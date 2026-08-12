// api/lead.js
//
// Wholesale inquiries land here. Done server side rather than writing straight
// from the browser so the anon key never needs insert rights on the table, and
// so a rep can be notified without exposing anything.

import { db } from './_lib.js';

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

    const { error } = await db.from('leads').insert({
      business_name: clip(business_name, 200),
      contact_name:  clip(contact_name, 120),
      email:         clip(email, 200),
      phone:         clip(phone, 40),
      business_type: clip(business_type, 60),
      message:       clip(message, 2000),
      status: 'new'
    });
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead failed:', err);
    return res.status(500).json({ error: 'Could not send. Call 214-681-8417 and we will take it by phone.' });
  }
}
