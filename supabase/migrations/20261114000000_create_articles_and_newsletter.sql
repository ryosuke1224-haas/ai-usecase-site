-- Atlas articles and newsletter subscribers.
-- Apply this file in the Atlas Supabase SQL editor. Do not drop these tables.
-- Public and signed-in clients cannot read or write these tables.
-- The server uses the service role, which bypasses row level security.
-- A later review queue can use status, review_note, and scheduled_for.
-- A later send step can add newsletter_issues without replacing newsletter_subscribers.

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  summary text not null,
  body text not null,
  category text not null,
  source_urls jsonb not null default '[]'::jsonb,
  related_blueprints jsonb not null default '[]'::jsonb,
  status text not null,
  published_at timestamptz,
  featured boolean not null default false,
  display_author text,
  seo_title text,
  seo_description text,
  review_note text,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_slug_unique unique (slug),
  constraint articles_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint articles_category_check check (category in ('ai-news', 'us-tech', 'practical-ai', 'technical')),
  constraint articles_status_check check (status in ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'PUBLISHED', 'ARCHIVED')),
  constraint articles_published_check check (status <> 'PUBLISHED' or published_at is not null),
  constraint articles_source_urls_check check (jsonb_typeof(source_urls) = 'array'),
  constraint articles_related_blueprints_check check (jsonb_typeof(related_blueprints) = 'array')
);

create index if not exists articles_status_published_at_idx
  on public.articles (status, published_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email),
  constraint newsletter_subscribers_email_check check (
    email = lower(email)
    and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint newsletter_subscribers_status_check check (status in ('ACTIVE', 'UNSUBSCRIBED')),
  constraint newsletter_subscribers_source_check check (
    source in ('ja-home', 'ja-blog', 'ja-article', 'ja-newsletter')
  )
);

create index if not exists newsletter_subscribers_status_subscribed_at_idx
  on public.newsletter_subscribers (status, subscribed_at desc);

create or replace function public.touch_atlas_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'articles_touch_updated_at') then
    create trigger articles_touch_updated_at
    before update on public.articles
    for each row
    execute function public.touch_atlas_content_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'newsletter_subscribers_touch_updated_at') then
    create trigger newsletter_subscribers_touch_updated_at
    before update on public.newsletter_subscribers
    for each row
    execute function public.touch_atlas_content_updated_at();
  end if;
end $$;

alter table public.articles enable row level security;
alter table public.articles force row level security;
revoke all on table public.articles from public, anon, authenticated;
grant select, insert, update, delete on table public.articles to service_role;

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_subscribers force row level security;
revoke all on table public.newsletter_subscribers from public, anon, authenticated;
grant select, insert, update, delete on table public.newsletter_subscribers to service_role;
