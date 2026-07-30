-- Run once in Supabase SQL Editor for saved speaker labels and LLM signals.
ALTER TABLE public.interview_transcripts
  ADD COLUMN IF NOT EXISTS speaker_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS communication_signals JSONB NOT NULL DEFAULT '{}'::jsonb;
