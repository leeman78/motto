// api/_paylink.js — mail transport and the approve-and-pay email.
//
// Both the admin console and the rep portal send the same email: the full
// order table and one button. One builder, so the store sees one format no
// matter who wrote the order.

import { db } from './_lib.js';

// Sender is mottousa.com, verified in Resend (Aug 31, 2026). Whatever
// domain goes here must be verified there first, or every message silently
// fails to send.
export const FROM = process.env.LEAD_FROM_EMAIL || 'Motto Wholesale <info@mottousa.com>';

export async function sendMail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set, so no email can be sent.');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const usd = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });

/**
 * Email the store its order and the link to approve and pay it. The email
 * carries the full order table, so "what did I agree to" is answered in the
 * inbox, not just behind the link.
 *
 * Works for any unpaid order regardless of who placed it, so it also rescues
 * an abandoned dealer checkout. Throws with a safe message on any problem;
 * on success returns { sent_to, link } and stamps pay_link_sent_at.
 */
export async function sendPayLink(order_id, origin) {
  const { data: order, error: oErr } = await db
    .from('orders')
    .select(`id, order_no, status, subtotal_cents, freight_cents, pay_token,
             dealer_accounts ( business_name, email ),
             order_items ( sku, color, cases, case_cents, pieces )`)
    .eq('id', order_id).single();
  if (oErr || !order) { const e = new Error('No such order.'); e.status = 404; throw e; }
  if (['paid', 'shipped', 'refunded'].includes(order.status)) {
    const e = new Error(`Order #${order.order_no} is already ${order.status}.`); e.status = 400; throw e;
  }
  if (order.status === 'processing') {
    const e = new Error(`Payment for #${order.order_no} is already on its way — a new link could collect it twice.`);
    e.status = 400; throw e;
  }
  const to = order.dealer_accounts?.email;
  if (!to) { const e = new Error('This order has no email on file.'); e.status = 400; throw e; }

  const skus = [...new Set(order.order_items.map(i => i.sku))];
  const { data: variants } = await db
    .from('variants').select('sku, label, case_pack, products(name)').in('sku', skus);
  const bySku = Object.fromEntries((variants || []).map(v => [v.sku, v]));

  const link = `${origin}/pay.html?t=${order.pay_token}`;
  const total = order.subtotal_cents + order.freight_cents;

  const rowsHtml = order.order_items.map(it => {
    const v = bySku[it.sku];
    const name = v ? `${v.products.name} — ${v.label}` : it.sku;
    return `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #eee;font-size:13px">
        <b>${esc(name)}</b>${it.color ? ' — ' + esc(it.color) : ''}<br>
        <span style="color:#9a9da4;font-size:11px">${esc(it.sku)} · ${it.pieces} pcs</span></td>
      <td style="padding:9px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right">${it.cases} box${it.cases > 1 ? 'es' : ''}</td>
      <td style="padding:9px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right">${usd(it.case_cents * it.cases)}</td>
    </tr>`;
  }).join('');

  await sendMail({
    to,
    subject: `Your Motto order #${order.order_no} — ${usd(total)} · approve & pay`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:auto;color:#0b0b0d">
      <p style="font-size:15px">Hi ${esc(order.dealer_accounts.business_name)},</p>
      <p style="font-size:14px;line-height:1.6">Here is your order. Look it over, and if it
      is right, the button below takes you to a secure Stripe page to pay —
      no sign-in needed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${rowsHtml}
        <tr><td colspan="2" style="padding:9px 0 2px;font-size:13px">Subtotal</td>
            <td style="padding:9px 0 2px;font-size:13px;text-align:right">${usd(order.subtotal_cents)}</td></tr>
        <tr><td colspan="2" style="padding:2px 0;font-size:13px">Ground freight</td>
            <td style="padding:2px 0;font-size:13px;text-align:right">${order.freight_cents ? usd(order.freight_cents) : 'Free'}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;font-size:16px;font-weight:800">Total</td>
            <td style="padding:8px 0;font-size:16px;font-weight:800;text-align:right">${usd(total)}</td></tr>
      </table>
      <a href="${link}" style="display:block;background:#0b0b0d;color:#fff;text-align:center;
         padding:15px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none">
         Approve &amp; pay ${usd(total)}</a>
      <p style="font-size:12px;color:#9a9da4;line-height:1.6;margin-top:14px">
        Bank payment (ACH) or card — your choice on the next page. Approving a bank
        payment authorizes Motto USA to debit your account for this order.
        Something off? Reply to this email or call 214-681-8417 and we will fix
        the order before you pay.</p>
      <p style="font-size:12px;color:#9a9da4">Motto USA · Dallas, TX</p>
    </div>`
  });

  await db.from('orders').update({ pay_link_sent_at: new Date().toISOString() }).eq('id', order.id);

  return { sent_to: to, link };
}
