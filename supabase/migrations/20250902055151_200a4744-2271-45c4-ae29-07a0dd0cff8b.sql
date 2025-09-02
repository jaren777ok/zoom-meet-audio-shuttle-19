-- Fix numeric field overflow by expanding connection_stability_score precision
ALTER TABLE public.session_analytics 
ALTER COLUMN connection_stability_score TYPE NUMERIC(5,2);