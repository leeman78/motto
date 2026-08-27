-- =====================================================================
-- Motto Wholesale — the real price list, and a fixed-price model
--
-- WHAT CHANGES, AND WHY IT MATTERS
--
-- Until now a dealer's price was list minus a percentage. The business does
-- not work that way. There is one wholesale price per SKU, the same for
-- everyone, and the dealer's own margin is whatever they add on top. So the
-- percentage stops being the mechanism and the price list becomes it.
--
-- Four numbers per SKU, all per piece:
--
--   cost_cents      what Motto pays for it
--   list_cents      what the dealer pays Motto        (sheet: "Wholesale")
--   retail_cents    what the dealer charges a store   (sheet: "Retail")
--   msrp_cents      what the shopper pays             (sheet: "MSRP")
--
--   Motto margin  = list   - cost
--   Dealer margin = retail - list
--
-- cost_cents is set to half of list for now, on Nam's instruction, and is a
-- placeholder until the real landed costs are entered. It is stored rather
-- than computed so that correcting one SKU later does not require touching
-- this file again.
--
-- A NOTE ON UNITS. list_cents on variants is PER BOX, because that is what an
-- order is priced in and what dealer_case_price() returns. The sheet quotes
-- per piece. Every figure below is therefore multiplied by case_pack, and the
-- per-piece number is kept in the comment so the two can be reconciled.
--
-- THREE SKUs ARE RENAMED. The 10 ft part numbers were guessed from the
-- pattern of the priced cables back when only 3 ft and 6 ft were on an
-- invoice. The sheet shows the real ones use four digits, not three.
--
-- Safe to re-run.
-- =====================================================================

begin;

-- ---------------------------------------------------------------- columns
alter table variants add column if not exists cost_cents   int;
alter table variants add column if not exists retail_cents int;

comment on column variants.cost_cents   is 'Per box. What Motto pays. Placeholder = half of list.';
comment on column variants.retail_cents is 'Per box. What the dealer charges a store. Set from the sales sheet.';
comment on column variants.list_cents   is 'Per box. What the dealer pays Motto. The sheet calls this Wholesale.';

-- ---------------------------------------------------------------- renames
-- 10 ft cables: the real part numbers pad the length to four digits.
update variants set sku = 'IUL0010' where sku = 'IUL010';
update variants set sku = 'OCC0010' where sku = 'OCC010';
update variants set sku = 'OUC0010' where sku = 'OUC010';

-- Products the sheet names that were still on placeholder part numbers.
update variants set sku = '780080' where sku = 'MT-BUDS-P';
update variants set sku = 'JH071'  where sku = 'MT-AD-UC35';
-- MT-AD-LT35, the Lightning to 3.5mm adapter, is left alone: the sheet does
-- not give it a part number and inventing one is how the last three wrong
-- SKUs happened.

-- ---------------------------------------------------------------- prices
-- Per-piece figures straight off the sales sheet, multiplied by case_pack on
-- the way in so the stored value stays per box.
update variants v
set cost_cents   = s.wholesale * v.case_pack / 2,
    list_cents   = s.wholesale * v.case_pack,
    retail_cents = s.retail    * v.case_pack,
    msrp_cents   = s.msrp
from (values
  --  sku          wholesale  retail  msrp     per piece, in cents
  ('IUL003',            200,    400,   999),   -- iPhone USB 3 ft (U to L)
  ('IUL0010',           325,    700,  1699),   -- iPhone USB 10 ft (U to L)
  ('ICL006',            275,    600,  1299),   -- PD iPhone USB 6 ft (C to L)
  ('OCC003',            200,    400,   999),   -- PD Type-C USB 3 ft (C to C)
  ('OCC006',            275,    600,  1299),   -- PD Type-C USB 6 ft (C to C)
  ('OCC0010',           325,    700,  1699),   -- PD Type-C USB 10 ft (C to C)
  ('OUC003',            200,    400,   999),   -- Type-C USB 3 ft (U to C)
  ('OUC0010',           325,    700,  1699),   -- Type-C USB 10 ft (U to C)
  ('WC0200',            300,    600,  1299),   -- Wall charger
  ('CC0200',            250,    600,  1299),   -- PD car charger
  ('TEPH007',           300,    600,  1299),   -- Type-C earphone
  ('IEP007',            300,    600,  1299),   -- iPhone earphone
  ('EPH004',            225,    400,   999),   -- Earphone AUX type
  ('ANC',              1000,   2000,  3999),   -- A9 with display panel
  ('A5WH',             1000,   2000,  3999),   -- Wireless Airbuds headset
  ('780080',           1000,   2000,  3999),   -- Wireless headset B Plus
  ('JH071',             250,    600,  1299)    -- Type-C to 3.5mm AUX cable
) as s(sku, wholesale, retail, msrp)
where v.sku = s.sku;

commit;

-- ---------------------------------------------------------------- check
-- Per-piece view of what just landed, plus both margins. Anything showing
-- NULL in retail is a SKU the sheet does not price yet.
select
  v.sku,
  p.name,
  v.label,
  v.case_pack                                              as per_box,
  round(v.cost_cents  ::numeric / v.case_pack / 100, 2)     as cost_ea,
  round(v.list_cents  ::numeric / v.case_pack / 100, 2)     as wholesale_ea,
  round(v.retail_cents::numeric / v.case_pack / 100, 2)     as retail_ea,
  round(v.msrp_cents  ::numeric / 100, 2)                   as msrp,
  round((v.list_cents - v.cost_cents)::numeric / v.case_pack / 100, 2)   as motto_margin_ea,
  round((v.retail_cents - v.list_cents)::numeric / v.case_pack / 100, 2) as dealer_margin_ea
from variants v
join products p on p.id = v.product_id
order by v.retail_cents is null desc, p.sort_order, v.sort_order;
