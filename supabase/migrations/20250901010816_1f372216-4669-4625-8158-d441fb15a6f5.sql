-- Create session_analytics table for storing meeting session analysis
CREATE TABLE public.session_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  meeting_session_id UUID NULL,
  webhook_sent_at TIMESTAMP WITH TIME ZONE NULL,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  metricas_json JSONB NULL,
  analisis_markdown TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_analytics
CREATE POLICY "Users can view their own session analytics" 
ON public.session_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session analytics" 
ON public.session_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session analytics" 
ON public.session_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "N8N can update session analytics" 
ON public.session_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "N8N can insert session analytics" 
ON public.session_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_session_analytics_updated_at
BEFORE UPDATE ON public.session_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_session_analytics_user_id ON public.session_analytics(user_id);
CREATE INDEX idx_session_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX idx_session_analytics_created_at ON public.session_analytics(created_at);