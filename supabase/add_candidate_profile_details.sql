-- Run once in Supabase SQL Editor before saving expanded CV profiles.
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS analysis_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_candidates_department
  ON public.candidates(department);

CREATE INDEX IF NOT EXISTS idx_candidates_location
  ON public.candidates(location);
