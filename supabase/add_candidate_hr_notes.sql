-- Personal HR reminder notes shown on candidate cards.
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS hr_notes TEXT;
