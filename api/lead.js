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

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      reply_to: lead.email,          // hitting reply goes straight to the buyer
      subject: `Wholesale inquiry — ${lead.business_name}`,
      html
    })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
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

    // The lead is already safe. A failed notification must not tell the buyer
    // their message was lost — it wasn't.
    try { await notify(lead); }
    catch (e) { console.error('lead notification failed:', e.message); }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead failed:', err);
    return res.status(500).json({ error: 'Could not send. Call 214-681-8417 or email info@mottob2b.com.' });
  }
}
