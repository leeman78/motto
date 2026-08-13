-- =====================================================================
-- Motto Wholesale — product copy, taken from the mottousa.com listings
--
-- Run 04_detail.sql first; this fills the columns it adds.
-- Safe to re-run. All fifteen products.
--
-- RULES THIS FILE FOLLOWS
--   * The paragraph text is the retail copy as supplied, with three things
--     removed: the Brand line, the UPC, and the consumer price. Brand is
--     redundant on a Motto-only site; the UPC already appears in the SKU
--     table from the variants row; and a retail price in the body confuses
--     a buyer working out margin, who has MSRP as its own field already.
--   * Emoji in the source bullets are dropped. One listing had them and the
--     other fourteen did not.
--   * features and compatibility are left empty where the source listing has
--     no such block, and the product page then omits it. Do not fill one in
--     to make a product look complete next to another.
-- =====================================================================

-- ---------------------------------------- 1. usbc-usbc
update products set
  description_long = 'Power your devices with speed and durability using the Motto Leather-Wrapped Type-C to Type-C Cable. Designed to support up to 65W fast charging, this cable delivers efficient power and stable data transfer for smartphones, tablets, and laptops. The premium leather-wrapped exterior provides a tangle-free experience while enhancing durability for everyday use. Strong, flexible, and built to last, it''s the perfect charging solution for modern USB-C devices.',
  features = array[
    'Supports up to 65W fast charging (USB-C PD)',
    'Type-C to Type-C universal compatibility',
    'Premium leather-wrapped design for durability',
    'Tangle-free, flexible cable for easy use',
    'Ideal for phones, tablets, and laptops',
    'Fast charging + data sync support'
  ],
  compatibility = 'Works with USB-C devices including Samsung, Google Pixel, iPad, MacBook, and more.',
  weight_oz = 2.00
where slug = 'usbc-usbc';

-- ---------------------------------------- 2. usbc-lightning
update products set
  description_long = 'Experience fast, reliable charging with this leather-wrapped Type-C to Lightning cable, designed for modern Apple devices.

Supporting up to 65W fast charging, it delivers efficient power and stable data transfer for everyday use.

The durable, tangle-free design ensures smooth handling, while the flexible build adds comfort and long-lasting performance. A premium essential for charging, syncing, and staying connected.',
  features = '{}',
  compatibility = null,
  weight_oz = 2.60
where slug = 'usbc-lightning';

-- ---------------------------------------- 3. usba-usbc
update products set
  description_long = 'The Motto Leather Wrapped USB Type-A to Type-C Cable in 3FT is the desk and nightstand essential, compact enough to keep tidy, long enough to charge comfortably without stretching. The full-grain leather wrap gives it a premium feel that stands out from every plastic or nylon cable on the market, while the reinforced connectors at both ends prevent the fraying that kills ordinary cables within months. Fast charging and stable data transfer come standard, so you can plug into any USB-A port on a wall charger, laptop, power bank, or car charger and your USB-C device charges at full speed. Available in Black, Dark Brown, Light Brown, Red, and Orange.',
  features = '{}',
  compatibility = null,
  weight_oz = 2.00
where slug = 'usba-usbc';

-- ---------------------------------------- 4. usba-lightning
update products set
  description_long = 'Charge your Apple devices in style with this premium leather-wrapped iPhone cable. Designed with a durable, flexible build, it prevents tangling while supporting fast, reliable charging for everyday use. Compatible with iPhone, iPad, and other Lightning devices, it''s a sleek and dependable essential for your setup.',
  features = array[
    'Fast charging for iPhone and Lightning devices',
    'Lightning to USB-A compatibility',
    'Premium leather-wrapped design for added durability',
    'Tangle-free cable for smooth, hassle-free use',
    'Durable, flexible build for long-lasting performance',
    'Supports charging and data sync'
  ],
  compatibility = 'Works with iPhone, iPad, and all Lightning-enabled Apple devices.',
  weight_oz = 2.00
where slug = 'usba-lightning';

-- ---------------------------------------- 5. wall-20w
update products set
  description_long = 'Power all your devices with the Motto 20W PD Wall Charger, featuring dual USB-C and USB-A ports for versatile charging.

Designed to support a wide range of cables, including Lightning, Micro USB, and USB-C.

It delivers fast, reliable power in one compact solution. Perfect for home, office, or travel, this charger reduces clutter while keeping your devices charged efficiently.',
  features = '{}',
  compatibility = null,
  weight_oz = 1.50
where slug = 'wall-20w';

-- ---------------------------------------- 6. car-45w
update products set
  description_long = 'Power your devices on the go with the Motto 45W PD Car Charger, designed for fast, efficient charging in any vehicle. Featuring dual intelligent chips, it delivers up to 45W USB-C Power Delivery and 18W Quick Charge for high-speed, safe performance. Compatible with a wide range of devices, including iPhone, Samsung, Google Pixel, iPad, and even MacBook, this compact charger keeps all your essentials powered during every drive. Reliable, versatile, and built for everyday convenience.',
  features = array[
    '45W USB-C Power Delivery fast charging',
    '18W Quick Charge (QC) support',
    'Dual intelligent chips for safe, efficient power',
    'Universal compatibility with most vehicles',
    'Works with iPhone, Samsung, Pixel, iPad, MacBook and more',
    'Compact, travel-friendly design'
  ],
  compatibility = null,
  weight_oz = 0.60
where slug = 'car-45w';

-- ---------------------------------------- 7. powerbank-soccer
update products set
  description_long = 'The Motto Soccer Ball Power Bank is a 10000mAh portable charger with 22.5W PD fast charging and a built-in LED battery percentage display.

Shaped like a soccer ball, it delivers fast, reliable charging for iPhone, Android, and USB-C devices, and doubles as a conversation starter.',
  features = '{}',
  compatibility = null,
  weight_oz = 9.40
where slug = 'powerbank-soccer';

-- ---------------------------------------- 8. buds-plus
update products set
  description_long = 'Wireless headset with magnetic charging and battery display.',
  features = array[
    'Bluetooth version: 5.0 + EDR',
    'Charging: wireless magnetic charging, Qi-compatible',
    'Battery indicator: shows charging and power levels',
    'Connection: automatically connects when opening the case, initial manual pairing required',
    'Controls: touch control, one, two, or three taps',
    'Compatibility: works with iPhone and Android',
    'Features: no ANC support, no wearable app connection, can be renamed',
    'Water resistance: PX4'
  ],
  compatibility = null,
  weight_oz = 3.70
where slug = 'buds-plus';

-- ---------------------------------------- 9. airbuds-a5
update products set
  description_long = 'The Motto Wireless Airbuds A5 are clean, compact true wireless earbuds built for all-day wear. The white finish gives them an understated premium look that works whether you''re on a run, at a desk, or out running errands. Bluetooth pairing is instant, so you open the case and they connect. No ANC complexity, no learning curve. Just put them in and hit play. For buyers who want reliable true wireless audio without the feature overload, the A5 delivers everything that matters most.',
  features = '{}',
  compatibility = null,
  weight_oz = 4.90
where slug = 'airbuds-a5';

-- ---------------------------------------- 10. headset-anc
update products set
  description_long = 'The Motto ANC/ENC Wireless Earbuds give you dual-mode noise control. Active Noise Cancellation (ANC) is for deep focus and immersive listening, and Environmental Noise Cancellation (ENC) works on calls so your voice comes through crystal clear no matter where you are. Switch between modes based on what your moment demands: block the world out, or let just enough in. Built for commuters, remote workers, and anyone who lives on calls and can''t afford to sound like they''re calling from a tunnel.',
  features = '{}',
  compatibility = null,
  weight_oz = 4.70
where slug = 'headset-anc';

-- ---------------------------------------- 11. wired-35mm
update products set
  description_long = 'The Motto Premium 3.5mm Wired Earphones deliver clear, balanced audio through a universal AUX connection. Compatible with any device that has a 3.5mm headphone jack, including Android phones, laptops, tablets, gaming consoles, and older iPhones. Built-in microphone and in-line controls for calls and music.',
  features = '{}',
  compatibility = null,
  weight_oz = 1.40
where slug = 'wired-35mm';

-- ---------------------------------------- 12. wired-usbc
update products set
  description_long = 'The Motto Premium USB-C Earphones are the top of Motto''s wired audio lineup, built for listeners who want the most out of every USB-C device. Where the standard USB-C earphones deliver clean digital audio, the Premium version steps it up with enhanced drivers, refined acoustics, and a more elevated build quality that matches the look and feel of Motto''s leather-wrapped accessories. Connect directly to iPhone 15 and newer, Samsung Galaxy, Google Pixel, iPad Pro, or any USB-C MacBook. No adapter, no wireless lag, no battery anxiety. Just high-resolution wired audio, every time you plug in.',
  features = '{}',
  compatibility = null,
  weight_oz = 1.40
where slug = 'wired-usbc';

-- ---------------------------------------- 13. wired-lightning
update products set
  description_long = 'Enjoy clear, high-quality sound with the Motto Premium Lightning Earphones, designed specifically for iPhone and Lightning devices. These wired earphones deliver crisp audio and balanced bass for music, calls, and everyday use. Featuring a comfortable, lightweight design and built-in microphone, they provide a seamless listening experience whether you''re at home, commuting, or on the go. Reliable, easy to use, and ready whenever you are.',
  features = array[
    'Premium sound quality with clear audio and balanced bass',
    'Lightning connector for iPhone and Apple devices',
    'Built-in microphone for calls and voice control',
    'Ideal for music, calls, and daily use',
    'Lightweight, comfortable fit for extended wear',
    'Plug-and-play design, no Bluetooth needed'
  ],
  compatibility = 'Compatible with iPhone, iPad, and all Lightning-enabled Apple devices.',
  weight_oz = 1.40
where slug = 'wired-lightning';

-- ---------------------------------------- 14. adapter-usbc-35
update products set
  description_long = 'Enhance your audio experience with the Motto Type-C to 3.5mm AUX Adapter Cable, designed for seamless control and high-quality sound from Type-C ports.',
  features = '{}',
  compatibility = null,
  weight_oz = 0.60
where slug = 'adapter-usbc-35';

-- ---------------------------------------- 15. adapter-lightning-35
update products set
  description_long = 'Enjoy music and charge your iPhone at the same time with the Motto Lightning to 3.5mm AUX Adapter. Designed for seamless compatibility, this adapter lets you connect your Lightning (Apple) device to any 3.5mm headphone or car audio system while keeping your device powered. Compact, durable, and perfect for everyday use at home, in the car, or on the go.',
  features = array[
    'Simultaneous charging and audio support',
    'Connects Lightning (Apple) to 3.5mm AUX',
    'Stable, high-quality sound output',
    'Compatible with iPhone and Lightning devices',
    'Compact, portable, and easy to use'
  ],
  compatibility = null,
  weight_oz = 0.60
where slug = 'adapter-lightning-35';

-- ---------------------------------------------------------------------
-- Names, matched to the retail listings.
-- Only where the retail title carries information the wholesale title was
-- missing. Titles that differ only by restating the size or the material are
-- left alone, since the spec table already shows both.
-- ---------------------------------------------------------------------
update products set name = 'Motto Premium 3.5mm AUX Wired Earphones' where slug = 'wired-35mm';
update products set name = 'Motto Premium Lightning Wired Earphones' where slug = 'wired-lightning';
update products set name = 'Wireless Headset ANC/ENC' where slug = 'headset-anc';
