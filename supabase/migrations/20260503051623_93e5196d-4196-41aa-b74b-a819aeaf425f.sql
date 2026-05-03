
-- Tables
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  agent TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_photo_id ON public.comments(photo_id);

CREATE TABLE public.additional_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  task_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Public insert photos" ON public.photos FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read tasks" ON public.additional_tasks FOR SELECT USING (true);
CREATE POLICY "Public insert tasks" ON public.additional_tasks FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Public read photo files" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Public upload photo files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
