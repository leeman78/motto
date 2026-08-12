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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dealer = await getDealer(req);

    const { data: cats } = await db
      .from('categories').select('slug, name, sort_order').order('sort_order');

    const { data: products, error } = await db
      .from('products')
      .select(`
        slug, type_label, name, description, spec_tags, colors, images, sort_order,
        categories ( slug ),
        variants ( sku, label, case_pack, master_carton, is_active, sort_order )
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
      variants: (p.variants || [])
        .filter(v => v.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(v => ({
          sku: v.sku,
          label: v.label,
          pack: v.case_pack,
          // omitted entirely when nobody is signed in
          ...(dealer ? { case_cents: priceBySku[v.sku]?.case_cents ?? null } : {})
        }))
    }));

    return res.status(200).json({
      categories: cats,
      products: catalog,
      dealer: dealer ? {
        business_name: dealer.business_name,
        terms: dealer.terms,
        moq_cents: dealer.moq_cents ?? MOQ_CENTS
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
