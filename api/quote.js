// api/quote.js
//
// The cart when online payment is switched off. A signed-in dealer builds an
// order at their own pricing and submits it; the order is recorded and emailed
// to sales and to the dealer. Nothing is charged.
//
// Prices are re-resolved here, exactly as in checkout.js. A submitted order is
// a commitment, so it cannot be priced by whatever the browser happened to
// have cached.

import { db, getDealer, freightFor, MOQ_CENTS } from './_lib.js';

const NOTIFY_TO   = process.env.LEAD_NOTIFY_EMAIL || 'info@mottob2b.com';
const NOTIFY_FROM = process.env.LEAD_FROM_EMAIL   || 'Motto Wholesale <info@mottob2b.com>';

const usd = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));

const CODES = { black:'BLK', brown:'BRN', wine:'WIN', red:'RED', orange:'ORG',
                gold:'GLD', white:'WHT', navy:'NVY', pink:'PNK' };
const fullSku = (sku, color) =>
  color ? `${sku}-${CODES[color.toLowerCase()] || color.slice(0,3).toUpperCase()}` : sku;

async function mail({ to, subject, html, reply_to }) {
  if (!process.env.RESEND_API_KEY) return;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html, ...(reply_to ? { reply_to } : {}) })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

function table(rows, freight, subtotal) {
  return `
  <table style="border-collapse:collapse;width:100%;font-size:13px">
    <tr style="text-align:left;color:#8a8d94;font-size:11px;letter-spacing:.08em;text-transform:uppercase">
      <th style="padding:0 0 8px">Item</th><th style="padding:0 0 8px">SKU</th>
      <th style="padding:0 0 8px;text-align:right">Cases</th>
      <th style="padding:0 0 8px;text-align:right">Pieces</th>
      <th style="padding:0 0 8px;text-align:right">Total</th>
    </tr>
    ${rows.map(r => `
      <tr style="border-top:1px solid #eee">
        <td style="padding:9px 10px 9px 0">${esc(r.name)}${r.color ? ` — ${esc(r.color)}` : ''}<br>
          <span style="color:#9a9da4">${esc(r.label)}</span></td>
        <td style="padding:9px 10px 9px 0;font-family:monospace;color:#6e7077">${esc(r.display_sku)}</td>
        <td style="padding:9px 0;text-align:right">${r.cases}</td>
        <td style="padding:9px 0;text-align:right;color:#6e7077">${r.pieces}</td>
        <td style="padding:9px 0;text-align:right;font-weight:600">${usd(r.case_cents * r.cases)}</td>
      </tr>`).join('')}
    <tr style="border-top:1px solid #ddd">
      <td colspan="4" style="padding:11px 0 4px;text-align:right;color:#6e7077">Subtotal</td>
      <td style="padding:11px 0 4px;text-align:right">${usd(subtotal)}</td></tr>
    <tr><td colspan="4" style="padding:0 0 11px;text-align:right;color:#6e7077">Freight</td>
      <td style="padding:0 0 11px;text-align:right">${freight ? usd(freight) : 'Free'}</td></tr>
    <tr style="border-top:2px solid #0b0b0d">
      <td colspan="4" style="padding:11px 0;text-align:right;font-weight:700">Order total</td>
      <td style="padding:11px 0;text-align:right;font-weight:700;font-size:16px">${usd(subtotal + freight)}</td></tr>
  </table>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dealer = await getDealer(req);
    if (!dealer) return res.status(401).json({ error: 'Sign in with your dealer account to submit an order.' });

    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your order is empty.' });

    const skus = [...new Set(items.map(i => String(i.sku)))];
    const { data: variants, error: vErr } = await db
      .from('variants')
      .select('sku, label, case_pack, is_active, stock_status, products(name)')
      .in('sku', skus).eq('is_active', true);
    if (vErr) throw vErr;

    const bySku = Object.fromEntries(variants.map(v => [v.sku, v]));
    const missing = skus.filter(s => !bySku[s]);
    if (missing.length) return res.status(400).json({ error: `No longer available: ${missing.join(', ')}` });

    const priced = {};
    for (const sku of skus) {
      const { data, error } = await db.rpc('dealer_case_price', { p_dealer: dealer.id, p_sku: sku });
      if (error) throw error;
      if (data == null) return res.status(400).json({ error: `No price on file for ${sku}.` });
      priced[sku] = data;
    }

    let subtotal = 0;
    const rows = items.map(({ sku, color, cases }) => {
      const qty = Math.max(1, Math.min(9999, parseInt(cases, 10) || 0));
      const v = bySku[sku], unit = priced[sku];
      subtotal += unit * qty;
      return {
        sku, color: color || null, display_sku: fullSku(sku, color),
        name: v.products.name, label: v.label,
        cases: qty, pieces: v.case_pack * qty, case_cents: unit,
        stock: v.stock_status
      };
    });

    const moq = dealer.moq_cents ?? MOQ_CENTS;
    if (subtotal < moq) {
      return res.status(400).json({ error: `Your minimum order is ${usd(moq)}.` });
    }
    const freight = freightFor(subtotal);

    const { data: order, error: oErr } = await db.from('orders').insert({
      dealer_id: dealer.id,
      subtotal_cents: subtotal,
      freight_cents: freight,
      total_cents: subtotal + freight,
      status: 'requested',
      payment_method: 'invoice',
      customer_email: dealer.email,
      customer_name: dealer.business_name
    }).select('id, order_no').single();
    if (oErr) throw oErr;

    const { error: iErr } = await db.from('order_items').insert(
      rows.map(r => ({
        order_id: order.id, sku: r.sku, color: r.color,
        cases: r.cases, case_cents: r.case_cents, pieces: r.pieces
      })));
    if (iErr) throw iErr;

    const flagged = rows.filter(r => r.stock !== 'in_stock');
    const head = `<p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8d94;margin:0 0 8px">
      Motto USA · Wholesale</p>`;

    const salesHtml = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:640px;color:#0b0b0d">
        ${head}
        <h2 style="margin:0 0 4px;font-size:22px">Order #${order.order_no} — ${esc(dealer.business_name)}</h2>
        <p style="margin:0 0 20px;color:#6e7077;font-size:13px">
          ${esc(dealer.contact_name || '')} · ${esc(dealer.email)} ${dealer.phone ? '· ' + esc(dealer.phone) : ''}
          · Terms ${esc(dealer.terms).toUpperCase()}</p>
        ${flagged.length ? `<p style="background:#fff4e0;color:#8a5a00;border-radius:10px;padding:11px 14px;font-size:13px;margin:0 0 18px">
          Check stock before confirming: ${flagged.map(f => esc(f.display_sku)).join(', ')}</p>` : ''}
        ${table(rows, freight, subtotal)}
        <p style="font-size:13px;color:#6e7077;margin:20px 0 0">Not charged. Confirm with the dealer and invoice as usual.</p>
      </div>`;

    const dealerHtml = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:640px;color:#0b0b0d">
        ${head}
        <h2 style="margin:0 0 14px;font-size:22px">Order #${order.order_no} received.</h2>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
          Thanks. A rep will confirm stock and totals, usually within a few hours, and invoice you from there.
          Nothing has been charged yet.</p>
        ${table(rows, freight, subtotal)}
        <p style="font-size:13px;line-height:1.6;color:#6e7077;margin:22px 0 0">
          Questions? Call <a href="tel:2146818417" style="color:#1268ff">214-681-8417</a>, Mon–Fri 9–5 Central.<br>
          Motto USA · 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007</p>
      </div>`;

    // The order is already recorded. Email failures are logged, not surfaced —
    // telling a dealer their order failed when it did not is the worse error.
    const sent = await Promise.allSettled([
      mail({ to: NOTIFY_TO, subject: `Order #${order.order_no} — ${dealer.business_name}`, html: salesHtml, reply_to: dealer.email }),
      mail({ to: dealer.email, subject: `Order #${order.order_no} received — Motto USA`, html: dealerHtml })
    ]);
    sent.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`${i ? 'dealer' : 'sales'} order email failed:`, r.reason?.message);
    });

    return res.status(200).json({
      ok: true,
      order_no: order.order_no,
      message: `Order #${order.order_no} is with our sales team. A confirmation is on its way to ${dealer.email}.`
    });

  } catch (err) {
    console.error('quote failed:', err);
    return res.status(500).json({ error: 'Could not submit. Call 214-681-8417 and we will take the order.' });
  }
}
