// api/_lib.js — shared server helpers.
// The leading underscore keeps Vercel from exposing this as a route.

import { createClient } from '@supabase/supabase-js';

// service_role bypasses every RLS policy. Server only, forever.
export const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const MOQ_CENTS = 50000;           // $500
export const FREE_FREIGHT_CENTS = 150000; // $1,500
export const FREIGHT_CENTS = 1800;        // $18 flat

/** Resolve the signed-in dealer from the Authorization header. */
export async function getDealer(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: dealer } = await db
    .from('dealer_accounts')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // An account that exists but was never approved gets nothing.
  if (!dealer?.approved_at) return null;
  return dealer;
}

/** Admin routes are gated by a shared secret, not a user session. */
export function isAdmin(req) {
  const sent = req.headers['x-admin-token'];
  const real = process.env.ADMIN_TOKEN;
  if (!real || !sent) return false;
  // Constant-time-ish compare so the token can't be guessed a byte at a time.
  if (sent.length !== real.length) return false;
  let diff = 0;
  for (let i = 0; i < real.length; i++) diff |= sent.charCodeAt(i) ^ real.charCodeAt(i);
  return diff === 0;
}

/** Readable temporary password a rep can say out loud on the phone. */
export function tempPassword() {
  const words = ['cable','charger','dallas','retail','summit','anchor','harbor','maple',
                 'copper','ranger','falcon','cedar','orbit','pilot','quartz','ridge'];
  const w = () => words[Math.floor(Math.random() * words.length)];
  return `${w()}-${w()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Mirror of orderTotal() in public/catalog.js. Keep the two in step: if they
// drift, a dealer is charged something other than what the cart showed.
export const FEE_MODE = process.env.FEE_MODE || 'absorb';
export const ACH_DISCOUNT_PCT = Number(process.env.ACH_DISCOUNT_PCT || 2);

export function feeFor(base, method) {
  if (!base) return { adjust: 0, label: null };
  if (FEE_MODE === 'ach_discount') {
    const adjust = method === 'us_bank_account'
      ? -Math.round(base * (ACH_DISCOUNT_PCT / 100)) : 0;
    return { adjust, label: adjust ? `Bank debit discount (${ACH_DISCOUNT_PCT}%)` : null };
  }
  if (FEE_MODE === 'surcharge') {
    const adjust = method === 'card'
      ? Math.round(base * 0.029) + 30 : Math.min(500, Math.round(base * 0.008));
    return { adjust, label: 'Processing' };
  }
  return { adjust: 0, label: null };
}

export function freightFor(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_FREIGHT_CENTS ? 0 : FREIGHT_CENTS;
}
