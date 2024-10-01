from util.VectorDBRetriever import VectorDBRetriever, VectorDBReranker
from util.ServiceContext import vector_store, embed_model
from db.db_utils import service_context
from llama_index import ServiceContext, LLMPredictor
from llama_index.callbacks.base import CallbackManager
from llama_index import get_response_synthesizer, Prompt
from llama_index.query_engine import RetrieverQueryEngine

template = (
    "We have provided context information below. \n"
    "---------------------\n"
    "{context_str}"
    "\n---------------------\n"
    "Given this information, please answer the question directly and with GREAT BREVITY. Prioritize readability in answers, using bulleted lists when it makes sense: {query_str}\n"
)

vector_store_instance = vector_store
embed_model_instance = embed_model

retriever = VectorDBRetriever(vector_store_instance, embed_model_instance, query_mode="default", similarity_top_k=8)
qa_template = Prompt(template)

reranker = VectorDBReranker(
    vector_store=vector_store_instance,
    embed_model=embed_model_instance,
    service_context=ServiceContext.from_defaults(llm=service_context),  
    query_mode="default",
    similarity_top_k=8,
    reranker_top_n=5  
)

synth = get_response_synthesizer(streaming=True, text_qa_template=qa_template)
query_engine = RetrieverQueryEngine.from_args(reranker, response_synthesizer=synth, service_context=service_context)
