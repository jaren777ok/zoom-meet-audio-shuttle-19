-- Crear política RLS para permitir que empresas vean sesiones de sus vendedores
CREATE POLICY "Company owners can view vendor sessions" 
ON public.session_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.company_accounts ca ON ca.company_code = p.company_code
    WHERE p.id = session_analytics.user_id
    AND ca.user_id = auth.uid()
  )
);