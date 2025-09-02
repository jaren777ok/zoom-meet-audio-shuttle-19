-- Allow company owners to view session analytics of their vendors
CREATE POLICY "Company owners can view vendor session analytics" 
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