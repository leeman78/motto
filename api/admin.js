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

import { db, isAdmin, tempPassword } from './_lib.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Not authorized.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...p } = req.body || {};

  try {
    switch (action) {

      // ---------------------------------------------------------------
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
          .select('id, business_name, contact_name, email, phone, discount_pct, terms, approved_at, created_at')
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
        return res.status(200).json({ password });
      }

      case 'send_magic_link': {
        // Passwordless. Better for buyers who will forget a password.
        const { data, error } = await db.auth.admin.generateLink({
          type: 'magiclink',
          email: p.email
        });
        if (error) throw error;
        return res.status(200).json({ ok: true, link: data?.properties?.action_link });
      }

      // ---------------------------------------------------------------
      // List prices. These are the numbers every dealer discount is derived
      // from, so they are edited in one place and nowhere else.
      case 'list_products': {
        const { data, error } = await db
          .from('variants')
          .select('sku, label, case_pack, master_carton, list_cents, msrp_cents, upc, is_active, sort_order, products(name, sort_order)')
          .order('sku');
        if (error) throw error;
        data.sort((a, b) =>
          (a.products?.sort_order ?? 0) - (b.products?.sort_order ?? 0) || a.sort_order - b.sort_order);
        return res.status(200).json({ items: data });
      }

      case 'set_list_price': {
        const { sku } = p;
        const patch = {};
        for (const k of ['list_cents','msrp_cents','case_pack','master_carton']) {
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
