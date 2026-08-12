// api/checkout.js
//
// The browser sends only { sku, cases }. Every price is re-resolved here
// through dealer_case_price() so a dealer is charged exactly what their
// price sheet says, no matter what the page had cached.

import Stripe from 'stripe';
import { db, getDealer, freightFor, feeFor, MOQ_CENTS, FREE_FREIGHT_CENTS } from './_lib.js';

// Stripe is optional until the account is connected. Everything up to the
// payment page works without it, so the flow can be demonstrated and the
// order still lands in the database and the sales inbox.
const LIVE = Boolean(process.env.STRIPE_SECRET_KEY);
const stripe = LIVE ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dealer = await getDealer(req);
    if (!dealer) {
      return res.status(401).json({ error: 'Sign in with your dealer account to place an order.' });
    }

    const { items, payment_method = 'us_bank_account' } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your order is empty.' });
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
      return res.status(400).json({ error: `No longer available: ${missing.join(', ')}` });
    }

    // Prices come from the database, never from the request body.
    const priced = {};
    for (const sku of skus) {
      const { data, error } = await db.rpc('dealer_case_price', {
        p_dealer: dealer.id, p_sku: sku
      });
      if (error) throw error;
      if (data == null) return res.status(400).json({ error: `No price on file for ${sku}.` });
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
            description: `${sku} · case of ${v.case_pack}`,
            metadata: { sku, ...(color ? { color } : {}) }
          }
        }
      });
      rows.push({ sku, color: color || null, cases: qty, case_cents: unit, pieces: v.case_pack * qty });
    }

    const moq = dealer.moq_cents ?? MOQ_CENTS;
    if (subtotal < moq) {
      return res.status(400).json({
        error: `Your minimum order is $${(moq / 100).toFixed(2)}.`
      });
    }

    const freight = freightFor(subtotal);
    if (freight) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd', unit_amount: freight,
          product_data: { name: 'Ground freight' }
        }
      });
    }

    // Record the order before anyone leaves for Stripe. If they abandon the
    // payment page, a rep can still see what was in the cart and call them.
    const { data: order, error: oErr } = await db.from('orders').insert({
      dealer_id: dealer.id,
      subtotal_cents: subtotal,
      freight_cents: freight,
      status: 'pending',
      payment_method,
      customer_email: dealer.email,
      customer_name: dealer.business_name
    }).select('id, order_no').single();
    if (oErr) throw oErr;

    const { error: iErr } = await db.from('order_items')
      .insert(rows.map(r => ({ ...r, order_id: order.id })));
    if (iErr) throw iErr;

    // Net-30 dealers should not be paying by card at checkout. Send them an
    // invoice instead and leave the order open.
    if (dealer.terms !== 'prepay') {
      await db.from('orders').update({ status: 'processing' }).eq('id', order.id);
      return res.status(200).json({
        invoice: true,
        message: `Order received on ${dealer.terms.toUpperCase()} terms. An invoice is on its way to ${dealer.email}.`
      });
    }

    // Whatever the fee model does, it has to become a real Stripe line or the
    // dealer is charged a different number than the cart quoted.
    const { adjust, label } = feeFor(subtotal + freight, payment_method);
    if (adjust > 0) {
      line_items.push({ quantity: 1,
        price_data: { currency: 'usd', unit_amount: adjust, product_data: { name: label } } });
    }
    const discount = adjust < 0 ? -adjust : 0;

    const origin = req.headers.origin || `https://${req.headers.host}`;

    if (!LIVE) {
      await db.from('orders').update({ status: 'requested' }).eq('id', order.id);
      return res.status(200).json({
        url: `${origin}/checkout-preview.html?order=${order.order_no}`
             + `&total=${subtotal + freight}&method=${payment_method}`
      });
    }

    // ACH is 0.8% capped at $5. Card is 2.9% + 30c. On a $2,000 reorder that
    // is $5 versus $58, so ACH is offered first.
    const methods = payment_method === 'card' ? ['card'] : ['us_bank_account', 'card'];

    // A discount cannot be a negative line item, so it goes through a coupon.
    let discounts;
    if (discount) {
      const coupon = await stripe.coupons.create({
        amount_off: discount, currency: 'usd', duration: 'once', name: label
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: methods,
      line_items,
      ...(discounts ? { discounts } : {}),
      customer_email: dealer.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, dealer_id: dealer.id },
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      custom_fields: [{
        key: 'resale_cert',
        label: { type: 'custom', custom: 'Resale certificate / Tax ID' },
        type: 'text',
        optional: true
      }],
      success_url: `${origin}/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#catalog`
    }, { idempotencyKey: `order_${order.id}` });

    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('checkout failed:', err);
    return res.status(500).json({ error: 'Could not start checkout. Call 214-681-8417 and we will take the order.' });
  }
}
