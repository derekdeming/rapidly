# query_engine.py
from util.sub_question_query_engine import SubQuestionQueryEngine
from util.VectorDBRetriever import VectorDBRetriever, VectorDBReranker
from util.ServiceContext import serviceContext, vectorStore, embed_model
from llama_index.tools import QueryEngineTool, ToolMetadata

class QueryEngineFactory:
    @staticmethod
    def queryEngine(get_sources=False):
        service_context = serviceContext()
        vector_store = vectorStore()
        vector_db_retriever = VectorDBRetriever(vector_store, embed_model, query_mode="default", similarity_top_k=8)
        
        vector_db_reranker = VectorDBReranker(
            vector_store=vectorStore(),
            embed_model=embed_model(),
            service_context=serviceContext(),
            query_mode="default",
            similarity_top_k=8,
            reranker_top_n=5
        )


        retriever_tool = QueryEngineTool(
            query_engine=vector_db_retriever,
            metadata=ToolMetadata(name="VectorDBRetriever", description="vector db retriever tool")
        )
        reranker_tool = QueryEngineTool(
            query_engine=vector_db_reranker,
            metadata=ToolMetadata(name="VectorDBReranker", description="vector db reranker tool ")
        )

        return SubQuestionQueryEngine.from_defaults(
            query_engine_tools=[retriever_tool, reranker_tool],
            service_context=service_context
        )