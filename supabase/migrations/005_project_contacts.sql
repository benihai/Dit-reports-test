ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
