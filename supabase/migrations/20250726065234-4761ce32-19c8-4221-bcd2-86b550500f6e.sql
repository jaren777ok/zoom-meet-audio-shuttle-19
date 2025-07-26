-- Remove confidence column from ai_messages table
ALTER TABLE public.ai_messages DROP COLUMN IF EXISTS confidence;

-- Create meeting_configurations table
CREATE TABLE IF NOT EXISTS public.meeting_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  number_of_people INTEGER NOT NULL,
  company_info TEXT NOT NULL,
  meeting_objective TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meeting_configurations
ALTER TABLE public.meeting_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meeting_configurations
CREATE POLICY "Users can view their own meeting configurations" 
ON public.meeting_configurations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meeting configurations" 
ON public.meeting_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting configurations" 
ON public.meeting_configurations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting configurations" 
ON public.meeting_configurations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_configurations_updated_at
BEFORE UPDATE ON public.meeting_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to ensure one config per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_configurations_user_id 
ON public.meeting_configurations(user_id);