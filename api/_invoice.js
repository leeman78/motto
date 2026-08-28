// api/_invoice.js
//
// Raising an invoice when an order is paid.
//
// Called from the Stripe webhook, from both places an order can become paid:
// a card settles at checkout, ACH settles days later. Putting it here rather
// than in the webhook means the two paths cannot drift apart.
//
// Two rules that matter more than they look:
//
//   One invoice per order. The webhook can deliver the same event twice, and
//   Stripe explicitly says to expect that. A duplicate invoice number is the
//   kind of thing an accountant finds in March and nobody can explain.
//
//   Lines are copied, not referenced. Reprinting a year-old invoice must show
//   what was actually charged, not what the price list says today.

import { db } from './_lib.js';

const FROM = process.env.LEAD_FROM_EMAIL || 'Motto Wholesale <info@mottob2b.com>';
const BOOKS = process.env.INVOICE_EMAIL || 'invoice@mottob2b.com';

const usd = c => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

async function sendMail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return { skipped: 'no RESEND_API_KEY' };
  const list = [...new Set(to.filter(Boolean))];
  if (!list.length) return { skipped: 'no recipients' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: list, subject, html })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return { sent: list };
}

/**
 * Raise the invoice for a paid order and email it.
 * Safe to call more than once: the second call finds the existing invoice and
 * does nothing.
 */
export async function invoiceForOrder(orderId) {
  if (!orderId) return null;

  const { data: existing } = await db
    .from('invoices').select('id, invoice_no').eq('order_id', orderId).maybeSingle();
  if (existing) return existing;                    // already raised

  const { data: order } = await db
    .from('orders')
    .select('id, order_no, dealer_id, rep_id, subtotal_cents, freight_cents, total_cents, ship_to, po_number:resale_cert, created_at, order_items(sku, cases, case_cents, pieces)')
    .eq('id', orderId).single();
  if (!order) return null;

  const { data: dealer } = await db
    .from('dealer_accounts')
    .select('business_name, contact_name, email, phone, terms')
    .eq('id', order.dealer_id).single();

  const rep = order.rep_id
    ? (await db.from('reps').select('name, email').eq('id', order.rep_id).single()).data
    : null;

  // Product names for the description column, so the invoice reads as goods
  // rather than as part numbers.
  const skus = (order.order_items || []).map(i => i.sku);
  const { data: vars } = skus.length
    ? await db.from('variants').select('sku, label, products(name)').in('sku', skus)
    : { data: [] };
  const named = Object.fromEntries((vars || []).map(v =>
    [v.sku, `${v.products?.name || v.sku}${v.label && v.label !== 'Single' ? ' · ' + v.label : ''}`]));

  // Net terms decide the due date. Prepay is already paid, so it is due now.
  const days = dealer?.terms === 'net30' ? 30 : dealer?.terms === 'net15' ? 15 : 0;
  const now = new Date();
  const due = new Date(now.getTime() + days * 864e5);

  const { data: inv, error } = await db.from('invoices').insert({
    order_id: order.id,
    dealer_id: order.dealer_id,
    rep_id: order.rep_id,
    // The order is paid, so the invoice is a record of a settled sale rather
    // than a request for money.
    status: 'paid',
    issued_at: now.toISOString(),
    due_at: due.toISOString(),
    terms: dealer?.terms || 'prepay',
    subtotal_cents: order.subtotal_cents,
    freight_cents: order.freight_cents || 0,
    total_cents: order.total_cents,
    paid_cents: order.total_cents,
    paid_at: now.toISOString(),
    bill_to: { name: dealer?.business_name, contact: dealer?.contact_name, email: dealer?.email, phone: dealer?.phone },
    ship_to: order.ship_to || null
  }).select('id, invoice_no').single();
  if (error) throw error;

  const rows = (order.order_items || []).map(i => ({
    invoice_id: inv.id,
    sku: i.sku,
    description: named[i.sku] || i.sku,
    boxes: i.cases,
    box_cents: i.case_cents,
    pieces: i.pieces,
    line_cents: i.cases * i.case_cents
  }));
  if (rows.length) await db.from('invoice_items').insert(rows);

  const body = `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:640px;color:#0b0b0d">
    <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8d94;margin:0 0 8px">
      Motto USA &middot; Wholesale</p>
    <h2 style="margin:0 0 4px;font-size:22px;letter-spacing:-.02em">Invoice ${inv.invoice_no}</h2>
    <p style="font-size:13px;color:#5f6268;margin:0 0 22px">
      Order #${order.order_no} &middot; ${now.toISOString().slice(0, 10)} &middot; Paid
      ${rep ? ` &middot; Rep: ${esc(rep.name)}` : ''}</p>

    <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
      <b>${esc(dealer?.business_name || '')}</b><br>
      ${esc(dealer?.contact_name || '')}${dealer?.contact_name ? '<br>' : ''}
      ${esc(dealer?.email || '')}</p>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px">
      <thead><tr>
        <th style="text-align:left;padding:0 8px 9px 0;border-bottom:1px solid #e7e7ea;font-size:10.5px;letter-spacing:.1em;color:#9a9da4">Item</th>
        <th style="text-align:right;padding:0 8px 9px;border-bottom:1px solid #e7e7ea;font-size:10.5px;letter-spacing:.1em;color:#9a9da4">Boxes</th>
        <th style="text-align:right;padding:0 8px 9px;border-bottom:1px solid #e7e7ea;font-size:10.5px;letter-spacing:.1em;color:#9a9da4">Per box</th>
        <th style="text-align:right;padding:0 0 9px 8px;border-bottom:1px solid #e7e7ea;font-size:10.5px;letter-spacing:.1em;color:#9a9da4">Amount</th>
      </tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td style="padding:11px 8px 11px 0;border-bottom:1px solid #f2f2f4">${esc(r.description)}<br>
          <span style="color:#9a9da4;font-size:11.5px">${esc(r.sku)} &middot; ${r.pieces} pcs</span></td>
        <td style="text-align:right;padding:11px 8px;border-bottom:1px solid #f2f2f4">${r.boxes}</td>
        <td style="text-align:right;padding:11px 8px;border-bottom:1px solid #f2f2f4">${usd(r.box_cents)}</td>
        <td style="text-align:right;padding:11px 0 11px 8px;border-bottom:1px solid #f2f2f4">${usd(r.line_cents)}</td>
      </tr>`).join('')}</tbody>
      <tfoot>
        <tr><td colspan="3" style="text-align:right;padding:12px 8px 4px 0;color:#5f6268">Subtotal</td>
            <td style="text-align:right;padding:12px 0 4px 8px">${usd(order.subtotal_cents)}</td></tr>
        <tr><td colspan="3" style="text-align:right;padding:2px 8px 4px 0;color:#5f6268">Freight</td>
            <td style="text-align:right;padding:2px 0 4px 8px">${usd(order.freight_cents)}</td></tr>
        <tr><td colspan="3" style="text-align:right;padding:10px 8px 0 0;font-weight:700;border-top:2px solid #0b0b0d">Total paid</td>
            <td style="text-align:right;padding:10px 0 0 8px;font-weight:700;border-top:2px solid #0b0b0d">${usd(order.total_cents)}</td></tr>
      </tfoot>
    </table>

    <p style="font-size:12px;color:#9a9da4;line-height:1.6;margin:26px 0 0">
      Motto USA LLC &middot; 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007<br>
      214-681-8417 &middot; info@mottousa.com</p>
  </div>`;

  // Books first, then the rep, then the customer. A failure to reach one
  // must not stop the others, and it must never undo the invoice: the
  // record exists whether or not the mail went out.
  const results = {};
  for (const [who, to, subject] of [
    ['books',    [BOOKS],          `Invoice ${inv.invoice_no} · ${dealer?.business_name || ''} · ${usd(order.total_cents)}`],
    ['rep',      [rep?.email],     `Invoice ${inv.invoice_no} · ${dealer?.business_name || ''}`],
    ['customer', [dealer?.email],  `Your Motto invoice ${inv.invoice_no}`]
  ]) {
    try { results[who] = await sendMail({ to, subject, html: body }); }
    catch (e) { results[who] = { failed: e.message }; console.error(`invoice mail to ${who} failed:`, e); }
  }

  return { ...inv, mail: results };
}
