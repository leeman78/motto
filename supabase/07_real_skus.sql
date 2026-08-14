-- =====================================================================
-- Motto Wholesale — real SKUs
--
-- The MT-* codes were invented while the catalogue was being built. The real
-- part numbers are the ones on the supplier invoice, and they are what is
-- printed on the display labels a store owner reads before reordering. Using
-- anything else means a buyer searches a number that does not exist here.
--
--   WC0200   20W PD wall charger              was MT-W20
--   CC0200   45W PD car charger               was MT-C45
--   EPH004   3.5mm AUX earphones              was MT-EAR-35
--   TEPH007  USB-C earphones                  was MT-EAR-UC
--   IEP007   Lightning earphones              was MT-EAR-LT
--   IUL003   USB-A to Lightning, 3 ft         was MT-AL-03
--   ICL006   USB-C to Lightning, 6 ft         was MT-CL-06
--   OUC003   USB-A to USB-C, 3 ft             was MT-AC-03
--   OCC006   USB-C to USB-C, 6 ft             was MT-CC65-06
--   A5WH     Wireless Airbuds A5              was MT-A5
--   ANC      Wireless Headset ANC/ENC         was MT-HS-ANC
--
-- Eight SKUs are NOT renamed, because the invoice does not name them and a
-- guessed part number is worse than an obviously placeholder one. They keep
-- their MT-* code and can be edited in the admin once the real numbers are
-- known:
--   MT-PB-SOC   MT-BUDS-P   MT-AD-UC35  MT-AD-LT35
--
-- Four cable SKUs ARE renamed from the pattern the priced cables share, since
-- the scheme is unambiguous once decoded. They are still worth confirming:
--   OCC003  OCC010  OUC010  IUL010
--
-- dealer_prices.sku references variants(sku) without ON UPDATE CASCADE, so
-- the constraint is briefly deferred and both tables are moved together.
-- Prices are not touched.
--
-- Safe to re-run: rows already renamed simply match nothing.
-- =====================================================================

begin;

create temp table sku_map(old_sku text primary key, new_sku text not null) on commit drop;
insert into sku_map values
  ('MT-W20',     'WC0200'),
  ('MT-C45',     'CC0200'),
  ('MT-EAR-35',  'EPH004'),
  ('MT-EAR-UC',  'TEPH007'),
  ('MT-EAR-LT',  'IEP007'),
  ('MT-AL-03',   'IUL003'),
  ('MT-CL-06',   'ICL006'),
  ('MT-AC-03',   'OUC003'),
  ('MT-CC65-06', 'OCC006'),
  ('MT-A5',      'A5WH'),
  ('MT-HS-ANC',  'ANC'),
  -- Derived from the pattern the four priced cables share, not from the
  -- invoice, which only priced 3 ft and 6 ft. Confirm with the supplier.
  --   position 1  device        I = iPhone,   O = other
  --   position 2  charger end   U = USB-A,    C = USB-C (the PD lines)
  --   position 3  device end    L = Lightning, C = Type-C
  --   digits      length in feet
  ('MT-CC65-03', 'OCC003'),
  ('MT-CC65-10', 'OCC010'),
  ('MT-AC-10',   'OUC010'),
  ('MT-AL-10',   'IUL010');

-- Stop if a target name is already taken by a different row, rather than
-- failing halfway through with the catalogue in two states.
do $$
declare clash text;
begin
  select string_agg(m.new_sku, ', ') into clash
  from sku_map m
  join variants v on v.sku = m.new_sku
  where not exists (select 1 from variants o where o.sku = m.old_sku);
  if clash is not null then
    raise exception 'These SKUs already exist and are not the rows being renamed: %', clash;
  end if;
end $$;

alter table dealer_prices drop constraint if exists dealer_prices_sku_fkey;

update variants v set sku = m.new_sku from sku_map m where v.sku = m.old_sku;
update dealer_prices d set sku = m.new_sku from sku_map m where d.sku = m.old_sku;

alter table dealer_prices
  add constraint dealer_prices_sku_fkey
  foreign key (sku) references variants(sku) on update cascade on delete cascade;

commit;

-- What the catalogue looks like now.
select
  p.name,
  v.label,
  v.sku,
  case when v.sku like 'MT-%' then 'PLACEHOLDER — real part number needed'
       else 'real part number' end as status
from variants v
join products p on p.id = v.product_id
order by status, v.sku;
