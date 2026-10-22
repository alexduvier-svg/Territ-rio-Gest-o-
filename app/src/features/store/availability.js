import { orderStockProducts } from '../stock-order.js';
import { heldLocal } from '../local-catalog/model.js';

// Only this producer's registered inventory is published, never catalog suggestions.
export function shopSnapshot(data, comingSoonIds = [], description = () => '') {
 const soon = new Set(comingSoonIds), images = data.portfolio?.productImages || {};
 return orderStockProducts(data.products || []).filter(p => p.active !== false && p.price > 0).map(p => ({
  productId:p.id, name:p.name, category:p.category, label:description(p), unit:p.unit,
  stock:Math.max(0, Math.round((p.stock-heldLocal(data,p.id))*1000)/1000),
  price:p.price, image:images[p.id]||null, comingSoon:soon.has(p.id)
 }));
}
