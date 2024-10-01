import asyncio
from prisma import Prisma, Json
import os
from pprint import pprint
# from llama_index.text_splitter import SentenceSplitter
from llama_index.node_parser import SimpleNodeParser
from llama_index.schema import NodeRelationship, MetadataMode

from llama_index import Document
from datetime import datetime
from llama_index.vector_stores import PGVectorStore, VectorStoreQuery
from llama_index.embeddings import OpenAIEmbedding
from llama_index import ServiceContext, set_global_service_context
from llama_index.llms import OpenAI

embed_model = OpenAIEmbedding(embed_batch_size=10)
vector_store = PGVectorStore.from_params(
    database=os.environ.get("DB_DATABASE"),
    host=os.environ.get("DB_HOST"),
    # password=os.environ.get("DB_PASSWORD"),
    port=os.environ.get("DB_PORT"),
    user=os.environ.get("DB_USER"),
    table_name="v1",
    embed_dim=1536
)

node_parser = SimpleNodeParser.from_defaults(chunk_size=1024, chunk_overlap=20)

gpt3_5 = OpenAI(model="gpt-3.5-turbo")
gpt4 = OpenAI(model="gpt-4-1106-preview")

service_context = ServiceContext.from_defaults(
    embed_model=embed_model, node_parser=node_parser, llm=gpt4)

set_global_service_context(service_context)

# data_fill = {
#         'id': "456",
#         'fileName': "bbb",
#         'fileType': "notion",
#         'directory': '/notion',
#         'userId': "user",
#         'lastSyncedAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
#         'lastModified': datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
#         'src': "test",
#         'contents': """
# An apple is a round, edible fruit produced by an apple tree (Malus domestica). Apple trees are cultivated worldwide and are the most widely grown species in the genus Malus. The tree originated in Central Asia, where its wild ancestor, Malus sieversii, is still found. Apples have been grown for thousands of years in Asia and Europe and were introduced to North America by European colonists. Apples have religious and mythological significance in many cultures, including Norse, Greek, and European Christian tradition.
# """
# }


async def add_slack_messages_db(data: [], userId: str):
    db = Prisma()
    await db.connect()

    nodes = node_parser.get_nodes_from_documents(data)
    pprint(nodes)

    return True

    # doc = await db.document.find_unique(where={'id': data['channel_id']})

    # if not doc:
    #     pass


async def add_sync_document_db(data: dict, userId: str):
    db = Prisma()
    await db.connect()

    doc = await db.document.find_unique(where={'id': data['id']})

    if not doc:
        create_data = {
            'id': data['id'],
            'fileName': data.get('fileName', 'Default Name'),
            'fileType': data.get('fileType', 'defaultType'),
            'directory': data.get('directory', '/defaultPath'),
            'userId': userId,
            'lastSyncedAt': data['lastSyncedAt'],
            'lastModified': data['lastModified'],
            'src': data['src']
            # ... other fields
        }
        await db.document.create(data=create_data)
    else:
        update_data = {
            'fileName': data.get('fileName', 'Default Name'),
            'directory': data.get('directory', '/defaultPath'),
            'lastSyncedAt': data['lastSyncedAt'],
            'lastModified': data['lastModified'],
            'src': data['src'],
        }

        await db.document.update(
            where={'id': data['id']},
            data=update_data
        )

        # delete all previous nodes
        vector_store.delete(doc.refDocId)

    # add new documentChunks
    doc = Document(text=data['contents'], id=data['id'], excluded_embed_metadata_keys=[
                   "docId", "src", "file_type"], excluded_llm_metadata_keys=["docId", "src", "file_type"])
    nodes = node_parser.get_nodes_from_documents([doc])

    for node in nodes:
        # add metadata
        node.metadata['title'] = data.get("fileName", "Default Name")
        node.metadata['docId'] = data['id']
        node.metadata['src'] = data['src']
        node.metadata['file_type'] = data.get('fileType', 'defaultType')

        node_embedding = embed_model.get_text_embedding(
            node.get_content(metadata_mode=MetadataMode.EMBED)
        )
        node.embedding = node_embedding

    if nodes:
        vector_store.add(nodes)
        relationship_info = nodes[0].relationships[NodeRelationship.SOURCE]
        ref_node_id = relationship_info.node_id

        await db.document.update(
            where={'id': data['id']},
            data={"refDocId": ref_node_id}
        )

    await db.disconnect()
