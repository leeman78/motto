// api/stripe-webhook.js — Vercel serverless function
//
// The browser redirect after checkout is NOT proof of payment. A buyer can close
// the tab, and ACH settles days later. This webhook is the only thing that should
// ever flip an order to paid.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { invoiceForOrder } from './_invoice.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Signature verification needs the exact raw bytes Stripe sent.
// Vercel's JSON parser would rewrite them, so turn it off.
export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Raising the invoice must never fail the webhook. Stripe retries anything
// that does not return 200, which would re-run the order update as well; and
// the payment is real whether or not the paperwork went out. So this logs and
// swallows, and the invoice can be raised by hand from the admin if needed.
async function raise(orderId) {
  try {
    const inv = await invoiceForOrder(orderId);
    if (inv) console.log('invoice raised', inv.invoice_no, 'for order', orderId);
  } catch (e) {
    console.error('invoice failed for order', orderId, e);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await rawBody(req),
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('bad signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const orderId = event.data.object?.metadata?.order_id
    || event.data.object?.client_reference_id;

  try {
    switch (event.type) {

      // Card: paid immediately. ACH: session completes but money is still moving.
      case 'checkout.session.completed': {
        const s = event.data.object;
        const settled = s.payment_status === 'paid';
        await db.from('orders').update({
          status: settled ? 'paid' : 'processing',
          stripe_payment_intent: s.payment_intent,
          customer_email: s.customer_details?.email,
          customer_name: s.customer_details?.name,
          ship_to: s.shipping_details?.address ?? s.collected_information?.shipping_details?.address,
          resale_cert: s.custom_fields?.find(f => f.key === 'resale_cert')?.text?.value ?? null,
          total_cents: s.amount_total,
          paid_at: settled ? new Date().toISOString() : null
        }).eq('id', orderId);
        // Card settles here. ACH does not, and gets its invoice below when the
        // money actually clears.
        if (settled) await raise(orderId);
        break;
      }

      // ACH clearing, typically 3 to 5 business days after checkout.
      case 'checkout.session.async_payment_succeeded':
        await db.from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', orderId);
        await raise(orderId);
        break;

      case 'checkout.session.async_payment_failed':
        await db.from('orders')
          .update({ status: 'payment_failed' })
          .eq('id', orderId);
        break;

      case 'checkout.session.expired':
        await db.from('orders')
          .update({ status: 'abandoned' })
          .eq('id', orderId);
        break;

      case 'charge.refunded':
        await db.from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent', event.data.object.payment_intent);
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries. Do not swallow database failures here.
    console.error('webhook handling failed:', err);
    return res.status(500).json({ error: 'handler failed' });
  }

  return res.status(200).json({ received: true });
}
