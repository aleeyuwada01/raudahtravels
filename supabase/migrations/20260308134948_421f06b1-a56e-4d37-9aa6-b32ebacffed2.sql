
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS visa_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ticket_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS visa_provider text,
  ADD COLUMN IF NOT EXISTS flight_provider text,
  ADD COLUMN IF NOT EXISTS visa_file_url text,
  ADD COLUMN IF NOT EXISTS ticket_file_url text,
  ADD COLUMN IF NOT EXISTS admin_visa_message text,
  ADD COLUMN IF NOT EXISTS admin_ticket_message text;
