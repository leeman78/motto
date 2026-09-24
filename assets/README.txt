IMAGE FILES
===========

Naming
------
  <product>_<color>.webp    one package shot per colorway
  <product>_hero.webp       brand or lifestyle shot (opens the card)
  <product>_lifestyle.webp  in-use shot
  <product>_detail.webp     spec or close-up shot

The color filename must match the "image" value in that product's colors
column. Extra views go in the images column. Change either one in Supabase
and the site picks it up, no code edit needed.

A colorway with image = null still shows its swatch, dimmed with a slash, so
buyers know the color exists while you finish shooting. A product with no
photos at all shows a grey placeholder card with its name on it.

Format
------
Square, roughly 1000x1000, WebP, product centred with a little margin.
Package shots on plain white. Everything in this folder has already been
trimmed, squared and compressed. Run new photos through the same treatment
or they will look inconsistent next to these.


IN THIS FOLDER
--------------
  usbc_hero.webp                brand shot, also the homepage hero
  usbc_black.webp
  usbc_brown.webp
  usbc_wine.webp
  usbc_orange.webp

  usba_usbc_hero.webp           brand shot
  usba_usbc_black.webp
  usba_usbc_darkbrown.webp
  usba_usbc_lightbrown.webp
  usba_usbc_red.webp
  usba_usbc_orange.webp

  usba_lightning_hero.webp      brand shot
  usba_lightning_wine.webp
  usba_lightning_orange.webp

  lightning_hero.webp           brand shot
  lightning_wine.webp
  lightning_gold.webp
  lightning_orange.webp
  lightning_brown.webp

  wall_white.webp
  wall_black.webp
  wall_lifestyle.webp

  car_black.webp                45W car charger, port face
  car_angle.webp                three-quarter, spec print visible
  car_side.webp                 back, MOTTO mark visible

  powerbank_soccer.webp             ball, cut out
  powerbank_soccer_lifestyle.webp   in use, opens the card
  powerbank_soccer_box.webp         retail box

  wired_35mm_white.webp             earphones, front of pack
  wired_35mm_lifestyle.webp         in use
  wired_35mm_back.webp              pack back, specs and barcode

  wired_lightning_white.webp        Lightning earphones, front of pack
  wired_lightning_back.webp         pack back, specs and barcode

  wired_usbc_white.webp             USB-C earphones, front of pack
  wired_usbc_lifestyle.webp         in use on the street

  buds_plus_blue.webp               BUDS+ colourways
  buds_plus_black.webp
  buds_plus_red.webp
  buds_plus_white.webp
  buds_plus_pink.webp
  buds_plus_lifestyle.webp          with a phone
  buds_plus_box.webp                what is in the box
  buds_plus_controls.webp           touch control guide

  headset_hero.webp                 ANC/ENC buds, opens the card
  headset_lifestyle.webp            in a cafe
  headset_detail.webp               worn, close up
  headset_box.webp                  what is in the box

  airbuds_a5_hero.webp              A5 with box and tips, opens the card
  airbuds_a5_lifestyle.webp         running outdoors
  airbuds_a5_box.webp               case, cable and tips
  airbuds_a5_detail.webp            retail box front
  airbuds_a5_specs.webp             retail box back

  adapter_lightning_35.webp             adapter, cut out
  adapter_lightning_35_lifestyle.webp   in use, opens the card
  adapter_lightning_35_box.webp         retail box front
  adapter_lightning_35_specs.webp       box back, specs and barcode

  adapter_usbc_35.webp          lifestyle, opens the card
  adapter_usbc_35_product.webp  white colorway
  adapter_usbc_35_detail.webp   TPE durability graphic


CUTOUTS VS FULL-BLEED
---------------------
Colorway shots are cutouts on a transparent background. The site floats them
on a light card with a drop shadow, so a photo with its own white rectangle
will look boxed-in next to the others. Cut new colorway shots out before
adding them.

Files ending _hero, _lifestyle or _detail keep their own background and are
rendered full-bleed, edge to edge. That is why the brand shots on the black
backdrop still look right.


VIDEO
-----
  counter_loop.mp4          H.264, 720x1140, 9.6s, silent
  counter_loop.webm         VP9, same source, served first where supported
  counter_loop_poster.webp  first visible frame, shown before playback starts

Source was a 1080x1920 Instagram recording in HEVC. Two things had to change
before it could go on the site: the burned-in "mottousa.official" header and
timer were cropped off, and HEVC was transcoded to H.264 because Chrome and
Firefox will not play HEVC in an MP4. The static end card was trimmed off as
well, since it is four seconds of frozen contact details in a loop and the
same details are already on the page.

Audio is stripped on purpose. Autoplay only works muted, so the track was
dead weight.

To replace it, run the same treatment:
  ffmpeg -i new.mp4 -t <secs> -an -vf "crop=W:H:X:Y,scale=720:-2" \
    -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 24 -preset slow \
    -movflags +faststart counter_loop.mp4


STILL NEEDED
------------
  logo.webp                     nav mark, square, transparent

  usbc_gold.webp                gold colorway, USB-C to USB-C
  lightning_black.webp          black colorway, USB-C to Lightning

  usba_lightning_black.webp     USB-A to Lightning, black colourway
  usba_lightning_gold.webp
  usba_lightning_red.webp


  buds_plus_black.webp          BUDS+
  buds_plus_white.webp
  buds_plus_case.webp

