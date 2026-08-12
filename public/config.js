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
// or over the phone. Start on 'quote' and switch when your list prices
// are real and Stripe is set up.
// -------------------------------------------------------------------
export const ORDER_MODE = 'quote';

// Shown wherever a buyer is told to get in touch.
export const SALES_PHONE = '214-681-8417';
export const SALES_EMAIL = 'info@mottob2b.com';
