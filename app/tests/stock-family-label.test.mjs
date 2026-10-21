import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stockFamilyLabel,stockFamily,stockGroupKey,orderStockProducts} from '../src/features/stock-order.js';

test('o título abrange as três variedades de banana sem modificar cadastros',()=>{
 const products=['Nanica','Maçã','Prata'].map((v,i)=>({id:String(i),name:'Banana '+v,baseName:'Banana '+v,category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:3}));
 const before=JSON.stringify(products);
 assert.deepEqual(products.map(stockFamilyLabel),['Bananas','Bananas','Bananas']);
 assert.equal(new Set(products.map(stockGroupKey)).size,1);
 assert.equal(stockFamily(products[0]),'banana');
 assert.equal(JSON.stringify(products),before);
});
test('título da família independe da ordem de entrada e da variedade filtrada',()=>{
 const a={id:'a',name:'BANANA PRATA',category:'Hortifruti-Granjeiro'},b={id:'b',name:'banana maçã',category:'Hortifruti-Granjeiro'};
 assert.equal(stockFamilyLabel(orderStockProducts([a,b])[0]),'Bananas');
 assert.equal(stockFamilyLabel(b),'Bananas');
});
test('famílias já agrupadas de café, fubá e mandioca têm título abrangente',()=>{
 const products=[{name:'Café Catuaí Especial',category:'Cafés'},{name:'Fubá Mimoso',category:'Grãos'},{name:'Aipim',category:'Hortifruti-Granjeiro'},{name:'Macaxeira',category:'Hortifruti-Granjeiro'}];
 assert.deepEqual(products.map(stockFamilyLabel),['Cafés','Fubás','Mandiocas','Mandiocas']);
});
test('família genérica preserva o nome completo e categorias continuam separadas',()=>{
 assert.equal(stockFamilyLabel({name:'Vitamina de Banana',category:'Bebidas'}),'Vitamina de Banana');
 assert.notEqual(stockGroupKey({name:'Banana Prata',category:'Doces'}),stockGroupKey({name:'Banana Prata',category:'Hortifruti-Granjeiro'}));
});
