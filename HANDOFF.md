# Motto Wholesale — project handoff

Paste this whole file into a new chat, attach `motto-wholesale.zip`, and say
what you want to work on next. Everything needed to continue is here.

---

## What this is

A private B2B catalog and ordering portal for **Motto USA**, a Dallas-based
wholesaler of phone accessories. Separate from their retail site
`mottousa.com`. The public side shows the product line with no prices;
approved partners sign in and see pricing set for their account.

**Stack:** static HTML on Vercel, serverless functions in `/api`, Supabase for
data and auth, Stripe for payment (not connected yet).

**Live:** deployed on Vercel, connected to Supabase.

---

## Credentials and services

| Thing | Value / where |
|---|---|
| Supabase project | `https://ryeqfugcvqwqtbjbwnin.supabase.co` |
| Publishable key | already in `public/config.js` |
| Secret key | Vercel env `SUPABASE_SERVICE_ROLE_KEY` — never in code |
| Admin token | Vercel env `ADMIN_TOKEN` — Nam has it saved |
| Email | Resend, domain `mottob2b.com` verified, key in Vercel |
| Sales inbox | `info@mottousa.com` — all contact and order mail is delivered here |
| Sending domain | `mottob2b.com` — verified in Resend. The From address must stay on it |
| Phone | 214-681-8417 |
| Warehouse | 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007 |
| Founded | **2017** (matches mottousa.com; the Instagram bio still says 2016 and needs fixing) |
| Territory | TX · LA · OK · AR, 2,000+ retail doors |

---

## What is built and working

**Public site** — hero, catalog with Cards/List toggle and category filters,
private label section, Why Motto, About, a 9.6s product reel that plays only
when on screen, contact form.

**Partner sign-in** — email + password, magic link, and self-serve password
reset. First sign-in forces a password change (the temp one was handed over by
a rep, so it is not private). Admin can reset.

**Per-partner pricing** — every SKU has one list price. What a partner pays is
resolved as: a manual per-SKU override if one exists, otherwise list minus that
partner's discount percentage. One Postgres function, `dealer_case_price()`,
decides this and is used by both the catalog and checkout, so what a partner
sees and what they are charged cannot drift apart.

**Order matrix** — lengths down the side, colourways across the top, one cell
each. Lets a buyer place "wine 3 ft x100, brown 6 ft x10" in one pass. Typing
only stages a line; nothing enters the cart until **Add to order**.

**Ordering** — `ORDER_MODE` in `public/config.js` is `'online'`. With no Stripe
key set, checkout lands on `checkout-preview.html`, which shows real totals and
both payment methods, clearly labelled as a preview. No card fields — a fake
payment form that looks real is how you end up with someone's card number in a
URL. The order is still recorded and emailed. Add `STRIPE_SECRET_KEY` and the
same button goes to real Stripe with no other change.

**Fees** — `FEE_MODE` is `'absorb'`. Motto pays processing; a partner sees one
price whichever method they pick and no fee line anywhere. Do not switch to
`'surcharge'` without reading the fee notes in README.md — debit cards can never
be surcharged anywhere in the US, Texas has a contested ban, and Oklahoma caps
at 2%, below what the code would apply.

**Admin** (`/admin.html`, unlocked with `ADMIN_TOKEN`) — five tabs: Partners
(create accounts, set discount, per-SKU price overrides, reset password),
List prices, Compliance, Inventory, Orders.

**Email** — contact form and orders notify `info@mottousa.com` and send the
buyer a confirmation. Sent in parallel; a failed email never tells someone
their message was lost, because the record is already saved.

---

## The catalog: 15 products, all photographed

Matched one by one against mottousa.com.

| Category | Products |
|---|---|
| Leather cables (4) | USB-C↔USB-C 65W · USB-C↔Lightning · USB-A↔USB-C · USB-A↔Lightning |
| Chargers & power (3) | 20W PD Wall · 45W PD Car (CC0200) · Soccer Ball Power Bank |
| Earbuds & audio (6) | BUDS+ · Airbuds A5 · ANC/ENC · 3.5mm wired · USB-C wired · Lightning wired (EP-007) |
| Adapters (2) | USB-C→3.5mm cable · Lightning→3.5mm adapter (JBC029) |

61 photos. Colourway shots are cut out onto transparent backgrounds; files
ending `_hero`, `_lifestyle`, `_detail`, `_box`, `_specs`, `_controls` keep
their own backdrop and render full-bleed.

**Removed:** `adapter-lightning-usbc` (Lightning to USB-C Adapter). It was a
guess from before the product list was confirmed and is not on mottousa.com.

---

## Open items

**1. List prices are placeholders.** Every `list_cents` in the seed is a number
Claude made up for display. Replace them in the admin **List prices** tab before
opening any real partner accounts. This is the single most important remaining
task — a partner account opened on fake prices means honouring a quote nobody
meant to give.

**2. Possible missing product.** mottousa.com appears to list both a "Lightning
to 3.5mm AUX Audio **Adapter**" and a "Lightning to 3.5mm AUX Audio **Cable**"
at $12.99. Only the adapter is in the catalog. Confirm whether these are two
products or one duplicate listing.

**3. `mottousa.com/wholesale` says "Dallas-based since 2017"** but this site and
the company Instagram says 2016. Fix the Instagram bio — a buyer who checks both
and finds two years will not ask, they will just trust you less.

**4. Compliance marks are all off.** `products.compliance` defaults to empty and
every product shows "Certificates on request". Only tick FCC/RoHS/CE in the
admin once the certificate on file lists that product's model number. An
untested wireless device sold as FCC certified is a real enforcement matter.
The original per-product certificate PDFs have not been supplied yet; the only
copy so far is a composite image too low-resolution to be usable.

**5. Stripe not connected.** See above.

**6. The About story is partly invented.** Verified: founded 2017, 2,000+ doors,
TX/LA/OK/AR, Carrollton warehouse. The narrative around it — starting with
independent gas stations, the leather cable being the best-turning line — was
written to sound right and has not been confirmed. Read it before a buyer does.

**7. A "test" product at $1.50** is publicly visible on mottousa.com.

---

## Setup notes worth keeping

**`02_seed.sql` is safe to re-run.** It updates names, descriptions, spec tags,
colourways and photos on conflict, but deliberately leaves `list_cents`,
`msrp_cents` and `stock_status` alone — those are set in the admin and a re-run
must never undo that work.

**`03_cleanup.sql`** removes SKUs seeded from early guesses (`MT-AD-LTUC`,
`MT-AL-06`, `MT-CL-03`) and lists anything else in the database that is not in
the current seed, without deleting it.

**Three things that are deliberate and should not be undone:**

- Prices are never accepted from the browser. `/api/checkout` and `/api/quote`
  receive only `{ sku, color, cases }` and re-resolve every price server side.
- Orders are written before the redirect to Stripe, so an abandoned cart still
  leaves a record a rep can call about.
- `paid` is set by the webhook only. Landing on the success page is not proof of
  payment, and ACH has not settled at that point anyway.

---

## Working style that worked well here

- Korean, informal. Direct.
- Push back when something is wrong rather than just complying — the ANC spec on
  BUDS+, the card surcharge legality, and the invented product were all caught
  that way and all mattered.
- Ship a zip every time, and check the Supabase keys are inside it before
  handing it over.
- Render and screenshot the actual page before claiming something works.
