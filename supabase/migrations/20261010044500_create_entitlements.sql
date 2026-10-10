-- Atlas Payments v1 entitlements.
-- Apply this file yourself in the Supabase SQL editor. Do not drop this table.
-- Authenticated users can read their own rows. They cannot insert, update, or delete.
-- The Stripe webhook writes rows with the service role, which bypasses row level security.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  access_type text not null,
  status text not null,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_user_product_unique unique (user_id, product_slug),
  constraint entitlements_access_type_check check (access_type in ('lifetime')),
  constraint entitlements_status_check check (status in ('active', 'revoked')),
  constraint entitlements_product_slug_check check (char_length(product_slug) > 0)
);

create unique index if not exists entitlements_checkout_session_unique
  on public.entitlements (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists entitlements_user_id_idx
  on public.entitlements (user_id);

create or replace function public.touch_entitlements_updated_at()
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
  if not exists (
    select 1 from pg_trigger where tgname = 'entitlements_touch_updated_at'
  ) then
    create trigger entitlements_touch_updated_at
    before update on public.entitlements
    for each row
    execute function public.touch_entitlements_updated_at();
  end if;
end $$;

alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;

revoke all on table public.entitlements from public, anon, authenticated;
grant select on table public.entitlements to authenticated;
grant select, insert, update on table public.entitlements to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'entitlements'
      and policyname = 'entitlements_select_own'
  ) then
    create policy entitlements_select_own
    on public.entitlements
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;
