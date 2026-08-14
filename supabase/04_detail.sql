-- =====================================================================
-- Motto Wholesale — long-form product detail
--
-- 01_schema.sql cannot be re-run against a live database, so the same
-- columns are added here. Safe to run more than once.
--
--   description       short blurb, shown on the catalog card   (already exists)
--   description_long  full copy from the retail listing, product page only
--   features          Key Features bullets. Empty for products whose retail
--                     page has no feature list; the page then skips the block
--                     rather than showing an invented one.
--   compatibility     the one-line Compatibility note, where the source has one
--   weight_oz         per piece. Case weight is case_pack x this.
-- =====================================================================

alter table products add column if not exists description_long text;
alter table products add column if not exists features         text[] default '{}';
alter table products add column if not exists compatibility    text;
alter table products add column if not exists weight_oz        numeric(6,2);

-- ---------------------------------------------------------------------
-- Weights. Every retail listing carries one, so all fifteen are known.
-- ---------------------------------------------------------------------
update products p set weight_oz = w.oz
from (values
  ('usbc-usbc',            2.00),
  ('usbc-lightning',       2.60),
  ('usba-usbc',            2.00),
  ('usba-lightning',       2.00),
  ('wall-20w',             1.50),
  ('car-45w',              0.60),
  ('buds-plus',            3.70),
  ('airbuds-a5',           4.90),
  ('headset-anc',          4.70),
  ('wired-35mm',           1.40),
  ('wired-usbc',           1.40),
  ('wired-lightning',      1.40),
  ('adapter-usbc-35',      0.60),
  ('adapter-lightning-35', 0.60)
) as w(slug, oz)
where p.slug = w.slug;
