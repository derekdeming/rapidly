import os
from typing import List

import psycopg2
from psycopg2.extras import execute_values
from pgvector.psycopg2 import register_vector

from Node import Node, ScoredNode
from Query import Query


class Database():
    conn: psycopg2.extensions.connection
    cur: psycopg2.extensions.cursor
    vector_store_table: str

    def __init__(self, vector_store_table: str):
        connection_string = os.getenv("DATABASE_URL")
        if connection_string is None:
            raise Exception(
                "No database connection string provided. Please set the DATABASE_URL environment variable.")

        self.conn = psycopg2.connect(connection_string)
        self.cur = self.conn.cursor()
        # install pgvector
        self.cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        self.conn.commit()

        self.vector_store_table = vector_store_table

        # Register the vector type with psycopg2
        register_vector(self.conn)

    def kill(self):
        self.conn.close()

    def add_nodes(self, nodes: List[Node]):
        # insert nodes
        insert_query = "INSERT INTO " + self.vector_store_table + \
            " (text, metadata, node_id, embedding) VALUES %s ON CONFLICT DO NOTHING"
        execute_values(self.cur, insert_query, nodes)
        self.conn.commit()

    async def get_top_k(self, query: Query, k: int, doc_filter: List[str] = None) -> List[ScoredNode]:
        # get top k vectors
        if doc_filter is None:
            self.cur.execute("SELECT node_id, text, metadata_, 1 - (embedding <=> %s) AS cosine_similarity FROM " + self.vector_store_table +
                            " ORDER BY embedding <=> %s LIMIT %s", (query.embedding, query.embedding, k))
            result = self.cur.fetchall()
            return [ScoredNode(node=Node(node_id=row[0], text=row[1], metadata=row[2]), score=row[3]) for row in result]

        else:
            # list contains ids of documents to include. the ids match to the "id" field of the column "metadata_" which contains a json object
            self.cur.execute("SELECT node_id, text, metadata_, 1 - (embedding <=> %s) AS cosine_similarity FROM " + self.vector_store_table +
                            " WHERE metadata_ ->> 'id' IN %s ORDER BY embedding <=> %s LIMIT %s", (query.embedding, tuple(doc_filter), query.embedding, k))
            result = self.cur.fetchall()
            return [ScoredNode(node=Node(node_id=row[0], text=row[1], metadata=row[2]), score=row[3]) for row in result]