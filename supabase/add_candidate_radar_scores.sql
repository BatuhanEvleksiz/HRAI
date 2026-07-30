-- Run once in the Supabase SQL Editor before deploying candidate radar storage.
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS radar_scores JSONB NOT NULL DEFAULT '{}'::jsonb;
