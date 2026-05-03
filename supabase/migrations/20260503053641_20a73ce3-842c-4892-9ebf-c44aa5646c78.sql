ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'field';
CREATE INDEX IF NOT EXISTS idx_photos_category ON public.photos(category);