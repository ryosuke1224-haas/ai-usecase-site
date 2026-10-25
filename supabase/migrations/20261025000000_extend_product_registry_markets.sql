-- Multi-market product registry.
-- Apply this file yourself in the Supabase SQL editor. Do not drop this table.
-- Existing rows keep their Stripe ids, amounts, and currency. Null market/locale become US / en.
-- Browser roles cannot read or write the table. The server writes with the service role.

alter table public.product_registry
  add column if not exists market text,
  add column if not exists locale text;

update public.product_registry
set market = 'US'
where market is null;

update public.product_registry
set locale = 'en'
where locale is null;

alter table public.product_registry
  alter column market set default 'US',
  alter column locale set default 'en',
  alter column market set not null,
  alter column locale set not null;

alter table public.product_registry
  drop constraint if exists product_registry_currency_check;

alter table public.product_registry
  add constraint product_registry_currency_check
  check (currency in ('usd', 'jpy'));

alter table public.product_registry
  drop constraint if exists product_registry_environment_check;

alter table public.product_registry
  add constraint product_registry_environment_check
  check (stripe_environment in ('SANDBOX', 'LIVE'));

alter table public.product_registry
  drop constraint if exists product_registry_market_check;

alter table public.product_registry
  add constraint product_registry_market_check
  check (market in ('US', 'JP'));

alter table public.product_registry
  drop constraint if exists product_registry_locale_check;

alter table public.product_registry
  add constraint product_registry_locale_check
  check (locale in ('en', 'ja'));

alter table public.product_registry
  drop constraint if exists product_registry_slug_unique;

alter table public.product_registry
  drop constraint if exists product_registry_mapping_unique;

alter table public.product_registry
  add constraint product_registry_mapping_unique
  unique (product_slug, market, locale, currency, stripe_environment);
