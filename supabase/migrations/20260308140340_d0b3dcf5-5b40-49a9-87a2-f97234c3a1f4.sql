
-- Audit trigger function to log mutations to user_activity
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_activity (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Attach audit triggers to key tables
CREATE TRIGGER audit_bookings AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER audit_agents AFTER INSERT OR UPDATE OR DELETE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER audit_packages AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER audit_staff_permissions AFTER INSERT OR UPDATE OR DELETE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Allow staff to view activity log and insert activity
CREATE POLICY "Staff can view activity" ON public.user_activity
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can insert activity" ON public.user_activity
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Allow staff to view all profiles (needed for displaying names in activity log / staff management)
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
