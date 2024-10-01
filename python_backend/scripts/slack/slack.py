from llama_index import download_loader
from llama_index.readers.base import BasePydanticReader
from llama_index.schema import TextNode

import time
from prisma import Prisma, Json
from typing import Any
from db.db_utils import add_slack_messages_db
from slack_sdk import WebClient
import os
import pprint
from datetime import datetime
import asyncio
from typing import Optional
from util.logs import start_log, end_log, Code, fetch_last_sync_log, Status

# class MessageNode:
#     def __init__(self, message_id: str, content: str, prev_id: Optional[str] = None, next_id: Optional[str] = None):
#         self.message_id = message_id
#         self.content = content
#         self.prev_id = prev_id
#         self.next_id = next_id

#     def get_metadata_str(self, mode=None):
#         metadata = {
#             'message_id': self.message_id,
#             'prev_id': self.prev_id,
#             'next_id': self.next_id,
#         }
#         return str(metadata)

class SlackReader(BasePydanticReader):
    '''
    Slack Reader.
    '''
    token: str
    user_id: str
    Loader: Any

    def __init__(self, token: str, user_id: str):
        super().__init__(token=token, user_id=user_id)
        self.token = token
        self.user_id = user_id
        self.Loader = download_loader("SlackReader")
        # self.client = WebClient(token=self.token)

    @classmethod
    def class_name(cls) -> str:
        return "SlackReader"

    async def _get_channels(self):
        client = WebClient(token=self.token)
        result = client.conversations_list()
        channels = [{'id': c['id'], 'name': c['name_normalized']}
                    for c in result['channels'] if c['is_member']] # only get channels that the bot is a member of

        return channels
    
    async def _fetch_messages_since(self, channel_id: str, last_sync_datetime: datetime):
        if not last_sync_datetime:
            last_sync_datetime = datetime(1970, 1, 1)

        loader = self.Loader(slack_token=self.token, earliest_date=last_sync_datetime)
        messages = loader.load_data(channel_ids=[channel_id])
        print(messages)
        return messages
    
    def get_message_timestamp(self, document):
        return document.metadata.get('timestamp', "2023-01-01T00:00:00.000000") 


    async def sync_changes(self):
        '''
        Get all new messages since last sync.
        '''
        # get time since last sync
        db = Prisma()
        await db.connect()
        # def get_message_timestamp(document):
        #     message_dict = document.to_dict()
        #     return message_dict.get('ts')
        
        await start_log(self.user_id, 'slack')
        try: 
            log= await fetch_last_sync_log(self.user_id, 'slack')
            last_sync_time = log.ts if log else datetime(1970, 1, 1)
            channels = await self._get_channels()

            # last_sync_time_q = await db.document.find_many(
            #     where={
            #         'fileType': 'slack',
            #         'userId': self.user_id
            #     },
            #     order={
            #         'lastSyncedAt': 'desc',
            #     },
            #     take=1)
            # last_sync_time = last_sync_time_q[0].lastSyncedAt if last_sync_time_q else None
            # channels = await self._get_channels()
            
            all_processed_nodes = []

            for channel in channels:
                messages = await self._fetch_messages_since(channel['id'], last_sync_time)

                # sort msg by timestamp & filter out join msgs
                sorted_filtered_msgs = [
                    m for m in sorted(
                        messages, 
                        key=lambda doc: self.get_message_timestamp(doc)
                    ) if not m.get_content().endswith('has joined the channel')
                ]

                for i, message in enumerate(sorted_filtered_msgs):
                    prev_msg_id = sorted_filtered_msgs[i - 1].id_ if i > 0 else None
                    next_msg_id = sorted_filtered_msgs[i + 1].id_ if i < len(sorted_filtered_msgs) - 1 else None

                    node = TextNode(
                        text=message.text, 
                        metadata={
                            'message_id': message.id_, 
                            'prev_id': prev_msg_id, 
                            'next_id': next_msg_id
                        })
                    all_processed_nodes.append(node)

            
            
            # pprint.pprint(channels)
            # loader = self.Loader(slack_token=self.token, earliest_date=last_sync_time)
            # docs = loader.load_data(
            #     channel_ids=[c['id'] for c in channels])

            # # filter out join messages
            # docs = [d for d in docs if not d.get_content().endswith(
            #     'has joined the channel')]

            # save to db
            pprint.pprint(all_processed_nodes)
            await add_slack_messages_db(all_processed_nodes, self.user_id)
            await end_log(self.user_id, 'slack', Code.SUCCESS, 'Sync completed successfully')
    
        except Exception as e:
            await end_log(self.user_id, 'slack', Code.FAILED, str(e))
            raise
    


if __name__ == "__main__":
    async def main():
        print("start")
        reader = SlackReader(
            token='xoxe.xoxb-1-MS0yLTYxNDAyMjk1MTQ2NjAtNjE0NTIxNjMwMTMzMy02MTQ4MTQ0MTE3OTcwLTYxODM2MTM0MDg1OTUtYzA4OWMxZTNlZjBmYjZmZDBmODVmZTAyMmE5NzcyZjRiYmFkYjQ4ZTNmMWRiOTAwOGFjZmI3MTAzOWRkM2RlZA', user_id='1')
        await reader.sync_changes()

    asyncio.run(main())


'''
figure out how to add to vector store and get something figured out on pre post node thing 

'''