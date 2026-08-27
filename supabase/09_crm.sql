-- =====================================================================
-- Motto Wholesale — sales reps, assignments and invoices
--
-- What this adds:
--   reps            a salesperson, with their own sign-in
--   dealer_accounts .rep_id, the dealer's assigned rep
--   orders          .rep_id, the rep credited for THAT order
--   invoices        a billing document raised against an order
--   invoice_items   what was billed, snapshotted
--   rep_monthly     a view: orders, revenue and commission by rep by month
--
-- Two things worth understanding before reading the rest.
--
-- 1. Reps sign in the same way dealers do. A rep row is keyed to an
--    auth.users id, so the sign-in, forced first password change and reset
--    that already exist for dealers work unchanged. This is what makes "rep
--    A sees only rep A's dealers" possible at all: with one shared admin
--    password the server cannot tell one person from another.
--
-- 2. orders.rep_id is written at order time and never recalculated. If a
--    dealer is reassigned later, past commission stays with the rep who
--    earned it. Deriving the rep from the dealer at report time would silently
--    move history every time an account changes hands.
-- =====================================================================

-- ---------------------------------------------------------------- reps
create table if not exists reps (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null,
  email          text not null,
  phone          text,
  -- Commission is a percentage of the order subtotal, freight excluded:
  -- freight is a pass-through cost, not something a rep sold.
  commission_pct numeric(5,2) not null default 0,
  is_active      boolean not null default true,
  -- Same reasoning as dealer_accounts: the first password is handed over by
  -- a person, so it is not private until it has been replaced.
  must_change_password boolean not null default true,
  password_changed_at  timestamptz,
  notes          text,
  created_at     timestamptz default now()
);

comment on table reps is
  'A salesperson. Sees their own dealers and orders; the owner sees everything.';
comment on column reps.commission_pct is
  'Percent of order subtotal. Freight is excluded because it is a pass-through.';

-- ------------------------------------------------- dealer -> rep
alter table dealer_accounts
  add column if not exists rep_id uuid references reps(id) on delete set null;

create index if not exists dealer_accounts_rep_idx on dealer_accounts(rep_id);

comment on column dealer_accounts.rep_id is
  'Who owns this relationship now. Past orders keep their own rep_id.';

-- ------------------------------------------------- order -> rep (snapshot)
alter table orders
  add column if not exists rep_id uuid references reps(id) on delete set null;

create index if not exists orders_rep_idx on orders(rep_id, created_at desc);

-- Stamp the rep on the way in, so reassigning a dealer never rewrites history.
create or replace function orders_set_rep()
returns trigger language plpgsql as $$
begin
  if new.rep_id is null and new.dealer_id is not null then
    select rep_id into new.rep_id from dealer_accounts where id = new.dealer_id;
  end if;
  return new;
end $$;

drop trigger if exists orders_set_rep_trg on orders;
create trigger orders_set_rep_trg
  before insert on orders
  for each row execute function orders_set_rep();

-- ---------------------------------------------------------------- invoices
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_no     bigint generated always as identity,
  order_id       uuid references orders(id) on delete set null,
  dealer_id      uuid not null references dealer_accounts(id),
  -- Snapshotted, like rep_id on orders, and for the same reason: an invoice
  -- is a document that was issued, not a live query.
  rep_id         uuid references reps(id) on delete set null,

  status         text not null default 'draft',
  -- draft | sent | paid | partial | void
  -- Void rather than delete. A missing invoice number is the thing an
  -- accountant asks about first.

  issued_at      timestamptz,
  due_at         timestamptz,
  terms          text not null default 'prepay',

  subtotal_cents int not null default 0,
  freight_cents  int not null default 0,
  tax_cents      int not null default 0,
  total_cents    int not null default 0,
  paid_cents     int not null default 0,

  bill_to        jsonb,
  ship_to        jsonb,
  po_number      text,
  notes          text,

  paid_at        timestamptz,
  voided_at      timestamptz,
  void_reason    text,
  created_at     timestamptz default now()
);

create index if not exists invoices_dealer_idx on invoices(dealer_id, created_at desc);
create index if not exists invoices_rep_idx    on invoices(rep_id, created_at desc);
create index if not exists invoices_status_idx on invoices(status);

comment on column invoices.status is
  'draft | sent | paid | partial | void. Never delete a raised invoice; void it.';
comment on column invoices.paid_cents is
  'Supports partial payment, which happens on net terms more than anyone expects.';

create table if not exists invoice_items (
  id          bigserial primary key,
  invoice_id  uuid not null references invoices(id) on delete cascade,
  sku         text not null,
  description text,
  boxes       int  not null check (boxes > 0),
  box_cents   int  not null,
  pieces      int  not null,
  line_cents  int  not null
);

create index if not exists invoice_items_invoice_idx on invoice_items(invoice_id);

comment on table invoice_items is
  'Copied from order_items at issue time. Prices and descriptions are frozen: '
  'reprinting a year-old invoice must not pick up this year''s price.';

-- ------------------------------------------------- keep the invoice total honest
create or replace function invoice_recalc(p_invoice uuid)
returns void language sql as $$
  update invoices i
  set subtotal_cents = coalesce((select sum(line_cents) from invoice_items where invoice_id = p_invoice), 0),
      total_cents    = coalesce((select sum(line_cents) from invoice_items where invoice_id = p_invoice), 0)
                       + i.freight_cents + i.tax_cents
  where i.id = p_invoice;
$$;

-- ---------------------------------------------------------------- reporting
-- Revenue and commission per rep per month.
--
-- Counted on PAID orders only. Booking commission on submitted orders pays out
-- on money that has not arrived, and on net terms some of it never does.
-- Change the status filter here if the business decides otherwise; it is the
-- one line that sets the rule.
create or replace view rep_monthly as
select
  r.id                                   as rep_id,
  r.name                                 as rep_name,
  date_trunc('month', o.paid_at)         as month,
  count(*)                               as orders,
  count(distinct o.dealer_id)            as dealers,
  sum(o.subtotal_cents)                  as subtotal_cents,
  sum(o.total_cents)                     as total_cents,
  round(sum(o.subtotal_cents) * r.commission_pct / 100) as commission_cents
from orders o
join reps r on r.id = o.rep_id
where o.status = 'paid' and o.paid_at is not null
group by r.id, r.name, date_trunc('month', o.paid_at);

comment on view rep_monthly is
  'Paid orders only, grouped by the month payment landed. Commission excludes freight.';

-- Everything a rep is allowed to see about their own book.
create or replace view rep_dealers as
select
  d.id, d.business_name, d.contact_name, d.email, d.phone,
  d.terms, d.discount_pct, d.approved_at, d.rep_id,
  (select count(*) from orders o where o.dealer_id = d.id)                   as orders_all_time,
  (select max(o.created_at) from orders o where o.dealer_id = d.id)          as last_order_at,
  (select coalesce(sum(o.subtotal_cents), 0) from orders o
     where o.dealer_id = d.id and o.status = 'paid')                          as paid_subtotal_cents,
  (select coalesce(sum(i.total_cents - i.paid_cents), 0) from invoices i
     where i.dealer_id = d.id and i.status in ('sent', 'partial'))            as outstanding_cents
from dealer_accounts d;

comment on view rep_dealers is
  'One row per dealer with the numbers a rep asks for. Scope by rep_id in the API.';

-- ---------------------------------------------------------------- access
-- These tables are only ever reached through the server, which holds the
-- service key. RLS is on with no permissive policy so that a leaked anon key
-- cannot read the book: defence in depth, not the primary control. Scoping a
-- rep to their own dealers is enforced in /api/rep against the signed-in user.
alter table reps          enable row level security;
alter table invoices      enable row level security;
alter table invoice_items enable row level security;
