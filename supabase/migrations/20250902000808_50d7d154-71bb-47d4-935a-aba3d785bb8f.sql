-- Function to initialize vendor metrics when a vendor associates with a company
CREATE OR REPLACE FUNCTION public.initialize_vendor_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_uuid UUID;
BEGIN
  -- Check if company_code changed and is not null
  IF NEW.company_code IS NOT NULL AND (OLD.company_code IS NULL OR OLD.company_code != NEW.company_code) THEN
    -- Get company UUID from company_code
    SELECT id INTO company_uuid 
    FROM public.company_accounts 
    WHERE company_code = NEW.company_code;
    
    -- Insert or update vendor metrics
    INSERT INTO public.vendor_metrics (vendor_id, company_id)
    VALUES (NEW.id, company_uuid)
    ON CONFLICT (vendor_id) DO UPDATE SET 
      company_id = EXCLUDED.company_id,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize vendor metrics when company_code is updated
CREATE TRIGGER initialize_vendor_metrics_trigger
  AFTER UPDATE OF company_code ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_vendor_metrics();