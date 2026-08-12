-- =====================================================================
-- Motto Wholesale — full schema
-- Run this once in Supabase → SQL Editor.
--
-- PRICING MODEL (the important part)
--   Every variant has ONE list price: variants.list_cents (per case).
--   What a given dealer actually pays is resolved in this order:
--
--     1. dealer_prices row for (dealer, sku)   ← explicit manual override
--     2. list_cents discounted by dealer_accounts.discount_pct
--
--   So a new dealer needs ONE number entered (their discount) and they are
--   live. If you negotiated something odd on three SKUs, override just
--   those three. Raise a list price later and every dealer without an
--   override moves with it automatically.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- catalog
create table categories (
  id         serial primary key,
  slug       text unique not null,
  name       text not null,
  sort_order int default 0
);

create table products (
  id           uuid primary key default gen_random_uuid(),
  category_id  int references categories(id),
  slug         text unique not null,
  type_label   text,
  name         text not null,
  description  text,
  spec_tags    text[],
  colors       jsonb default '[]'::jsonb,   -- [{"name":"Black","hex":"#111"}]
  images       text[] default '{}',         -- ['usbc_black.png', ...]
  is_published boolean default true,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

create table variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete cascade,
  sku           text unique not null,
  upc           text,
  label         text not null,               -- '6 ft' | 'Single'
  case_pack     int  not null,
  master_carton int,
  list_cents    int  not null,               -- LIST price per case, integer cents
  msrp_cents    int,                         -- suggested retail per piece
  is_active     boolean default true,
  sort_order    int default 0
);

create index variants_product_idx on variants(product_id);

-- ---------------------------------------------------------------- dealers
create table dealer_accounts (
  id            uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name  text,
  phone         text,
  email         text,
  discount_pct  numeric(5,2) not null default 0,   -- 32.00 = 32% off list
  terms         text not null default 'prepay',    -- prepay | net15 | net30
  moq_cents     int  not null default 50000,
  notes         text,
  approved_at   timestamptz,
  created_at    timestamptz default now()
);

comment on column dealer_accounts.discount_pct is
  'Baseline discount off list. Overridden per SKU by dealer_prices.';

-- Manual per-SKU price for one dealer. Beats discount_pct.
create table dealer_prices (
  id         bigserial primary key,
  dealer_id  uuid not null references dealer_accounts(id) on delete cascade,
  sku        text not null references variants(sku) on delete cascade,
  case_cents int  not null,
  note       text,
  updated_at timestamptz default now(),
  unique (dealer_id, sku)
);

create index dealer_prices_dealer_idx on dealer_prices(dealer_id);

-- The one function that decides what a dealer pays.
-- Used by /api/catalog and /api/checkout so the price a dealer SEES
-- and the price they are CHARGED can never drift apart.
create or replace function dealer_case_price(p_dealer uuid, p_sku text)
returns int
language sql stable as $$
  select coalesce(
    (select dp.case_cents from dealer_prices dp
      where dp.dealer_id = p_dealer and dp.sku = p_sku),
    (select round(v.list_cents * (1 - d.discount_pct / 100.0))::int
       from variants v, dealer_accounts d
      where v.sku = p_sku and d.id = p_dealer)
  );
$$;

-- Full price sheet for one dealer. This is what the admin screen edits
-- and what the dealer catalog reads.
create or replace function dealer_price_sheet(p_dealer uuid)
returns table (
  sku text, product_name text, label text, case_pack int,
  list_cents int, case_cents int, is_override boolean
)
language sql stable as $$
  select v.sku, p.name, v.label, v.case_pack, v.list_cents,
         dealer_case_price(p_dealer, v.sku),
         exists (select 1 from dealer_prices dp
                  where dp.dealer_id = p_dealer and dp.sku = v.sku)
  from variants v
  join products p on p.id = v.product_id
  where v.is_active and p.is_published
  order by p.sort_order, v.sort_order;
$$;

-- ---------------------------------------------------------------- orders
create table orders (
  id                    uuid primary key default gen_random_uuid(),
  order_no              bigint generated always as identity,
  dealer_id             uuid references dealer_accounts(id),
  status                text not null default 'pending',
  -- pending | processing | paid | payment_failed | abandoned | refunded | shipped
  payment_method        text,
  subtotal_cents        int not null,
  freight_cents         int not null default 0,
  total_cents           int,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  customer_name         text,
  customer_email        text,
  ship_to               jsonb,
  resale_cert           text,
  created_at            timestamptz default now(),
  paid_at               timestamptz,
  shipped_at            timestamptz,
  tracking              text
);

create index orders_dealer_idx on orders(dealer_id, created_at desc);
create index orders_status_idx on orders(status);

create table order_items (
  id         bigserial primary key,
  order_id   uuid references orders(id) on delete cascade,
  sku        text not null,
  cases      int not null check (cases > 0),
  case_cents int not null,      -- price snapshot at order time
  pieces     int not null
);

create index order_items_order_idx on order_items(order_id);

-- ---------------------------------------------------------------- leads
create table leads (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name  text,
  email         text,
  phone         text,
  business_type text,
  message       text,
  status        text default 'new',
  assigned_rep  text,
  created_at    timestamptz default now()
);

-- =====================================================================
-- Row Level Security
--
-- Rule of thumb here: the browser can READ its own stuff and WRITE
-- nothing that involves money. Every write that touches a price goes
-- through a serverless function using the service_role key.
-- =====================================================================
alter table products        enable row level security;
alter table variants        enable row level security;
alter table categories      enable row level security;
alter table dealer_accounts enable row level security;
alter table dealer_prices   enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table leads           enable row level security;

-- Public catalog: anyone may read products, but NOT prices.
create policy cat_read  on categories for select to anon, authenticated using (true);
create policy prod_read on products   for select to anon, authenticated using (is_published);

-- variants carries list_cents, so anon is blocked entirely.
-- The public page reads this view instead.
create view public_catalog with (security_invoker = off) as
  select v.sku, v.label, v.case_pack, v.upc, p.slug as product_slug
  from variants v join products p on p.id = v.product_id
  where v.is_active and p.is_published;

grant select on public_catalog to anon, authenticated;

-- A dealer reads only their own account and their own overrides.
create policy dealer_self  on dealer_accounts for select to authenticated using (id = auth.uid());
create policy dprice_self  on dealer_prices   for select to authenticated using (dealer_id = auth.uid());

-- A dealer reads only their own orders. No insert policy on purpose:
-- orders are created server side so a browser can never invent a price.
create policy order_own on orders for select to authenticated using (dealer_id = auth.uid());
create policy oitem_own on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_items.order_id and o.dealer_id = auth.uid()));

-- Anyone may submit a lead. Nobody may read them back.
create policy lead_insert on leads for insert to anon, authenticated with check (true);

-- =====================================================================
-- Seed: categories
-- =====================================================================
insert into categories (slug, name, sort_order) values
  ('cables','Leather cables',1),
  ('power','Chargers & power',2),
  ('audio','Earbuds & audio',3),
  ('adapters','Adapters',4)
on conflict (slug) do nothing;
