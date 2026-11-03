import test from 'node:test';
import assert from 'node:assert/strict';
import { supplierStock } from '../src/features/suppliers/stock-trace.js';

const buy = (id, supplierId, productId, quantity, occurredOn, extra = {}) => ({ id, supplierId, quantity, occurredOn, createdAt: occurredOn + 'T10:00:00Z', item: { productId, name: 'Café', unit: 'Pacote' }, ...extra });
const sale = (date, productId, qty, status = 'completed') => ({ status, date: date + 'T12:00:00-03:00', items: [{ productId, qty, unit:'Pacote' }] });

test('restante pela ordem de chegada: a compra mais antiga sai primeiro', () => {
  const data = {
    products: [{ id: 'cafe', name: 'Café', unit: 'Pacote', stock: 12 }],
    sales: [sale('2026-10-05', 'cafe', 6), sale('2026-10-06', 'cafe', 2), sale('2026-09-01', 'cafe', 50), sale('2026-10-07', 'cafe', 9, 'returned')],
    supplierBook: { purchases: [buy('a', 'joao', 'cafe', '10', '2026-10-01'), buy('b', 'maria', 'cafe', '10', '2026-10-03'), buy('x', 'joao', 'cafe', '99', '2026-10-02', { voidedAt: '2026-10-02' })] },
  };
  const [joao] = supplierStock(data, 'joao'), [maria] = supplierStock(data, 'maria');
  assert.equal(joao.bought, 10); assert.equal(joao.sold, 8); assert.equal(joao.remaining, 2);
  assert.equal(maria.remaining, 10);
  assert.equal(joao.otherSuppliers, 1);
});

test('restante nunca passa do saldo real (perda ou correção saem das compras mais antigas)', () => {
  const data = { products: [{ id: 'cafe', unit: 'Pacote', stock: 3 }], sales: [], supplierBook: { purchases: [buy('a', 'joao', 'cafe', '10', '2026-10-01'), buy('b', 'maria', 'cafe', '5', '2026-10-03')] } };
  assert.equal(supplierStock(data, 'joao')[0].remaining, 0);
  assert.equal(supplierStock(data, 'maria')[0].remaining, 3);
});

test('compra sem produto do estoque ou com quantidade inválida fica de fora', () => {
  const data = { products: [], sales: [], supplierBook: { purchases: [{ ...buy('a', 'joao', '', '10', '2026-10-01'), item: { name: 'Adubo', unit: 'kg' } }, buy('b', 'joao', 'cafe', 'abc', '2026-10-01')] } };
  assert.deepEqual(supplierStock(data, 'joao'), []);
});

test('decimal quantities use the purchase parser and do not multiply a decimal point by ten',()=>{
 const data={products:[{id:'cafe',unit:'Pacote',stock:1.75}],sales:[sale('2026-10-02','cafe',0.5)],supplierBook:{purchases:[buy('a','joao','cafe','2.25','2026-10-01')]}};
 const row=supplierStock(data,'joao')[0];assert.equal(row.bought,2.25);assert.equal(row.remaining,1.75);
});

test('different historical units, future purchases and returned sales are not mixed',()=>{
 const data={products:[{id:'cafe',unit:'Pacote',stock:4}],sales:[sale('2026-10-02','cafe',2,'returned'),{...sale('2026-10-02','cafe',80),items:[{productId:'cafe',qty:80,unit:'kg'}]}],supplierBook:{purchases:[buy('a','joao','cafe','4','2026-10-01'),buy('b','joao','cafe','999','2099-01-01'),buy('c','joao','cafe','500','2026-10-01',{item:{productId:'cafe',unit:'kg'}})]}};
 const row=supplierStock(data,'joao')[0];assert.equal(row.bought,4);assert.equal(row.sold,0);assert.equal(row.remaining,4);
});

test('sold period starts at the first linked purchase and uses the business timezone',()=>{
 const data={products:[{id:'cafe',unit:'Pacote',stock:18}],sales:[{...sale('2026-10-01','cafe',8),date:'2026-10-01T01:00:00Z'},sale('2026-10-02','cafe',2)],supplierBook:{purchases:[buy('a','joao','cafe','10','2026-10-01'),buy('b','maria','cafe','10','2026-10-03')]}};
 const row=supplierStock(data,'maria')[0];assert.equal(row.firstSaleOn,'2026-10-01');assert.equal(row.firstOn,'2026-10-03');assert.equal(row.sold,2);assert.equal(row.remaining,10);
});
