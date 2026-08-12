// -------------------------------------------------------------------
// Public configuration. Everything here ships to the browser, so only
// put values here that are safe for anyone to read.
// -------------------------------------------------------------------

// Supabase → Project Settings → API.
// The ANON key belongs here. It only grants what your RLS policies allow.
// The service_role key must NEVER appear in this file.
export const SUPABASE_URL      = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

// -------------------------------------------------------------------
// PRICING_MODE
//
//   'contact'  Catalog only. Every product says to call for pricing.
//              Dealer sign-in and the order cart are hidden entirely.
//              Use this until real list prices are loaded in Supabase.
//
//   'dealer'   Approved dealers sign in, see their own case pricing and
//              order online through Stripe.
//
// Flip this one word when your prices are real. Nothing else changes.
// -------------------------------------------------------------------
export const PRICING_MODE = 'contact';

// Shown wherever a buyer is told to get in touch.
export const SALES_PHONE = '214-681-8417';
