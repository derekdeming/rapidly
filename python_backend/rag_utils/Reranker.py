from typing import List, Tuple
import json

from Query import Query
from Node import ScoredNode, Node
from LiteLLM import LiteLLM

# TODO: Adjust the formatting so we reduce the probabiility of the documents having template-like text in them

DEFAULT_LLM_RERANKER_MODEL = "openai:gpt-3.5"


def generate_llm_reranker_prompt(context_str: str, query_str: str):
    response_template = (
        "A list of documents is shown below. Each document has a number next to it along "
        "with a summary of the document. A question is also provided. \n"
        "Respond with the numbers of the documents (without any additional info) "
        "you should consult to answer the question, in order of relevance, as well \n"
        "as the relevance score. The relevance score is a number from 1-10 based on "
        "how relevant you think the document is to the question.\n"
        "Do not include any documents that are not relevant to the question. \n"
        "Example format: \n"
        "Document 1:\n<summary of document 1>\n\n"
        "Document 2:\n<summary of document 2>\n\n"
        "...\n\n"
        "Document 10:\n<summary of document 10>\n\n"
        "Question: <question>\n"
        "Answer:\n"
        '[{"doc": 9, "relevance": 7},{"doc": 3, "relevance": 4},{"doc": 7, "relevance": 3}]\n\n'
        "Let's try this now: \n\n"
    )

    final_response = response_template + context_str + \
        "\nQuestion: " + query_str + "\nAnswer:\n"
    return final_response


class Reranker():
    top_n: int
    llm_reranker_model: str

    def __init__(self, top_n: int = None, llm_reranker_model: str = DEFAULT_LLM_RERANKER_MODEL):
        self.top_n = top_n
        self.llm_reranker_model = llm_reranker_model

    def _parse_llm_response(self, response: str) -> List[Tuple[int, int]]:
        json_response = json.loads(response)

        return [(int(doc['doc']), int(doc['relevance'])) for doc in json_response]

    async def llm_rerank(self, query: Query, choices: List[ScoredNode]) -> List[Node]:
        '''
        Uses an LLM with a prompt to rerank the top k choices
        '''
        if len(choices) == 0:
            return []
        completed_prompt = generate_llm_reranker_prompt(
            context_str="\n".join(
                [f"Doc {index + 1} {choice.to_content_str()}" for index, choice in enumerate(choices)]),
            query_str=query.q)

        llm_response = (await LiteLLM.acompletion(model=self.llm_reranker_model,
                                                  messages=[{"role": "user", "content": completed_prompt}])).choices[0].message.content
        parsed_response = self._parse_llm_response(llm_response)

        ranked_choices = []
        for doc_num, _ in parsed_response:
            ranked_choices.append(choices[doc_num - 1].node)

        return ranked_choices[:self.top_n]
