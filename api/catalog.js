// api/catalog.js
//
// GET /api/catalog
//   No token          → catalog with no prices at all.
//   Dealer bearer token → catalog with THAT dealer's resolved case prices.
//
// Prices are resolved by the dealer_case_price() function in Postgres, which
// is the same function checkout uses. One source of truth means the price a
// dealer sees and the price they get charged cannot drift apart.

import { db, getDealer, MOQ_CENTS, FREE_FREIGHT_CENTS, FREIGHT_CENTS } from './_lib.js';

const RANK = { out_of_stock: 0, low_stock: 1, pre_order: 2, in_stock: 3 };
function rollUp(list) {
  if (!list.length) return 'in_stock';
  if (list.every(s => s === 'out_of_stock')) return 'out_of_stock';
  if (list.some(s => s === 'out_of_stock' || s === 'low_stock')) return 'low_stock';
  if (list.some(s => s === 'pre_order')) return 'pre_order';
  return 'in_stock';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dealer = await getDealer(req);

    const { data: cats } = await db
      .from('categories').select('slug, name, sort_order').order('sort_order');

    const { data: products, error } = await db
      .from('products')
      .select(`
        slug, type_label, name, description, spec_tags, colors, images, sort_order, compliance,
        categories ( slug ),
        variants ( sku, upc, label, case_pack, master_carton, is_active, sort_order, stock_status, restock_date )
      `)
      .eq('is_published', true)
      .order('sort_order');
    if (error) throw error;

    // Price sheet in one round trip rather than one query per SKU.
    let priceBySku = {};
    if (dealer) {
      const { data: sheet, error: sheetErr } = await db
        .rpc('dealer_price_sheet', { p_dealer: dealer.id });
      if (sheetErr) throw sheetErr;
      priceBySku = Object.fromEntries(
        sheet.map(r => [r.sku, { case_cents: r.case_cents, is_override: r.is_override }])
      );
    }

    const catalog = products.map(p => ({
      slug: p.slug,
      cat: p.categories?.slug,
      type: p.type_label,
      name: p.name,
      desc: p.description,
      meta: p.spec_tags || [],
      colors: p.colors || [],
      shots: p.images || [],
      compliance: p.compliance || [],
      // a family is only as available as its weakest SKU
      stock: rollUp((p.variants || []).filter(v => v.is_active).map(v => v.stock_status)),
      variants: (p.variants || [])
        .filter(v => v.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(v => ({
          sku: v.sku,
          upc: v.upc,
          label: v.label,
          pack: v.case_pack,
          master_carton: v.master_carton,
          stock: v.stock_status,
          restock: v.restock_date,
          // omitted entirely when nobody is signed in
          ...(dealer ? { case_cents: priceBySku[v.sku]?.case_cents ?? null } : {})
        }))
    }));

    return res.status(200).json({
      categories: cats,
      products: catalog,
      dealer: dealer ? {
        business_name: dealer.business_name,
        contact_name: dealer.contact_name,
        email: dealer.email,
        phone: dealer.phone,
        terms: dealer.terms,
        moq_cents: dealer.moq_cents ?? MOQ_CENTS,
        must_change_password: dealer.must_change_password === true
      } : null,
      rules: {
        moq_cents: dealer?.moq_cents ?? MOQ_CENTS,
        free_freight_cents: FREE_FREIGHT_CENTS,
        freight_cents: FREIGHT_CENTS
      }
    });

  } catch (err) {
    console.error('catalog failed:', err);
    return res.status(500).json({ error: 'Could not load the catalog.' });
  }
}
