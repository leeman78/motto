// -------------------------------------------------------------------
// Public configuration. Everything here ships to the browser, so only
// put values here that are safe for anyone to read.
// -------------------------------------------------------------------

// Supabase → Project Settings → API.
// Use the PUBLISHABLE key (sb_publishable_...) or the legacy anon key.
// It only grants what your RLS policies allow.
// The secret / service_role key must NEVER appear in this file.
export const SUPABASE_URL      = 'https://ryeqfugcvqwqtbjbwnin.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_5ubPlK5Cp8gj0AALJt2AAQ_4l6WU5kO';

// -------------------------------------------------------------------
// ORDER_MODE — what a signed-in dealer can do.
//
//   'quote'  Dealers sign in and see their own pricing. No cart, no
//            checkout. They call or email to place the order.
//
//   'online' Everything above, plus a case cart and Stripe checkout.
//
// Dealer sign-in works in both. The public catalog never shows a price
// either way, so this only decides whether orders are placed on the site
// or over the phone.
//
// On 'online' with no STRIPE_SECRET_KEY set, checkout lands on a preview
// page instead of Stripe: the order is still recorded and emailed, and the
// dealer sees exactly what the paid flow will look like. Add the key and the
// same button goes to real Stripe with nothing else to change.
// -------------------------------------------------------------------
export const ORDER_MODE = 'online';

// -------------------------------------------------------------------
// FEE_MODE — who pays the payment processing cost. Motto does, so a dealer
// sees one price whichever method they pick and no fee line anywhere.
//
// The other two modes exist but are switched off. Read the fee notes in
// README.md before touching this: card surcharging is regulated, banned in
// several states, capped at 3%, and never allowed on debit cards.
//
//   'absorb'       one price, any method   ← current
//   'ach_discount' ACH gets a discount
//   'surcharge'    card orders carry a fee
// -------------------------------------------------------------------
export const FEE_MODE = 'absorb';
export const ACH_DISCOUNT_PCT = 2;   // only used when FEE_MODE is 'ach_discount'

// Shown wherever a buyer is told to get in touch.
export const SALES_PHONE = '214-681-8417';
export const SALES_EMAIL = 'info@mottousa.com';
