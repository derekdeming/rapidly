from typing import List, Optional
from Source import Source

class SubQueryData():
  subquery: str
  is_original_query: bool
  ai_response: Optional[str]
  sources: Optional[List[Source]]

  def __init__(self, subquery: str, is_original_query: bool, ai_response: Optional[str], sources: Optional[List[Source]]):
    self.subquery = subquery
    self.is_original_query = is_original_query
    self.ai_response = ai_response
    self.sources = sources

  def set_sources(self, sources: List[Source]):
    self.sources = sources

  def set_ai_response(self, ai_response: str):
    self.ai_response = ai_response

  def to_json(self):
    return {
      "subquery": self.subquery,
      "is_original_query": self.is_original_query,
      "ai_response": self.ai_response,
      "sources": [source.to_json() for source in self.sources]
    }