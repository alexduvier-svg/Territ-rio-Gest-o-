import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderStockProducts} from '../src/features/stock-order.js';
const coffee=(id,type,format,weight,price=1000)=>({id,name:'Café '+type,baseName:'Café',category:'Cafés',type,format,weight,unit:'Pacote',price,stock:1});
test('cafés seguem tipo, formato e pesos mesmo inseridos intercalados com outros produtos',()=>{
 const special=['Moído','Em grãos'].flatMap(format=>[250,500,1000].map(weight=>coffee('s'+format+weight,'Especial',format,weight)));
 const extra=[coffee('g','Gourmet','Moído',250),coffee('t','Tradicional','Moído',250),coffee('c','Commodity','Verde',1000),coffee('d','Drip coffee','Dose individual',10),coffee('novo','Descafeinado','Moído',250)];
 const fuba={id:'f',name:'Fubá Mimoso',category:'Grãos',unit:'Pacote',weight:1000},mandioca={id:'m',name:'Mandioca',category:'Hortifruti-Granjeiro',unit:'kg'};
 const input=[special[5],fuba,extra[3],mandioca,special[2],extra[0],special[0],extra[1],special[4],extra[2],special[1],extra[4],special[3]];
 const before=JSON.stringify(input),sorted=orderStockProducts(input);
 assert.deepEqual(sorted.slice(0,6).map(p=>p.id),special.map(p=>p.id));
 assert.deepEqual(sorted.slice(6,11).map(p=>p.id),extra.map(p=>p.id));
 assert(sorted.slice(0,11).every(p=>p.category==='Cafés'));
 assert.equal(sorted.at(-1).id,'f');assert.equal(JSON.stringify(input),before);
});
test('categorias e famílias ficam contíguas e preço desempata apresentações equivalentes',()=>{
 const input=[{id:'f1',name:'Fubá Mimoso',category:'Grãos',unit:'Pacote',price:700},{id:'b',name:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia'}, {id:'a',name:'Arroz',category:'Grãos',unit:'Pacote'}, {id:'f2',name:'Fubá de Milho',category:'Grãos',unit:'Pacote',price:1200}];
 assert.deepEqual(orderStockProducts(input).map(p=>p.id),['b','a','f2','f1']);
});

test('linhas de café permanecem juntas sem cultivar intercalar pesos da linha Especial',()=>{
 const standard=['Moído','Em grão'].flatMap(format=>[250,500,1000].map(weight=>({...coffee('especial-'+format+'-'+weight,'Especial',format,weight),baseName:'Café Especial'})));
 const catuai={...coffee('catuai','Especial','Em grão',500),baseName:'Café Catuaí Especial',name:'Café Catuaí Especial'};
 const gourmet=coffee('gourmet','Gourmet','Moído',250);
 const input=[gourmet,standard[2],catuai,standard[4],standard[0],standard[5],standard[1],standard[3]];
 const before=JSON.stringify(input),sorted=orderStockProducts(input);
 assert.deepEqual(sorted.slice(0,6).map(p=>p.id),standard.map(p=>p.id));
 assert.deepEqual(sorted.slice(6).map(p=>p.id),['catuai','gourmet']);
 assert.equal(JSON.stringify(input),before);
});
