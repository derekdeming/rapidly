from fastapi import APIRouter, HTTPException, Query, Header, BackgroundTasks
from fastapi.responses import StreamingResponse
from util.queryEngine import QueryEngineFactory

from prisma import Prisma
import asyncio
import uuid
import logging
from pydantic import BaseModel
from typing import List, Optional, Dict
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter()
client = Prisma()

ongoing_tasks: Dict[str, asyncio.Task] = {}

class Metadata(BaseModel):
    file_type: str
    last_author_name: str
    last_author_picture_url: str
    last_modified: str
    title: str
    url: str
    

class Source(BaseModel):
    chunks: List[str]
    metadata: Metadata

class Message(BaseModel):
    id: str
    isUser: bool
    message: str
    status: Optional[str] = None
    errorMsg: Optional[str] = None
    query: str
    subqueries: Optional[List[str]] = None
    query_response: Optional[str] = None
    sources: Optional[List[Source]] = None

class Subquery(BaseModel):
    query: str
    source_query: str
    sources: Optional[List[Source]] = None
    query_response: Optional[str] = None




async def create_subqueries(
    query: str, 
    convoId: str, 
    messageId: str, 
    message: Optional[Message] = None, 
    isUser: bool = False, 
    x_user_id: str = Header(None)
) -> Message:
    logger.info("CREATING SUBQUERIES")
    if not client.is_connected():
        await client.connect()

    query_engine = QueryEngineFactory.queryEngine()
    subqueries = await query_engine.query(query)
    
    if message:
        message.subqueries = subqueries
        await client.conversationMessage.update(where={'id': message.id}, data={'subqueries': subqueries})
    else:
        x_user_id = x_user_id or str(uuid.uuid4())
        new_message_record = await client.ConversationMessage.create(data={
            'conversationId': convoId,
            'userId': x_user_id,
            'fetchAdditionalSrcs': isUser,
            'userMessage': query,
            'subqueries': subqueries
        })
        message = Message(**new_message_record)

    subquery_records = [{'query': subquery, 'conversationId': convoId, 'messageId': messageId} for subquery in subqueries]
    await client.subquery.create_many(data=subquery_records)
    logger.info("SUBQUERIES CREATED")
    return message


@router.post("/api/message")
async def process_message(message: Message):
    return {"message": "Message processed successfully"}

# @app.get("/api/message")
# async def get_message():
#     return {"message": "Route is working"}


@router.get("/api/message")
async def get_message():
    messages = [
        {
            "query": "What did Elon do before Tesla?",
            "subqueries": [
                {
                    "query": "What did Elon do before Tesla?",
                    "source_query": "Elon Musk before Tesla"
                }
            ]
        },
        {
            "query": "What did Elon do before Tesla?",
            "subqueries": [
                {
                    "query": "What did Elon do before Tesla?",
                    "source_query": "Elon Musk before Tesla",
                    "sources": [
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        }
                    ]
                }
            ]
        },
        {
            "query": "What did Elon do before Tesla?",
            "subqueries": [
                {
                    "query": "What did Elon do before Tesla?",
                    "source_query": "Elon Musk before Tesla",
                    "sources": [
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        }
                    ],
                    "query_response": "Elon Musk was a founder of PayPal"
                }
            ]
        },
        {
            "query": "What did Elon do before Tesla?",
            "subqueries": [
                {
                    "query": "What did Elon do before Tesla?",
                    "source_query": "Elon Musk before Tesla",
                    "sources": [
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        },
                        {
                            "chunks": [],
                            "metadata": {
                                "file_type": "",
                                "last_author_name": "",
                                "last_author_picture_url": "",
                                "last_modified": "",
                                "title": "",
                                "url": ""
                            }
                        }
                    ],
                    "query_response": "Elon Musk was a founder of PayPal"
                }
            ],
            "query_response": "Elon Musk was a founder of PayPal"
        }
    ]
    return messages








# @router.post("/conversation/message")
# async def start_conversation(request: ConvoRequest, background_tasks: BackgroundTasks, x_user_id: str = Header(None)) -> ConvoResponse:
#     if not client.is_connected():
#         await client.connect()
#     convoId = request.convoId or str(uuid.uuid4())
#     #  fetching the conversation
#     if request.convoId:
#         convo = await client.ConversationMessage.fetch_many(where={'conversationId': convoId})
#         if not convo:
#             raise HTTPException(
#                 status_code=404, detail="Conversation not found")
#     else:
#         convo = []

#     # creating new message
#     msg = await client.ConversationMessage.create(data={
#         'conversationId': convoId,
#         'userId': x_user_id,
#         'fetchAdditionalSrcs': True,
#         'userMessage': request.query,
#     })
    
#     # add subquery creation task in the background
#     # task = asyncio.create_task(create_subqueries(request.query, convoId, str(msg.messageId)))
#     # ongoing_tasks[convoId] = task
#     background_tasks.add_task(create_subqueries, request.query, convoId, str(msg.messageId))

#     return ConvoResponse(convoId=convoId, messageId=str(msg.messageId))


# @router.get("/conversation/subqueries")
# async def get_subqueries(convoId: str) -> SubqueryResponse:
#     message = await client.conversationMessage.find_first(
#         where={'id': int(convoId)},
#         include={'subqueries': True},
#         order_by={'createdAt': 'desc'}

#     )
#     if not message:
#         raise HTTPException(
#             status_code=404, detail="No subqueries found for this conversation")
#     if not message.subqueries:
#         query_engine = QueryEngineFactory.queryEngine()
#         subqueries = await query_engine.query(message.userMessage)

#         subquery_records = [{'query': subquery, 'conversationId': message.id,
#                                 'messageId': message.messageId} for subquery in subqueries]
#         await client.subquery.create_many(data=subquery_records)

#         return SubqueryResponse(subqueries=subqueries)
#     else:
#         return SubqueryResponse(subqueries=[sq.query for sq in message.subqueries])


# @router.get("/conversation/sources")
# async def get_sources(convoId: str) -> SourcesResponse:
#     # Fetch all subqueries associated with the conversation
#     subqueries = await client.subquery.find_many(
#         where={'conversationId': int(convoId)},
#         select={'query': True}
#     )

#     if not subqueries:
#         raise HTTPException(
#             status_code=404, detail="No subqueries found for this conversation")

#     # Initialize the QueryEngine with get_sources set to True
#     query_engine = QueryEngineFactory.queryEngine(get_sources=True)

#     sources = []
#     for subquery in subqueries:
#         subquery_sources = await query_engine.query(subquery.query)
#         sources.extend(subquery_sources)

#     vector_db_reranker = VectorDBReranker(
#         vector_store=vectorStore(),
#         embed_model=embed_model(),
#         service_context=serviceContext(),
#         query_mode="default",
#         similarity_top_k=8,
#         reranker_top_n=5
#     )

#     # todo: Replace '...' with actual parameters / logic to create a QueryBundle
#     query_bundle = QueryBundle(...)

#     reranked_sources = vector_db_reranker._rerank(sources, query_bundle)

#     return SourcesResponse(sources=reranked_sources)
