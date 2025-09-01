-- Eliminar la columna meeting_session_id que ya no es necesaria
-- ahora que tenemos session_id consistente en todo el flujo
ALTER TABLE session_analytics DROP COLUMN IF EXISTS meeting_session_id;

-- Agregar índice en session_id para mejorar performance de búsquedas
CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON session_analytics(session_id);

-- Agregar índice compuesto para búsquedas por usuario y session_id
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_session ON session_analytics(user_id, session_id);