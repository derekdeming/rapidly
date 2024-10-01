CREATE INDEX embeddings_idx ON public."DocumentChunk" USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);
