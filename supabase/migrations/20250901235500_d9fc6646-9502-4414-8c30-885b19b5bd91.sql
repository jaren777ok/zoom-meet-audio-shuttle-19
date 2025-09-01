-- Create company metrics table for aggregated statistics
CREATE TABLE public.company_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_accounts(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_satisfaction NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_metrics
ALTER TABLE public.company_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for company_metrics
CREATE POLICY "Company owners can manage their metrics"
ON public.company_metrics
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_accounts 
    WHERE company_accounts.id = company_metrics.company_id 
    AND company_accounts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_accounts 
    WHERE company_accounts.id = company_metrics.company_id 
    AND company_accounts.user_id = auth.uid()
  )
);

-- Create vendor metrics table for individual performance tracking
CREATE TABLE public.vendor_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_satisfaction NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  last_session_date TIMESTAMP WITH TIME ZONE,
  performance_score NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_metrics
ALTER TABLE public.vendor_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_metrics
CREATE POLICY "Vendors can view their own metrics"
ON public.vendor_metrics
FOR SELECT
TO authenticated
USING (auth.uid() = vendor_id);

CREATE POLICY "Company owners can view their vendors' metrics"
ON public.vendor_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_accounts 
    WHERE company_accounts.id = vendor_metrics.company_id 
    AND company_accounts.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage vendor metrics"
ON public.vendor_metrics
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update company metrics when vendor metrics change
CREATE OR REPLACE FUNCTION public.update_company_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update company metrics based on all vendors
  IF NEW.company_id IS NOT NULL THEN
    UPDATE public.company_metrics 
    SET 
      total_sessions = (
        SELECT COALESCE(SUM(total_sessions), 0) 
        FROM public.vendor_metrics 
        WHERE company_id = NEW.company_id
      ),
      total_sales = (
        SELECT COALESCE(SUM(total_sales), 0) 
        FROM public.vendor_metrics 
        WHERE company_id = NEW.company_id
      ),
      total_revenue = (
        SELECT COALESCE(SUM(total_revenue), 0) 
        FROM public.vendor_metrics 
        WHERE company_id = NEW.company_id
      ),
      avg_satisfaction = (
        SELECT COALESCE(AVG(avg_satisfaction), 0) 
        FROM public.vendor_metrics 
        WHERE company_id = NEW.company_id AND avg_satisfaction > 0
      ),
      conversion_rate = (
        SELECT COALESCE(AVG(conversion_rate), 0) 
        FROM public.vendor_metrics 
        WHERE company_id = NEW.company_id AND conversion_rate > 0
      ),
      updated_at = now()
    WHERE company_id = NEW.company_id;
    
    -- If no company metrics record exists, create one
    INSERT INTO public.company_metrics (company_id)
    SELECT NEW.company_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.company_metrics WHERE company_id = NEW.company_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic company metrics updates
CREATE TRIGGER update_company_metrics_trigger
  AFTER INSERT OR UPDATE ON public.vendor_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_metrics();

-- Create function to initialize vendor metrics when a vendor joins a company
CREATE OR REPLACE FUNCTION public.initialize_vendor_metrics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor metrics initialization
CREATE TRIGGER initialize_vendor_metrics_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_vendor_metrics();

-- Add unique constraint to vendor_metrics to prevent duplicates
ALTER TABLE public.vendor_metrics ADD CONSTRAINT vendor_metrics_vendor_id_key UNIQUE (vendor_id);