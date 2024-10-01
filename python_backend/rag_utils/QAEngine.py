import asyncio
from typing import List, Optional

from Database import Database
from Reranker import Reranker
from SubqueryEngine import SubQueryEngine
from Query import Query
from Node import Node
from LiteLLM import LiteLLM
from DataEmitter import DataEmitter
from Message import Message

DEFAULT_QA_MODEL = "openai:gpt-4"
SOURCE_SEPARATOR = "\n\n\n"
NEWLINE = "\n"


def generate_qa_prompt(query: Query, sources: List[Node], message_history: List[Message] = None):
    if message_history is None:
        message_history = []
    # Convert each message in the history to a string
    history_str = "\n".join([msg.to_context_str() for msg in message_history])

    # Combine the sources into a single string
    sources_str = SOURCE_SEPARATOR.join(
        [source.to_content_str() for source in sources])

    # Construct the prompt
    prompt = f"""\
Context information is below.
----------------------------------
{sources_str}
""" \

    if len(message_history) > 0:
        prompt += f"""\
Message History:
{history_str}
----------------------------------
"""

    prompt += f"""\
Given the context information and message history, and not prior knowledge, answer the query. Be specific and use format the response with markdown syntax. Use lists if necessary.
Query: {query.q}
Answer: 
    """
    return prompt


class SubQueryAndResponse():
    subquery: Query
    response: str

    def __init__(self, subquery: Query, response: str):
        self.subquery = subquery
        self.response = response

    def __repr__(self) -> str:
        return self.__str__()

    def __str__(self):
        return f"SubQueryAndResponse(subquery={self.subquery}, response={self.response})"


def merge_subquery_responses_prompt(subquery_responses: List[SubQueryAndResponse], message_history: List[Message] = None):
    if message_history is None:
        message_history = []
    # Convert each message in the history to a string
    history_str = "\n".join([msg.to_context_str() for msg in message_history])

    # Construct the prompt with subquery responses
    prompt = f"""\
Given the following pairs of subqueries and responses, merge the responses into a single response that answers the original query. Use markdown syntax to format the response. Use lists if necessary. \n
{SOURCE_SEPARATOR.join([f"Subquery: {subquery_response.subquery.q}{NEWLINE}Response: {subquery_response.response}" for subquery_response in subquery_responses])}
"""

    # Add message history to the prompt if it exists
    if len(message_history) > 0:
        prompt += f"""\
------------------
Message History:
{history_str}
------------------
"""

    # Add the final query and placeholder for the answer
    prompt += f"""\
Query: {subquery_responses[0].subquery.q}
Answer: 
"""

    return prompt


class QAEngine():
    db: Database
    reranker: Reranker
    subquery_engine: SubQueryEngine

    def __init__(self, db: Database, reranker: Reranker, subquery_engine: SubQueryEngine):
        self.db = db
        self.reranker = reranker
        self.subquery_engine = subquery_engine

    async def _answer(self,
                      query: Query,
                      sources: Optional[List[Node]],
                      use_stream: bool = False,
                      message_history: List[Message] = None,):
        # TODO: implement use Stream
        if sources is None:
            sources = await self.reranker.llm_rerank(
                query=query, choices=await self.db.get_top_k(query=query, k=5))

        completed_prompt = generate_qa_prompt(
            query=query, sources=sources, message_history=message_history)
        llm_response = (await LiteLLM.acompletion(model=DEFAULT_QA_MODEL,
                                                  messages=[{"role": "user", "content": completed_prompt}])).choices[0].message.content
        return llm_response

    async def _get_top_k_and_answer(self, subquery: Query, doc_filter: List[str] = None):
        # get top k results
        top_k_results = await self.db.get_top_k(query=subquery, k=5, doc_filter=doc_filter)
        reranked_results = await self.reranker.llm_rerank(
            query=subquery, choices=top_k_results)

        if len(reranked_results) == 0:
            return SubQueryAndResponse(subquery=subquery, response="")

        # answer subquery
        subquery_response = await self._answer(query=subquery, sources=reranked_results)
        return SubQueryAndResponse(subquery=subquery, response=subquery_response)

    async def answer(self,
                     query: Query,
                     use_subqueries: bool = False,
                     data_emitter: DataEmitter = None,
                     message_history: List[Message] = None,
                     doc_filter: List[str] = None,
                     use_last_message_sources: bool = False):
        # enforce that if we are using last message sources, we do not need to generate subqueries used to find new sources
        if use_last_message_sources and use_subqueries:
            raise Exception(
                "Invalid configuration: cannot use both last message sources and subqueries")

        sources = None
        if use_last_message_sources:
            sources = [
                source for sq in message_history[-1].subqueries for source in sq.sources]
            # deduplicate sources
            sources = list(set(sources))

        if not use_subqueries:
            return await self._answer(query=query, sources=sources, message_history=message_history)

        # generate subqueries
        generated_subqueries = await self.subquery_engine.generate_subqueries(
            query=query,
            message_history=message_history
        )
        subqueries = [Query(q=subquery)
                      for subquery in generated_subqueries if len(subquery) != 0]  # + [query]

        if data_emitter:
            data_emitter.emit(subqueries)

        tasks = []
        for subquery in subqueries:
            task = self._get_top_k_and_answer(
                subquery=subquery, doc_filter=doc_filter)
            tasks.append(task)

        # Run tasks concurrently and wait for all of them to complete
        subquery_pairs = await asyncio.gather(*tasks)

        if data_emitter:
            data_emitter.emit(subquery_pairs)

        # merge subquery responses
        completed_prompt = merge_subquery_responses_prompt(
            subquery_responses=subquery_pairs, message_history=message_history)
        llm_response = (await LiteLLM.acompletion(model=DEFAULT_QA_MODEL,
                                                  messages=[{"role": "user", "content": completed_prompt}])).choices[0].message.content

        return llm_response
