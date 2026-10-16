import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../src/features/product-catalog.js';
import {catalogReference,catalogVocabularyAnswer} from '../src/features/advisor/catalog-vocabulary.js';
await loadCatalog();

test('inteligência consulta apenas referências pertinentes, sem estoque/preço/custo inventados',()=>{
 const r=catalogReference('Como cadastrar taiobas?');
 assert(r.matches.length>0&&r.matches.length<=6);
 assert(r.matches.every(p=>/taioba/i.test(p.name)&&p.unit==='Maço'));
 assert(r.matches.every(p=>!('stock'in p)&&!('price'in p)&&!('cost'in p)));
 assert.match(catalogVocabularyAnswer('Como cadastrar taiobas?'),/Referências para cadastro/);
});
test('pergunta financeira continua no motor oficial e o catálogo não determina saldo',()=>{
 assert.equal(catalogVocabularyAnswer('Devo aumentar o preço da taioba?'),null);
 assert.equal(catalogVocabularyAnswer('Quantas unidades vendi?'),null);
 assert.equal(catalogVocabularyAnswer('Como cadastrar um novo cliente?'),null);
 assert.equal(catalogReference('Qual produto dá mais lucro?').matches.length,0);
});
test('unidade regional e molho culinário mantêm contextos distintos',()=>{
 assert.match(catalogVocabularyAnswer('Qual unidade para molhos de taioba?'),/Não há peso fixo/);
 assert.doesNotMatch(catalogVocabularyAnswer('Como cadastrar molho de tomate?'),/Maço e molho podem/);
});
