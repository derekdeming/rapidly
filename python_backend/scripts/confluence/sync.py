import asyncio
import json
import os
import requests

from atlassian import Confluence
from llama_hub.confluence import ConfluenceReader
from llama_index.readers.base import BasePydanticReader
from llama_index.schema import MetadataMode
from prisma import Prisma
from requests.auth import HTTPBasicAuth

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

    permissions_user: list
    permissions_group: list
'''

excluded_embed_metadata_keys = ['id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group']
excluded_llm_metadata_keys = ['id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group']

class ConfluencePageReader(BasePydanticReader):
    '''
    Confluence page reader
    '''

    user_id: str
    base_url: str
    username: str
    token: str
    confluence: Confluence | None
    reader: ConfluenceReader | None

    @classmethod
    def class_name(cls):
        return 'ConfluencePageReader'

    def __init__(self, user_id: str):
        super().__init__(user_id=user_id, confluence=None,
                         reader=None, base_url='', username='', token='')
        self.user_id = user_id
        vector_store._initialize()

    async def initialize(self):
        '''
        Initialize the reader with async calls
        '''
        db = Prisma()
        await db.connect()

        self.base_url = await get_secret(self.user_id, "CONFLUENCE_BASE_URL")
        self.username = await get_secret(self.user_id, "CONFLUENCE_EMAIL")
        self.token = await get_secret(self.user_id, "CONFLUENCE_API_TOKEN")

        # GENERATE TOKENS FROM https://id.atlassian.com/manage-profile/security/api-tokens
        self.confluence = Confluence(
            url=self.base_url,
            username=self.username,
            password=self.token
        )
        os.environ['CONFLUENCE_USERNAME'] = self.username
        os.environ['CONFLUENCE_PASSWORD'] = self.token
        self.reader = ConfluenceReader(
            base_url=self.base_url + '/wiki',
        )

    def _get_page_permissions(self, page_id: str):
        '''
        Get specific user/group restrictions/permissions of a page
        '''
        url = f"{self.base_url}/wiki/rest/api/content/{page_id}/restriction/byOperation/read"
        auth = HTTPBasicAuth(self.username, self.token)
        headers = {
            'Accept': 'application/json'
        }

        response = requests.request(
            "GET",
            url,
            headers=headers,
            auth=auth
        )
        return json.loads(response.text)

    def _get_page_history(self, page_id: str):
        '''
        Gets edit history of page
        '''
        url = f"{self.base_url}/wiki/rest/api/content/{page_id}/history"
        auth = HTTPBasicAuth(self.username, self.token)
        headers = {
            'Accept': 'application/json'
        }

        response = requests.request(
            "GET",
            url,
            headers=headers,
            auth=auth
        )
        return json.loads(response.text)

    async def _process_docs(self, docs):
        '''
        Turns docs into nodes, create embeddings, and upserts them to the vector store
        '''
        for d in docs:
            read_perms = self._get_page_permissions(d.id_)
            history = self._get_page_history(d.id_)

            d.id_ = f'confluence-{d.id_}'
            d.metadata['last_modified'] = history['lastUpdated']['when']
            d.metadata['last_author_name'] =history['lastUpdated']['by']['displayName']
            d.metadata['last_author_picture_url'] =self.base_url + history['lastUpdated']['by']['profilePicture']['path']

            d.metadata['permissions_user'] = read_perms['restrictions']['user']['results']
            d.metadata['permissions_group'] = read_perms['restrictions']['group']['results']
            d.metadata['id'] = d.metadata['page_id']
            del d.metadata['status']
            del d.metadata['page_id']
            d.excluded_embed_metadata_keys = excluded_embed_metadata_keys
            d.excluded_llm_metadata_keys = excluded_llm_metadata_keys

        db = Prisma()
        if not db.is_connected():
            await db.connect()
        ids = [d.id_ for d in docs]
        ids_formatted = ', '.join(f"'{id}'" for id in ids)
        sql_query = f"""
            DELETE FROM "data_v1"
            WHERE metadata_ ->> 'doc_id' IN ({ids_formatted})
        """
        await db.execute_raw(sql_query)

        nodes = node_parser.get_nodes_from_documents(docs)
        for n in nodes:
            n.embedding = embed_model.get_text_embedding(
                n.get_content(metadata_mode=MetadataMode.EMBED))

        vector_store.add(nodes)

    async def init_sync(self):
        '''
        Initial sync of Confluence. Loads all pages from Confluence.
        '''
        await start_log(self.user_id, 'confluence')

        try:
            docs = self.reader.load_data(
                cql=f'type=page')
            await self._process_docs(docs)

        except Exception as e:
            await end_log(self.user_id, 'confluence', Code.FAILED, str(e))
            return True

        await end_log(self.user_id, 'confluence', Code.SUCCESS, f'Initialized {len(docs)} pages')

    async def sync(self):
        '''
        Sync pages since last update
        '''
        await start_log(self.user_id, 'confluence')

        try:
            log = await fetch_last_sync_log(self.user_id, 'confluence')
            ts_str = log.ts.strftime("%Y/%m/%d %H:%M")
            docs = self.reader.load_data(
                cql=f'type=page AND lastModified > "{ts_str}"')
            await self._process_docs(docs)
        
        except Exception as e:
            await end_log(self.user_id, 'confluence', Code.FAILED, str(e))
            return

        await end_log(self.user_id, 'confluence', Code.SUCCESS, f'Synced {len(docs)} pages')


if __name__ == "__main__":
    async def main():
        reader = ConfluencePageReader(user_id='clo4oqiji0000b9nir2p1hxug')
        await reader.initialize()
        
        # await reader.init_sync()
        await reader.sync()

    asyncio.run(main())
