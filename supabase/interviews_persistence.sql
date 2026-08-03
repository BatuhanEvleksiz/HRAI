-- Run this in Supabase SQL Editor if the interview tables are missing.
-- The FastAPI backend uses its server-side Supabase secret key, so RLS can
-- remain enabled without exposing these tables to the public browser.

create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  interview_date date not null,
  interview_time time not null,
  position varchar(255),
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  is_completed boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_interviews_candidate on public.interviews(candidate_id);
create index if not exists idx_interviews_status on public.interviews(status);
create index if not exists idx_interviews_date on public.interviews(interview_date);

create table if not exists public.interview_transcripts (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interviews(id) on delete set null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  transcript text not null,
  summary text not null,
  general_evaluation text not null,
  analysis_mode varchar(10) not null default 'demo'
    check (analysis_mode in ('demo', 'llm')),
  speaker_segments jsonb not null default '[]'::jsonb,
  communication_signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_interview_transcripts_candidate
  on public.interview_transcripts(candidate_id);
create index if not exists idx_interview_transcripts_interview
  on public.interview_transcripts(interview_id);

alter table public.interview_transcripts
  add column if not exists speaker_segments jsonb not null default '[]'::jsonb;
alter table public.interview_transcripts
  add column if not exists communication_signals jsonb not null default '{}'::jsonb;
