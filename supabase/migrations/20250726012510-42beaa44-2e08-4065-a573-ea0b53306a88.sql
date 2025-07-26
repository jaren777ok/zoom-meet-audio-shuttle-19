-- Create ai_messages table for real-time AI coaching messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'response' CHECK (message_type IN ('analysis', 'insight', 'suggestion', 'summary', 'response')),
  confidence DECIMAL(3,2) DEFAULT 0.8,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own ai messages" 
ON public.ai_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ai messages" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai messages" 
ON public.ai_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_messages_updated_at
BEFORE UPDATE ON public.ai_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the table
ALTER TABLE public.ai_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

-- Create index for better performance on queries
CREATE INDEX idx_ai_messages_user_session ON public.ai_messages(user_id, session_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at);