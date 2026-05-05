ALTER TABLE public.additional_tasks ADD COLUMN IF NOT EXISTS sector_slug text;

INSERT INTO public.app_settings (key, value)
VALUES ('route_dates', '["05.07","07.07","10.07","13.07","17.07","20.07"]')
ON CONFLICT (key) DO NOTHING;