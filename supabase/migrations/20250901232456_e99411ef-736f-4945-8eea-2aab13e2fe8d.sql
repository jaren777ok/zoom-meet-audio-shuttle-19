-- Create company accounts table
CREATE TABLE public.company_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_accounts
CREATE POLICY "Company accounts can manage their own account"
ON public.company_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add account_type and company_code to profiles table
ALTER TABLE public.profiles ADD COLUMN account_type TEXT NOT NULL DEFAULT 'vendedor';
ALTER TABLE public.profiles ADD COLUMN company_code TEXT NULL;

-- Create function to generate unique company codes
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_suffix TEXT;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-character alphanumeric code
    code_suffix := upper(substring(md5(random()::text) from 1 for 6));
    new_code := 'ZH-' || code_suffix;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.company_accounts WHERE company_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, break the loop
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update existing profiles to have account_type 'vendedor' by default
UPDATE public.profiles SET account_type = 'vendedor' WHERE account_type IS NULL;

-- Add constraint to account_type
ALTER TABLE public.profiles 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('vendedor', 'empresa'));

-- Create trigger for updated_at on company_accounts
CREATE TRIGGER update_company_accounts_updated_at
BEFORE UPDATE ON public.company_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();