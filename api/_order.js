// api/_order.js — the one place an order is priced and a Stripe session built.
//
// Three routes create or pay orders: checkout.js (the store, signed in),
// admin.js (the office writing an order for a store), and pay.js (the store
// following a pay link). If each priced items its own way they would drift,
// and a store would approve one number and be charged another. So they all
// call these.

import { db, freightFor, feeFor, MOQ_CENTS } from './_lib.js';

/**
 * Price a cart for one dealer. Prices come from dealer_case_price() in the
 * database, never from the caller — the same rule checkout has always had.
 *
 * items: [{ sku, color?, cases }]
 * Returns { rows, line_items, subtotal, freight } or throws with a message
 * safe to show.
 */
export async function priceOrder(dealer, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const e = new Error('The order is empty.'); e.status = 400; throw e;
  }

  const skus = [...new Set(items.map(i => String(i.sku)))];

  const { data: variants, error: vErr } = await db
    .from('variants')
    .select('sku, label, case_pack, is_active, products(name)')
    .in('sku', skus)
    .eq('is_active', true);
  if (vErr) throw vErr;

  const bySku = Object.fromEntries(variants.map(v => [v.sku, v]));
  const missing = skus.filter(s => !bySku[s]);
  if (missing.length) {
    const e = new Error(`No longer available: ${missing.join(', ')}`);
    e.status = 400; throw e;
  }

  const priced = {};
  for (const sku of skus) {
    const { data, error } = await db.rpc('dealer_case_price', {
      p_dealer: dealer.id, p_sku: sku
    });
    if (error) throw error;
    if (data == null) {
      const e = new Error(`No price on file for ${sku}.`); e.status = 400; throw e;
    }
    priced[sku] = data;
  }

  let subtotal = 0;
  const line_items = [];
  const rows = [];

  for (const { sku, color, cases } of items) {
    const qty = Math.max(1, Math.min(9999, parseInt(cases, 10) || 0));
    const v = bySku[sku];
    const unit = priced[sku];
    subtotal += unit * qty;

    line_items.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unit,
        product_data: {
          name: `${v.products.name} — ${v.label}${color ? ' — ' + color : ''}`,
          description: `${sku} · box of ${v.case_pack}`,
          metadata: { sku, ...(color ? { color } : {}) }
        }
      }
    });
    rows.push({ sku, color: color || null, cases: qty, case_cents: unit, pieces: v.case_pack * qty });
  }

  return { rows, line_items, subtotal, freight: freightFor(subtotal), moq: dealer.moq_cents ?? MOQ_CENTS };
}

/**
 * Rebuild Stripe line items from an order already in the database.
 *
 * Used by the pay link. The store is approving the order that was emailed to
 * them, so the prices are the ones frozen on order_items at write time — NOT
 * re-resolved. If the price sheet changed since, this order keeps its number;
 * write a new order for the new price.
 */
export async function frozenLineItems(orderId) {
  const { data: items, error } = await db
    .from('order_items')
    .select('sku, color, cases, case_cents, pieces')
    .eq('order_id', orderId);
  if (error) throw error;
  if (!items?.length) { const e = new Error('This order has no items.'); e.status = 400; throw e; }

  const skus = [...new Set(items.map(i => i.sku))];
  const { data: variants } = await db
    .from('variants')
    .select('sku, label, case_pack, products(name)')
    .in('sku', skus);
  const bySku = Object.fromEntries((variants || []).map(v => [v.sku, v]));

  return items.map(it => {
    const v = bySku[it.sku];
    return {
      quantity: it.cases,
      price_data: {
        currency: 'usd',
        unit_amount: it.case_cents,
        product_data: {
          name: v ? `${v.products.name} — ${v.label}${it.color ? ' — ' + it.color : ''}` : it.sku,
          description: `${it.sku} · box of ${v?.case_pack ?? '—'}`,
          metadata: { sku: it.sku, ...(it.color ? { color: it.color } : {}) }
        }
      }
    };
  });
}

/**
 * The dealer's Stripe customer, created on first use.
 *
 * This is what turns the second order into two taps: the bank account
 * verified on the first payment is attached to this customer, and Stripe
 * offers it back on every later session.
 */
export async function ensureCustomer(stripe, dealer) {
  if (dealer.stripe_customer_id) return dealer.stripe_customer_id;

  const customer = await stripe.customers.create({
    name: dealer.business_name,
    email: dealer.email,
    metadata: { dealer_id: dealer.id }
  });

  await db.from('dealer_accounts')
    .update({ stripe_customer_id: customer.id })
    .eq('id', dealer.id);

  return customer.id;
}

/**
 * Create the Checkout session for an order. One shape for every caller.
 *
 * opts: { dealer, order:{id}, line_items, base (subtotal+freight, for fees),
 *         payment_method, origin, collectAddress?, cancel_url?, idemKey? }
 *
 * idemKey: pass one where a double-click could mint two sessions (checkout).
 * Leave it off for the pay link — that session may need to be re-created
 * after Stripe's 24-hour expiry, and an idempotency key would hand back the
 * dead one.
 */
export async function paySession(stripe, opts) {
  const { dealer, order, line_items, base, payment_method, origin,
          collectAddress = true, cancel_url, idemKey } = opts;

  const items = [...line_items];

  // Whatever the fee model does has to become a real Stripe line, or the
  // store is charged a different number than it approved.
  const { adjust, label } = feeFor(base, payment_method);
  if (adjust > 0) {
    items.push({ quantity: 1,
      price_data: { currency: 'usd', unit_amount: adjust, product_data: { name: label } } });
  }
  let discounts;
  if (adjust < 0) {
    const coupon = await stripe.coupons.create({
      amount_off: -adjust, currency: 'usd', duration: 'once', name: label
    });
    discounts = [{ coupon: coupon.id }];
  }

  // ACH is 0.8% capped at $5; card is 2.9% + 30c. ACH is offered first.
  const methods = payment_method === 'card' ? ['card'] : ['us_bank_account', 'card'];

  const customer = await ensureCustomer(stripe, dealer);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: methods,
    line_items: items,
    ...(discounts ? { discounts } : {}),
    customer,
    // Save whatever they pay with. Approving the ACH debit on this screen is
    // also the mandate — Stripe records the consent, timestamp and IP, which
    // is the "signature" if the debit is ever disputed.
    payment_intent_data: { setup_future_usage: 'off_session' },
    client_reference_id: order.id,
    metadata: { order_id: order.id, dealer_id: dealer.id },
    ...(collectAddress ? {
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      custom_fields: [{
        key: 'resale_cert',
        label: { type: 'custom', custom: 'Resale certificate / Tax ID' },
        type: 'text',
        optional: true
      }]
    } : {}),
    success_url: `${origin}/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel_url || `${origin}/#catalog`
  }, idemKey ? { idempotencyKey: idemKey } : undefined);

  await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  return session;
}
