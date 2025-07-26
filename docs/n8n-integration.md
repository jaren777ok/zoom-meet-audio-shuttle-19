# N8N Integration Guide - Simplified AI Messages

## Campos de la Tabla `ai_messages` (Simplificada)

### Campos Obligatorios (que N8N debe llenar):

1. **`user_id`** (UUID, obligatorio)
   - ID del usuario que está grabando
   - Se obtiene del payload del webhook de audio
   - Ejemplo: `"550e8400-e29b-41d4-a716-446655440000"`

2. **`message`** (TEXT, obligatorio) 
   - El mensaje o insight de la IA
   - Contenido principal que se mostrará al usuario
   - Ejemplo: `"El cliente muestra interés en la propuesta. Momento ideal para cerrar."`

### Campos Opcionales (que N8N puede llenar):

3. **`message_type`** (TEXT, opcional)
   - Tipo de mensaje: `'analysis' | 'insight' | 'suggestion' | 'summary' | 'response'`
   - Por defecto: `'response'`
   - Determina el icono y estilo del mensaje

4. **`confidence`** (NUMERIC, opcional)
   - Nivel de confianza del análisis (0.0 a 1.0)
   - Por defecto: `0.8`
   - Se muestra como indicador visual

5. **`metadata`** (JSONB, opcional)
   - Información adicional en formato JSON
   - Por defecto: `{}`
   - Puede incluir: contexto, palabras clave, análisis de sentimiento, etc.

### Campos Automáticos (generados por Supabase):

6. **`id`** - UUID auto-generado
7. **`created_at`** - Timestamp automático
8. **`updated_at`** - Timestamp automático

## Payload JSON para N8N (Simplificado)

### Formato Mínimo Requerido:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Detecto un momento de silencio. Sugerencia: haz una pregunta abierta para mantener el engagement."
}
```

### Formato Recomendado (con campos opcionales):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "El cliente mencionó 'presupuesto' 3 veces. Momento perfecto para presentar opciones de pricing.",
  "message_type": "insight",
  "confidence": 0.92,
  "metadata": {
    "keywords": ["presupuesto", "pricing", "opciones"],
    "sentiment": "positive",
    "action_suggested": "present_pricing",
    "context": "negotiation_phase"
  }
}
```

## Configuración del Webhook N8N

### URL del Endpoint:
```
POST https://jbunbmphadxmzjokwgkw.supabase.co/rest/v1/ai_messages
```

### Headers Requeridos:
```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidW5ibXBoYWR4bXpqb2t3Z2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzkzMTksImV4cCI6MjA2MzcxNTMxOX0.HxkEMVXXx-X5vxyoFA9ukxpcVDgHHm4k73Ek0OxOAew
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidW5ibXBoYWR4bXpqb2t3Z2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzkzMTksImV4cCI6MjA2MzcxNTMxOX0.HxkEMVXXx-X5vxyoFA9ukxpcVDgHHm4k73Ek0OxOAew
```

## Flujo Simplificado

1. **Usuario inicia grabación** → Se activa el chat flotante automáticamente
2. **N8N procesa audio** → Envía mensajes directamente a tabla `ai_messages`
3. **Widget muestra mensajes** → En tiempo real por `user_id`
4. **Usuario finaliza grabación** → Se borran TODOS los mensajes del usuario

## Tipos de Mensajes y Iconos

| message_type | Icono | Descripción |
|-------------|-------|-------------|
| `analysis` | 🔍 | Análisis de la conversación |
| `insight` | 💡 | Insights y observaciones |
| `suggestion` | 🎯 | Sugerencias de acción |
| `summary` | 📝 | Resúmenes parciales |
| `response` | 💬 | Respuestas generales (default) |

## Ventajas del Enfoque Simplificado

- ✅ **Sin gestión de sesiones complejas**
- ✅ **Mensajes únicos por usuario**
- ✅ **Limpieza automática después de cada grabación**
- ✅ **Configuración más simple en N8N**
- ✅ **Mejor performance al eliminar joins**
- ✅ **Flujo más predecible y confiable**