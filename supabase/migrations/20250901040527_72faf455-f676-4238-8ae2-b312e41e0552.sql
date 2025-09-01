-- Add url field to session_analytics table for vendor photo
ALTER TABLE public.session_analytics 
ADD COLUMN url TEXT;