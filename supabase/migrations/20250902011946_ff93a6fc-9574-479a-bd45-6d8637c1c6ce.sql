-- Crear función que calcule métricas agregadas desde session_analytics para vendor_metrics
CREATE OR REPLACE FUNCTION public.calculate_vendor_metrics(p_vendor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar vendor_metrics con datos agregados de session_analytics
  UPDATE public.vendor_metrics 
  SET 
    total_sessions = (
      SELECT COUNT(*) 
      FROM public.session_analytics 
      WHERE user_id = p_vendor_id
    ),
    avg_satisfaction = (
      SELECT COALESCE(AVG(
        CASE 
          WHEN metricas_json->>'Puntuación_Satisfacción_Cliente' ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (metricas_json->>'Puntuación_Satisfacción_Cliente')::numeric
          ELSE NULL
        END
      ), 0)
      FROM public.session_analytics 
      WHERE user_id = p_vendor_id 
        AND metricas_json IS NOT NULL
        AND metricas_json->>'Puntuación_Satisfacción_Cliente' IS NOT NULL
    ),
    total_revenue = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN metricas_json->>'Ganancia_en_Dinero' ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (metricas_json->>'Ganancia_en_Dinero')::numeric
          ELSE 0
        END
      ), 0)
      FROM public.session_analytics 
      WHERE user_id = p_vendor_id 
        AND metricas_json IS NOT NULL
        AND metricas_json->>'Ganancia_en_Dinero' IS NOT NULL
    ),
    total_sales = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN metricas_json->>'Conversiones' ~ '^[0-9]+$'
          THEN (metricas_json->>'Conversiones')::integer
          ELSE 0
        END
      ), 0)
      FROM public.session_analytics 
      WHERE user_id = p_vendor_id 
        AND metricas_json IS NOT NULL
        AND metricas_json->>'Conversiones' IS NOT NULL
    ),
    conversion_rate = (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          (COALESCE(SUM(
            CASE 
              WHEN metricas_json->>'Conversiones' ~ '^[0-9]+$'
              THEN (metricas_json->>'Conversiones')::integer
              ELSE 0
            END
          ), 0)::numeric / COUNT(*)::numeric) * 100
        ELSE 0
      END
      FROM public.session_analytics 
      WHERE user_id = p_vendor_id
    ),
    updated_at = now()
  WHERE vendor_id = p_vendor_id;

  -- Si no existe el registro, crearlo
  INSERT INTO public.vendor_metrics (vendor_id, company_id)
  SELECT p_vendor_id, vm.company_id
  FROM public.profiles p
  LEFT JOIN public.company_accounts ca ON ca.company_code = p.company_code
  LEFT JOIN public.vendor_metrics vm ON vm.vendor_id = p_vendor_id
  WHERE p.id = p_vendor_id
    AND NOT EXISTS (SELECT 1 FROM public.vendor_metrics WHERE vendor_id = p_vendor_id)
  ON CONFLICT (vendor_id) DO NOTHING;
END;
$$;

-- Crear trigger que actualice vendor_metrics cuando se inserte/actualice session_analytics
CREATE OR REPLACE FUNCTION public.update_vendor_metrics_on_session_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar métricas para el vendedor afectado
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_vendor_metrics(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_vendor_metrics(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_vendor_metrics ON public.session_analytics;
CREATE TRIGGER trigger_update_vendor_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.session_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_vendor_metrics_on_session_change();