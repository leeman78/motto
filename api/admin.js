// api/admin.js
//
// One endpoint, several actions, all gated by the ADMIN_TOKEN header.
// This is where a closed deal becomes a working dealer account:
//
//   create_dealer   → makes the Supabase auth user, returns a temp password
//   list_dealers    → roster for the admin screen
//   price_sheet     → that dealer's resolved prices, override flags included
//   set_price       → manual per-SKU override
//   clear_price     → drop the override, fall back to the discount
//   update_dealer   → discount, terms, MOQ, approval, notes
//   send_magic_link → emails a passwordless sign-in link
//   list_orders     → recent orders

import { db, checkAdmin, tempPassword } from './_lib.js';

// Sender stays on the Resend-verified mottob2b.com domain.
const FROM = process.env.LEAD_FROM_EMAIL || 'Motto Wholesale <info@mottob2b.com>';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));

async function sendMail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set, so no email can be sent.');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html })
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const gate = await checkAdmin(req);
  if (!gate.ok) {
    return res.status(gate.locked ? 429 : 401).json({
      error: gate.locked
        ? `Too many wrong codes. Try again in about ${gate.minutes} minutes.`
        : 'That code was not accepted.'
    });
  }

  const { action, ...p } = req.body || {};

  try {
    switch (action) {

      // ---------------------------------------------------------------
      // ---------------------------------------------------------------
      // Reps. A rep signs in the same way a dealer does, so the sign-in,
      // forced first password change and reset all work unchanged. That
      // shared machinery is also what makes per-rep scoping possible: one
      // shared admin password cannot tell two people apart.
      case 'create_rep': {
        const { name, email, phone = '', commission_pct = 0, notes = '' } = p;
        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required.' });
        }
        // A caller may set the first password, because handing it over on the
        // phone is how this actually happens. Supabase rejects anything under
        // six characters, so say so here rather than surfacing its error.
        const password = p.password ? String(p.password) : tempPassword();
        if (password.length < 6) {
          return res.status(400).json({ error: 'A password must be at least 6 characters.' });
        }

        const { data: user, error: authErr } = await db.auth.admin.createUser({
          email, password,
          email_confirm: true,
          user_metadata: { rep_name: name }
        });
        if (authErr) {
          if (/already|exists|registered/i.test(authErr.message)) {
            return res.status(409).json({ error: 'That email already has an account.' });
          }
          throw authErr;
        }

        const { error: rowErr } = await db.from('reps').insert({
          id: user.user.id,
          name, email, phone, commission_pct, notes,
          must_change_password: true
        });
        if (rowErr) {
          await db.auth.admin.deleteUser(user.user.id);   // no orphan auth user
          throw rowErr;
        }
        return res.status(200).json({ ok: true, id: user.user.id, email, password });
      }

      case 'list_reps': {
        const { data, error } = await db
          .from('reps')
          .select('id, name, email, phone, commission_pct, is_active, must_change_password, created_at')
          .order('name');
        if (error) throw error;

        // Book size per rep, so the list is worth reading on its own.
        const { data: counts } = await db.from('dealer_accounts').select('rep_id');
        const per = {};
        (counts || []).forEach(d => { if (d.rep_id) per[d.rep_id] = (per[d.rep_id] || 0) + 1; });

        return res.status(200).json({
          items: (data || []).map(r => ({ ...r, dealers: per[r.id] || 0 }))
        });
      }

      case 'set_rep': {
        const { id } = p;
        if (!id) return res.status(400).json({ error: 'id is required.' });
        const patch = {};
        if ('name' in p)           patch.name = String(p.name || '').trim();
        if ('email' in p)          patch.email = String(p.email || '').trim();
        if ('phone' in p)          patch.phone = String(p.phone || '').trim();
        if ('notes' in p)          patch.notes = String(p.notes || '');
        if ('is_active' in p)      patch.is_active = !!p.is_active;
        if ('commission_pct' in p) {
          const n = Number(p.commission_pct);
          if (!isFinite(n) || n < 0 || n > 100) {
            return res.status(400).json({ error: 'Commission must be between 0 and 100.' });
          }
          patch.commission_pct = n;
        }
        if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });
        const { error } = await db.from('reps').update(patch).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'reset_rep_password': {
        // Same shape as reset_password for dealers. Either a chosen password,
        // because it is usually being read out on the phone, or a generated
        // one. Six characters is Supabase's floor, and saying so here beats
        // surfacing its error.
        const { id } = p;
        if (!id) return res.status(400).json({ error: 'id is required.' });
        const password = p.password ? String(p.password) : tempPassword();
        if (password.length < 6) {
          return res.status(400).json({ error: 'A password must be at least 6 characters.' });
        }
        const { error } = await db.auth.admin.updateUserById(id, { password });
        if (error) throw error;
        // Spoken aloud means temporary, so it has to be replaced on next use.
        await db.from('reps').update({ must_change_password: true }).eq('id', id);
        return res.status(200).json({ ok: true, password });
      }

      case 'send_rep_link': {
        // Passwordless way back in when a rep has locked themselves out.
        // generateLink builds it; sending is ours, so it arrives from Motto.
        const { data: rep } = await db.from('reps').select('name, email').eq('id', p.id).single();
        if (!rep) return res.status(404).json({ error: 'No such rep.' });

        const origin = req.headers.origin || `https://${req.headers.host}`;
        const { data, error } = await db.auth.admin.generateLink({
          type: 'magiclink', email: rep.email,
          options: { redirectTo: origin + '/rep.html' }
        });
        if (error) throw error;
        const link = data?.properties?.action_link;
        if (!link) throw new Error('Supabase did not return a link.');

        await sendMail({
          to: rep.email,
          subject: 'Your Motto rep portal sign-in link',
          html: `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;color:#0b0b0d">
            <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8d94;margin:0 0 10px">
              Motto USA · Wholesale</p>
            <h2 style="margin:0 0 14px;font-size:21px;letter-spacing:-.02em">Sign in to the rep portal</h2>
            <p style="font-size:15px;line-height:1.6;margin:0 0 22px">
              Hi ${esc(rep.name)}, tap the button to open your accounts and margins. No password needed.</p>
            <p style="margin:0 0 22px">
              <a href="${link}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                 padding:14px 26px;border-radius:999px;font-weight:700;font-size:14px">Open the rep portal</a></p>
            <p style="font-size:12.5px;line-height:1.6;color:#8a8d94;margin:0 0 18px">
              This link works once and expires in 24 hours. If you did not ask for it, ignore this email.</p>
            <p style="font-size:12px;color:#9a9da4;line-height:1.6;margin:0">
              Motto USA · 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007<br>
              214-681-8417 · Mon–Fri 9–5 Central</p>
          </div>`
        });
        return res.status(200).json({ ok: true, sent_to: rep.email });
      }

      // ---------------------------------------------------------------
      // Deleting. Only the admin token reaches this file at all, so these are
      // owner-only by construction; there is no rep path to them.
      //
      // Neither delete touches orders or invoices. A sold order and a raised
      // invoice are records of things that happened, and an accountant asking
      // why invoice 41 is missing is a worse problem than a stale name.
      case 'delete_rep': {
        const { id } = p;
        if (!id) return res.status(400).json({ error: 'id is required.' });

        const { data: rep } = await db.from('reps').select('name').eq('id', id).single();
        if (!rep) return res.status(404).json({ error: 'No such rep.' });

        // Typing the name is the confirmation. A dialog is too easy to click
        // through when the row above is the one you meant.
        if (String(p.confirm || '').trim() !== rep.name) {
          return res.status(400).json({ error: `Type the rep's name exactly (${rep.name}) to confirm.` });
        }

        const { count } = await db.from('dealer_accounts')
          .select('id', { count: 'exact', head: true }).eq('rep_id', id);
        if (count) {
          return res.status(409).json({
            error: `${rep.name} still covers ${count} account${count > 1 ? 's' : ''}. Move them to another rep first, or the accounts end up with nobody watching them.`
          });
        }

        // dealer_accounts.rep_id and orders.rep_id are ON DELETE SET NULL, so
        // past orders keep their totals and lose only the pointer.
        await db.from('reps').delete().eq('id', id);
        await db.auth.admin.deleteUser(id);          // the sign-in goes too
        return res.status(200).json({ ok: true, deleted: rep.name });
      }

      case 'delete_dealer': {
        const { id } = p;
        if (!id) return res.status(400).json({ error: 'id is required.' });

        const { data: d } = await db.from('dealer_accounts')
          .select('business_name').eq('id', id).single();
        if (!d) return res.status(404).json({ error: 'No such account.' });

        if (String(p.confirm || '').trim() !== d.business_name) {
          return res.status(400).json({ error: `Type the business name exactly (${d.business_name}) to confirm.` });
        }

        const { count } = await db.from('orders')
          .select('id', { count: 'exact', head: true }).eq('dealer_id', id);
        if (count && !p.force) {
          return res.status(409).json({
            error: `${d.business_name} has ${count} order${count > 1 ? 's' : ''} on file. Deleting the account keeps those orders but detaches them from a name. Send force to go ahead.`,
            orders: count
          });
        }

        // dealer_prices cascades. orders.dealer_id is a plain reference, so
        // clear it first rather than letting the delete fail on it.
        await db.from('orders').update({ dealer_id: null }).eq('dealer_id', id);
        await db.from('dealer_accounts').delete().eq('id', id);
        await db.auth.admin.deleteUser(id);
        return res.status(200).json({ ok: true, deleted: d.business_name });
      }

      case 'assign_dealer': {
        // Reassigning changes who owns the relationship from now on. Past
        // orders keep the rep_id they were stamped with, so commission
        // already earned does not move.
        const { dealer_id, rep_id } = p;
        if (!dealer_id) return res.status(400).json({ error: 'dealer_id is required.' });
        const { error } = await db.from('dealer_accounts')
          .update({ rep_id: rep_id || null }).eq('id', dealer_id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'create_dealer': {
        const { email, business_name, contact_name, phone,
                discount_pct = 0, terms = 'prepay', notes = '' } = p;
        if (!email || !business_name) {
          return res.status(400).json({ error: 'Email and business name are required.' });
        }

        const password = tempPassword();

        const { data: user, error: authErr } = await db.auth.admin.createUser({
          email,
          password,
          email_confirm: true,               // rep verified them on the phone
          user_metadata: { business_name }
        });
        if (authErr) {
          if (/already|exists|registered/i.test(authErr.message)) {
            return res.status(409).json({ error: 'That email already has an account.' });
          }
          throw authErr;
        }

        const { error: rowErr } = await db.from('dealer_accounts').insert({
          id: user.user.id,
          business_name, contact_name, phone, email,
          discount_pct, terms, notes,
          must_change_password: true,
          approved_at: new Date().toISOString()
        });
        if (rowErr) {
          // Don't leave an orphan auth user behind if the row fails.
          await db.auth.admin.deleteUser(user.user.id);
          throw rowErr;
        }

        // The password is returned exactly once. It is not stored anywhere
        // readable — Supabase keeps only a hash.
        return res.status(200).json({
          dealer_id: user.user.id,
          email,
          password,
          message: 'Read this password to the dealer once, then close this box.'
        });
      }

      // ---------------------------------------------------------------
      case 'list_dealers': {
        const { data, error } = await db
          .from('dealer_accounts')
          .select('id, business_name, contact_name, email, phone, discount_pct, terms, approved_at, created_at, must_change_password, password_changed_at, rep_id')
          .order('created_at', { ascending: false });
        if (error) throw error;

        // Attach override counts so you can see at a glance who is bespoke.
        const { data: counts } = await db.from('dealer_prices').select('dealer_id');
        const tally = {};
        (counts || []).forEach(r => { tally[r.dealer_id] = (tally[r.dealer_id] || 0) + 1; });

        return res.status(200).json({
          dealers: data.map(d => ({ ...d, override_count: tally[d.id] || 0 }))
        });
      }

      // ---------------------------------------------------------------
      case 'price_sheet': {
        if (!p.dealer_id) return res.status(400).json({ error: 'dealer_id required.' });
        const { data, error } = await db.rpc('dealer_price_sheet', { p_dealer: p.dealer_id });
        if (error) throw error;
        const { data: dealer } = await db
          .from('dealer_accounts').select('*').eq('id', p.dealer_id).single();
        return res.status(200).json({ dealer, rows: data });
      }

      // ---------------------------------------------------------------
      case 'set_price': {
        const { dealer_id, sku, case_cents, note = null } = p;
        const cents = parseInt(case_cents, 10);
        if (!dealer_id || !sku || !Number.isInteger(cents) || cents < 0) {
          return res.status(400).json({ error: 'dealer_id, sku and a whole-cent price are required.' });
        }
        const { error } = await db.from('dealer_prices').upsert({
          dealer_id, sku, case_cents: cents, note, updated_at: new Date().toISOString()
        }, { onConflict: 'dealer_id,sku' });
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'clear_price': {
        const { dealer_id, sku } = p;
        const { error } = await db.from('dealer_prices')
          .delete().eq('dealer_id', dealer_id).eq('sku', sku);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // ---------------------------------------------------------------
      case 'update_dealer': {
        const { dealer_id, ...fields } = p;
        const allowed = ['business_name','contact_name','phone','discount_pct',
                         'terms','moq_cents','notes','approved_at'];
        const patch = {};
        for (const k of allowed) if (k in fields) patch[k] = fields[k];
        if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });

        const { error } = await db.from('dealer_accounts').update(patch).eq('id', dealer_id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // ---------------------------------------------------------------
      case 'reset_password': {
        const password = tempPassword();
        const { error } = await db.auth.admin.updateUserById(p.dealer_id, { password });
        if (error) throw error;
        // A password a rep has read out loud is temporary by definition.
        await db.from('dealer_accounts')
          .update({ must_change_password: true }).eq('id', p.dealer_id);
        return res.status(200).json({ password });
      }

      case 'send_magic_link': {
        // generateLink builds the link but does NOT deliver it — the admin API
        // never sends mail. Sending is on us, which is fine: it means the email
        // comes from the Motto domain and looks like the rest of the brand.
        const origin = req.headers.origin || `https://${req.headers.host}`;
        const { data, error } = await db.auth.admin.generateLink({
          type: 'magiclink',
          email: p.email,
          options: { redirectTo: origin + '/#catalog' }
        });
        if (error) throw error;

        const link = data?.properties?.action_link;
        if (!link) throw new Error('Supabase did not return a link.');

        const dealerName = p.business_name ? esc(p.business_name) : 'there';
        await sendMail({
          to: p.email,
          subject: 'Your Motto Wholesale sign-in link',
          html: `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;color:#0b0b0d">
            <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8d94;margin:0 0 10px">
              Motto USA · Wholesale</p>
            <h2 style="margin:0 0 14px;font-size:21px;letter-spacing:-.02em">Sign in to your account</h2>
            <p style="font-size:15px;line-height:1.6;margin:0 0 22px">
              Hi ${dealerName}, tap the button to open your Motto wholesale catalog with your
              account pricing. No password needed.</p>
            <p style="margin:0 0 22px">
              <a href="${link}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                 padding:14px 26px;border-radius:999px;font-weight:700;font-size:14px">Open my catalog</a></p>
            <p style="font-size:12.5px;line-height:1.6;color:#8a8d94;margin:0 0 18px">
              This link works once and expires in 24 hours. If you did not ask for it, ignore this email.</p>
            <p style="font-size:12px;color:#9a9da4;line-height:1.6;margin:0">
              Motto USA · 1445 Mac Arthur Dr Ste 116, Carrollton, TX 75007<br>
              214-681-8417 · Mon–Fri 9–5 Central</p>
          </div>`
        });

        return res.status(200).json({ ok: true, sent_to: p.email });
      }

      // ---------------------------------------------------------------
      // List prices. These are the numbers every dealer discount is derived
      // from, so they are edited in one place and nowhere else.
      case 'list_products': {
        const { data, error } = await db
          .from('variants')
          .select('sku, label, case_pack, master_carton, cost_cents, list_cents, retail_cents, msrp_cents, upc, is_active, sort_order, products(name, sort_order)')
          .order('sku');
        if (error) throw error;
        data.sort((a, b) =>
          (a.products?.sort_order ?? 0) - (b.products?.sort_order ?? 0) || a.sort_order - b.sort_order);
        return res.status(200).json({ items: data });
      }

      case 'set_sku': {
        // Renaming a SKU is not the same as editing a field on it. The part
        // number is what a store owner reads off the display label before
        // reordering, and dealer_prices points at it, so the rename is
        // validated hard and the referencing rows move with it. That last
        // part is handled by ON UPDATE CASCADE on the foreign key, added in
        // supabase/07_real_skus.sql; without it this update is rejected.
        const from = String(p.sku || '').trim();
        const to   = String(p.new_sku || '').trim().toUpperCase();

        if (!from) return res.status(400).json({ error: 'sku is required.' });
        if (!to)   return res.status(400).json({ error: 'The new SKU cannot be empty.' });
        if (to === from) return res.status(200).json({ ok: true, unchanged: true });
        if (to.length > 40) {
          return res.status(400).json({ error: 'A SKU must be 40 characters or fewer.' });
        }
        if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(to)) {
          return res.status(400).json({
            error: 'A SKU may use letters, numbers, dot, dash and underscore, and must start with a letter or number.'
          });
        }

        const { data: exists } = await db
          .from('variants').select('sku').eq('sku', to).maybeSingle();
        if (exists) {
          return res.status(409).json({ error: `${to} is already used by another SKU.` });
        }

        const { data: row } = await db
          .from('variants').select('sku').eq('sku', from).maybeSingle();
        if (!row) return res.status(404).json({ error: `${from} was not found.` });

        const { error } = await db.from('variants').update({ sku: to }).eq('sku', from);
        if (error) throw error;

        const { count } = await db.from('dealer_prices')
          .select('id', { count: 'exact', head: true }).eq('sku', to);

        return res.status(200).json({ ok: true, from, to, moved: count || 0 });
      }

      case 'set_list_price': {
        const { sku } = p;
        const patch = {};
        for (const k of ['cost_cents','list_cents','retail_cents','msrp_cents','case_pack','master_carton']) {
          if (k in p) {
            const n = parseInt(p[k], 10);
            if (!Number.isInteger(n) || n < 0) {
              return res.status(400).json({ error: `${k} must be a whole number.` });
            }
            patch[k] = n;
          }
        }
        if ('upc' in p) patch.upc = (p.upc || '').trim() || null;
        if (!sku || !Object.keys(patch).length) {
          return res.status(400).json({ error: 'sku and at least one field are required.' });
        }
        const { error } = await db.from('variants').update(patch).eq('sku', sku);
        if (error) throw error;

        // Tell the caller how many dealers are pinned to a manual price on this
        // SKU, since those will NOT move with the list change.
        const { count } = await db.from('dealer_prices')
          .select('id', { count: 'exact', head: true }).eq('sku', sku);
        return res.status(200).json({ ok: true, pinned: count || 0 });
      }

      // ---------------------------------------------------------------
      case 'set_compliance': {
        const { slug, compliance } = p;
        const allowed = ['FCC', 'RoHS', 'CE'];
        if (!slug || !Array.isArray(compliance)) {
          return res.status(400).json({ error: 'slug and a compliance array are required.' });
        }
        const clean = compliance.filter(x => allowed.includes(x));
        const { error } = await db.from('products').update({ compliance: clean }).eq('slug', slug);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'list_compliance': {
        const { data, error } = await db
          .from('products').select('slug, name, compliance, sort_order').order('sort_order');
        if (error) throw error;
        return res.status(200).json({ items: data });
      }

      // ---------------------------------------------------------------
      case 'list_detail': {
        const { data, error } = await db
          .from('products')
          .select('slug, name, description, description_long, features, compatibility, weight_oz, sort_order')
          .order('sort_order');
        if (error) throw error;
        return res.status(200).json({ items: data });
      }

      case 'set_detail': {
        const { slug } = p;
        if (!slug) return res.status(400).json({ error: 'slug is required.' });

        // Every field here is optional and an empty one is meaningful: it
        // means the retail listing had no such block, and the product page
        // then leaves that block out rather than showing a made-up one.
        const patch = {};
        if ('description'      in p) patch.description      = String(p.description || '').trim() || null;
        if ('description_long' in p) patch.description_long = String(p.description_long || '').trim() || null;
        if ('compatibility'    in p) patch.compatibility    = String(p.compatibility || '').trim() || null;
        if ('features' in p) {
          if (!Array.isArray(p.features)) {
            return res.status(400).json({ error: 'features must be an array.' });
          }
          patch.features = p.features.map(f => String(f).trim()).filter(Boolean);
        }
        if ('weight_oz' in p) {
          const raw = p.weight_oz;
          if (raw === '' || raw === null) patch.weight_oz = null;
          else {
            const n = Number(raw);
            if (!isFinite(n) || n < 0 || n > 9999) {
              return res.status(400).json({ error: 'weight_oz must be a number of ounces.' });
            }
            patch.weight_oz = Math.round(n * 100) / 100;
          }
        }
        if (!Object.keys(patch).length) {
          return res.status(400).json({ error: 'Nothing to update.' });
        }
        const { error } = await db.from('products').update(patch).eq('slug', slug);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // ---------------------------------------------------------------
      case 'list_inventory': {
        const { data, error } = await db
          .from('variants')
          .select('sku, label, case_pack, stock_status, restock_date, is_active, sort_order, products(name, slug, sort_order)')
          .order('sku');
        if (error) throw error;
        data.sort((a, b) =>
          (a.products?.sort_order ?? 0) - (b.products?.sort_order ?? 0) || a.sort_order - b.sort_order);
        return res.status(200).json({ items: data });
      }

      case 'set_stock': {
        const { sku, stock_status, restock_date = null } = p;
        const ok = ['in_stock','low_stock','pre_order','out_of_stock'];
        if (!sku || !ok.includes(stock_status)) {
          return res.status(400).json({ error: 'sku and a valid stock_status are required.' });
        }
        const { error } = await db.from('variants')
          .update({ stock_status, restock_date: restock_date || null })
          .eq('sku', sku);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // ---------------------------------------------------------------
      case 'list_orders': {
        const { data, error } = await db
          .from('orders')
          .select('*, dealer_accounts(business_name), order_items(*)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json({ orders: data });
      }

      case 'update_order': {
        const { order_id, status, tracking } = p;
        const patch = {};
        if (status) patch.status = status;
        if (tracking !== undefined) patch.tracking = tracking;
        if (status === 'shipped') patch.shipped_at = new Date().toISOString();
        const { error } = await db.from('orders').update(patch).eq('id', order_id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('admin action failed:', action, err);
    return res.status(500).json({ error: err.message || 'Action failed.' });
  }
}
