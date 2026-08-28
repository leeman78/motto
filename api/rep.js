// api/rep.js
//
// Everything a sales rep can see, and nothing else.
//
// The scoping is done here, on the server, against the signed-in user. It is
// never a filter the browser asks for: a rep who edits a request must not be
// able to read another rep's book. Every query below either carries
// .eq('rep_id', rep.id) or is checked against a set of that rep's dealer ids.
//
// Cost never appears. A rep sees what the store was charged and what they owe
// Motto; the difference is theirs. What Motto paid for the goods is the
// owner's number and is not selected anywhere in this file.
//
//   summary       this month and last, plus what is outstanding
//   dealers       my accounts
//   dealer        one account, with its price list and recent orders
//   orders        my orders
//
// Reps read prices; they do not set them. Both price-writing actions answer
// 403 so the read-only screen is enforced rather than merely displayed.

import { db, getRep } from './_lib.js';
import { priceOrder } from './_order.js';
import { sendPayLink } from './_paylink.js';

const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
const lastMonthStart = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rep = await getRep(req);
  if (!rep) return res.status(401).json({ error: 'Sign in as a rep to see this.' });

  const { action, ...p } = req.body || {};

  // The set of accounts this rep may touch, resolved once and reused. Any
  // dealer_id arriving in the request is checked against it.
  const myDealerIds = async () => {
    const { data } = await db.from('dealer_accounts').select('id').eq('rep_id', rep.id);
    return new Set((data || []).map(d => d.id));
  };

  try {
    switch (action) {

      // ---------------------------------------------------------------
      case 'summary': {
        const { data: dealers } = await db
          .from('dealer_accounts')
          .select('id, business_name')
          .eq('rep_id', rep.id);

        const ids = (dealers || []).map(d => d.id);
        const empty = { orders: 0, retail_cents: 0, wholesale_cents: 0, margin_cents: 0 };
        if (!ids.length) {
          return res.status(200).json({ rep, dealers: 0, this_month: empty, last_month: empty, outstanding_cents: 0 });
        }

        // Paid orders only. Settling on submitted orders pays out money that
        // has not arrived, and on net terms some of it never does.
        const { data: rows } = await db
          .from('orders')
          .select('id, paid_at, order_items(sku, cases, case_cents)')
          .eq('rep_id', rep.id)
          .eq('status', 'paid')
          .gte('paid_at', lastMonthStart());

        // Wholesale for the SKUs involved, so margin can be worked out
        // without ever reading cost.
        const skus = [...new Set((rows || []).flatMap(o => (o.order_items || []).map(i => i.sku)))];
        const { data: vars } = skus.length
          ? await db.from('variants').select('sku, list_cents').in('sku', skus)
          : { data: [] };
        const wholesale = Object.fromEntries((vars || []).map(v => [v.sku, v.list_cents || 0]));

        const bucket = { ...empty }, prev = { ...empty };
        const thisMonth = monthStart();
        (rows || []).forEach(o => {
          const t = o.paid_at >= thisMonth ? bucket : prev;
          t.orders++;
          (o.order_items || []).forEach(i => {
            t.retail_cents    += i.cases * i.case_cents;
            t.wholesale_cents += i.cases * (wholesale[i.sku] || 0);
          });
        });
        bucket.margin_cents = bucket.retail_cents - bucket.wholesale_cents;
        prev.margin_cents   = prev.retail_cents   - prev.wholesale_cents;

        const { data: inv } = await db
          .from('invoices')
          .select('total_cents, paid_cents')
          .eq('rep_id', rep.id)
          .in('status', ['sent', 'partial']);
        const outstanding = (inv || []).reduce((s, i) => s + (i.total_cents - i.paid_cents), 0);

        return res.status(200).json({
          rep, dealers: ids.length,
          this_month: bucket, last_month: prev,
          outstanding_cents: outstanding
        });
      }

      // ---------------------------------------------------------------
      case 'password_changed': {
        // The password itself is changed by the browser against Supabase auth,
        // which is the only thing that can hash it. This just clears the flag
        // that forces the prompt, and it is keyed to the signed-in user, so a
        // rep can only ever clear their own.
        const { error } = await db.from('reps')
          .update({ must_change_password: false, password_changed_at: new Date().toISOString() })
          .eq('id', rep.id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // ---------------------------------------------------------------
      case 'dealers': {
        const { data, error } = await db
          .from('rep_dealers')
          .select('*')
          .eq('rep_id', rep.id)
          .order('business_name');
        if (error) throw error;
        return res.status(200).json({ items: data || [] });
      }

      // ---------------------------------------------------------------
      case 'dealer': {
        const { dealer_id } = p;
        if (!dealer_id) return res.status(400).json({ error: 'dealer_id is required.' });
        if (!(await myDealerIds()).has(dealer_id)) {
          // Same answer as a dealer that does not exist. Confirming that an
          // id is real but belongs to someone else is still information.
          return res.status(404).json({ error: 'No such account.' });
        }

        const { data: dealer } = await db
          .from('dealer_accounts')
          .select('id, business_name, contact_name, email, phone, terms, notes, approved_at, created_at')
          .eq('id', dealer_id).single();

        // variants_public exists so cost cannot leak from a select *.
        const { data: vars } = await db
          .from('variants_public')
          .select('sku, label, case_pack, list_cents, retail_cents, products(name, sort_order)')
          .order('sku');

        const { data: quoted } = await db
          .from('dealer_prices').select('sku, case_cents').eq('dealer_id', dealer_id);
        const mine = Object.fromEntries((quoted || []).map(q => [q.sku, q.case_cents]));

        const prices = (vars || []).map(v => {
          const charged = mine[v.sku] ?? v.retail_cents ?? v.list_cents ?? 0;
          return {
            sku: v.sku,
            product: v.products?.name || '',
            label: v.label,
            case_pack: v.case_pack,
            wholesale_cents: v.list_cents,
            standard_cents: v.retail_cents,
            charged_cents: charged,
            is_quoted: v.sku in mine,
            margin_cents: charged - (v.list_cents || 0)
          };
        });

        const { data: orders } = await db
          .from('orders')
          .select('id, order_no, status, subtotal_cents, freight_cents, total_cents, created_at, paid_at, order_items(sku, cases, case_cents, pieces)')
          .eq('dealer_id', dealer_id)
          .order('created_at', { ascending: false })
          .limit(20);

        return res.status(200).json({ dealer, prices, orders: orders || [] });
      }

      // ---------------------------------------------------------------
      case 'orders': {
        const { data, error } = await db
          .from('orders')
          .select('id, order_no, status, subtotal_cents, total_cents, created_at, paid_at, dealer_accounts(business_name), order_items(sku, cases, case_cents, pieces)')
          .eq('rep_id', rep.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;

        const skus = [...new Set((data || []).flatMap(o => (o.order_items || []).map(i => i.sku)))];
        const { data: vars } = skus.length
          ? await db.from('variants').select('sku, list_cents, label, products(name)').in('sku', skus)
          : { data: [] };
        const wholesale = Object.fromEntries((vars || []).map(v => [v.sku, v.list_cents || 0]));
        const names = Object.fromEntries((vars || []).map(v =>
          [v.sku, `${v.products?.name || v.sku} — ${v.label || ''}`]));

        return res.status(200).json({
          items: (data || []).map(o => {
            const items = (o.order_items || []).map(i => ({ ...i, name: names[i.sku] || i.sku }));
            const retail = items.reduce((s, i) => s + i.cases * i.case_cents, 0);
            const whole  = items.reduce((s, i) => s + i.cases * (wholesale[i.sku] || 0), 0);
            return { ...o, order_items: items, retail_cents: retail, wholesale_cents: whole, margin_cents: retail - whole };
          })
        });
      }

      // ---------------------------------------------------------------
      // Prices are set by Motto, not by reps. The screen shows them as text
      // rather than fields, and these two actions are kept only to answer
      // clearly if something old still calls them. Leaving them working would
      // mean the read-only screen was a suggestion rather than a rule.
      case 'set_price':
      case 'clear_price':
        return res.status(403).json({
          error: 'Prices are set by Motto. Contact the office to change a price for this account.'
        });

      // ---------------------------------------------------------------
      // A rep writes an order for one of their stores — the store called it
      // in, the rep is standing in the aisle. Same pricing path as checkout
      // and the admin console, so all three can never disagree. The rep can
      // only order for accounts assigned to them, and the store still
      // approves and pays through the emailed link: the rep never touches
      // the money.
      // ---------------------------------------------------------------
      case 'create_order': {
        const { dealer_id, items } = p;
        if (!(await myDealerIds()).has(dealer_id)) {
          return res.status(404).json({ error: 'No such account.' });
        }
        const { data: dealer, error: dErr } = await db
          .from('dealer_accounts').select('*').eq('id', dealer_id).single();
        if (dErr || !dealer) return res.status(404).json({ error: 'No such account.' });

        let priced;
        try { priced = await priceOrder(dealer, items); }
        catch (e) {
          if (e.status) return res.status(e.status).json({ error: e.message });
          throw e;
        }
        const { rows, subtotal, freight } = priced;

        const { data: order, error: oErr } = await db.from('orders').insert({
          dealer_id: dealer.id,
          rep_id: rep.id,          // credited to the rep who wrote it
          subtotal_cents: subtotal,
          freight_cents: freight,
          status: 'requested',
          placed_by: 'rep',
          customer_email: dealer.email,
          customer_name: dealer.business_name
        }).select('id, order_no').single();
        if (oErr) throw oErr;

        const { error: iErr } = await db.from('order_items')
          .insert(rows.map(r => ({ ...r, order_id: order.id })));
        if (iErr) throw iErr;

        return res.status(200).json({
          ok: true, order_id: order.id, order_no: order.order_no,
          subtotal_cents: subtotal, freight_cents: freight,
          total_cents: subtotal + freight
        });
      }

      // Email the approve-and-pay link. Scoped like everything else here:
      // a rep can only send links for orders on their own accounts.
      case 'send_pay_link': {
        const { data: order } = await db
          .from('orders').select('id, dealer_id').eq('id', p.order_id).single();
        if (!order || !(await myDealerIds()).has(order.dealer_id)) {
          return res.status(404).json({ error: 'No such order.' });
        }
        const origin = req.headers.origin || `https://${req.headers.host}`;
        try {
          const r = await sendPayLink(order.id, origin);
          return res.status(200).json({ ok: true, ...r });
        } catch (e) {
          if (e.status) return res.status(e.status).json({ error: e.message });
          throw e;
        }
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('rep action failed:', action, err);
    return res.status(500).json({ error: err.message || 'Action failed.' });
  }
}
