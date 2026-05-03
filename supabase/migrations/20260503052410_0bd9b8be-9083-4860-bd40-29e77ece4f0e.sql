
DROP VIEW IF EXISTS public.sectors_public;
CREATE VIEW public.sectors_public WITH (security_invoker = true) AS
  SELECT id, slug, title, briefing, mission, order_index FROM public.sectors;
GRANT SELECT ON public.sectors_public TO anon, authenticated;

-- Allow public to read non-password columns via the view; need a SELECT policy that the view can use
CREATE POLICY "Public read sector basics" ON public.sectors FOR SELECT USING (true);
-- Note: password column will only be returned for service_role since anon queries should go via the view; for direct queries we accept this risk in family app context. To be safe, revoke select on password column from anon.
REVOKE SELECT ON public.sectors FROM anon, authenticated;
GRANT SELECT (id, slug, title, briefing, mission, order_index) ON public.sectors TO anon, authenticated;

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
