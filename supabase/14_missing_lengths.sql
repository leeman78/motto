-- 14_missing_lengths.sql
--
-- The cable line is uneven: C-to-Lightning exists only in 6 ft, and the two
-- USB-A cables have no 6 ft. Nam says the real line is fuller than that.
--
-- ⚠️ DO NOT RUN AS-IS. Every SKU below marked CONFIRM was inferred from the
-- naming pattern (3 ft = xxx003, 6 ft = xxx006, 10 ft = xxx0010), and this
-- codebase has been burned by that exact guess before — see the note in
-- 10_price_list.sql about three wrong part numbers. Check each SKU against
-- the physical box or the supplier invoice, fix any that differ, delete the
-- lines for lengths Motto does not actually carry, then run.
--
-- Prices follow the sheet's per-length pattern (per piece):
--   3 ft   wholesale $2.00 · retail $4.00 · MSRP  $9.99 · 25/box · 200/master
--   6 ft   wholesale $2.75 · retail $6.00 · MSRP $12.99 · 25/box · 200/master
--   10 ft  wholesale $3.25 · retail $7.00 · MSRP $16.99 · 100/box · 400/master
-- If the invoice says otherwise for any SKU, the invoice wins.
--
-- Safe to re-run after editing (upserts on sku).

begin;

with c as (select id, slug from products),
     rows(slug, sku, label, pack, master, list_pp, retail_pp, msrp, ord) as (values
  -- ---- USB-C to Lightning (today: ICL006 only) ----
  ('usbc-lightning', 'ICL003',  '3 ft',  25, 200, 200, 400,  999, 1),  -- CONFIRM sku
  ('usbc-lightning', 'ICL0010', '10 ft', 100, 400, 325, 700, 1699, 3), -- CONFIRM sku
  -- ---- USB-A to Lightning (today: 3 ft, 10 ft) ----
  ('usba-lightning', 'IUL006',  '6 ft',  25, 200, 275, 600, 1299, 2),  -- CONFIRM sku
  -- ---- USB-A to USB-C (today: 3 ft, 10 ft) ----
  ('usba-usbc',      'OUC006',  '6 ft',  25, 200, 275, 600, 1299, 2)   -- CONFIRM sku
)
insert into variants
  (product_id, sku, label, case_pack, master_carton,
   list_cents, retail_cents, msrp_cents, cost_cents, sort_order, stock_status, is_active)
select c.id, r.sku, r.label, r.pack, r.master,
       r.list_pp   * r.pack,          -- per box, like every other variant
       r.retail_pp * r.pack,
       r.msrp,                        -- msrp stays per piece
       (r.list_pp * r.pack) / 2,      -- cost placeholder = half of list, same as 10_price_list
       r.ord, 'in_stock', true
from rows r join c on c.slug = r.slug
on conflict (sku) do update set
  label         = excluded.label,
  case_pack     = excluded.case_pack,
  master_carton = excluded.master_carton,
  list_cents    = excluded.list_cents,
  retail_cents  = excluded.retail_cents,
  msrp_cents    = excluded.msrp_cents,
  sort_order    = excluded.sort_order,
  is_active     = true;

commit;

-- sanity: every cable family with its lengths
select p.slug, v.sku, v.label, v.case_pack,
       v.list_cents, v.retail_cents, v.msrp_cents
from variants v join products p on p.id = v.product_id
where p.slug in ('usbc-usbc','usbc-lightning','usba-lightning','usba-usbc')
  and v.is_active
order by p.slug, v.sort_order;
