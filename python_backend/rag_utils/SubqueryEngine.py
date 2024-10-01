from typing import Optional, List

from LiteLLM import LiteLLM
from Message import Message
from Query import Query

DEFAULT_SUBQUERY_MODEL = "openai:gpt-4"
NEWLINE = "\n"


def generate_subquery_prompt(query: Query, message_history: List[Message] = None, limit: int = None):
    return f"""\
Given a new user query{" being a continuation off previous conversation history" if message_history else ""}, output a list of {
  f"no more than {limit}" if limit else ""  
} relevant sub-questions in a list seperated by \
only newlines that when composed can help answer the full user question. If the user query does not require subqueries (e.g. it already contains sufficient keywords) then respond with "None"\n
  Example 1:
  Q: Compare and contrast the revenue growth and EBITDA of Uber and Lyft for year 2021?
  Subqueries:
What is the revenue growth of Uber
What is the EBITDA of Uber
What is the revenue growth of Lyft
What is the EBITDA of Lyft
  Example 2:
  Q: customer support services
  Subqueries:
None

  Example 3:
  {"Conversation History:" if message_history else ""}
  {NEWLINE.join([message.to_content_str() for message in message_history]) if message_history else ""}
  Q: {query.q}
  Subqueries:
  """


class SubQueryEngine():
    limit: Optional[int]
    subquery_model: str

    def __init__(self, limit: int = None, subquery_model: str = DEFAULT_SUBQUERY_MODEL):
        self.limit = limit
        self.subquery_model = subquery_model

    async def generate_subqueries(self, query: Query, message_history: List[Message] = None):
        completed_prompt = generate_subquery_prompt(
            query=query, limit=self.limit)
        llm_response = (await LiteLLM.acompletion(model=self.subquery_model,
                                                  messages=[{"role": "user", "content": completed_prompt}])).choices[0].message.content
        # if response is None, then no subqueries are needed
        if llm_response == "None":
            return []
        # otherwise, split the response by newlines
        return llm_response.split('\n')
