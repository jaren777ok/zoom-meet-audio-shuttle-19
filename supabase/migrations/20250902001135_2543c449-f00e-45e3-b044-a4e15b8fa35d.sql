-- Allow vendors to read company basic info for association
CREATE POLICY "Vendors can read company info for association"
ON public.company_accounts
FOR SELECT
TO authenticated
USING (true);