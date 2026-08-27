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
  'OCC003','OCC006','OCC0010',
  'ICL006',
  'OUC003','OUC0010',
  'IUL003','IUL0010',
  'WC0200','CC0200',
  '780080','A5WH','ANC',
  'EPH004','TEPH007','IEP007',
  'JH071','MT-AD-LT35'
);
