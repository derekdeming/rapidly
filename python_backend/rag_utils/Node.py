import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional

from LiteLLM import LiteLLM

EMBEDDINGS_BATCH_SIZE = 100
DEFAULT_NODE_EMBEDDING_MODEL = "openai:embeddings"
EXCLUDED_ITEMS = ['_node_content', 'hash', 'start_char_idx', 'end_char_idx',
                  'text_template', 'metadata_template', 'metadata_separator', 'ref_doc_id', 'document_id', 'doc_id', '_node_type']


class Node():
    node_id: str
    text: str
    # note: it seems to become a string when it is fetched from the database
    metadata: Dict[str, Any]
    embedding: Optional[List[float]]
    embedding_model: str

    def __init__(self, text: str, metadata: Dict[str, Any], embedding: List[float] = None, node_id: str = None, embedding_model: str = DEFAULT_NODE_EMBEDDING_MODEL):

        self.node_id = str(uuid.uuid4()) if node_id is None else node_id
        self.text = text
        self.metadata = metadata
        self.embedding = embedding
        self.embedding_model = embedding_model

    async def embed(self):
        embedding_obj = await LiteLLM.aembedding(
            model=self.embedding_model, input=[self.text])
        self.embedding = embedding_obj.data[0].embedding

    def to_content_str(self):
        d = json.loads(self.metadata['_node_content'])

        metadata_str = "\n".join([
            f"{k}: {v}" for k, v in self.metadata.items() if
            k not in d['excluded_llm_metadata_keys'] and
            k not in EXCLUDED_ITEMS])

        return f"{metadata_str}\n\n{self.text}"

    def content(self):
        return self.text

    def __repr__(self) -> str:
        return self.__str__()

    def __str__(self):
        return f"Node(node_id={self.node_id}, text={self.text}, metadata={self.metadata})"


class ScoredNode():
    node: Node
    score: float

    def to_content_str(self):
        return self.node.to_content_str()

    def __init__(self, node: Node, score: float):
        self.node = node
        self.score = score

    def __repr__(self) -> str:
        return self.__str__()

    def __str__(self):
        return f"ScoredNode(node={self.node}, score={self.score})"


async def _bulk_embed_nodes(nodes: List[Node], embedding_model: str = DEFAULT_NODE_EMBEDDING_MODEL):
    # embed the nodes
    texts = [node.text for node in nodes]
    embedding_obj = await LiteLLM.aembedding(model=embedding_model, input=texts)
    for i, node in enumerate(nodes):
        node.embedding = embedding_obj.data[i].embedding


async def bulk_embed_nodes(nodes: List[Node], embedding_model: str = DEFAULT_NODE_EMBEDDING_MODEL):
    # split into batches to process
    node_batches = [nodes[i:i + EMBEDDINGS_BATCH_SIZE]
                    for i in range(0, len(nodes), EMBEDDINGS_BATCH_SIZE)]

    tasks = []
    for node_batch in node_batches:
        tasks.append(_bulk_embed_nodes(nodes=node_batch,
                                       embedding_model=embedding_model))

    await asyncio.gather(*tasks)

    return nodes
