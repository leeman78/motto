// api/checkout.js
//
// The browser sends only { sku, cases }. Every price is re-resolved here
// through dealer_case_price() so a dealer is charged exactly what their
// price sheet says, no matter what the page had cached.

import Stripe from 'stripe';
import { db, getDealer } from './_lib.js';
import { priceOrder, paySession } from './_order.js';

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

    // Pricing, availability and freight all live in _order.js now, shared
    // with the admin console and the pay link so the three can never drift.
    let subtotal, freight, line_items, rows, moq;
    try {
      ({ subtotal, freight, line_items, rows, moq } = await priceOrder(dealer, items));
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      throw e;
    }

    if (subtotal < moq) {
      return res.status(400).json({
        error: `Your minimum order is $${(moq / 100).toFixed(2)}.`
      });
    }

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

    const origin = req.headers.origin || `https://${req.headers.host}`;

    // Stripe not connected yet: park the order and show the preview page, so
    // the whole flow can be demonstrated before the account exists.
    if (!LIVE) {
      await db.from('orders').update({ status: 'requested' }).eq('id', order.id);
      return res.status(200).json({
        url: `${origin}/checkout-preview.html?order=${order.order_no}`
             + `&total=${subtotal + freight}&method=${payment_method}`
      });
    }

    const session = await paySession(stripe, {
      dealer, order, line_items,
      base: subtotal + freight,
      payment_method, origin,
      idemKey: `order_${order.id}`
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('checkout failed:', err);
    return res.status(500).json({ error: 'Could not start checkout. Call 214-681-8417 and we will take the order.' });
  }
}
