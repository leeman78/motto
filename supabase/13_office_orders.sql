-- 13_office_orders.sql
--
-- Orders no longer have to be born in the dealer's browser. The office (and
-- later a rep) writes the order, and the store approves and pays it through
-- a link — no username, no password. The link carries a token instead.
--
-- Run after 12_fix_780080.sql. Safe to re-run.

-- ---------------------------------------------------------------
-- 1. Who created the order.
--
--    'dealer'  the store itself, signed in, through checkout
--    'office'  entered in the admin console
--    'rep'     entered in the rep portal (wired up later; the column is
--              ready so the rep build does not need another migration)
-- ---------------------------------------------------------------
alter table orders
  add column if not exists placed_by text not null default 'dealer';

comment on column orders.placed_by is
  'dealer = store ordered itself · office = entered in admin · rep = entered by a sales rep';

-- ---------------------------------------------------------------
-- 2. The pay link token.
--
--    A UUID is 122 bits of randomness — not guessable — and it authorizes
--    exactly one thing: viewing and paying this one order. It is not a
--    session and grants nothing else, which is why the store needs no
--    account for this to be safe.
-- ---------------------------------------------------------------
alter table orders
  add column if not exists pay_token uuid unique default gen_random_uuid();

update orders set pay_token = gen_random_uuid() where pay_token is null;

create index if not exists orders_pay_token_idx on orders(pay_token);

alter table orders
  add column if not exists pay_link_sent_at timestamptz;

comment on column orders.pay_link_sent_at is
  'When the pay link was last emailed to the store. Null = never sent.';

-- ---------------------------------------------------------------
-- 3. One Stripe customer per store.
--
--    This is what makes the second order a two-tap affair: the bank account
--    the store connected on the first order is saved against this customer,
--    and Stripe offers it back on the next session.
-- ---------------------------------------------------------------
alter table dealer_accounts
  add column if not exists stripe_customer_id text;

comment on column dealer_accounts.stripe_customer_id is
  'Created on first payment. Saved bank accounts / cards live under it in Stripe.';

-- sanity check
select column_name from information_schema.columns
 where table_name = 'orders'
   and column_name in ('placed_by', 'pay_token', 'pay_link_sent_at');
