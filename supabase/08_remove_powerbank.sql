-- =====================================================================
-- Motto Wholesale — remove the Soccer Ball Power Bank
--
-- Dropped from the line. This removes the product, its variant, and any
-- dealer-specific price that was set against it.
--
-- Order matters. dealer_prices points at variants(sku) and order_items may
-- hold the SKU as a historical record, so the dealer price goes first, then
-- the variant, then the product.
--
-- ORDER HISTORY IS NOT TOUCHED. If this SKU was ever ordered, that line stays
-- on the order exactly as it was sold. An invoice that silently loses a line
-- is worse than a catalogue that briefly mentions something discontinued.
--
-- Safe to re-run.
-- =====================================================================

begin;

-- What is about to go, so there is a record in the query output.
select 'removing' as action, p.name, v.sku, v.label
from products p
left join variants v on v.product_id = p.id
where p.slug = 'powerbank-soccer';

delete from dealer_prices
where sku in (select v.sku from variants v
              join products p on p.id = v.product_id
              where p.slug = 'powerbank-soccer');

delete from variants
where product_id in (select id from products where slug = 'powerbank-soccer');

delete from products where slug = 'powerbank-soccer';

commit;

-- Confirm: this should return no rows, and the count should be 14.
select slug, name from products where slug = 'powerbank-soccer';
select count(*) as products_remaining from products;
