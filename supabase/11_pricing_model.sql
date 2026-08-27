-- =====================================================================
-- Motto Wholesale — fixed prices, rep margin, and where cost may be seen
--
-- HOW MONEY MOVES
--
--   Motto buys at        cost      $1.00   (placeholder: wholesale / 2)
--   Rep buys at          wholesale $2.00   our list price
--   Store buys at        retail    $4.00   what we invoice the store
--
--   Motto margin = wholesale - cost      $1.00
--   Rep margin   = retail - wholesale    $2.00
--
-- The store orders online, we invoice the store at retail, and the difference
-- is settled to the rep. So retail is the number the ordering system charges,
-- and wholesale exists to work out what the rep is owed.
--
-- WHAT THIS REPLACES
--
-- Pricing was list minus a percentage per dealer. It is now a fixed price per
-- SKU, with a per-dealer override where a rep has quoted that store its own
-- number. discount_pct stops being consulted; it is left on the table rather
-- than dropped so that nothing referencing it breaks, and is marked dead.
--
-- WHO MAY SEE COST
--
-- cost_cents and the Motto margin are for the owner alone. Not reps, not
-- stores. The API decides that, since every read goes through the server with
-- the service key, so this file adds a helper that returns everything EXCEPT
-- cost, and the rep and dealer endpoints use it. RLS stays on as a second
-- line: a leaked anon key still reads nothing.
--
-- Safe to re-run.
-- =====================================================================

begin;

-- ---------------------------------------------------------------- pricing
-- What a dealer pays: their own negotiated number if the rep set one,
-- otherwise the standard retail price. No percentage anywhere.
create or replace function dealer_case_price(p_dealer uuid, p_sku text)
returns int
language sql stable as $$
  select coalesce(
    (select dp.case_cents from dealer_prices dp
      where dp.dealer_id = p_dealer and dp.sku = p_sku),
    (select v.retail_cents from variants v where v.sku = p_sku),
    (select v.list_cents   from variants v where v.sku = p_sku)
  );
$$;

comment on function dealer_case_price(uuid, text) is
  'What the store is charged: the rep''s quoted price for that store, else the standard retail price. Never involves cost.';

comment on column dealer_accounts.discount_pct is
  'DEAD. Pricing is a fixed retail price per SKU, overridden per dealer in dealer_prices.';

comment on column dealer_prices.case_cents is
  'The retail price this store pays, quoted by its rep. Beats variants.retail_cents.';

-- ---------------------------------------------------------------- rep margin
-- What a rep earns on a line: retail charged minus wholesale owed to Motto.
create or replace function rep_margin_cents(p_sku text, p_charged int)
returns int
language sql stable as $$
  select p_charged - coalesce((select v.list_cents from variants v where v.sku = p_sku), 0);
$$;

comment on function rep_margin_cents(text, int) is
  'Rep margin for one box: what the store was charged, less the wholesale price.';

-- ---------------------------------------------------------------- reps
-- Reps do not earn a percentage. They buy at wholesale and sell at retail, so
-- the column that assumed a commission rate is retired.
comment on column reps.commission_pct is
  'DEAD. A rep earns retail minus wholesale, not a rate. Kept only so existing rows do not break.';

drop view if exists rep_monthly;

-- Monthly settlement per rep, computed from what was actually charged on each
-- order line. Paid orders only: settling on submitted orders pays out money
-- that has not arrived.
create view rep_monthly as
select
  r.id                            as rep_id,
  r.name                          as rep_name,
  date_trunc('month', o.paid_at)  as month,
  count(distinct o.id)            as orders,
  count(distinct o.dealer_id)     as dealers,
  sum(oi.cases * oi.case_cents)                                   as retail_cents,
  sum(oi.cases * coalesce(v.list_cents, 0))                       as wholesale_cents,
  sum(oi.cases * (oi.case_cents - coalesce(v.list_cents, 0)))     as rep_margin_cents
from orders o
join order_items oi on oi.order_id = o.id
join reps r         on r.id = o.rep_id
left join variants v on v.sku = oi.sku
where o.status = 'paid' and o.paid_at is not null
group by r.id, r.name, date_trunc('month', o.paid_at);

comment on view rep_monthly is
  'Paid orders by month. retail is what stores were charged, wholesale is what the rep owes Motto, the difference is the rep''s.';

-- What the owner sees, and only the owner: Motto's own margin.
create or replace view owner_monthly as
select
  date_trunc('month', o.paid_at)  as month,
  count(distinct o.id)            as orders,
  sum(oi.cases * oi.case_cents)                                   as retail_cents,
  sum(oi.cases * coalesce(v.list_cents, 0))                       as wholesale_cents,
  sum(oi.cases * coalesce(v.cost_cents, 0))                       as cost_cents,
  sum(oi.cases * (coalesce(v.list_cents,0) - coalesce(v.cost_cents,0))) as motto_margin_cents,
  sum(oi.cases * (oi.case_cents - coalesce(v.list_cents, 0)))     as rep_margin_cents
from orders o
join order_items oi on oi.order_id = o.id
left join variants v on v.sku = oi.sku
where o.status = 'paid' and o.paid_at is not null
group by date_trunc('month', o.paid_at);

comment on view owner_monthly is
  'Owner only. Contains cost and Motto margin, which no rep or store may see.';

-- ---------------------------------------------------------------- safe read
-- Everything about a SKU except what it cost us. The rep and dealer endpoints
-- read this, so cost cannot leak by someone selecting * on variants.
create or replace view variants_public as
select
  v.sku, v.product_id, v.upc, v.label, v.case_pack, v.master_carton,
  v.list_cents, v.retail_cents, v.msrp_cents,
  v.is_active, v.sort_order, v.stock_status, v.restock_date
from variants v;

comment on view variants_public is
  'variants without cost_cents. Anything that is not the admin reads this.';

commit;

-- ---------------------------------------------------------------- check
select
  v.sku,
  v.case_pack                                                          as per_box,
  round(v.cost_cents  ::numeric / v.case_pack / 100, 2)                as cost_ea,
  round(v.list_cents  ::numeric / v.case_pack / 100, 2)                as wholesale_ea,
  round(v.retail_cents::numeric / v.case_pack / 100, 2)                as retail_ea,
  round((v.list_cents   - v.cost_cents)::numeric / v.case_pack / 100, 2) as motto_ea,
  round((v.retail_cents - v.list_cents)::numeric / v.case_pack / 100, 2) as rep_ea
from variants v
where v.retail_cents is not null
order by v.sku;
