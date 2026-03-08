
INSERT INTO storage.buckets (id, name, public) VALUES ('visa-tickets', 'visa-tickets', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload visa tickets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'visa-tickets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update visa tickets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'visa-tickets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visa tickets" ON storage.objects FOR DELETE
  USING (bucket_id = 'visa-tickets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view visa tickets" ON storage.objects FOR SELECT
  USING (bucket_id = 'visa-tickets' AND auth.role() = 'authenticated');
