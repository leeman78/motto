# Motto Wholesale

A private B2B catalog and ordering portal for Motto USA. The public side shows
the assortment with no prices. Approved dealers sign in and see pricing that was
set for their account specifically, then order in full cases and pay by bank
debit or card.

Static pages on Vercel, serverless functions in `/api`, data in Supabase,
payments through Stripe.

---

## How pricing works

This is the part worth understanding before anything else.

Every variant has one **list price** per case, stored in `variants.list_cents`.
What a given dealer actually pays is resolved in two steps:

1. If there is a row in `dealer_prices` for that dealer and SKU, that price wins.
2. Otherwise, list price minus `dealer_accounts.discount_pct`.

So opening a new account is one number. You agree 32% off list on the phone, type
`32`, and their whole price sheet is live. If you also gave them a special deal on
two cable SKUs, you override those two lines and everything else keeps following
the discount.

The payoff comes later. When your landed cost moves and you raise a list price,
every dealer without an override moves with it automatically. Only the bespoke
lines need a second look. Fully manual pricing gets you the same flexibility but
makes a cost increase a day of data entry instead of five minutes.

The resolution lives in one Postgres function, `dealer_case_price()`. Both the
catalog endpoint and the checkout endpoint call it, which is why the price a
dealer sees and the price they get charged cannot drift apart.

---

## Setup

### 1. Supabase

Create a project, then in **SQL Editor** run these in order:

```
supabase/01_schema.sql
supabase/02_seed.sql
supabase/03_cleanup.sql
```

The seed loads all 15 product families with placeholder list prices.
`03_cleanup.sql` removes SKUs that were seeded from guesses before the real
product list was confirmed, and lists anything else in your database that is
not in the current seed so you can decide about it yourself. Replace
those with your real numbers in the admin before you open any dealer accounts.

**`02_seed.sql` is safe to re-run.** When a product already exists it updates
the name, description, spec tags, colourways and photos — but deliberately
leaves `list_cents`, `msrp_cents` and `stock_status` alone. Those are yours to
set in the admin, and a re-run must never undo that work. So when new photos or
copy land here, paste the whole file in again and nothing you have entered is
at risk.

Then go to **Authentication → Providers** and confirm Email is on. If you want
the passwordless option to work, leave "Enable email confirmations" on and set
your Site URL under **Authentication → URL Configuration** to your deployed
domain.

### 2. Front-end config

Edit `public/config.js` with your project URL and **anon** key, both from
Supabase → Project Settings → API.

The anon key belongs in the browser. It only grants what your RLS policies allow,
which is why `variants` is locked down and prices are served through `/api/catalog`
instead of read directly.

The same file holds `ORDER_MODE`, which decides how orders get placed:

- `'quote'` — dealers sign in and see their own pricing, then call or email to
  order. No cart, no Stripe.
- `'online'` — everything above, plus a case cart and Stripe checkout.

**Dealer sign-in works in both, and the public catalog never shows a price in
either.** So `ORDER_MODE` only controls whether an order is placed on the site
or over the phone. Ship on `'quote'`, load real list prices, then switch when
Stripe is set up.

Also in the file: `SALES_PHONE` and `SALES_EMAIL`. Change them here and they
update everywhere on the page.

### 3. Environment variables

Copy `.env.example` to `.env.local` for local work, and paste the same four keys
into Vercel → Settings → Environment Variables for production.

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_TOKEN
```

Two of these are dangerous:

- `SUPABASE_SERVICE_ROLE_KEY` ignores every RLS policy. Never prefix it with
  `NEXT_PUBLIC_` or `VITE_`, never put it in `public/`, never commit it.
- `ADMIN_TOKEN` is the only thing between the internet and your dealer pricing.
  Generate it, don't invent it: `openssl rand -base64 36`

### 4. Stripe

Start in test mode. In **Developers → Webhooks**, add an endpoint at
`https://your-domain/api/stripe-webhook` and subscribe to:

```
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
charge.refunded
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

To take ACH, enable **ACH Direct Debit** under Settings → Payment methods.
This matters more than it sounds: ACH costs 0.8% capped at $5, cards cost
2.9% + 30¢. On a $2,000 reorder that is $5 versus $58. On wholesale margins the
difference is real money, and the cart shows dealers the comparison so they pick
the cheap one themselves.

### 5. Deploy

```bash
npm install
vercel          # preview
vercel --prod   # live
```

Local development with functions:

```bash
vercel dev
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

`stripe listen` prints its own `whsec_` value. It is different from the
production one. Put it in `.env.local`.

Test card: `4242 4242 4242 4242`, any future date, any CVC.
For ACH, choose "Test Institution" in the Stripe payment sheet.

### 6. Photos

Photos for four products are already in `public/assets/`: both leather cables,
the 20W wall charger and the USB-C to 3.5mm cable. Everything still needed is
listed at the bottom of `public/assets/README.txt`.

Each colorway points at its own file. Clicking a swatch on a product card swaps
the main photo to that color, so one card covers the whole colorway range
without five pictures competing for attention. A color with no photo yet still
shows its swatch, dimmed with a slash, so buyers know it exists. A product with
no photos at all shows a grey placeholder with its name.

Run new photos through the same treatment as the existing ones: trim the empty
margin, pad to square, export WebP around 1000px. Untrimmed shots look tiny
next to these.

### Seeing it before you deploy

Open `public/index.html` and the catalog renders from a built-in copy of the
data, so you can show it to someone today. A yellow bar at the top says
PREVIEW while it is running that way. As soon as `/api/catalog` answers, the
database takes over and the bar disappears.

---

## Admin access

`ADMIN_TOKEN` is checked on every admin request, and failures are recorded per
IP in `admin_attempts`. Eight wrong codes inside fifteen minutes locks that IP
out for thirty. That lockout is what makes the code length a choice rather than
a requirement: without it the secret has to survive unlimited guessing, so it
has to be long. With it, a passphrase you can actually remember is workable.

If you shorten it, use a **passphrase, not a password** — four unrelated words
like `copper-ranger-maple-8412` is easier to type than a random string and far
harder to guess than `motto2026`. Do not reuse a password from anywhere else,
and never use a word connected to the business.

"Stay signed in on this device" keeps the code in the browser so you are not
retyping it. Untick it on a shared machine. Sign out clears it from both
places.

This is still one shared secret with no audit trail. Once more than one person
needs the admin, move it to Supabase Auth with per-person accounts.

## Passwords

A rep creates the account and hands the first password over — read out on a
call, sent in an email, whichever. Either way it has passed through someone
else before the dealer ever uses it, so the dealer is made to replace it the
first time they sign in. The modal has no close button until they do.

`Reset password` in the admin does the same thing: new temporary password,
flag set again. Dealers can also reset themselves with "Forgot your password?"
on the sign-in box, which emails a link and never involves a rep.

**Send sign-in link** on the dealer screen emails a one-tap passwordless link.
Supabase's admin API only *generates* that link, it does not deliver it, so the
email is sent through Resend from the Motto domain. Without `RESEND_API_KEY`
the button reports that no email could be sent rather than silently doing
nothing.

The Dealers list shows a **Temp password** tag next to anyone who has not
replaced theirs yet. An old account still carrying that tag usually means they
never actually signed in.

### Two different sign-in emails

They fail for different reasons, so work out which one you are testing first.

| Where | What sends it | Shows in Resend? |
|---|---|---|
| Admin → dealer → **Send sign-in link** | `/api/admin` calls Supabase for the link, then mails it through Resend itself | Yes, always |
| Site → Dealer sign in → **Email me a sign-in link** | Supabase, through whatever SMTP the project has | Only if custom SMTP is configured and pointed at Resend |

Supabase's `generateLink` mints a URL and does **not** send anything. The admin
button therefore does its own sending. If that button returns 200 in the auth
logs but nothing appears in Resend, the deployed build predates that fix —
redeploy.

### When a sign-in or reset link does not arrive

Supabase reports success even when the address has no account, so "sent" on
screen does not mean "delivered". Work through these in order:

1. **Does the address exactly match the account?** `signInWithOtp` is called
   with `shouldCreateUser: false`, so an address that is not on a dealer
   account silently sends nothing. Check the spelling in
   Authentication → Users.
2. **Is Site URL set?** Authentication → URL Configuration. If it still says
   `http://localhost:3000`, links in those emails point at a machine that is
   not there. Set it to the deployed domain and add it to Redirect URLs.
3. **Is custom SMTP actually saved?** Authentication → Emails → SMTP Settings.
   Without it Supabase sends from its own address with a hard limit of a few
   per hour, and once you cross that limit later attempts just fail quietly.
4. **Check Resend → Emails.** If the message is not listed there, Supabase
   never handed it over, which points back at 2 or 3. If it is listed as
   Bounced, the address is the problem.
5. **Auth logs.** Supabase → Logs → Auth shows the send attempt and the reason
   it failed.

The contact form is unrelated — it goes through Resend directly from
`/api/lead`, not through Supabase. So the form working tells you nothing about
whether auth email is configured.

## Fees

`FEE_MODE` in `public/config.js` is `absorb`: Motto pays the processing cost,
a dealer sees one price whichever method they choose, and no fee line appears
anywhere. `FEE_MODE` in the Vercel environment must match, or the server will
charge something the cart never showed.

Do not switch to `surcharge` casually. Passing card costs to the buyer is a
regulated programme, not a setting:

- **Debit cards can never be surcharged**, in any state, under the Durbin
  Amendment and card network rules — including when a debit card runs as
  credit. Stripe does not reliably tell you the card is debit before you
  charge it, so this alone makes a blanket card fee unsafe.
- **Some states ban it outright**, and Texas has a ban that federal courts
  found unconstitutional while the Attorney General maintains it is
  enforceable. Motto is in Texas and sells into Oklahoma, which caps
  surcharges at 2% — below the 2.9% the code would apply.
- **The cap is the lower of 3% or your actual cost**, and Visa and Mastercard
  require 30 days written notice before the first surcharge.

`ach_discount` avoids all of it. A discount for one payment method is legal in
every state, needs no registration, and works on debit cards. The economics are
the same; only the framing changes. None of this is legal advice — check with
your processor and an attorney before turning either one on.

## Prices

List prices live in the admin **List prices** tab. That is the only place they
should ever be edited. Every dealer's pricing is derived from them, so raising
a list price moves every dealer who does not have a manual override on that SKU.

The save confirmation tells you how many dealers are pinned to a manual price on
that SKU and therefore will *not* move. Those are the ones to call.

The Margin at MSRP column is what the retailer keeps selling at your suggested
price. It is the first number a convenience-store buyer asks about, so it is
worth keeping honest.

## Email

The contact form writes the lead to Supabase and then emails
`info@mottob2b.com`. The write happens first on purpose: if the mail provider
is down the lead is still saved, and the buyer is never told their message was
lost when it wasn't.

Set `RESEND_API_KEY` in Vercel to turn the email on. Without it the form still
works, the leads just sit in the database. The sending domain has to be
verified in Resend first, or mail from `info@mottob2b.com` will be rejected.

**Supabase auth emails are separate.** Password resets and the "email me a
sign-in link" option are sent by Supabase, and out of the box they come from
`noreply@mail.app.supabase.io` with a hard limit of a few per hour. For real
dealers, set custom SMTP under Supabase → Project Settings → Authentication →
SMTP Settings and point it at the same Resend account. Then those come from
`info@mottob2b.com` too, and the rate limit goes away.

## Ordering

Colour is part of the order line, not just a photo switch. A warehouse picks
"wine 3 ft", not "3 ft", so the cart carries both and the SKU on the pick list
comes out as `MT-CC65-03-WIN`.

Signed-in dealers get an order matrix on every card and product page: lengths
down the side, colourways across the top, one cell each. That is how a buyer
actually thinks — "10 cases of 6 ft, mixed" — and it beats picking a colour,
adding, and starting over for each one.

Typing in the matrix only stages a line. Nothing reaches the cart until **Add
to order** is pressed, so a mistyped digit is never an order.

What happens on submit depends on `ORDER_MODE`:

- `'quote'` → `/api/quote`. The order is recorded with status `requested` and
  emailed to sales and to the dealer. Nothing is charged. SKUs that are not
  `in_stock` are flagged at the top of the sales email so a rep checks before
  confirming.
- `'online'` → `/api/checkout`. Goes to Stripe when `STRIPE_SECRET_KEY` is set.

**Before Stripe is connected**, `'online'` still works: the order is recorded
and the dealer lands on `checkout-preview.html`, which shows the real totals and
both payment methods with their actual fees, clearly labelled as a preview. No
card or bank details are collected there — a fake payment form that looks real
is how you end up with someone's card number in a URL. Set `STRIPE_SECRET_KEY`
and the same button goes to real Stripe with no other change.

Both re-resolve every price server side. A submitted order is a commitment, so
it is never priced from whatever the browser had cached.

## Payment fees

`FEE_MODE` in `public/config.js` decides who pays the processing cost. It ships
on `'absorb'` — one price, any payment method — and that is the recommendation.

I am not a lawyer and this is not legal advice, but before switching to
`'surcharge'` here is what a card surcharge actually involves in the US:

- **Never on debit cards.** Banned in all 50 states by the Durbin Amendment and
  by Visa and Mastercard rules, including when a debit card runs as credit.
  Stripe Checkout does not tell you the card is debit until after it is charged,
  so a flat card fee will hit debit cards and break this rule.
- **Capped at 3%**, or your actual cost of acceptance, whichever is lower. The
  2.9% + 30¢ this code used goes over 3% on any order under about $300.
- **Oklahoma caps it at 2%**, and you sell into Oklahoma.
- **Texas has a ban on the books.** Federal courts found it unconstitutional but
  the Attorney General has said it is enforceable, so it is genuinely unsettled
  in your home state.
- **Thirty days written notice** to Visa and Mastercard before the first one,
  plus disclosure at checkout.

`'ach_discount'` gets you the same economics without any of that. A discount for
one payment method is legal in all 50 states, needs no network registration, and
can apply to debit cards. It also reads better to a buyer: "2% off if you pay by
bank" lands differently from "3% more if you use a card", even though the money
is identical.

Whatever mode is set, `public/config.js` and the `FEE_MODE` env var must match.
The browser uses the first to quote and the server uses the second to charge; if
they disagree, a dealer pays something other than what the cart showed.

## Compliance marks

`products.compliance` is an array like `{FCC,RoHS}`, edited in the admin
**Compliance** tab. It defaults to empty, and a product with nothing set shows
"Certificates on request" on its page — which is honest and costs nothing.

**Only tick a mark once the certificate on file lists that product's model
number.** Certificates usually cover specific models, so a cable's FCC report
does not cover the earbuds. In the US an untested wireless device sold as FCC
certified is a real enforcement matter, not a marketing exaggeration. When in
doubt, leave it blank; "on request" is the safe and normal answer in wholesale.

CE is included because the certificates exist, but it is deliberately dimmed on
the site. It is a European declaration and means nothing to a convenience-store
buyer in Texas. FCC and RoHS are what US buyers and chain accounts actually ask
for.

The certificates themselves are not hosted yet. When the original per-product
PDFs are available, drop them in `public/docs/` and link them from the
Compliance row — a composite screenshot of nine certificates is not something a
buyer can file.

## Availability

Every SKU carries a status: In stock, Low stock, Pre-order or Out of stock. It
shows as a badge on the catalog card, a column in list view, and per SKU on the
product page. A product family displays the weakest status among its SKUs, so
one low-stock length makes the whole card read Low stock. That is intentional:
it starts the conversation before a buyer places an order you cannot fill.

Set it in the admin Inventory tab. This is manual rather than wired to a live
count on purpose — a wrong "in stock" costs one phone call, a broken inventory
feed takes down the catalog.

## Day to day

### Opening a dealer account

Go to `/admin.html` and unlock with your `ADMIN_TOKEN`.

Fill in the business, their email (that becomes their login), and the discount
you agreed. Hit **Create account**. A temporary password appears once — read it
to them on the call. It is not stored anywhere retrievable, only as a hash, so
if they lose it use **Reset password** rather than looking it up.

Dealers who will not remember a password can use **email me a sign-in link** on
the login screen instead. For a lot of store owners this is the better default.

### Adjusting one dealer's prices

Click their row, then type over any price in the sheet. Blue rows are the ones
you have overridden. **CLEAR** puts a line back on the discount.

### Net 30 accounts

Set terms to net15 or net30 on the dealer's screen. Their checkout stops going to
Stripe Checkout and instead records the order as `processing` with a note that an
invoice is coming. Send that invoice from Stripe Billing. Terms customers should
not be paying card fees at checkout.

### Shipping

Orders tab. Paste a tracking number into a row and it flips to shipped.

**Do not ship on `processing`.** Card orders reach `paid` in seconds. ACH orders
sit at `processing` for a few business days while the transfer settles, and the
webhook moves them to `paid` when it clears. Shipping early means the goods leave
before the money arrives.

---

## Security notes

Three things are deliberate and worth not undoing later:

**Prices are never accepted from the browser.** `/api/checkout` receives only
`{ sku, cases }` and looks up every price server side. If the client could send
an amount, anyone with DevTools could buy a $2,000 order for $1.

**Orders are written before the redirect to Stripe.** An abandoned cart still
leaves a `pending` order, so a rep can call and close it.

**`paid` is set by the webhook only.** Landing on the success page is not proof
of payment — the buyer can close the tab, and ACH has not settled yet anyway.

`api/stripe-webhook.js` disables the body parser on purpose. Stripe's signature
is computed over the exact raw bytes, so any JSON parsing ahead of verification
breaks it.

---

## Files

```
api/
  _lib.js             Supabase clients, auth helpers, freight rules
  catalog.js          catalog, priced for whoever is signed in
  checkout.js         Stripe Checkout session, prices resolved server side
  stripe-webhook.js   the only writer of paid status
  admin.js            dealer accounts, price sheets, orders
  lead.js             wholesale inquiry form
public/
  index.html          home: hero, catalog, private label, why, about, reel, contact
                      catalog has a Cards / List density toggle, remembered per browser
  product.html        product detail, reads ?p=<slug>
  admin.html          internal console
  order-confirmed.html
  catalog.js          shared data layer for index and product pages
  config.js           Supabase URL, anon key, PRICING_MODE
  styles.css
  assets/             product photos
supabase/
  01_schema.sql       tables, pricing functions, RLS
  02_seed.sql         15 product families
```

## Editing copy

The About section on the home page carries the company story. Four claims in
it are load-bearing and repeat in several places, so change them by searching
the repo rather than editing one spot:

| Claim | Also appears in |
|---|---|
| Founded 2017 | top banner, hero kicker, trust bar, footer, Organization schema |
| 2,000+ retail doors | hero lead, trust bar, About facts |
| TX · LA · OK · AR | hero lead, trust bar, About facts, meta description |
| Carrollton warehouse | About facts, Contact block, Organization schema |

One thing to reconcile before launch: the wholesale page on mottousa.com
currently says "Dallas-based since 2017", while the company's own Instagram
says founded 2017. This site uses 2017. Fix whichever is wrong on the other
site too — a buyer who checks both and finds two different years will not ask
you about it, they will just trust you less.

---

## Not built yet

- Emailed order confirmations and packing slips
- Inventory counts and out-of-stock handling
- Reorder from a past order in one click
- A downloadable PDF price sheet per dealer
- Volume breaks inside a single dealer (5 cases vs 20 cases)
