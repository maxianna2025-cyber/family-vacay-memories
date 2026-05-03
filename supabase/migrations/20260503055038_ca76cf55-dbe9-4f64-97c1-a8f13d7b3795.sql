
INSERT INTO public.agents (slug, display_name, order_index)
VALUES ('agent4', 'Агент 4', 4), ('agent5', 'Агент 5', 5)
ON CONFLICT DO NOTHING;

ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

INSERT INTO public.app_settings (key, value)
VALUES ('route_progress', '0')
ON CONFLICT (key) DO NOTHING;
