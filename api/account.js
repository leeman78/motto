// api/account.js
//
// The dealer's own account. A dealer can change their password through
// Supabase directly, but the "must change" flag lives on a row they are not
// allowed to write, so clearing it goes through here with their own token.

import { db, getDealer } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dealer = await getDealer(req);
    if (!dealer) return res.status(401).json({ error: 'Not signed in.' });

    const { action } = req.body || {};

    if (action === 'password_changed') {
      const { error } = await db.from('dealer_accounts').update({
        must_change_password: false,
        password_changed_at: new Date().toISOString()
      }).eq('id', dealer.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('account action failed:', err);
    return res.status(500).json({ error: 'That did not save. Call 214-681-8417.' });
  }
}
