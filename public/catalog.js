// catalog.js — shared data layer for index.html and product.html.
//
// Both pages call loadCatalog(). It tries the live API first and falls back to
// the built-in copy below, so the site renders before Supabase is connected and
// the two pages can never disagree about what is in the catalog.

import { SUPABASE_URL, SUPABASE_ANON_KEY, ORDER_MODE } from './config.js';

// Ordering online is optional. Signing in never is — a dealer who has an
// account should always be able to see the pricing that was set for them.
export const CAN_ORDER = ORDER_MODE === 'online';

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
export const isFlat = f => /_hero\.|_lifestyle\.|_detail\.|^adapter_usbc_35\.webp$/.test(f || '');

/* Availability. Kept deliberately coarse — a buyer needs to know whether to
   plan around it, not a live unit count that goes stale between page loads. */
export const STOCK = {
  in_stock:     { label: 'In stock',     dot: '#22a45d', tone: 'ok'   },
  low_stock:    { label: 'Low stock',    dot: '#d98324', tone: 'warn' },
  pre_order:    { label: 'Pre-order',    dot: '#7b7f87', tone: 'grey' },
  out_of_stock: { label: 'Out of stock', dot: '#c8382f', tone: 'bad'  }
};
export const stockOf = x => STOCK[x?.stock] || STOCK.in_stock;

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

  {slug:'usba-lightning',cat:'cables',type:'Leather-Wrapped Lightning Cable',
   name:'USB-A to Lightning Charging Cable',
   desc:'Legacy USB-A connection for customers still running older wall bricks and car adapters.',
   meta:['3 ft / 6 ft','USB-A','Lightning'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'Wine',hex:'#7d2230',image:null},{name:'Brown',hex:'#6b4128',image:null}],
   shots:[],
   stock:'in_stock',variants:[{sku:'MT-AL-03',label:'3 ft',pack:12,stock:'in_stock'},{sku:'MT-AL-06',label:'6 ft',pack:12,stock:'in_stock'}]},

  {slug:'wall-20w',cat:'power',type:'Fast Charger',name:'20W PD Wall Charger',
   desc:'Compact dual-port wall charger with USB-C PD and USB-A. Supports Lightning, Micro USB and USB-C cables, so one brick covers the whole rack.',
   meta:['20W PD','USB-C','USB-A','Dual Port'],
   colors:[{name:'White',hex:'#f4f4f6',image:'wall_white.webp'},{name:'Black',hex:'#1a1a1a',image:'wall_black.webp'}],
   shots:['wall_white.webp','wall_lifestyle.webp'],
   stock:'in_stock',variants:[{sku:'MT-W20',label:'Single',pack:10,stock:'in_stock'}]},

  {slug:'car-45w',cat:'power',type:'Fast Charger',name:'45W PD Car Charger',
   desc:'USB-C Power Delivery paired with an 18W Quick Charge port in an alloy housing.',
   meta:['45W PD','QC 18W','Dual Port'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-C45',label:'Single',pack:10,stock:'in_stock'}]},

  {slug:'powerbank-soccer',cat:'power',type:'Portable Power',name:'Soccer Ball Portable Power Bank',
   desc:'Novelty portable power bank with USB-C in and out. Seasonal and event-driven demand.',
   meta:['Portable','USB-C In/Out'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'pre_order',variants:[{sku:'MT-PB-SOC',label:'Single',pack:6,stock:'pre_order'}]},

  {slug:'buds-plus',cat:'audio',type:'True Wireless Earbuds',name:'Motto BUDS+',
   desc:'True wireless earbuds with active noise cancellation and a Qi-chargeable case.',
   meta:['ANC','Qi Charging','True Wireless'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-BUDS-P',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'airbuds-a5',cat:'audio',type:'True Wireless Earbuds',name:'Wireless Airbuds A5',
   desc:'Entry true wireless earbuds for retailers who want a second price point above wired.',
   meta:['True Wireless','Charging Case'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'low_stock',variants:[{sku:'MT-A5',label:'Single',pack:6,stock:'low_stock'}]},

  {slug:'headset-anc',cat:'audio',type:'Wireless Headset',name:'Wireless Headset ANC/ENC',
   desc:'Over-ear wireless headset with active and environmental noise cancellation.',
   meta:['ANC','ENC','Over-Ear'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-HS-ANC',label:'Single',pack:6,stock:'in_stock'}]},

  {slug:'wired-35mm',cat:'audio',type:'Wired Earphones',name:'Premium 3.5mm AUX Wired Earphones',
   desc:'Standard 3.5mm wired earphones with in-line mic. Reliable impulse purchase at the counter.',
   meta:['3.5mm','In-line Mic'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-EAR-35',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'wired-usbc',cat:'audio',type:'Wired Earphones',name:'Premium USB-C Wired Earphones',
   desc:'USB-C wired earphones for Android and iPhone 15 and up. Growing share every quarter.',
   meta:['USB-C','In-line Mic'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-EAR-UC',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'wired-lightning',cat:'audio',type:'Wired Earphones',name:'Premium Lightning Wired Earphones',
   desc:'Lightning wired earphones for the installed iPhone base. Still the volume leader on wired.',
   meta:['Lightning','In-line Mic'],
   colors:[{name:'Black',hex:'#1a1a1a',image:null},{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-EAR-LT',label:'Single',pack:12,stock:'in_stock'}]},

  {slug:'adapter-usbc-35',cat:'adapters',type:'Audio Adapter Cable',name:'USB-C to 3.5mm Audio Adapter Cable',
   desc:'Type-C to 3.5mm AUX cable for headphones and car aux inputs. TPE jacket resists compression and twisting, so it survives being stuffed in a console.',
   meta:['USB-C','3.5mm AUX','TPE jacket'],
   colors:[{name:'White',hex:'#f4f4f6',image:'adapter_usbc_35_product.webp'}],
   shots:['adapter_usbc_35.webp','adapter_usbc_35_detail.webp'],
   stock:'in_stock',variants:[{sku:'MT-AD-UC35',label:'Single',pack:20,stock:'in_stock'}]},

  {slug:'adapter-lightning-35',cat:'adapters',type:'Audio Adapter',name:'Lightning to 3.5mm Adapter',
   desc:'Headphone jack adapter for iPhone. Pairs naturally with the wired earphone assortment.',
   meta:['Lightning','3.5mm'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-AD-LT35',label:'Single',pack:20,stock:'in_stock'}]},

  {slug:'adapter-lightning-usbc',cat:'adapters',type:'Connector Adapter',name:'Lightning to USB-C Adapter',
   desc:'Lets an existing Lightning cable charge a USB-C device. Explains itself on the peg card.',
   meta:['Lightning','USB-C','Charge + Data'],
   colors:[{name:'White',hex:'#f4f4f6',image:null}],shots:[],
   stock:'in_stock',variants:[{sku:'MT-AD-LTUC',label:'Single',pack:20,stock:'in_stock'}]}
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
