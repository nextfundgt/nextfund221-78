-- Security fixes migration

-- 1. Add missing admin RLS policy for profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add admin policies for better data access control
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove CPF column from transactions table (critical security fix)
-- First backup existing data if needed, then remove the column
ALTER TABLE public.transactions DROP COLUMN IF EXISTS cpf;

-- 4. Add audit logging table for admin actions
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert audit logs
CREATE POLICY "Admins can manage audit logs" 
ON public.admin_audit_log 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is admin
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      p_action,
      p_table_name,
      p_record_id,
      p_details
    );
  END IF;
END;
$$;

-- 6. Create security definer function for safe profile access
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  balance NUMERIC,
  affiliate_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.balance,
    p.affiliate_code,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id
    AND (
      auth.uid() = p_user_id OR 
      has_role(auth.uid(), 'admin'::app_role)
    );
$$;