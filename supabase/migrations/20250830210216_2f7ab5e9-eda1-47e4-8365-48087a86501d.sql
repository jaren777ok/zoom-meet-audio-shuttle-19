-- Create meeting_sessions table for session tracking
CREATE TABLE public.meeting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  number_of_people INTEGER NOT NULL,
  company_info TEXT NOT NULL,
  meeting_objective TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meeting_sessions
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.meeting_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.meeting_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.meeting_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.meeting_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create knowledge_documents table for document management
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL, -- Unique ID per user for webhook
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, error
  vectorization_status TEXT NOT NULL DEFAULT 'pending', -- pending, success, error
  webhook_response JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, document_id)
);

-- Enable RLS on knowledge_documents
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_documents
CREATE POLICY "Users can view their own documents" 
ON public.knowledge_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.knowledge_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.knowledge_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.knowledge_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on meeting_sessions
CREATE TRIGGER update_meeting_sessions_updated_at
BEFORE UPDATE ON public.meeting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique document ID per user
CREATE OR REPLACE FUNCTION public.generate_document_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_count INTEGER;
  doc_id TEXT;
BEGIN
  -- Get count of existing documents for user
  SELECT COUNT(*) INTO doc_count
  FROM public.knowledge_documents
  WHERE user_id = p_user_id;
  
  -- Generate unique document ID: USER_DOC_001, USER_DOC_002, etc.
  doc_id := 'USER_DOC_' || LPAD((doc_count + 1)::TEXT, 3, '0');
  
  -- Ensure uniqueness (in case of concurrent inserts)
  WHILE EXISTS (
    SELECT 1 FROM public.knowledge_documents 
    WHERE user_id = p_user_id AND document_id = doc_id
  ) LOOP
    doc_count := doc_count + 1;
    doc_id := 'USER_DOC_' || LPAD((doc_count + 1)::TEXT, 3, '0');
  END LOOP;
  
  RETURN doc_id;
END;
$$;