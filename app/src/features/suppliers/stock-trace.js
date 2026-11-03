// Estoque por fornecedor: quanto foi comprado de cada um, quanto já foi vendido e quanto deve restar.
// As vendas não guardam de qual compra saiu cada unidade, então o restante é estimado pela ordem de
// chegada (a compra mais antiga sai primeiro) e nunca passa do saldo real do produto. Só entram compras
// confirmadas e ligadas a um produto do estoque; compra cancelada não conta.

import {day, decimal, validDay} from './model.js';
const qty = raw => { try { return decimal(raw,3,{positive:true}) / 1000; } catch { return 0; } };
const dayOf = value => Number.isFinite(Date.parse(value)) ? day(Date.parse(value)) : '';

/**
 * data: { products, sales, supplierBook:{ purchases } }. Devolve, para o fornecedor, uma linha por produto:
 * { productId, bought, purchases, firstOn, lastOn, sold, remaining, stock, otherSuppliers }.
 */
export function supplierStock(data, supplierId) {
  const purchases = (data.supplierBook?.purchases || []).filter(p => !p.voidedAt && p.item?.productId && validDay(p.occurredOn) && p.occurredOn <= day() && qty(p.quantity) > 0);
  const mine = [...new Set(purchases.filter(p => p.supplierId === supplierId).map(p => p.item.productId))];
  return mine.map(productId => {
    const product = (data.products || []).find(p => p.id === productId);
    const linked = purchases.filter(p => p.item.productId === productId), unit = product?.unit || linked[0].item.unit;
    const all = linked.filter(p => p.item.unit === unit).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || String(a.createdAt).localeCompare(String(b.createdAt)));
    if (!all.some(p => p.supplierId === supplierId)) return null;
    const firstOn = all[0].occurredOn;
    const sold = (data.sales || []).filter(s => s.status === 'completed' && dayOf(s.date) >= firstOn && dayOf(s.date) <= day())
      .reduce((n, s) => n + (s.items || []).filter(i => i.productId === productId && i.unit === unit).reduce((m, i) => m + Math.max(0, Number(i.qty) || 0), 0), 0);
    const bought = all.reduce((n, p) => n + qty(p.quantity), 0);
    const stock = Math.max(0, Number(product?.stock) || 0);
    // O que saiu (vendas, perdas, correções) consome as compras mais antigas primeiro.
    let gone = bought - Math.max(0, Math.min(bought - sold, stock));
    let remaining = 0;
    for (const p of all) { const q = qty(p.quantity), used = Math.min(q, gone); gone -= used; if (p.supplierId === supplierId) remaining += q - used; }
    const own = all.filter(p => p.supplierId === supplierId);
    return {
      productId, name: product?.name || own[0].item.name, unit: product?.unit || own[0].item.unit, archived: !!product?.archived,
      bought: own.reduce((n, p) => n + qty(p.quantity), 0), purchases: own.length, firstOn: own[0].occurredOn, lastOn: own.at(-1).occurredOn,
      sold, firstSaleOn:firstOn, remaining: Math.round(remaining * 1000) / 1000, stock, otherSuppliers: new Set(all.map(p => p.supplierId)).size - 1,
    };
  }).filter(Boolean).sort((a, b) => b.lastOn.localeCompare(a.lastOn) || String(a.name).localeCompare(String(b.name), 'pt-BR'));
}
