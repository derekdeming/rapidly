import asyncio
import requests
from datetime import datetime
from typing import Any, Dict, List, Optional

from ratelimiter import RateLimiter

from llama_index.readers.base import BasePydanticReader
from llama_index.schema import Document, MetadataMode
from prisma import Prisma

from util.ServiceContext import embed_model, node_parser, vector_store
from util.helper import get_secret
from util.logs import end_log, fetch_last_sync_log, start_log, Code


'''
Metadata:
    *title: str
    id: str
    url: str
    *last_modified: datestr
    *last_author_name: str
    last_author_picture_url: str
'''

excluded_embed_metadata_keys = [
    'id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group']
excluded_llm_metadata_keys = [
    'id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group']

INTEGRATION_TOKEN_NAME = "NOTION_INTEGRATION_TOKEN"
BLOCK_CHILD_URL_TMPL = "https://api.notion.com/v1/blocks/{block_id}/children"
DATABASE_URL_TMPL = "https://api.notion.com/v1/databases/{database_id}/query"
SEARCH_URL = "https://api.notion.com/v1/search"
PAGE_SIZE = 10

class NotionPageReader(BasePydanticReader):
    '''
    Notion page reader
    '''

    user_id: str
    headers: Dict[str, str] | None

    @classmethod
    def class_name(cls) -> str:
        return "NotionPageReader"

    def __init__(self, user_id: str):
        super().__init__(user_id=user_id, headers=None)
        self.user_id = user_id
        vector_store._initialize()

    async def initalize(self):
        '''
        Initialize the reader with async calls
        '''
        db = Prisma()
        await db.connect()

        token = await get_secret(self.user_id, "NOTION_TOKEN")

        self.headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        }

    def _read_block(self, block_id: str, num_tabs: int = 0) -> str:
        """
        Read a block without fetching its children
        """

        result_lines_arr = []
        cur_block_id = block_id
        done = False

        while not done:
            block_url = BLOCK_CHILD_URL_TMPL.format(block_id=cur_block_id)
            res = requests.request("GET", block_url, headers=self.headers)
            data = res.json()

            result_lines_arr = []

            for result in data["results"]:
                result_type = result["type"]

                result_obj = result[result_type]

                if result_type == "child_page":
                    text = result_obj['title']
                    prefix = "\t" * num_tabs

                    result_lines_arr.append(prefix + text)
                else:
                    if "rich_text" in result_obj:
                        for rich_text in result_obj["rich_text"]:
                            if "text" in rich_text:
                                text = rich_text["text"]["content"]

                                if rich_text["text"]["link"]:
                                    text = f"[{text}]({rich_text['text']['link']['url']})"
                                prefix = "\t" * num_tabs

                                result_lines_arr.append(prefix + text)

                    result_block_id = result["id"]
                    has_children = result["has_children"]
                    if has_children:
                        children_text = self._read_block(
                            result_block_id, num_tabs=num_tabs + 1
                        )
                        result_lines_arr.append(children_text)

                    cur_result_text = "\n".join(result_lines_arr)
                    result_lines_arr = []
                    result_lines_arr.append(cur_result_text)

            if data["next_cursor"] is None:
                done = True
                break
            else:
                cur_block_id = data["next_cursor"]

        return "\n".join(result_lines_arr)

    @RateLimiter(max_calls=3, period=1)
    def _fetch_changes(self, next_cursor=None):
        """Fetch recent changes from Notion with rate limiting."""
        query = {
            "filter": {
                "property": "object",
                "value": "page",
            },
            "sort": {
                "direction": "descending",
                "timestamp": "last_edited_time",
            },
            "page_size": PAGE_SIZE,
        }
        if next_cursor:
            query["start_cursor"] = next_cursor

        res = requests.post(SEARCH_URL, headers=self.headers, json=query)
        data = res.json()
        return data

    def _read_page(self, page_id: str) -> str:
        """Read a page."""
        return self._read_block(page_id)

    def _query_database(self, database_id: str, query_dict: Dict[str, Any] = {}) -> List[str]:
        """Get all the pages from a Notion database."""
        res = requests.post(DATABASE_URL_TMPL.format(
            database_id=database_id), headers=self.headers, json=query_dict)
        data = res.json()
        page_ids = [result["id"] for result in data.get("results", [])]

        return page_ids

    def _process_page(self, page_ids: List[str] = [], database_id: Optional[str] = None) -> List[Document]:
        """Load data from the input directory."""
        if not page_ids and not database_id:
            raise ValueError(
                "Must specify either `page_ids` or `database_id`.")

        docs = []
        if database_id:
            page_ids = self._query_database(database_id)
        for page_id in page_ids:

            page_text = self._read_page(page_id)
            docs.append(Document(text=page_text,
                        metadata={"page_id": page_id}))

        return docs

    async def _get_notion_user(self, user_id: str):
        """
        Get the user name and avatar 
        """
        res = requests.get(
            f"https://api.notion.com/v1/users/{user_id}", headers=self.headers)
        data = res.json()

        name = data["name"]
        avatar_url = data["avatar_url"] or ""

        return name, avatar_url

    async def sync(self):
        """
        Fetch recent changes from Notion with rate limiting and save to the database
        """
        await start_log(self.user_id, 'notion')
        try:
            log = await fetch_last_sync_log(self.user_id, 'notion')
            page_count = 0

            if log:
                last_sync_time = log.ts
                init = False
            else:
                last_sync_time = datetime(1970, 1, 1, 0, 0, 0, 0)
                init = True

            db = Prisma()
            if not db.is_connected():
                await db.connect()

            finished = False
            next_cursor = None

            while not finished:
                # get the changes from Notion
                data = self._fetch_changes(next_cursor=next_cursor)

                if 'status' in data and data['status'] == 401:
                    raise Exception(data['message'])

                if (data['has_more']):
                    next_cursor = data['next_cursor']
                else:
                    next_cursor = None
                    finished = True

                # now save to the database
                for page in data["results"]:
                    if page['last_edited_time'] < last_sync_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'):
                        finished = True
                        continue
                    # skip db entries
                    if page['parent']['type'] == 'database_id':
                        continue

                    page_contents = self._read_page(page["id"])

                    doc = Document(
                        id=f'notion-{page["id"]}',
                        text=page_contents,
                        excluded_embed_metadata_keys=excluded_embed_metadata_keys,
                        excluded_llm_metadata_keys=excluded_llm_metadata_keys
                    )
                    doc.id_ = f'notion-{page["id"]}'

                    author_id = page["last_edited_by"]['id']
                    name, avatar_url = await self._get_notion_user(author_id)
                    # add metadata
                    doc.metadata['title'] = page["properties"]['title']['title'][0]['plain_text']
                    doc.metadata['id'] = doc.id_
                    doc.metadata['doc_id'] = doc.id_
                    doc.metadata['url'] = page["url"]
                    doc.metadata['last_modified'] = page["last_edited_time"]
                    doc.metadata['last_author_name'] = name
                    doc.metadata['last_author_picture_url'] = avatar_url

                    db = Prisma()
                    if not db.is_connected():
                        await db.connect()
                    sql_query = f"""
                        DELETE FROM "data_v1"
                        WHERE metadata_ ->> 'doc_id' = '{doc.id_}'
                    """
                    await db.execute_raw(sql_query)

                    nodes = node_parser.get_nodes_from_documents([doc])
                    page_count += 1
                    for n in nodes:
                        n.embedding = embed_model.get_text_embedding(
                            n.get_content(metadata_mode=MetadataMode.EMBED))

                    vector_store.add(nodes)

        except Exception as e:
            await end_log(self.user_id, 'notion', Code.FAILED, str(e))
            return True
        if init:
            await end_log(self.user_id, 'notion', Code.SUCCESS, f'Initialized {page_count} pages')
        else:
            await end_log(self.user_id, 'notion', Code.SUCCESS, f'Synced {page_count} pages')


if __name__ == "__main__":
    async def main():
        reader = NotionPageReader(user_id='clo4oqiji0000b9nir2p1hxug')
        await reader.initalize()

        await reader.sync()

    asyncio.run(main())
