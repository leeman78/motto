// catalog.js — shared data layer for index.html and product.html.
//
// Both pages call loadCatalog(). It tries the live API first and falls back to
// the built-in copy below, so the site renders before Supabase is connected and
// the two pages can never disagree about what is in the catalog.

import { SUPABASE_URL, SUPABASE_ANON_KEY, ORDER_MODE, FEE_MODE, ACH_DISCOUNT_PCT } from './config.js';

// Ordering online is optional. Signing in never is — a dealer who has an
// account should always be able to see the pricing that was set for them.
export const CAN_ORDER = ORDER_MODE === 'online';

/* ------------------------------------------------------------------
   One place that decides what an order costs. The cart, the payment
   page and the server all call this, so the number a dealer sees on
   the catalog is the number they are charged.
------------------------------------------------------------------ */
export function orderTotal(subtotal, freight, method) {
  const base = subtotal + freight;
  if (!base) return { base, adjust: 0, total: 0, label: null };

  if (FEE_MODE === 'ach_discount') {
    // A discount for one payment method, not a penalty on another. Legal
    // everywhere, no network registration, and it works on debit cards.
    const adjust = method === 'us_bank_account'
      ? -Math.round(base * (ACH_DISCOUNT_PCT / 100)) : 0;
    return { base, adjust, total: base + adjust,
             label: adjust ? `ACH discount (${ACH_DISCOUNT_PCT}%)` : null };
  }

  if (FEE_MODE === 'surcharge') {
    const adjust = method === 'card'
      ? Math.round(base * 0.029) + 30 : Math.min(500, Math.round(base * 0.008));
    return { base, adjust, total: base + adjust, label: 'Processing' };
  }

  return { base, adjust: 0, total: base, label: null };   // 'absorb'
}
export const FEE = FEE_MODE;
export const ACH_PCT = ACH_DISCOUNT_PCT;

let sbPromise = null;
export function supabase(){
  if(/YOUR-PROJECT|YOUR-ANON-KEY/.test(SUPABASE_URL + SUPABASE_ANON_KEY)) return Promise.resolve(null);
  if(!sbPromise){
    sbPromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(m => m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch(e => { console.warn('Supabase unavailable:', e.message); return null; });
  }
  return sbPromise;
}

export const usd = c => '$' + (c/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

/* Brand and lifestyle shots are full-bleed on their own dark backdrop. Cutouts
   float on the light card. This decides which treatment a file gets. */
export const isFlat = f => /_hero\.|_lifestyle\.|_detail\.|_box\.|_specs\.|_controls\.|^adapter_usbc_35\.webp$/.test(f || '');

/* Availability. Kept deliberately coarse — a buyer needs to know whether to
   plan around it, not a live unit count that goes stale between page loads. */
export const STOCK = {
  in_stock:     { label: 'In stock',     dot: '#22a45d', tone: 'ok'   },
  low_stock:    { label: 'Low stock',    dot: '#d98324', tone: 'warn' },
  pre_order:    { label: 'Pre-order',    dot: '#7b7f87', tone: 'grey' },
  out_of_stock: { label: 'Out of stock', dot: '#c8382f', tone: 'bad'  }
};
export const stockOf = x => STOCK[x?.stock] || STOCK.in_stock;

/* ------------------------------------------------------------------
   Order lines are colour + length, not length alone. A warehouse picks
   "wine 3 ft", not "3 ft", so the cart has to carry both or the pick
   list is guesswork.
------------------------------------------------------------------ */
const CODES = { black:'BLK', brown:'BRN', wine:'WIN', red:'RED', orange:'ORG',
                gold:'GLD', white:'WHT', navy:'NVY', pink:'PNK' };
export const colorCode = name =>
  CODES[String(name || '').toLowerCase()] || String(name || 'STD').slice(0,3).toUpperCase();

export const lineKey  = (sku, color) => `${sku}::${color || ''}`;
export const splitKey = key => { const [sku, color] = key.split('::'); return { sku, color }; };
export const fullSku  = (sku, color) => color ? `${sku}-${colorCode(color)}` : sku;

export const FALLBACK = {
  categories:[{slug:'cables',name:'Leather cables'},{slug:'power',name:'Chargers & power'},
              {slug:'audio',name:'Earbuds & audio'},{slug:'adapters',name:'Adapters'}],
  rules:{ moq_cents:50000, free_freight_cents:150000, freight_cents:1800 },
  dealer:null,
  products:[
  {slug:'usbc-usbc',cat:'cables',type:'Leather-Wrapped Charging Cable',
   name:'USB-C to USB-C Fast Charging Cable',
   desc:'Leather-wrapped Type-C to Type-C cable rated to 65W. Tangle-free, flexible, and built for daily handling. Works with Samsung, Pixel, iPad, MacBook and any other USB-C device.',
   meta:['3 ft / 6 ft / 10 ft','Up to 65W','USB-C PD','Data sync'],
   colors:[{name:'Black',hex:'#1a1a1a',image:'usbc_black.webp'},{name:'Brown',hex:'#6b4128',image:'usbc_brown.webp'},
           {name:'Wine',hex:'#7d2230',image:'usbc_wine.webp'},{name:'Orange',hex:'#e2611f',image:'usbc_orange.webp'},
           {name:'Gold',hex:'#c98b32',image:null}],
   shots:['usbc_hero.webp'],stock:'in_stock',
   variants:[{sku:'MT-CC65-03',label:'3 ft',pack:12,stock:'in_stock'},{sku:'MT-CC65-06',label:'6 ft',pack:12,stock:'in_stock'},{sku:'MT-CC65-10',label:'10 ft',pack:12,stock:'low_stock'}]},

  {slug:'usbc-lightning',cat:'cables',type:'Leather-Wrapped Lightning Cable',
   name:'USB-C to Lightning Fast Charging Cable',
   desc:'Leather-wrapped Type-C to Lightning cable for Apple devices, supporting up to 65W fast charging plus stable data transfer.',
   meta:['6 ft','Up to 65W','Lightning','Data sync'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'Wine',hex:'#7d2230',image:'lightning_wine.webp'},
           {name:'Gold',hex:'#c98b32',image:'lightning_gold.webp'},{name:'Orange',hex:'#e2611f',image:'lightning_orange.webp'},
           {name:'Brown',hex:'#6b4128',image:'lightning_brown.webp'}],
   shots:['lightning_hero.webp'],stock:'in_stock',
   variants:[{sku:'MT-CL-06',label:'6 ft',pack:12,stock:'in_stock'}]},

  {slug:'usba-usbc',cat:'cables',type:'Leather-Wrapped Charging Cable',
   name:'USB-A to USB-C Charging Cable',
   desc:'Full-grain leather wrap over a Type-A to Type-C cable. Reinforced connectors at both ends stop the fraying that kills ordinary cables, and it plugs into any USB-A port — wall brick, laptop, power bank or car charger.',
   meta:['3 ft / 10 ft','USB-A','USB-C','Data sync'],
   colors:[{name:'Black',hex:'#1a1a1a',image:'usba_usbc_black.webp'},
           {name:'Dark Brown',hex:'#4a2f22',image:'usba_usbc_darkbrown.webp'},
           {name:'Light Brown',hex:'#a9743a',image:'usba_usbc_lightbrown.webp'},
           {name:'Red',hex:'#8f1f28',image:'usba_usbc_red.webp'},
           {name:'Orange',hex:'#e2611f',image:'usba_usbc_orange.webp'}],
   shots:['usba_usbc_hero.webp'],stock:'in_stock',
   variants:[{sku:'MT-AC-03',label:'3 ft',pack:12,stock:'in_stock'},
             {sku:'MT-AC-10',label:'10 ft',pack:12,stock:'in_stock'}]},

  {slug:'usba-lightning',cat:'cables',type:'Leather-Wrapped Lightning Cable',
   name:'USB-A to Lightning Charging Cable',
   desc:'Leather-wrapped USB-A to Lightning cable for iPhone and iPad. Tangle-free and flexible, with the reinforced connectors that keep it out of the bin. Plugs into any USB-A port a customer already owns.',
   meta:['3 ft / 10 ft','USB-A','Lightning','Data sync'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},
           {name:'Wine',hex:'#7d2230',image:'usba_lightning_wine.webp'},
           {name:'Gold',hex:'#c98b32',image:null},
           {name:'Orange',hex:'#e2611f',image:'usba_lightning_orange.webp'},
           {name:'Red',hex:'#b3202b',image:null}],
   shots:['usba_lightning_hero.webp'],stock:'in_stock',
   variants:[{sku:'MT-AL-03',label:'3 ft',pack:12,stock:'in_stock'},
             {sku:'MT-AL-10',label:'10 ft',pack:12,stock:'in_stock'}]},

  {slug:'wall-20w',cat:'power',type:'Fast Charger',name:'20W PD Wall Charger',
   desc:'Compact dual-port wall charger with USB-C PD and USB-A. Supports Lightning, Micro USB and USB-C cables, so one brick covers the whole rack.',
   meta:['20W PD','USB-C','USB-A','Dual Port'],
   colors:[{name:'White',hex:'#f4f4f6',image:'wall_white.webp'},{name:'Black',hex:'#1a1a1a',image:'wall_black.webp'}],
   shots:['wall_white.webp','wall_lifestyle.webp'],
   stock:'in_stock',variants:[{sku:'MT-W20',label:'Single',pack:10,stock:'in_stock'}]},

  {slug:'car-45w',cat:'power',type:'Fast Charger',name:'45W PD Car Charger',
   desc:'Dual intelligent chips deliver up to 45W USB-C Power Delivery on one port and 18W Quick Charge 3.0 on the other, so two people can charge at speed off one socket. Model CC0200.',
   meta:['45W PD','QC 3.0 18W','Dual Port','12–24V'],
   colors:[{name:'Black',hex:'#1a1a1a',image:'car_black.webp'}],
   shots:['car_black.webp','car_angle.webp','car_side.webp'],stock:'in_stock',
   variants:[{sku:'MT-C45',upc:'850025312035',label:'Single',pack:10,stock:'in_stock'}]},

  {slug:'powerbank-soccer',cat:'power',type:'Portable Power',name:'Soccer Ball Power Bank',
   desc:'10,000 mAh with 22.5W PD fast charging and an LED percentage readout. Shaped like a soccer ball, which is the whole point: it sells itself off a counter display, and it moves hardest around tournaments, back-to-school and the World Cup.',
   meta:['10,000 mAh','22.5W PD','LED display','USB-C In/Out'],
   colors:[{name:'White & Navy',hex:'#2b3a6b',image:'powerbank_soccer.webp'}],
   shots:['powerbank_soccer_lifestyle.webp','powerbank_soccer_box.webp'],stock:'in_stock',
   variants:[{sku:'MT-PB-SOC',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'buds-plus',cat:'audio',type:'True Wireless Earbuds',name:'Motto BUDS+',
   desc:'True wireless earbuds on Bluetooth 5.0 + EDR with a Qi-compatible magnetic charging case and a battery indicator on the case. Touch controls for play, skip and calls. Five colorways, which is what makes it work on a rack — the same peg sells to five different customers.',
   meta:['Bluetooth 5.0 + EDR','Qi charging case','Battery indicator','Touch controls'],
   colors:[{name:'Blue',hex:'#9ecbe8',image:'buds_plus_blue.webp'},
           {name:'Black',hex:'#1a1a1a',image:'buds_plus_black.webp'},
           {name:'Red',hex:'#c8202a',image:'buds_plus_red.webp'},
           {name:'White',hex:'#f4f4f6',image:'buds_plus_white.webp'},
           {name:'Pink',hex:'#efb3c4',image:'buds_plus_pink.webp'}],
   shots:['buds_plus_blue.webp','buds_plus_lifestyle.webp','buds_plus_box.webp','buds_plus_controls.webp'],
   stock:'in_stock',
   variants:[{sku:'MT-BUDS-P',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'airbuds-a5',cat:'audio',type:'True Wireless Earbuds',name:'Wireless Airbuds A5',
   desc:'Clean, compact true wireless in white, with a USB-C magnetic charging case and three sizes of ear tip in the box. Open the case and they pair. No ANC to explain, no app to set up — for the customer who wants working earbuds, not a features list. Sits at the same price as the ANC pair, so a rack can carry both.',
   meta:['True wireless','USB-C charging case','Instant pairing','3 ear tip sizes'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],
   shots:['airbuds_a5_hero.webp','airbuds_a5_lifestyle.webp','airbuds_a5_box.webp','airbuds_a5_detail.webp','airbuds_a5_specs.webp'],
   stock:'in_stock',
   variants:[{sku:'MT-A5',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'headset-anc',cat:'audio',type:'True Wireless Earbuds',name:'ANC/ENC Wireless Earbuds',
   desc:'Dual-mode noise control: ANC blocks the room out, ENC cleans up your voice on calls. The charging case has a touch display showing battery for each bud and the case, and switches modes without reaching for a phone. That screen is what a customer notices on a peg.',
   meta:['ANC + ENC','Touch display case','True wireless','USB-C charging'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],
   shots:['headset_hero.webp','headset_lifestyle.webp','headset_detail.webp','headset_box.webp'],
   stock:'in_stock',
   variants:[{sku:'MT-HS-ANC',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'wired-35mm',cat:'audio',type:'Wired Earphones',name:'Premium 3.5mm AUX Wired Earphones',
   desc:'Clear, balanced audio through a universal 3.5mm jack, with an in-line mic and volume controls. Works with anything that still has the port — Android phones, laptops, tablets, gaming consoles and older iPhones. In-ear with sound isolation, 20Hz–20KHz.',
   meta:['3.5mm jack','In-line mic','HD mic','20Hz–20KHz'],
   colors:[{name:'White',hex:'#f4f4f6',image:'wired_35mm_white.webp'}],
   shots:['wired_35mm_white.webp','wired_35mm_lifestyle.webp','wired_35mm_back.webp'],stock:'in_stock',
   variants:[{sku:'MT-EAR-35',upc:'1500002200006',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'wired-usbc',cat:'audio',type:'Wired Earphones',name:'Motto Premium USB-C Wired Earphones',
   desc:'Enhanced drivers and refined acoustics on a plain USB-C plug — no dongle, no adapter, no pairing. For every Android and iPhone 15-and-up customer whose phone lost the headphone jack. In-line mic and volume controls.',
   meta:['USB-C','In-line mic','Enhanced drivers','No adapter needed'],
   colors:[{name:'White',hex:'#f4f4f6',image:'wired_usbc_white.webp'}],
   shots:['wired_usbc_white.webp','wired_usbc_lifestyle.webp'],stock:'in_stock',
   variants:[{sku:'MT-EAR-UC',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'wired-lightning',cat:'audio',type:'Wired Earphones',name:'Premium Lightning Wired Earphones',
   desc:'Crisp audio and balanced bass through a Lightning plug, with an in-line mic and volume controls. For every iPhone customer who lost the ones in the box. In-ear with sound isolation, 20Hz–20kHz. Model EP-007.',
   meta:['Lightning','In-line mic','HD mic','20Hz–20kHz'],
   colors:[{name:'White',hex:'#f4f4f6',image:'wired_lightning_white.webp'}],
   shots:['wired_lightning_white.webp','wired_lightning_back.webp'],stock:'in_stock',
   variants:[{sku:'MT-EAR-LT',upc:'703977746056',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'adapter-usbc-35',cat:'adapters',type:'Audio Adapter Cable',name:'USB-C to 3.5mm Audio Adapter Cable',
   desc:'Type-C to 3.5mm AUX cable for headphones and car aux inputs. TPE jacket resists compression and twisting, so it survives being stuffed in a console.',
   meta:['USB-C','3.5mm AUX','TPE jacket'],
   colors:[{name:'White',hex:'#f4f4f6',image:'adapter_usbc_35_product.webp'}],
   shots:['adapter_usbc_35.webp','adapter_usbc_35_detail.webp'],
   stock:'in_stock',variants:[{sku:'MT-AD-UC35',label:'Single',pack:20,stock:'in_stock'}]},

  {slug:'adapter-lightning-35',cat:'adapters',type:'Audio Adapter',name:'Lightning to 3.5mm AUX Adapter',
   desc:'Two ports, not one: plug in 3.5mm headphones and keep charging at the same time. That is the difference between this and the dongle in every other rack, and it is the whole reason a customer picks it up. Plug and play, no app. Works with iPhone 7 through 12 and every Lightning device. Model JBC029.',
   meta:['Lightning','3.5mm AUX','Charge + listen','Plug and play'],
   colors:[{name:'White',hex:'#f4f4f6',image:'adapter_lightning_35.webp'}],
   shots:['adapter_lightning_35_lifestyle.webp','adapter_lightning_35_box.webp','adapter_lightning_35_specs.webp'],
   stock:'in_stock',
   variants:[{sku:'MT-AD-LT35',upc:'984720174657',label:'Single',pack:20,stock:'in_stock'}]}
]};
/** Returns { categories, products, rules, dealer, live } */
export async function loadCatalog(){
  try{
    const sb = await supabase();
    const session = sb ? (await sb.auth.getSession()).data.session : null;
    const headers = session ? { Authorization:`Bearer ${session.access_token}` } : {};
    const r = await fetch('/api/catalog', { headers });
    if(r.ok) return { ...(await r.json()), live:true };
  }catch(_){ /* not deployed yet */ }
  return { ...FALLBACK, live:false };
}

export const bySlug = (products, slug) => products.find(p => p.slug === slug);

/** Opening image for a product: brand shot if there is one, else first colourway. */
export const openingShot = p =>
  p.shots?.[0] || (p.colors || []).find(c => c.image)?.image || '';


/* ------------------------------------------------------------------
   Order matrix. Lengths down the side, colourways across the top, one
   cell per orderable line. Lets a buyer place "wine 3 ft x100, brown
   6 ft x10" in a single pass instead of picking a colour, adding, and
   starting over.
------------------------------------------------------------------ */
export function orderMatrix(p, cart, opts = {}) {
  const priced = p.variants.filter(v => v.case_cents != null);
  if (!priced.length) {
    return `<div class="nomatrix">No pricing on file for this product yet. Call for a quote.</div>`;
  }
  const cols = (p.colors || []).filter(c => c.name);
  const multi = cols.length > 1;
  const cell = (v, colorName) => {
    const key = lineKey(v.sku, multi ? colorName : '');
    return `<input class="qty mono" type="text" inputmode="numeric" value="${cart[key] || ''}"
              placeholder="0" data-key="${key}" aria-label="${p.name} ${v.label} ${colorName || ''} cases">`;
  };

  return `
  <div class="matrix${multi ? '' : ' single'}" style="--cols:${multi ? cols.length : 1}">
    <div class="mhead">
      <span class="mcorner">Cases</span>
      ${multi ? cols.map(c => `<span class="mcol"><i style="background:${c.hex}" title="${c.name}"></i><em>${c.name}</em></span>`).join('')
              : '<span class="mcol"><em>Qty</em></span>'}
    </div>
    ${priced.map(v => `
      <div class="mrow">
        <span class="mlab">${v.label}<small class="mono">${usd(v.case_cents)} · ${v.pack}/cs</small></span>
        ${multi ? cols.map(c => cell(v, c.name)).join('') : cell(v, '')}
      </div>`).join('')}
    <div class="mfoot">
      <span class="mtot" data-total="${p.slug}">No cases selected</span>
      <button class="btn dark madd" data-add="${p.slug}" disabled>${opts.addLabel || 'Add to order'}</button>
    </div>
  </div>`;
}

/** Cases and dollars currently typed into one product's matrix. */
export function matrixTotals(root, p) {
  let cases = 0, cents = 0, pieces = 0;
  root.querySelectorAll(`[data-key]`).forEach(el => {
    const n = parseInt(el.value, 10) || 0;
    if (!n) return;
    const { sku } = splitKey(el.dataset.key);
    const v = p.variants.find(x => x.sku === sku);
    if (!v || v.case_cents == null) return;
    cases += n; cents += v.case_cents * n; pieces += v.pack * n;
  });
  return { cases, cents, pieces };
}
