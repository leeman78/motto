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

const MAX_TRIES = 8;        // per IP
const WINDOW_MIN = 15;      // rolling window
const LOCKOUT_MIN = 30;     // how long a tripped IP stays out

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress || 'unknown';
}

function tokenMatches(sent, real) {
  if (!real || !sent) return false;
  // Constant-time-ish compare so the token can't be guessed a byte at a time.
  if (sent.length !== real.length) return false;
  let diff = 0;
  for (let i = 0; i < real.length; i++) diff |= sent.charCodeAt(i) ^ real.charCodeAt(i);
  return diff === 0;
}

/**
 * Admin routes are gated by a shared secret plus a lockout. Without the
 * lockout the secret would have to be long enough to survive unlimited
 * guessing; with it, eight wrong tries buys an attacker a thirty minute wait,
 * and a passphrase a person can actually remember becomes workable.
 *
 * Returns { ok } or { ok:false, locked:true, minutes }.
 */
export async function checkAdmin(req) {
  const ip = clientIp(req);
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();

  const { data: recent } = await db
    .from('admin_attempts')
    .select('ok, at')
    .eq('ip', ip).gte('at', since)
    .order('at', { ascending: false }).limit(MAX_TRIES + 1);

  const fails = (recent || []).filter(r => !r.ok);
  if (fails.length >= MAX_TRIES) {
    const oldest = new Date(fails[fails.length - 1].at).getTime();
    const minutes = Math.max(1, Math.ceil((oldest + LOCKOUT_MIN * 60000 - Date.now()) / 60000));
    return { ok: false, locked: true, minutes };
  }

  const ok = tokenMatches(req.headers['x-admin-token'], process.env.ADMIN_TOKEN);

  // Only failures are worth keeping. Logging every success would grow the
  // table for no reason, since a valid token is not the thing being defended.
  if (!ok) await db.from('admin_attempts').insert({ ip, ok: false });
  else if (fails.length) await db.from('admin_attempts').delete().eq('ip', ip);

  return { ok };
}

/** Synchronous form, kept for callers that do not need the lockout. */
export function isAdmin(req) {
  return tokenMatches(req.headers['x-admin-token'], process.env.ADMIN_TOKEN);
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
    return { adjust, label: adjust ? `ACH discount (${ACH_DISCOUNT_PCT}%)` : null };
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
