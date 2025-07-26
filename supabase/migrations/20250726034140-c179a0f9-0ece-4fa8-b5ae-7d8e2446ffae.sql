-- Add DELETE policy for ai_messages table
-- This allows users to delete their own AI messages
CREATE POLICY "Users can delete their own ai messages" 
ON public.ai_messages 
FOR DELETE 
USING (auth.uid() = user_id);