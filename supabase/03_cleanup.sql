-- =====================================================================
-- 03_cleanup.sql — run once, after 02_seed.sql
--
-- Removes rows that were seeded from guesses before the real product list
-- was confirmed against mottousa.com. Re-running is harmless.
-- =====================================================================

-- Lightning to USB-C Adapter: never existed. Guessed early on.
delete from variants where sku = 'MT-AD-LTUC';
delete from products where slug = 'adapter-lightning-usbc';

-- USB-A to Lightning was guessed at 6 ft. The real sizes are 3 ft and 10 ft,
-- and MT-AL-10 comes from the seed.
delete from variants where sku = 'MT-AL-06';

-- USB-C to Lightning was guessed at 3 ft as well as 6 ft. Only 6 ft is real.
delete from variants where sku = 'MT-CL-03';

-- Anything else that is not in 02_seed.sql is either something you added on
-- purpose or another leftover. This lists them rather than deleting, because
-- deleting a SKU a dealer has been quoted on is not something to automate.
select 'REVIEW: not in the current seed' as note, v.sku, p.name
from variants v join products p on p.id = v.product_id
where v.sku not in (
  'MT-CC65-03','MT-CC65-06','MT-CC65-10',
  'MT-CL-06',
  'MT-AC-03','MT-AC-10',
  'MT-AL-03','MT-AL-10',
  'MT-W20','MT-C45','MT-PB-SOC',
  'MT-BUDS-P','MT-A5','MT-HS-ANC',
  'MT-EAR-35','MT-EAR-UC','MT-EAR-LT',
  'MT-AD-UC35','MT-AD-LT35'
);
