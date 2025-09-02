-- Update session_analytics table to ensure proper data types and constraints
-- Fix internet quality columns to never allow null values

-- Add constraints to ensure internet quality values are never null and have proper ranges
ALTER TABLE public.session_analytics 
ADD CONSTRAINT internet_quality_start_range CHECK (internet_quality_start >= 1 AND internet_quality_start <= 10),
ADD CONSTRAINT internet_quality_end_range CHECK (internet_quality_end >= 1 AND internet_quality_end <= 10);

-- Set default values for internet quality columns
ALTER TABLE public.session_analytics 
ALTER COLUMN internet_quality_start SET DEFAULT 1,
ALTER COLUMN internet_quality_end SET DEFAULT 1;

-- Update existing records with null values
UPDATE public.session_analytics 
SET 
  internet_quality_start = CASE WHEN internet_quality_start IS NULL THEN 1 ELSE internet_quality_start END,
  internet_quality_end = CASE WHEN internet_quality_end IS NULL THEN 1 ELSE internet_quality_end END
WHERE internet_quality_start IS NULL OR internet_quality_end IS NULL;