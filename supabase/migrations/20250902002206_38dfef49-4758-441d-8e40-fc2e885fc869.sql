-- Add profile photo URL and display name fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_photo_url TEXT,
ADD COLUMN display_name TEXT;

-- Update RLS policies to allow vendors to update their profile data
CREATE POLICY "Users can update their own profile data"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow company owners to read vendor profiles for their company
CREATE POLICY "Company owners can read vendor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_accounts ca
    WHERE ca.user_id = auth.uid() 
    AND ca.company_code = profiles.company_code
  ) OR auth.uid() = id
);