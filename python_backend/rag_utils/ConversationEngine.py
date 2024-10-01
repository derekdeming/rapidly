from typing import List

from Database import Database
from DataEmitter import DataEmitter
from Message import Message, UserMessage, AIMessage
from QAEngine import QAEngine
from Query import Query
from Reranker import Reranker
from SubqueryEngine import SubQueryEngine
from LiteLLM import LiteLLM

DEFAULT_CONVERSATION_MODEL = "openai:gpt-4"

NEWLINE = "\n==\n"


def generate_context_request_prompt(new_message: UserMessage, last_message: AIMessage):
    return f"""\
You are an agent designed to answer questions given chunks of texts from documents. We are to determine the next steps given a new query.

New Query: {new_message.message}

Previous queries:

{NEWLINE.join([sq.subquery for sq in last_message.subqueries])}

Sources cited
{NEWLINE.join([s.to_content_str() for sq in last_message.subqueries for s in sq.sources])}

…

Choose one of the following actions, and follow the EXACT instructions in each choice in brackets

A: The sources that answered the previous queries probably don't answer all the info necessary to answer the new query (we should look for completely different/new sources) [reply with "Start new query"]

B: The documents that answered the previous queries probably could answer all the info, not necessarily these exact chunks (we should look ONLY within these same documents but query for potentially new relevant chunks) [reply with "Search documents"]

C: The provided sources is already sufficient to answer the query. [reply with "Use same sources"]

"""


class ConversationEngine():
    db: Database
    reranker: Reranker
    subquery_engine: SubQueryEngine
    qa_engine: QAEngine

    def __init__(self, db: Database, reranker: Reranker, subquery_engine: SubQueryEngine):
        self.db = db
        self.reranker = reranker
        self.subquery_engine = subquery_engine
        self.qa_engine = QAEngine(db, reranker, subquery_engine)

    async def generate_response(self, message: UserMessage, history: List[Message], data_emitter: DataEmitter):
        query = Query(message.message)
        # if first message in conversation
        if len(history) == 0:
            res = await self.qa_engine.answer(query=query, use_subqueries=True, data_emitter=data_emitter)
        else:
            # Determine if new context is needed
            context_determination_prompt = generate_context_request_prompt(
                new_message=message, last_message=history[-1])
            llm_response = (await LiteLLM.acompletion(model=DEFAULT_CONVERSATION_MODEL, messages=[{"role": "user", "content": context_determination_prompt}])).choices[0].message.content

            data_emitter.emit("context_determination_result: ", llm_response)

            if llm_response == "Start new query":
                res = await self.qa_engine.answer(query=query, use_subqueries=True, data_emitter=data_emitter, message_history=history)
            elif llm_response == "Search documents":
                doc_list = list(
                    set([s.id for sq in history[-1].subqueries for s in sq.sources]))
                res = await self.qa_engine.answer(query=query, use_subqueries=True, data_emitter=data_emitter, message_history=history, doc_filter=doc_list)
            elif llm_response == "Use same sources":
                res = await self.qa_engine.answer(query=query, use_subqueries=False, data_emitter=data_emitter, message_history=history, use_last_message_sources=True)
            else:
                print("RESPONSE: " + llm_response)
                raise Exception("Invalid response from LLM")

        return res

        # take message and determine if we need to query sources again
        # if yes
        #   use QAEngine and SubQueryEngine to generate subqueries
        #   query sources
        #   generate response
        # if no
        #   use QAEngine to generate response
        pass
