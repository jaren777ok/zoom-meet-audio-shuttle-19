-- Add session_name field to session_analytics table
ALTER TABLE public.session_analytics 
ADD COLUMN session_name TEXT DEFAULT 'Análisis de Sesión';

-- Update existing records to have a default name
UPDATE public.session_analytics 
SET session_name = 'Análisis de Sesión - ' || DATE(created_at)
WHERE session_name IS NULL OR session_name = 'Análisis de Sesión';

-- Create index for better performance on session_name queries
CREATE INDEX idx_session_analytics_session_name ON public.session_analytics(session_name);