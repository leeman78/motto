-- =====================================================================
-- Motto Wholesale — 780080 belongs to the Lightning adapter
--
-- The sales sheet row for 780080 is the Lightning to 3.5mm AUX audio cable,
-- not the BUDS+ headset. Reading the two off a photograph of a rotated page,
-- they were swapped.
--
--   780080   Lightning to 3.5mm AUX audio cable   $2.50 / $6.00 / $12.99
--
-- BUDS+ takes its real part number, BUDS. The wireless products all use a
-- short name rather than a coded one, which is why it did not look like a
-- SKU on the sheet: ANC, A5WH, BUDS.
--
-- Order matters. 780080 has to be freed before it can be reused, or the
-- unique constraint on variants.sku rejects the second update.
--
-- Safe to re-run.
-- =====================================================================

begin;

-- Free the number, and give BUDS+ the part number it actually has.
update variants v
set sku = 'BUDS'
from products p
where p.id = v.product_id
  and v.sku in ('780080', 'MT-BUDS-P')
  and p.slug = 'buds-plus';

-- Give it to the adapter it actually belongs to.
update variants v
set sku = '780080'
from products p
where p.id = v.product_id
  and p.slug = 'adapter-lightning-35'
  and v.sku <> '780080';

-- Price both from the sheet. Per piece x case_pack, as everywhere else.
-- BUDS+ needs doing here too: 10_price_list.sql priced 780080, and that row
-- is the adapter, so BUDS+ was left without one.
update variants v
set cost_cents   = s.wholesale * v.case_pack / 2,
    list_cents   = s.wholesale * v.case_pack,
    retail_cents = s.retail    * v.case_pack,
    msrp_cents   = s.msrp
from (values
  ('780080',  250,  600, 1299),   -- Lightning to 3.5mm AUX audio cable
  ('BUDS',   1000, 2000, 3999)    -- Wireless Headset B Plus
) as s(sku, wholesale, retail, msrp)
where v.sku = s.sku;

commit;

-- Both adapters and BUDS+, so the swap can be seen to have landed.
select
  p.name,
  v.sku,
  v.case_pack                                                as per_box,
  round(v.list_cents  ::numeric / v.case_pack / 100, 2)      as wholesale_ea,
  round(v.retail_cents::numeric / v.case_pack / 100, 2)      as retail_ea,
  round(v.msrp_cents  ::numeric / 100, 2)                    as msrp
from variants v
join products p on p.id = v.product_id
where p.slug in ('adapter-lightning-35', 'adapter-usbc-35', 'buds-plus')
order by p.name;
