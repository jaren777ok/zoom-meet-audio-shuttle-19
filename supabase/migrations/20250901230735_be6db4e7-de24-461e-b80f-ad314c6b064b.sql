-- Add connectivity and session duration fields to session_analytics table
ALTER TABLE session_analytics 
ADD COLUMN internet_quality_start INTEGER CHECK (internet_quality_start >= 1 AND internet_quality_start <= 10),
ADD COLUMN internet_quality_end INTEGER CHECK (internet_quality_end >= 1 AND internet_quality_end <= 10),
ADD COLUMN session_duration_minutes INTEGER,
ADD COLUMN connection_stability_score NUMERIC(3,2) CHECK (connection_stability_score >= 0 AND connection_stability_score <= 10),
ADD COLUMN network_type TEXT,
ADD COLUMN avg_connection_speed NUMERIC(10,2);