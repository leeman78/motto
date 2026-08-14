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

((select id from c where slug='cables'),'usba-usbc','Leather-Wrapped Charging Cable',
 'USB-A to USB-C Charging Cable',
 'Full-grain leather wrap over a Type-A to Type-C cable. Reinforced connectors at both ends stop the fraying that kills ordinary cables, and it plugs into any USB-A port — wall brick, laptop, power bank or car charger.',
 '{"3 ft / 10 ft","USB-A","USB-C","Data sync"}',
 '[{"name":"Black","hex":"#1a1a1a","image":"usba_usbc_black.webp"},
   {"name":"Dark Brown","hex":"#4a2f22","image":"usba_usbc_darkbrown.webp"},
   {"name":"Light Brown","hex":"#a9743a","image":"usba_usbc_lightbrown.webp"},
   {"name":"Red","hex":"#8f1f28","image":"usba_usbc_red.webp"},
   {"name":"Orange","hex":"#e2611f","image":"usba_usbc_orange.webp"}]',
 '{usba_usbc_hero.webp}',3),

((select id from c where slug='cables'),'usba-lightning','Leather-Wrapped Lightning Cable',
 'USB-A to Lightning Charging Cable',
 'Leather-wrapped USB-A to Lightning cable for iPhone and iPad. Tangle-free and flexible, with the reinforced connectors that keep it out of the bin. Plugs into any USB-A port a customer already owns.',
 '{"3 ft / 10 ft","USB-A","Lightning","Data sync"}',
 '[{"name":"Black","hex":"#1a1a1a","image":null},
   {"name":"Wine","hex":"#7d2230","image":"usba_lightning_wine.webp"},
   {"name":"Gold","hex":"#c98b32","image":null},
   {"name":"Orange","hex":"#e2611f","image":"usba_lightning_orange.webp"},
   {"name":"Red","hex":"#b3202b","image":null}]',
 '{usba_lightning_hero.webp}',4),

-- ------------------------------------------------- CHARGERS & POWER
((select id from c where slug='power'),'wall-20w','Fast Charger','20W PD Wall Charger',
 'Compact dual-port wall charger with USB-C PD and USB-A. Supports Lightning, Micro USB and USB-C cables, so one brick covers the whole rack.',
 '{"20W PD","USB-C","USB-A","Dual Port"}',
 '[{"name":"White","hex":"#f4f4f6","image":"wall_white.webp"},
   {"name":"Black","hex":"#1a1a1a","image":"wall_black.webp"}]',
 '{wall_white.webp,wall_lifestyle.webp}',4),

((select id from c where slug='power'),'car-45w','Fast Charger','45W PD Car Charger',
 'Dual intelligent chips deliver up to 45W USB-C Power Delivery on one port and 18W Quick Charge 3.0 on the other, so two people can charge at speed off one socket. Model CC0200.',
 '{"45W PD","QC 3.0 18W","Dual Port","12–24V"}',
 '[{"name":"Black","hex":"#1a1a1a","image":"car_black.webp"}]',
 '{car_black.webp,car_angle.webp,car_side.webp}',6),

((select id from c where slug='power'),'powerbank-soccer','Portable Power','Soccer Ball Power Bank',
 '10,000 mAh with 22.5W PD fast charging and an LED percentage readout. Shaped like a soccer ball, which is the whole point: it sells itself off a counter display, and it moves hardest around tournaments, back-to-school and the World Cup.',
 '{"10,000 mAh","22.5W PD","LED display","USB-C In/Out"}',
 '[{"name":"White & Navy","hex":"#2b3a6b","image":"powerbank_soccer.webp"}]',
 '{powerbank_soccer_lifestyle.webp,powerbank_soccer_box.webp}',7),

-- ------------------------------------------------- AUDIO
((select id from c where slug='audio'),'buds-plus','True Wireless Earbuds','Motto BUDS+',
 'True wireless earbuds on Bluetooth 5.0 + EDR with a Qi-compatible magnetic charging case and a battery indicator on the case. Touch controls for play, skip and calls. Five colorways, which is what makes it work on a rack — the same peg sells to five different customers.',
 '{"Bluetooth 5.0 + EDR","Qi charging case","Battery indicator","Touch controls"}',
 '[{"name":"Blue","hex":"#9ecbe8","image":"buds_plus_blue.webp"},
   {"name":"Black","hex":"#1a1a1a","image":"buds_plus_black.webp"},
   {"name":"Red","hex":"#c8202a","image":"buds_plus_red.webp"},
   {"name":"White","hex":"#f4f4f6","image":"buds_plus_white.webp"},
   {"name":"Pink","hex":"#efb3c4","image":"buds_plus_pink.webp"}]',
 '{buds_plus_blue.webp,buds_plus_lifestyle.webp,buds_plus_box.webp,buds_plus_controls.webp}',8),

((select id from c where slug='audio'),'airbuds-a5','True Wireless Earbuds','Wireless Airbuds A5',
 'Clean, compact true wireless in white, with a USB-C magnetic charging case and three sizes of ear tip in the box. Open the case and they pair. No ANC to explain, no app to set up — for the customer who wants working earbuds, not a features list. Sits at the same price as the ANC pair, so a rack can carry both.',
 '{"True wireless","USB-C charging case","Instant pairing","3 ear tip sizes"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]',
 '{airbuds_a5_hero.webp,airbuds_a5_lifestyle.webp,airbuds_a5_box.webp,airbuds_a5_detail.webp,airbuds_a5_specs.webp}',9),

((select id from c where slug='audio'),'headset-anc','True Wireless Earbuds','Wireless Headset ANC/ENC',
 'Dual-mode noise control: ANC blocks the room out, ENC cleans up your voice on calls. The charging case has a touch display showing battery for each bud and the case, and switches modes without reaching for a phone. That screen is what a customer notices on a peg.',
 '{"ANC + ENC","Touch display case","True wireless","USB-C charging"}',
 '[{"name":"White","hex":"#f4f4f6","image":null}]',
 '{headset_hero.webp,headset_lifestyle.webp,headset_detail.webp,headset_box.webp}',10),

((select id from c where slug='audio'),'wired-35mm','Wired Earphones','Motto Premium 3.5mm AUX Wired Earphones',
 'Clear, balanced audio through a universal 3.5mm jack, with an in-line mic and volume controls. Works with anything that still has the port — Android phones, laptops, tablets, gaming consoles and older iPhones. In-ear with sound isolation, 20Hz–20KHz.',
 '{"3.5mm jack","In-line mic","HD mic","20Hz–20KHz"}',
 '[{"name":"White","hex":"#f4f4f6","image":"wired_35mm_white.webp"}]',
 '{wired_35mm_white.webp,wired_35mm_lifestyle.webp,wired_35mm_back.webp}',11),

((select id from c where slug='audio'),'wired-usbc','Wired Earphones','Motto Premium USB-C Wired Earphones',
 'The top of Motto''s wired audio lineup. Where the standard USB-C earphone delivers clean digital audio, the Premium version steps it up with enhanced drivers, refined acoustics, and a more elevated build quality that matches the look and feel of Motto''s leather-wrapped accessories. Connects directly to iPhone 15 and newer, Samsung Galaxy, Google Pixel, iPad Pro, or any USB-C MacBook. No adapter, no wireless lag, no battery anxiety. Just high-resolution wired audio, every time you plug in. In-line mic and volume controls. 1.40 oz.',
 '{"USB-C","In-line mic","Enhanced drivers","No adapter needed"}',
 '[{"name":"White","hex":"#f4f4f6","image":"wired_usbc_white.webp"}]',
 '{wired_usbc_white.webp,wired_usbc_lifestyle.webp}',12),

((select id from c where slug='audio'),'wired-lightning','Wired Earphones','Motto Premium Lightning Wired Earphones',
 'Crisp audio and balanced bass through a Lightning plug, with an in-line mic and volume controls. For every iPhone customer who lost the ones in the box. In-ear with sound isolation, 20Hz–20kHz. Model EP-007.',
 '{"Lightning","In-line mic","HD mic","20Hz–20kHz"}',
 '[{"name":"White","hex":"#f4f4f6","image":"wired_lightning_white.webp"}]',
 '{wired_lightning_white.webp,wired_lightning_back.webp}',13),

-- ------------------------------------------------- ADAPTERS
((select id from c where slug='adapters'),'adapter-usbc-35','Audio Adapter Cable','USB-C to 3.5mm Audio Adapter Cable',
 'Type-C to 3.5mm AUX cable for headphones and car aux inputs. TPE jacket resists compression and twisting, so it survives being stuffed in a console.',
 '{"USB-C","3.5mm AUX","TPE jacket"}',
 '[{"name":"White","hex":"#f4f4f6","image":"adapter_usbc_35_product.webp"}]',
 '{adapter_usbc_35.webp,adapter_usbc_35_detail.webp}',13),

((select id from c where slug='adapters'),'adapter-lightning-35','Audio Adapter','Lightning to 3.5mm AUX Adapter',
 'Two ports, not one: plug in 3.5mm headphones and keep charging at the same time. That is the difference between this and the dongle in every other rack, and it is the whole reason a customer picks it up. Plug and play, no app. Works with iPhone 7 through 12 and every Lightning device. Model JBC029.',
 '{"Lightning","3.5mm AUX","Charge + listen","Plug and play"}',
 '[{"name":"White","hex":"#f4f4f6","image":"adapter_lightning_35.webp"}]',
 '{adapter_lightning_35_lifestyle.webp,adapter_lightning_35_box.webp,adapter_lightning_35_specs.webp}',15)

on conflict (slug) do update set
  category_id = excluded.category_id,
  type_label  = excluded.type_label,
  name        = excluded.name,
  description = excluded.description,
  spec_tags   = excluded.spec_tags,
  colors      = excluded.colors,
  images      = excluded.images,
  sort_order  = excluded.sort_order;

-- ---------------------------------------------------------------------
-- Variants. UPC and weight filled in where known.
-- ---------------------------------------------------------------------
insert into variants (product_id, sku, upc, label, case_pack, master_carton, list_cents, msrp_cents, sort_order, stock_status)
select p.id, x.sku, nullif(x.upc,''), x.label, x.pack, x.master, x.list, x.msrp, x.ord, x.stock
from (values
 ('usbc-usbc','OCC003','','3 ft',25,200, 6000, 999,1,'in_stock'),
 ('usbc-usbc','OCC006','','6 ft',25,200, 7680, 999,2,'in_stock'),
 ('usbc-usbc','OCC010','','10 ft',100,200, 8960, 999,3,'in_stock'),
 ('usbc-lightning','ICL006','850025312042','6 ft',25,200, 7920,1299,1,'in_stock'),
 ('usba-usbc','OUC003','','3 ft',25,200, 5760, 999,1,'in_stock'),
 ('usba-usbc','OUC010','','10 ft',100,200, 8400, 999,2,'in_stock'),
 ('usba-lightning','IUL003','','3 ft',25,200, 5900, 999,1,'in_stock'),
 ('usba-lightning','IUL010','','10 ft',100,200, 8600,1499,2,'in_stock'),
 ('wall-20w','WC0200','','Single',100,400, 6470,1299,1,'in_stock'),
 ('car-45w','CC0200','850025312035','Single',600,600, 4270, 999,1,'in_stock'),
 ('powerbank-soccer','MT-PB-SOC','','Single',6,48,13200,3999,1,'in_stock'),
 ('buds-plus','MT-BUDS-P','','Single',6,48,12720,3999,1,'in_stock'),
 ('airbuds-a5','A5WH','','Single',100,100,11360,3999,1,'in_stock'),
 ('headset-anc','ANC','','Single',100,100,12800,3999,1,'in_stock'),
 ('wired-35mm','EPH004','1500002200006','Single',100,300, 4960, 999,1,'in_stock'),
 ('wired-usbc','TEPH007','','Single',100,300, 7040,1299,1,'in_stock'),
 ('wired-lightning','IEP007','703977746056','Single',100,300, 7360,1299,1,'in_stock'),
 ('adapter-usbc-35','MT-AD-UC35','','Single',20,200,10530,1299,1,'in_stock'),
 ('adapter-lightning-35','MT-AD-LT35','984720174657','Single',20,200,10930,1299,1,'in_stock')
) as x(slug,sku,upc,label,pack,master,list,msrp,ord,stock)
join products p on p.slug = x.slug
on conflict (sku) do update set
  product_id    = excluded.product_id,
  upc           = coalesce(excluded.upc, variants.upc),
  label         = excluded.label,
  case_pack     = excluded.case_pack,
  master_carton = excluded.master_carton,
  sort_order    = excluded.sort_order;
  -- list_cents, msrp_cents and stock_status are NOT updated on purpose:
  -- those are yours to set in the admin, and a re-run must never wipe them.
