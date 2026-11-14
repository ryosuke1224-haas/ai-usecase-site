-- Review queue, newsletter issues, and the admin action log.
-- Apply this after 20261114000000_create_articles_and_newsletter.sql
-- in the Atlas Supabase SQL editor.
-- Public and signed-in clients cannot read or write these tables.
-- Approve, needs changes, and reject do not publish or send.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'articles'
  ) then
    alter table public.articles drop constraint if exists articles_status_check;
    alter table public.articles add constraint articles_status_check
      check (status in ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'PUBLISHED', 'ARCHIVED'));
  end if;
end $$;

create table if not exists public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  summary text not null,
  body text not null default '',
  status text not null,
  review_note text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_issues_slug_unique unique (slug),
  constraint newsletter_issues_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint newsletter_issues_status_check check (
    status in ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'SENT')
  ),
  constraint newsletter_issues_sent_check check (status <> 'SENT' or sent_at is not null)
);

create table if not exists public.review_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  title text not null,
  summary text not null,
  status text not null,
  qa_note text,
  review_note text,
  preview_path text,
  related_slug text,
  source text not null default 'atlas',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_items_type_check check (item_type in ('BLUEPRINT', 'CONTENT_UPDATE')),
  constraint review_items_status_check check (
    status in ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'PUBLISHED')
  ),
  constraint review_items_source_check check (source in ('atlas', 'owner'))
);

create table if not exists public.admin_action_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  target_title text not null,
  from_status text not null,
  to_status text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint admin_action_log_action_check check (action in ('approve', 'needs_changes', 'reject')),
  constraint admin_action_log_target_check check (target_type in ('blog', 'newsletter', 'review'))
);

create index if not exists newsletter_issues_status_idx on public.newsletter_issues (status, updated_at desc);
create index if not exists review_items_status_idx on public.review_items (status, created_at desc);
create index if not exists admin_action_log_created_at_idx on public.admin_action_log (created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'newsletter_issues_touch_updated_at') then
    create trigger newsletter_issues_touch_updated_at
    before update on public.newsletter_issues
    for each row
    execute function public.touch_atlas_content_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'review_items_touch_updated_at') then
    create trigger review_items_touch_updated_at
    before update on public.review_items
    for each row
    execute function public.touch_atlas_content_updated_at();
  end if;
end $$;

alter table public.newsletter_issues enable row level security;
alter table public.newsletter_issues force row level security;
revoke all on table public.newsletter_issues from public, anon, authenticated;
grant select, insert, update, delete on table public.newsletter_issues to service_role;

alter table public.review_items enable row level security;
alter table public.review_items force row level security;
revoke all on table public.review_items from public, anon, authenticated;
grant select, insert, update, delete on table public.review_items to service_role;

alter table public.admin_action_log enable row level security;
alter table public.admin_action_log force row level security;
revoke all on table public.admin_action_log from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_action_log to service_role;
