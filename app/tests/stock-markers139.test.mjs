import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {orderStockProducts,setManualOrder} from '../src/features/stock-order.js';
const source=fs.readFileSync(new URL('../src/legacy/erp-ui.js',import.meta.url),'utf8');
const dotStart=source.indexOf("const OUT_DOT="),dotEnd=source.indexOf('const sellCardHtmlBeforeDot=',dotStart);
const wordStart=source.indexOf('const stockWord='),wordEnd=source.indexOf('\n',wordStart);
const outStart=source.indexOf('function soldOutLast('),outEnd=source.indexOf('\n',outStart);
const ctx={grammarCount:(n,a,b)=>n+' '+(n===1?a:b),sellingAvailableStock:id=>ctx.stock[id],stock:{}};vm.createContext(ctx);vm.runInContext(source.slice(dotStart,dotEnd)+source.slice(wordStart,wordEnd)+'\n'+source.slice(outStart,outEnd)+'\nthis.marker=withOutDot;this.status=stockWord;this.order=soldOutLast;',ctx);
for(const html of ['<strong><span class="cn-first">Café</span><span class="cn-rest">Especial TC</span></strong>','<strong>Acará-Bandeira</strong>','<strong>Betta</strong>'])test('one red dot precedes the first word: '+html,()=>{
 const out=ctx.marker(html);assert.equal((out.match(/class="out-dot"/g)||[]).length,1);assert.match(out,/<i class="out-dot"[^>]*><\/i>(Café|Acará-Bandeira|Betta)/);assert(!/restock-symbol/.test(out));
});
test('stock cards count one, two and three sold-out products with correct plural',()=>{
 for(const n of [1,2,3]){const rows=Array.from({length:36},(_,i)=>({stock:i<n?0:4,min:1}));assert.deepEqual([...ctx.status(rows)],['out',n+' '+(n===1?'esgotado':'esgotados')]);}
 assert.deepEqual([...ctx.status([{stock:5,min:1}])],['ok','Em dia']);
});
test('sold-out cards go last without changing saved order and one unit restores their original place',()=>{
 const products=['a','b','c'].map((id,i)=>({id,name:'Café Especial',category:'Cafés',type:'Especial',unit:'Pacote',weight:250+i*250,stock:3}));setManualOrder(['b','a','c']);
 try{for(const p of products)ctx.stock[p.id]=3;const original=orderStockProducts(products).map(p=>p.id);ctx.stock.b=0;assert.deepEqual([...ctx.order(orderStockProducts(products))].map(p=>p.id),['a','c','b']);ctx.stock.b=1;assert.deepEqual([...ctx.order(orderStockProducts(products))].map(p=>p.id),original);}finally{setManualOrder([]);}
});
