// api/pay.js — the pay link's server side.
//
// The store has no account here and needs none. The token in the emailed
// link is the whole authorization, and it authorizes exactly two things:
// seeing this one order, and paying it. Prices shown and charged are the
// ones frozen on the order when it was written — the store approves the
// number it was sent, not whatever the price sheet says today.

import Stripe from 'stripe';
import { db } from './_lib.js';
import { frozenLineItems, paySession } from './_order.js';

const LIVE = Boolean(process.env.STRIPE_SECRET_KEY);
const stripe = LIVE ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// States a pay button still makes sense in. 'processing' is deliberately
// absent: an ACH debit is already on its way, and a second tap would take
// the money twice.
const PAYABLE = new Set(['requested', 'pending', 'payment_failed', 'abandoned']);

async function orderByToken(token) {
  if (!token || !/^[0-9a-f-]{36}$/i.test(String(token))) return null;
  const { data, error } = await db
    .from('orders')
    .select(`id, order_no, status, payment_method, subtotal_cents, freight_cents,
             total_cents, created_at, paid_at, placed_by,
             dealer_accounts ( id, business_name, email, terms, stripe_customer_id ),
             order_items ( sku, color, cases, case_cents, pieces )`)
    .eq('pay_token', token)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, token } = req.body || {};

  try {
    const order = await orderByToken(token);
    if (!order) {
      // One message for "no such token" and "bad token": a guesser learns
      // nothing about which tokens exist.
      return res.status(404).json({ error: 'This link is not valid. Ask us to send a new one: 214-681-8417.' });
    }

    switch (action) {

      // -------------------------------------------------------------
      // The page loads: show the store what it is approving.
      // -------------------------------------------------------------
      case 'view': {
        const skus = [...new Set(order.order_items.map(i => i.sku))];
        const { data: variants } = await db
          .from('variants')
          .select('sku, label, case_pack, products(name)')
          .in('sku', skus);
        const bySku = Object.fromEntries((variants || []).map(v => [v.sku, v]));

        return res.status(200).json({
          order_no: order.order_no,
          status: order.status,
          payable: PAYABLE.has(order.status),
          business_name: order.dealer_accounts?.business_name || '',
          created_at: order.created_at,
          paid_at: order.paid_at,
          subtotal_cents: order.subtotal_cents,
          freight_cents: order.freight_cents,
          items: order.order_items.map(it => {
            const v = bySku[it.sku];
            return {
              sku: it.sku,
              name: v ? v.products.name : it.sku,
              label: v?.label || '',
              color: it.color,
              cases: it.cases,
              case_pack: v?.case_pack ?? null,
              case_cents: it.case_cents,
              pieces: it.pieces
            };
          })
        });
      }

      // -------------------------------------------------------------
      // The store taps Approve & pay.
      // -------------------------------------------------------------
      case 'pay': {
        if (order.status === 'paid' || order.status === 'shipped') {
          return res.status(400).json({ error: 'This order is already paid.' });
        }
        if (order.status === 'processing') {
          return res.status(400).json({
            error: 'Payment for this order is already on its way. ACH takes a few business days to clear.'
          });
        }
        if (!PAYABLE.has(order.status)) {
          return res.status(400).json({ error: `This order cannot be paid right now (${order.status}).` });
        }

        const dealer = order.dealer_accounts;
        if (!dealer) return res.status(400).json({ error: 'This order has no account attached. Call 214-681-8417.' });

        const payment_method = req.body.payment_method === 'card' ? 'card' : 'us_bank_account';
        const origin = req.headers.origin || `https://${req.headers.host}`;

        if (!LIVE) {
          return res.status(200).json({
            url: `${origin}/checkout-preview.html?order=${order.order_no}`
                 + `&total=${order.subtotal_cents + order.freight_cents}&method=${payment_method}`
          });
        }

        const line_items = await frozenLineItems(order.id);
        if (order.freight_cents) {
          line_items.push({
            quantity: 1,
            price_data: { currency: 'usd', unit_amount: order.freight_cents,
                          product_data: { name: 'Ground freight' } }
          });
        }

        await db.from('orders').update({ payment_method }).eq('id', order.id);

        const session = await paySession(stripe, {
          dealer, order, line_items,
          base: order.subtotal_cents + order.freight_cents,
          payment_method, origin,
          cancel_url: `${origin}/pay.html?t=${token}`
          // no idemKey on purpose: a link opened again after Stripe's 24-hour
          // session expiry must get a fresh session, not the dead one back
        });

        return res.status(200).json({ url: session.url });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('pay link failed:', err);
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Something went wrong. Call 214-681-8417 and we will take the payment.'
    });
  }
}
