from llama_index import QueryBundle
from llama_index.vector_stores import PGVectorStore, VectorStoreQuery
from llama_index.retrievers import BaseRetriever
from typing import Any, List, Optional
from llama_index.schema import NodeWithScore
from llama_index.callbacks.base import CallbackManager
from db.db_utils import embed_model, vector_store
from llama_index import ServiceContext, LLMPredictor
from llama_index.indices.postprocessor import LLMRerank


class VectorDBRetriever(BaseRetriever):
    """Retriever over a postgres vector store."""

    def __init__(
        self,
        vector_store: PGVectorStore,
        embed_model: Any,
        query_mode: str = "default",
        similarity_top_k: int = 2,
        callback_manager: Optional[CallbackManager] = None,
        
    ) -> None:
        """Init params."""
        self._vector_store = vector_store
        self._embed_model = embed_model
        self._query_mode = query_mode
        self._similarity_top_k = similarity_top_k
        super().__init__(callback_manager)

    def _retrieve(self, query_bundle: QueryBundle) -> List[NodeWithScore]:
        """Retrieve."""
        query_embedding = embed_model.get_query_embedding(query_bundle.query_str)
        vector_store_query = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=self._similarity_top_k,
            mode=self._query_mode,
        )
        query_result = vector_store.query(vector_store_query)

        nodes_with_scores = []
        for index, node in enumerate(query_result.nodes):
            score: Optional[float] = None
            if query_result.similarities is not None:
                score = query_result.similarities[index]
            nodes_with_scores.append(NodeWithScore(node=node, score=score))

        return nodes_with_scores
    
    
class VectorDBReranker(VectorDBRetriever):
    def __init__(
        self,
        vector_store: PGVectorStore,
        embed_model: Any,
        service_context: ServiceContext,
        query_mode: str = "default",
        similarity_top_k: int = 8,
        reranker_top_n: int = 5,
    ) -> None:
        super().__init__(vector_store, embed_model, query_mode, similarity_top_k)
        self._service_context = service_context
        self._reranker_top_n = reranker_top_n
    
    def _rerank(self, nodes_with_scores: List[NodeWithScore], query_bundle: QueryBundle) -> List[NodeWithScore]:
        reranker = LLMRerank(
            choice_batch_size=5,
            top_n=self._reranker_top_n,
            service_context=self._service_context,
        )
        return reranker.postprocess_nodes(nodes_with_scores, query_bundle)

    def _retrieve(self, query_bundle: QueryBundle) -> List[NodeWithScore]:
        # the retrieval logic
        query_embedding = self._embed_model.get_query_embedding(query_bundle.query_str)  # note - we are accessing embed_model via self
        vector_store_query = VectorStoreQuery(
            query_embedding=query_embedding,
            similarity_top_k=self._similarity_top_k,
            mode=self._query_mode,
        )
        query_result = self._vector_store.query(vector_store_query)  # note - accessing vector_store via self

        nodes_with_scores = []
        for index, node in enumerate(query_result.nodes):
            score: Optional[float] = None
            if query_result.similarities is not None:
                score = query_result.similarities[index]
            nodes_with_scores.append(NodeWithScore(node=node, score=score))

        # Reranking logic
        return self._rerank(nodes_with_scores, query_bundle)
