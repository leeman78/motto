-- =====================================================================
-- Motto Wholesale — real packaging quantities
--
-- Supplied by Nam, 14 Aug 2026, for the core Motto products. Replaces the
-- placeholder pack sizes that were in the seed.
--
--   3 ft and 6 ft cables      25 pc per box   x 8 boxes = 200 per case
--   10 ft cables             100 pc per box   x 2 boxes = 200 per case
--   Wall charger             100 pc per box   x 4 boxes = 400 per case
--   Car charger              600 pc per box   x 1 box   = 600 per case
--   A5 Airbuds               100 pc per box   x 1 box   = 100 per case
--   ANC / A9 headset         100 pc per box   x 1 box   = 100 per case
--   Wired earphones, all 3   100 pc per box   x 3 boxes = 300 per case
--
-- MAPPING, and the one thing to check before running this:
--   variants.case_pack     <- the BOX quantity, the unit a dealer orders in
--   variants.master_carton <- the CASE quantity, the unit that ships
--
-- case_pack drives the order form. Setting it to the 200/400/600 case figure
-- instead would make that the minimum a dealer can buy. If the box is not
-- actually your minimum order, change the numbers below before running.
--
-- NOT TOUCHED, because they were not in the supplied list:
--   MT-PB-SOC   Soccer Ball Power Bank
--   MT-BUDS-P   Motto BUDS+
--   MT-AD-UC35  USB-C to 3.5mm adapter
--   MT-AD-LT35  Lightning to 3.5mm adapter
--
-- Safe to re-run.
-- =====================================================================

update variants set case_pack = v.box, master_carton = v.cs
from (values
  -- 3 ft and 6 ft cables
  ('MT-CC65-03',  25, 200),
  ('MT-CC65-06',  25, 200),
  ('MT-CL-06',    25, 200),
  ('MT-AC-03',    25, 200),
  ('MT-AL-03',    25, 200),
  -- 10 ft cables
  ('MT-CC65-10', 100, 200),
  ('MT-AC-10',   100, 200),
  ('MT-AL-10',   100, 200),
  -- chargers
  ('MT-W20',     100, 400),
  ('MT-C45',     600, 600),
  -- wireless
  ('MT-A5',      100, 100),
  ('MT-HS-ANC',  100, 100),
  -- wired earphones
  ('MT-EAR-35',  100, 300),
  ('MT-EAR-UC',  100, 300),
  ('MT-EAR-LT',  100, 300)
) as v(sku, box, cs)
where variants.sku = v.sku;

-- Check the result, and see which SKUs are still on placeholder packaging.
select
  v.sku,
  v.label,
  v.case_pack                              as per_box,
  v.master_carton                          as per_case,
  round(v.master_carton::numeric / nullif(v.case_pack, 0), 2) as boxes_per_case,
  case when v.sku in ('MT-PB-SOC','MT-BUDS-P','MT-AD-UC35','MT-AD-LT35')
       then 'PLACEHOLDER' else 'confirmed' end as source
from variants v
order by source, v.sku;
