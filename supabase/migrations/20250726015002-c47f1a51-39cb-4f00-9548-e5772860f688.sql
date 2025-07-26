-- Remove session_id column from ai_messages table as it's no longer needed
-- Messages will be managed per user_id only and cleared after each recording session
ALTER TABLE public.ai_messages DROP COLUMN IF EXISTS session_id;