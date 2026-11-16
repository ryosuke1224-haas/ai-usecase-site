-- Weekly run history for /admin/project.
-- Apply this in the Atlas Supabase SQL editor after the review queue migration.
-- The weekly command inserts review drafts. It does not publish or send.
-- Public and signed-in clients cannot read or write this table.

create table if not exists public.atlas_weekly_runs (
  run_id text primary key,
  week_key text not null,
  stage text not null,
  status text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  counts jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint atlas_weekly_runs_week_unique unique (week_key),
  constraint atlas_weekly_runs_status_check check (status in ('running', 'failed', 'succeeded')),
  constraint atlas_weekly_runs_counts_check check (jsonb_typeof(counts) = 'object'),
  constraint atlas_weekly_runs_errors_check check (jsonb_typeof(errors) = 'array'),
  constraint atlas_weekly_runs_state_check check (jsonb_typeof(state) = 'object')
);

create index if not exists atlas_weekly_runs_updated_idx on public.atlas_weekly_runs (updated_at desc);

alter table public.atlas_weekly_runs enable row level security;
alter table public.atlas_weekly_runs force row level security;
revoke all on table public.atlas_weekly_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.atlas_weekly_runs to service_role;
