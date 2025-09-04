-- Add recording_url column to session_analytics table
ALTER TABLE public.session_analytics 
ADD COLUMN recording_url TEXT;