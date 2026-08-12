// api/lead.js
//
// Wholesale inquiries land here. Two things happen: the lead is written to
// Supabase so nothing is ever lost, and a notification goes to the sales
// inbox. The write comes first — if the email provider is down, you still
// have the lead.

import { db } from './_lib.js';

const NOTIFY_TO   = process.env.LEAD_NOTIFY_EMAIL || 'info@mottob2b.com';
const NOTIFY_FROM = process.env.LEAD_FROM_EMAIL   || 'Motto Wholesale <info@mottob2b.com>';

const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));

async function send({ to, subject, html, reply_to }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html, ...(reply_to ? { reply_to } : {}) })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

/** Confirmation to the person who filled the form. */
async function acknowledge(lead) {
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;color:#0b0b0d">
      <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8d94;margin:0 0 10px">
        Motto USA · Wholesale</p>
      <h2 style="margin:0 0 16px;font-size:21px;letter-spacing:-.02em">Thanks — we have your inquiry.</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">
        Hi${lead.contact_name ? ' ' + esc(lead.contact_name.split(' ')[0]) : ''}, a rep will follow up within one
        business day with pricing, minimums and a suggested opening order for ${esc(lead.business_name)}.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 22px">
        If it is easier to talk it through now, call
        <a href="tel:2146818417" style="color:#1268ff">214-681-8417</a>, Monday to Friday, 9 to 5 Central.
      </p>
      <div style="background:#f5f5f7;border-radius:14px;padding:16px 18px;font-size:13px;line-height:1.6;color:#5f6268">
        <b style="color:#0b0b0d">What you sent us</b><br>
        ${[['Business', lead.business_name], ['Type', lead.business_type], ['Phone', lead.phone], ['Message', lead.message]]
          .filter(([, v]) => v).map(([k, v]) => `${k}: ${esc(v)}`).join('<br>')}
      </div>
      <p style="font-size:12px;color:#9a9da4;line-height:1.6;margin:22px 0 0">
        Motto USA · 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007<br>
        Supplying convenience retail since 2016.
      </p>
    </div>`;
  return send({ to: lead.email, subject: 'We have your wholesale inquiry — Motto USA', html });
}

async function notify(lead) {
  if (!process.env.RESEND_API_KEY) return { skipped: 'no RESEND_API_KEY' };

  const rows = [
    ['Business',  lead.business_name],
    ['Contact',   lead.contact_name],
    ['Email',     lead.email],
    ['Phone',     lead.phone],
    ['Type',      lead.business_type],
    ['Message',   lead.message]
  ].filter(([, v]) => v);

  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px">
      <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8a8d94;margin:0 0 6px">
        New wholesale inquiry</p>
      <h2 style="margin:0 0 18px;font-size:22px">${esc(lead.business_name)}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:9px 14px 9px 0;color:#6e7077;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee">${k}</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee">${esc(v)}</td>
          </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0;font-size:13px">
        <a href="mailto:${esc(lead.email)}">Reply to ${esc(lead.contact_name || lead.business_name)}</a>
      </p>
    </div>`;

  return send({
    to: NOTIFY_TO,
    reply_to: lead.email,            // hitting reply goes straight to the buyer
    subject: `Wholesale inquiry — ${lead.business_name}`,
    html
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { business_name, contact_name, email, phone, business_type, message, website } = req.body || {};

    // Honeypot. A real person never fills a field they cannot see.
    if (website) return res.status(200).json({ ok: true });

    if (!business_name || !email) {
      return res.status(400).json({ error: 'Business name and email are required.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'That email address does not look right.' });
    }

    const clip = (s, n) => (s || '').toString().slice(0, n);
    const lead = {
      business_name: clip(business_name, 200),
      contact_name:  clip(contact_name, 120),
      email:         clip(email, 200),
      phone:         clip(phone, 40),
      business_type: clip(business_type, 60),
      message:       clip(message, 2000),
      status: 'new'
    };

    const { error } = await db.from('leads').insert(lead);
    if (error) throw error;

    // The lead is already safe. A failed email must not tell the buyer their
    // message was lost — it wasn't. Sent in parallel so one slow send does not
    // stack on the other and push the whole request past the function timeout.
    if (process.env.RESEND_API_KEY) {
      const results = await Promise.allSettled([notify(lead), acknowledge(lead)]);
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`${i ? 'acknowledgement' : 'notification'} failed:`, r.reason?.message);
        }
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead failed:', err);
    return res.status(500).json({ error: 'Could not send. Call 214-681-8417 or email info@mottob2b.com.' });
  }
}
