-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table for storing vectorized documents
CREATE TABLE public.document_embeddings (
  id bigserial PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_document_embeddings_user_id ON public.document_embeddings(user_id);
CREATE INDEX idx_document_embeddings_document_id ON public.document_embeddings(document_id);

-- Create HNSW index for vector similarity search
CREATE INDEX idx_document_embeddings_embedding ON public.document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own document embeddings
CREATE POLICY "Users can view their own document embeddings" 
ON public.document_embeddings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own document embeddings
CREATE POLICY "Users can create their own document embeddings" 
ON public.document_embeddings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow N8N webhook to insert embeddings (bypass RLS for service operations)
CREATE POLICY "Allow N8N to insert document embeddings" 
ON public.document_embeddings 
FOR INSERT 
WITH CHECK (true);

-- Users can update their own document embeddings
CREATE POLICY "Users can update their own document embeddings" 
ON public.document_embeddings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own document embeddings
CREATE POLICY "Users can delete their own document embeddings" 
ON public.document_embeddings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function for semantic search with user filtering
CREATE OR REPLACE FUNCTION public.match_user_documents(
  query_embedding vector(1536),
  user_filter uuid,
  match_count integer DEFAULT 5,
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE(
  id bigint,
  document_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    document_embeddings.metadata,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  FROM public.document_embeddings
  WHERE document_embeddings.user_id = user_filter
    AND (filter = '{}' OR document_embeddings.metadata @> filter)
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_document_embeddings_updated_at
BEFORE UPDATE ON public.document_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();