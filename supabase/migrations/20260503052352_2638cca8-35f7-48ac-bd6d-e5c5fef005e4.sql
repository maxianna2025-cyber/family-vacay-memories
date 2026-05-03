
-- App settings (key-value)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.app_settings FOR SELECT USING (true);

INSERT INTO public.app_settings (key, value) VALUES
  ('app_title', 'СПЕЦОТРЯД: САЯНСКАЯ ВЕРШИНА'),
  ('app_subtitle', 'МЧС России · Семейная операция');

-- Agents
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  order_index int NOT NULL DEFAULT 0
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read agents" ON public.agents FOR SELECT USING (true);

INSERT INTO public.agents (slug, display_name, order_index) VALUES
  ('agent1', 'Агент 1', 1),
  ('agent2', 'Агент 2', 2),
  ('agent3', 'Агент 3', 3);

-- Sectors (password column hidden from public via column-level grants)
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  briefing text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '1234',
  order_index int NOT NULL DEFAULT 0
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Public view without password
CREATE VIEW public.sectors_public AS
  SELECT id, slug, title, briefing, mission, order_index FROM public.sectors;

GRANT SELECT ON public.sectors_public TO anon, authenticated;

-- No public RLS policy on sectors table itself => only service_role can read full row (incl. password)

INSERT INTO public.sectors (slug, title, briefing, mission, password, order_index) VALUES
  ('beijing', 'Сектор «Пекин»', 'Столица операции. Базовый лагерь.', 'Найди и сфотографируй красную звезду на площади Тяньаньмэнь.', '1234', 1),
  ('hongkong', 'Сектор «Гонконг»', 'Город небоскрёбов и бухты Виктория.', 'Сделай фото панорамы с Пика Виктория.', '2345', 2),
  ('vietnam', 'Сектор «Вьетнам / Дананг»', 'Морская база отряда.', 'Сфотографируй Мост Дракона.', '3456', 3),
  ('macao', 'Сектор «Макао»', 'Финальный город маршрута.', 'Найди руины собора Святого Павла и сделай фото.', '4567', 4);

-- Extend photos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS agent_slug text;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS sector_slug text;

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_app_settings_touch BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
