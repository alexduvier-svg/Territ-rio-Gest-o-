import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  loadCatalog,isCatalogReady,catalogInfo,searchCatalog,searchFamilies,familyPresentations,
  getCatalogRecord,toProductSuggestion,normalizeProductName,normalizeUnit,quantityLabel,
  commercialIdentity,duplicateCandidates,importWithoutDuplicates,
} from '../src/features/product-catalog.js';

test('catalog is lazy, offline, repeatable, and has no producer transactions', async()=>{
  assert.equal(isCatalogReady(),false);
  assert.deepEqual(searchCatalog('taioba'),{items:[],total:0});
  const promise = loadCatalog();
  assert.equal(loadCatalog(),promise);
  await promise;
  assert.equal(isCatalogReady(),true);
  assert.equal(catalogInfo().total,2479);
  assert.equal(Object.keys(catalogInfo().categories).length,22);
  assert.equal(catalogInfo().sourceFamilyCount,1270);
  assert.equal(catalogInfo().families,1269);
  assert.equal(searchFamilies('',{limit:1}).total,1269);
  assert.equal(catalogInfo().rules.some(rule=>rule.includes('Não presuma peso fixo')),true);
});

test('plural, diacritic and alias searches retain the intended families',async()=>{
  await loadCatalog();
  assert.equal(searchFamilies('TAIOBAS').items[0].name,'Taioba');
  assert.ok(searchFamilies('mamões').items.some(f=>f.name.includes('Mamão')));
  assert.ok(searchFamilies('bolos de cenoura').items.some(f=>f.name==='Bolo de Cenoura'));
  assert.ok(searchCatalog('mussarela').items.every(p=>p.nome_base==='Queijo muçarela'));
  assert.ok(searchCatalog('mussarela').total>0);
  assert.equal(normalizeProductName('aipim'),'mandioca de mesa');
  assert.equal(normalizeProductName('macaxeiras'),'mandioca de mesa');
  assert.equal(normalizeProductName('queijos mussarelas'),'queijo mucarela');
  assert.equal(normalizeProductName('Farofa especial'),'farofa especial');
});

test('category browsing groups presentations without hiding individual commercial records',async()=>{
  await loadCatalog();
  const family=searchFamilies('bolos de cenoura',{category:'Bolos'}).items.find(f=>f.name==='Bolo de Cenoura');
  const presentations=familyPresentations(family.key);
  assert.ok(presentations.length>=5);
  assert.ok(presentations.some(p=>p.forma==='Inteiro'&&p.conteudo_quantidade===1000));
  assert.ok(presentations.some(p=>p.forma==='Pedaço'&&p.conteudo_quantidade===100));
  assert.equal(new Set(presentations.map(p=>p.id)).size,presentations.length);
  const page=searchFamilies('',{category:'Hortifruti-Granjeiro',limit:3});
  assert.equal(page.items.length,3); assert.ok(page.total>3);
  assert.ok(page.items.every(p=>p.category==='Hortifruti-Granjeiro'));
  assert.notEqual(searchFamilies('',{category:'Hortifruti-Granjeiro',limit:3,offset:3}).items[0].key,page.items[0].key);
});

test('safe adapter carries commercial description but no financial or available-stock defaults',async()=>{
  await loadCatalog();
  const taioba=searchCatalog('taiobas').items[0],suggestion=toProductSuggestion(taioba);
  assert.equal(suggestion.unit,'Maço');
  assert.equal(suggestion.weight,0);
  assert.equal(suggestion.category,'Hortifruti-Granjeiro');
  for(const field of ['stock','price','cost','min','id','saldo_inicial','preco_venda','custo_unitario']) assert.equal(Object.hasOwn(suggestion,field),false,field);
  assert.equal(getCatalogRecord(taioba.id),taioba);
  assert.equal(getCatalogRecord('not-a-product'),null);
  assert.throws(()=>{taioba.nome_base='Outro'},TypeError);
});

test('all 2479 presentations roundtrip to the legacy product model without losing identity',async()=>{
  await loadCatalog();
  const families=searchFamilies('',{limit:100}).items;
  assert.ok(families.length>0);
  const packed=JSON.parse(await fs.readFile(new URL('../src/data/product-catalog-compact.json',import.meta.url),'utf8'));
  const idPosition=packed.fields.indexOf('id');
  for(const row of packed.rows){
    const record=getCatalogRecord(packed.strings[row[idPosition]]);
    const original=commercialIdentity(record),adapted=commercialIdentity(toProductSuggestion(record));
    assert.equal(original.complete,true,record.nome_exibicao);
    assert.equal(adapted.key,original.key,record.nome_exibicao);
  }
});

test('complete catalog import is idempotent and does not mutate existing products',async()=>{
  await loadCatalog();
  const packed=JSON.parse(await fs.readFile(new URL('../src/data/product-catalog-compact.json',import.meta.url),'utf8'));
  const records=packed.rows.map(row=>getCatalogRecord(packed.strings[row[packed.fields.indexOf('id')]]));
  const first=importWithoutDuplicates([],records);
  assert.equal(first.report.inserted.length,2479);
  assert.equal(first.report.review.length,0);
  const second=importWithoutDuplicates(first.products,records);
  assert.equal(second.products.length,2479);
  assert.equal(second.report.ignored.length,2479);
  assert.equal(second.report.inserted.length,0);
  const saved={...toProductSuggestion(records[0]),id:'producer-id',price:1873,cost:511,stock:17,photo:'keep-me',name:'Meu bolo'};
  const before=structuredClone(saved);
  const reimport=importWithoutDuplicates([saved],[records[0]]);
  assert.equal(reimport.report.ignored.length,1);
  assert.deepEqual(saved,before);
  assert.equal(reimport.products[0],saved);
});

test('equivalent mass and volume normalize while different dimensions stay distinct',async()=>{
  await loadCatalog();
  const cake=searchCatalog('bolo cenoura',{limit:100}).items.find(p=>p.forma==='Inteiro'&&p.conteudo_quantidade===1000);
  assert.ok(cake);
  const kg={...cake,id:'other-id',conteudo_quantidade:1,conteudo_unidade:'kg'};
  assert.equal(commercialIdentity(kg).key,commercialIdentity(cake).key);
  assert.equal(duplicateCandidates([cake],kg).status,'exact');
  const juice=searchCatalog('suco de uva integral',{limit:100}).items.find(p=>p.conteudo_quantidade===1000);
  const litre={...juice,id:'other-volume-id',conteudo_quantidade:1,conteudo_unidade:'l'};
  assert.equal(commercialIdentity(litre).key,commercialIdentity(juice).key);
  assert.notEqual(commercialIdentity({...cake,conteudo_unidade:'ml'}).key,commercialIdentity(cake).key);
});

test('real variants stay distinct and a changed stable catalog ID requires review',async()=>{
  await loadCatalog();
  const cakes=searchCatalog('bolos de cenoura',{limit:100}).items;
  const whole500=cakes.find(p=>p.forma==='Inteiro'&&p.conteudo_quantidade===500);
  const whole1000=cakes.find(p=>p.forma==='Inteiro'&&p.conteudo_quantidade===1000);
  const slice=cakes.find(p=>p.forma==='Pedaço');
  assert.equal(duplicateCandidates([whole500],whole1000).status,'none');
  assert.equal(duplicateCandidates([whole500],slice).status,'none');
  const altered={...toProductSuggestion(whole500),weight:1000};
  assert.equal(duplicateCandidates([whole500],altered).status,'review');
  assert.equal(importWithoutDuplicates([whole500],[altered]).report.review.length,1);
  const coffees=searchCatalog('café especial torra clara',{limit:100}).items;
  assert.ok(new Set(coffees.map(p=>p.forma)).size>1);
  const ground=coffees.find(p=>p.forma==='Moído'),beans=coffees.find(p=>p.forma!=='Moído');
  assert.equal(duplicateCandidates([ground],beans).exact.length,0);
});

test('unknown legacy presentations are review candidates, never silently merged',async()=>{
  await loadCatalog();
  const suggestion=toProductSuggestion(searchCatalog('taioba').items[0]);
  const legacy={id:'old',name:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',price:499,stock:7};
  const duplicate=duplicateCandidates([legacy],suggestion);
  assert.equal(duplicate.status,'review'); assert.equal(duplicate.exact.length,0); assert.equal(duplicate.review[0],legacy);
  const differentCategory={...suggestion,category:'Outros'};
  assert.equal(commercialIdentity(differentCategory).key,commercialIdentity(suggestion).key);
  assert.equal(duplicateCandidates([suggestion],differentCategory).status,'exact');
});

test('an explicitly confirmed own product may have no applicable form without treating old blanks as known',()=>{
  const product={id:'own-taioba',baseName:'Taioba da horta',unit:'Maço',format:'',unitConfirmed:true,identityComplete:true};
  assert.equal(commercialIdentity(product).complete,true);
  assert.equal(duplicateCandidates([product],{...product,id:'new-id'}).status,'exact');
  assert.equal(commercialIdentity({...product,identityComplete:false}).complete,false);
  assert.equal(commercialIdentity({...product,unitConfirmed:false}).complete,false);
  assert.equal(commercialIdentity({...product,format:undefined}).complete,false);
  const missing={...product}; delete missing.format;
  assert.equal(commercialIdentity(missing).complete,false);
});

test('producer scope and commercial differentiators prevent cross-business or brand merges',async()=>{
  await loadCatalog();
  const suggestion=toProductSuggestion(searchCatalog('taioba').items[0]);
  const a={...suggestion,producerId:'A'},b={...suggestion,producerId:'B'};
  assert.equal(duplicateCandidates([a],b).status,'none');
  assert.notEqual(commercialIdentity({...suggestion,brand:'Marca A'}).key,commercialIdentity({...suggestion,brand:'Marca B'}).key);
  assert.notEqual(commercialIdentity({...suggestion,origin:'Sítio A'}).key,commercialIdentity(suggestion).key);
});

test('regional units remain contextual and have correct plurals without invented conversions',async()=>{
  await loadCatalog();
  assert.equal(quantityLabel(2,'Molho'),'2 molhos');
  assert.equal(quantityLabel(1,'Maço'),'1 maço');
  assert.equal(quantityLabel(2,'Maço',{regional:true}),'2 molhos');
  assert.equal(quantityLabel(0.5,'kg'),'0,5 kg');
  assert.equal(quantityLabel(2,'Litro'),'2 L');
  assert.equal(quantityLabel(3,'Pé'),'3 pés');
  assert.equal(normalizeUnit('Cacho'),'cacho');
  assert.notEqual(normalizeUnit('Cacho'),normalizeUnit('Dúzia'));
  assert.equal(normalizeProductName('molho de tomate'),'molho de tomate');
  const taioba=toProductSuggestion(searchCatalog('taioba').items[0]);
  assert.equal(commercialIdentity({...taioba,unit:'Molho'}).key,commercialIdentity(taioba).key);
  assert.notEqual(commercialIdentity({...taioba,unit:'kg'}).key,commercialIdentity(taioba).key);
});

test('Mucia is preserved as its own regional name and not aliased to morcela or chouriço',async()=>{
  await loadCatalog();
  const found=searchCatalog('múcia');
  assert.ok(found.total>0);
  assert.ok(found.items.every(p=>p.nome_base==='Mucia'&&p.confirmar_denominacao));
  assert.notEqual(normalizeProductName('Mucia'),normalizeProductName('Morcela'));
  assert.notEqual(normalizeProductName('Mucia'),normalizeProductName('Chouriço'));
});

test('bundled vocabulary excludes financial fields and remains substantially smaller than source',async()=>{
  const text=await fs.readFile(new URL('../src/data/product-catalog-compact.json',import.meta.url),'utf8');
  assert.ok(Buffer.byteLength(text)<500000);
  const packed=JSON.parse(text);
  assert.equal(packed.rows.length,2479);
  for(const field of ['price','cost','stock','preco_venda','custo_unitario','saldo_inicial']) assert.equal(packed.fields.includes(field),false);
});
