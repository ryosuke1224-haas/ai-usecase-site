-- Atlas Commerce v1 product registry.
-- Apply this file yourself in the Supabase SQL editor. Do not drop this table.
-- Browser roles cannot read or write it. The server writes with the service role.
-- price_amount, suggested_price_amount, and approved_price_amount are integer cents.

create table if not exists public.product_registry (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  name text not null,
  stripe_product_id text,
  stripe_price_id text,
  price_amount integer,
  suggested_price_amount integer,
  approved_price_amount integer,
  currency text not null default 'usd',
  payment_type text not null,
  stripe_environment text not null,
  status text not null,
  commercial_rationale text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_registry_slug_unique unique (product_slug),
  constraint product_registry_slug_check check (product_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint product_registry_payment_type_check check (payment_type in ('ONE_TIME')),
  constraint product_registry_environment_check check (stripe_environment in ('SANDBOX')),
  constraint product_registry_status_check check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  constraint product_registry_currency_check check (currency in ('usd'))
);

create index if not exists product_registry_status_idx
  on public.product_registry (status);

create or replace function public.touch_product_registry_updated_at()
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
    select 1 from pg_trigger where tgname = 'product_registry_touch_updated_at'
  ) then
    create trigger product_registry_touch_updated_at
    before update on public.product_registry
    for each row
    execute function public.touch_product_registry_updated_at();
  end if;
end $$;

alter table public.product_registry enable row level security;
alter table public.product_registry force row level security;

revoke all on table public.product_registry from public, anon, authenticated;
grant select, insert, update on table public.product_registry to service_role;
