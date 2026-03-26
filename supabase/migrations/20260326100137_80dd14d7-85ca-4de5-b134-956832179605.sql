-- Fix WARN 1: Set search_path on handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix WARN 2: Restrict pending_registrations INSERT to anon role only (not wide open)
DROP POLICY "Anyone can register" ON public.pending_registrations;
CREATE POLICY "Anon can register" ON public.pending_registrations FOR INSERT TO anon WITH CHECK (true);