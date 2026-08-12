-- =====================================================================
-- Motto Wholesale — catalog seed
--
-- IMAGES
--   colors  = [{"name","hex","image"}]  one package shot per colorway.
--             Clicking a swatch on the site swaps the main photo to it.
--             image can be null while you are still shooting; the swatch
--             renders dimmed and is not clickable.
--   images  = extra views (brand shot, lifestyle, detail). The first one
--             is what the card shows before any swatch is clicked.
--
-- PRICES
--   list_cents = LIST price per case, integer cents. Placeholders below.
--   Replace with your real numbers BEFORE opening any dealer accounts.
-- =====================================================================

with c as (select id, slug from categories)
insert into products (category_id, slug, type_label, name, description, spec_tags, colors, images, sort_order)
values

-- ------------------------------------------------- CABLES
((select id from c where slug='cables'),'usbc-usbc','Leather-Wrapped Charging Cable',
 'USB-C to USB-C Fast Charging Cable',
 'Leather-wrapped Type-C to Type-C cable rated to 65W. Tangle-free, flexible, and built for daily handling. Works with Samsung, Pixel, iPad, MacBook and any other USB-C device.',
 '{"3 ft / 6 ft / 10 ft","Up to 65W","USB-C PD","Data sync"}',
 '[{"name":"Black","hex":"#1a1a1a","image":"usbc_black.webp"},
   {"name":"Brown","hex":"#6b4128","image":"usbc_brown.webp"},
   {"name":"Wine","hex":"#7d2230","image":"usbc_wine.webp"},
   {"name":"Orange","hex":"#e2611f","image":"usbc_orange.webp"},
   {"name":"Gold","hex":"#c98b32","image":null}]',
 '{usbc_hero.webp}',1),

((select id from c where slug='cables'),'usbc-lightning','Leather-Wrapped Lightning Cable',
 'USB-C to Lightning Fast Charging Cable',
 'Leather-wrapped Type-C to Lightning cable for Apple devices, supporting up to 65W fast charging plus stable data transfer.',
 '{"6 ft","Up to 65W","Lightning","Data sync"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},
   {"name":"Wine","hex":"#7d2230","image":"lightning_wine.webp"},
   {"name":"Gold","hex":"#c98b32","image":"lightning_gold.webp"},
   {"name":"Orange","hex":"#e2611f","image":"lightning_orange.webp"},
   {"name":"Brown","hex":"#6b4128","image":"lightning_brown.webp"}]',
 '{lightning_hero.webp}',2),

((select id from c where slug='cables'),'usba-lightning','Leather-Wrapped Lightning Cable',
 'USB-A to Lightning Charging Cable',
 'Legacy USB-A connection for customers still running older wall bricks and car adapters.',
 '{"3 ft / 6 ft","USB-A","Lightning"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},
   {"name":"Wine","hex":"#7d2230","image":null},
   {"name":"Brown","hex":"#6b4128","image":null}]',
 '{}',3),

-- ------------------------------------------------- CHARGERS & POWER
((select id from c where slug='power'),'wall-20w','Fast Charger','20W PD Wall Charger',
 'Compact dual-port wall charger with USB-C PD and USB-A. Supports Lightning, Micro USB and USB-C cables, so one brick covers the whole rack.',
 '{"20W PD","USB-C","USB-A","Dual Port"}',
 '[{"name":"White","hex":"#f4f4f6","image":"wall_white.webp"},
   {"name":"Black","hex":"#1a1a1a","image":"wall_black.webp"}]',
 '{wall_white.webp,wall_lifestyle.webp}',4),

((select id from c where slug='power'),'car-45w','Fast Charger','45W PD Car Charger',
 'USB-C Power Delivery paired with an 18W Quick Charge port in an alloy housing.',
 '{"45W PD","QC 18W","Dual Port"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null}]','{}',5),

((select id from c where slug='power'),'powerbank-soccer','Portable Power','Soccer Ball Portable Power Bank',
 'Novelty portable power bank with USB-C in and out. Seasonal and event-driven demand.',
 '{"Portable","USB-C In/Out"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]','{}',6),

-- ------------------------------------------------- AUDIO
((select id from c where slug='audio'),'buds-plus','True Wireless Earbuds','Motto BUDS+',
 'True wireless earbuds with active noise cancellation and a Qi-chargeable case.',
 '{"ANC","Qi Charging","True Wireless"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},{"name":"White","hex":"#f4f4f6","image":null}]','{}',7),

((select id from c where slug='audio'),'airbuds-a5','True Wireless Earbuds','Wireless Airbuds A5',
 'Entry true wireless earbuds for retailers who want a second price point above wired.',
 '{"True Wireless","Charging Case"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]','{}',8),

((select id from c where slug='audio'),'headset-anc','Wireless Headset','Wireless Headset ANC/ENC',
 'Over-ear wireless headset with active and environmental noise cancellation.',
 '{"ANC","ENC","Over-Ear"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},{"name":"White","hex":"#f4f4f6","image":null}]','{}',9),

((select id from c where slug='audio'),'wired-35mm','Wired Earphones','Premium 3.5mm AUX Wired Earphones',
 'Standard 3.5mm wired earphones with in-line mic. Reliable impulse purchase at the counter.',
 '{"3.5mm","In-line Mic"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},{"name":"White","hex":"#f4f4f6","image":null}]','{}',10),

((select id from c where slug='audio'),'wired-usbc','Wired Earphones','Premium USB-C Wired Earphones',
 'USB-C wired earphones for Android and iPhone 15 and up. Growing share every quarter.',
 '{"USB-C","In-line Mic"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},{"name":"White","hex":"#f4f4f6","image":null}]','{}',11),

((select id from c where slug='audio'),'wired-lightning','Wired Earphones','Premium Lightning Wired Earphones',
 'Lightning wired earphones for the installed iPhone base. Still the volume leader on wired.',
 '{"Lightning","In-line Mic"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},{"name":"White","hex":"#f4f4f6","image":null}]','{}',12),

-- ------------------------------------------------- ADAPTERS
((select id from c where slug='adapters'),'adapter-usbc-35','Audio Adapter Cable','USB-C to 3.5mm Audio Adapter Cable',
 'Type-C to 3.5mm AUX cable for headphones and car aux inputs. TPE jacket resists compression and twisting, so it survives being stuffed in a console.',
 '{"USB-C","3.5mm AUX","TPE jacket"}',
 '[{"name":"White","hex":"#f4f4f6","image":"adapter_usbc_35_product.webp"}]',
 '{adapter_usbc_35.webp,adapter_usbc_35_detail.webp}',13),

((select id from c where slug='adapters'),'adapter-lightning-35','Audio Adapter','Lightning to 3.5mm Adapter',
 'Headphone jack adapter for iPhone. Pairs naturally with the wired earphone assortment.',
 '{"Lightning","3.5mm"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]','{}',14),

((select id from c where slug='adapters'),'adapter-lightning-usbc','Connector Adapter','Lightning to USB-C Adapter',
 'Lets an existing Lightning cable charge a USB-C device. Explains itself on the peg card.',
 '{"Lightning","USB-C","Charge + Data"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]','{}',15)

on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Variants. UPC and weight filled in where known.
-- ---------------------------------------------------------------------
insert into variants (product_id, sku, upc, label, case_pack, master_carton, list_cents, msrp_cents, sort_order, stock_status)
select p.id, x.sku, nullif(x.upc,''), x.label, x.pack, x.master, x.list, x.msrp, x.ord, x.stock
from (values
 ('usbc-usbc','MT-CC65-03','','3 ft',12,144, 6000, 999,1,'in_stock'),
 ('usbc-usbc','MT-CC65-06','','6 ft',12,144, 7680, 999,2,'in_stock'),
 ('usbc-usbc','MT-CC65-10','','10 ft',12,120, 8960, 999,3,'in_stock'),
 ('usbc-lightning','MT-CL-06','850025312042','6 ft',12,144, 7920,1299,1,'in_stock'),
 ('usba-lightning','MT-AL-03','','3 ft',12,144, 5760, 999,1,'in_stock'),
 ('usba-lightning','MT-AL-06','','6 ft',12,144, 7360,1299,2,'in_stock'),
 ('wall-20w','MT-W20','','Single',10,100, 6470,1299,1,'in_stock'),
 ('car-45w','MT-C45','','Single',10,120, 4270, 999,1,'in_stock'),
 ('powerbank-soccer','MT-PB-SOC','','Single',6,48,13200,3999,1,'in_stock'),
 ('buds-plus','MT-BUDS-P','','Single',6,48,12720,3999,1,'in_stock'),
 ('airbuds-a5','MT-A5','','Single',6,48,11360,3999,1,'in_stock'),
 ('headset-anc','MT-HS-ANC','','Single',6,36,12800,3999,1,'in_stock'),
 ('wired-35mm','MT-EAR-35','','Single',12,144, 4960, 999,1,'in_stock'),
 ('wired-usbc','MT-EAR-UC','','Single',12,144, 7040,1299,1,'in_stock'),
 ('wired-lightning','MT-EAR-LT','','Single',12,144, 7360,1299,1,'in_stock'),
 ('adapter-usbc-35','MT-AD-UC35','','Single',20,200,10530,1299,1,'in_stock'),
 ('adapter-lightning-35','MT-AD-LT35','','Single',20,200,10930,1299,1,'in_stock'),
 ('adapter-lightning-usbc','MT-AD-LTUC','','Single',20,200,10670,1299,1,'in_stock')
) as x(slug,sku,upc,label,pack,master,list,msrp,ord,stock)
join products p on p.slug = x.slug
on conflict (sku) do nothing;
