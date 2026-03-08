-- Trigger function: notify on visa/ticket status changes
CREATE OR REPLACE FUNCTION public.notify_visa_ticket_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Visa status changed
  IF OLD.visa_status IS DISTINCT FROM NEW.visa_status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, 'Visa Status Updated',
      'Your visa for booking ' || COALESCE(NEW.reference, NEW.id::text) || ' is now ' || NEW.visa_status,
      CASE WHEN NEW.visa_status = 'approved' THEN 'success' WHEN NEW.visa_status = 'rejected' THEN 'error' ELSE 'info' END,
      '/dashboard/visa-tickets');
    -- Notify agent if exists
    IF NEW.agent_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      SELECT a.user_id, 'Client Visa Updated',
        NEW.full_name || '''s visa is now ' || NEW.visa_status, 'info', '/agent/visa-tickets'
      FROM public.agents a WHERE a.id = NEW.agent_id;
    END IF;
  END IF;
  -- Ticket status changed
  IF OLD.ticket_status IS DISTINCT FROM NEW.ticket_status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, 'Flight Ticket Updated',
      'Your flight ticket for booking ' || COALESCE(NEW.reference, NEW.id::text) || ' is now ' || NEW.ticket_status,
      CASE WHEN NEW.ticket_status = 'approved' THEN 'success' WHEN NEW.ticket_status = 'rejected' THEN 'error' ELSE 'info' END,
      '/dashboard/visa-tickets');
    IF NEW.agent_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      SELECT a.user_id, 'Client Ticket Updated',
        NEW.full_name || '''s flight ticket is now ' || NEW.ticket_status, 'info', '/agent/visa-tickets'
      FROM public.agents a WHERE a.id = NEW.agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_visa_ticket_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_visa_ticket_change();

-- Storage: allow authenticated users to download from visa-tickets bucket
CREATE POLICY "Authenticated users can download visa tickets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'visa-tickets');