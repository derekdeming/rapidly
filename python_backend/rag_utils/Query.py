from typing import List
import numpy as np

from LiteLLM import LiteLLM

DEFAULT_QUERY_EMBEDDING_MODEL = "openai:embeddings"


class Query():
    q: str
    embedding: np.array
    embedding_model: str

    def __init__(self, q: str, embedding: np.array = None, query_embedding_model: str = DEFAULT_QUERY_EMBEDDING_MODEL):
        if len(q) == 0:
            raise ValueError("Query cannot be empty")

        self.q = q
        self.embedding_model = query_embedding_model
        if embedding is None:
            self.embedding = np.array(LiteLLM.embedding(
                model=self.embedding_model, input=[self.q]).data[0].embedding)
        else:
            self.embedding = np.array(embedding)

    def __repr__(self) -> str:
        return self.__str__()

    def __str__(self):
        return f"Query(q={self.q}, embedding={self.embedding})"
