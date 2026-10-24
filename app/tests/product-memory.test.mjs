import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Catalog from '../src/features/product-catalog.js';
import { CATALOG_KNOWLEDGE } from '../src/data/catalog-knowledge.js';
import { INTERFACE_GUIDELINES } from '../src/data/interface-guidelines.js';
import { ENGAGEMENT_GUIDELINES } from '../src/data/engagement-guidelines.js';

await Catalog.loadCatalog();
const clone = value => JSON.parse(JSON.stringify(value));
const source = fs.readFileSync(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8');
function environment() {
  const ctx = { console, Date, Math, JSON, Intl, crypto:globalThis.crypto,
    TerritorioProductCatalog:Catalog, TerritorioCatalogKnowledge:CATALOG_KNOWLEDGE,
    TerritorioInterfaceGuidelines:INTERFACE_GUIDELINES, TerritorioEngagementGuidelines:ENGAGEMENT_GUIDELINES };
  ctx.window=ctx; ctx.globalThis=ctx; vm.createContext(ctx); vm.runInContext(source,ctx);
  return ctx.ERP;
}
const dataset = (products=[]) => ({ schema:1, inventoryRevision:20,
  products:clone(products), sales:[], clients:[], events:[], movements:[], expenses:[], profiles:{},
  productLibrary:{entries:[],dimensions:{}}, dataContext:{type:'real',confirmedAt:'2026-10-15T12:00:00.000Z'},
});
const ownVariant = (extra={}) => ({ unit:'Maço', format:'', unitConfirmed:true, identityComplete:true,
  weight:0,volume:0,contentCount:0,contentUnit:'',priceInput:'5,00',costInput:'2,00',stockInput:'0',minInput:'0',...extra });
const saveOwn = (m,name,extra={}) => m.saveProducts({name,category:'Hortifruti-Granjeiro'},[ownVariant(extra)])[0];
const catalogVariant = (record,extra={}) => ({...Catalog.toProductSuggestion(record),unitConfirmed:true,
  priceInput:'8,00',costInput:'3,00',stockInput:'2',minInput:'0',...extra});
const saveReference = (m,record,name,extra={},baseExtra={}) => m.saveProducts({
  name:name||Catalog.toProductSuggestion(record).name, category:Catalog.categoryFor(record.categoria),...baseExtra,
},[catalogVariant(record,extra)])[0];

test('venda guarda custo zero confirmado e custo não confirmado no registro histórico',()=>{
  const E=environment(),products=[
    {id:'zero-confirmed',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',stock:5,min:0,price:400,cost:0,costKnown:true,stockGroup:'general'},
    {id:'cost-pending',name:'Banana',baseName:'Banana',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:5,min:0,price:1000,cost:200,costKnown:false,stockGroup:'general'},
  ],m=new E.ERPModel(dataset(products));
  const sale=m.complete({scope:'loja',payment:'Pix',discountMode:'R$',discountValue:'',items:products.map(p=>({productId:p.id,rawQty:'1'}))});
  assert.equal(sale.items[0].costKnown,true);
  assert.equal(sale.items[0].costTotal,0);
  assert.equal(sale.items[1].costKnown,false);
  assert.equal(sale.items[1].costTotal,200);
  m.data.products[0].cost=900;
  assert.equal(sale.items[0].costTotal,0,'custo de hoje não altera custo da venda');
});

test('regras de cadastro atualizam referências antigas sem perder a memória do produtor',()=>{
  const E=environment(),data=dataset();
  data.catalogKnowledge={version:'1.0.0',rules:['Texto anterior']};
  const m=new E.ERPModel(data);
  assert.equal(m.catalogKnowledgeInstalled,true);
  assert.equal(m.data.catalogKnowledge.version,CATALOG_KNOWLEDGE.version);
  assert.equal(m.data.stockCatalogGuidelines.ownHeading,'Você já tem cadastrado');
  assert.equal(m.stockCatalogGuidelinesInstalled,true);
  const newer=clone(m.data);newer.catalogKnowledge={version:'2.0.0',rules:['Referência posterior']};
  const restored=new E.ERPModel(newer);
  assert.equal(restored.data.catalogKnowledge.version,'2.0.0');
  assert.deepEqual(clone(restored.data.sales),[]);
  assert.deepEqual(clone(restored.data.movements),[]);
});

test('premissas visuais acompanham backup e retomada sem substituir uma revisão mais nova',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  assert.equal(m.interfaceGuidelinesInstalled,true);
  assert.equal(m.engagementGuidelinesInstalled,true);
  assert.deepEqual(clone(m.data.engagementGuidelines),ENGAGEMENT_GUIDELINES);
  assert.deepEqual(clone(m.data.interfaceGuidelines),INTERFACE_GUIDELINES);
  const restored=new E.ERPModel(clone(m.data));
  assert.notEqual(restored.interfaceGuidelinesInstalled,true);
  assert.notEqual(restored.engagementGuidelinesInstalled,true);
  assert.deepEqual(clone(restored.data.interfaceGuidelines),INTERFACE_GUIDELINES);
  assert.deepEqual(clone(restored.data.products),[]);
  assert.deepEqual(clone(restored.data.sales),[]);
  assert.deepEqual(clone(restored.data.movements),[]);
  const newer={...clone(restored.data),interfaceGuidelines:{...INTERFACE_GUIDELINES,version:INTERFACE_GUIDELINES.version+1,extra:'Premissa posterior'}};
  const future=new E.ERPModel(newer);
  assert.equal(future.data.interfaceGuidelines.version,INTERFACE_GUIDELINES.version+1);
  assert.equal(future.data.interfaceGuidelines.extra,'Premissa posterior');
  assert.notEqual(future.interfaceGuidelinesInstalled,true);
});

test('instalar conhecimento e memória deixa produtos e atividade do produtor intactos',()=>{
  const E=environment(),p={id:'id-producer',name:'Taioba especial da Ana',baseName:'Taioba especial da Ana',
    category:'Hortifruti-Granjeiro',unit:'Molho',format:'',stock:7,stockGroup:'general',min:1,price:875,cost:240,
    photo:'data:image/png;base64,AA==',brand:'Da Ana',identityComplete:true,unitConfirmed:true};
  const original=dataset([p]);
  original.catalog={title:'Horta da Ana',story:'Produção local',publicUrl:'',photos:{[p.id]:'data:image/png;base64,AA=='}};
  original.sales=[{id:'sale-history',status:'completed',date:'2026-10-15T10:00:00-03:00',scope:'loja',total:875,cost:240,
    items:[{productId:p.id,name:p.name,unit:'Molho',qty:1,price:875,cost:240,total:875}],payments:[{method:'Pix',amount:875}]}];
  original.movements=[{id:'movement-history',productId:p.id,kind:'initial',qty:8,before:0,after:8,date:'2026-10-14T10:00:00-03:00',unit:'Molho'}];
  const before=clone(original),m=new E.ERPModel(original);
  before.products=before.products.map(p=>({...p,name:E.productName(p.name),baseName:E.productName(p.baseName)}));
  for(const key of ['products','sales','movements','catalog','dataContext'])assert.deepEqual(clone(m.data[key]),before[key],key);
  assert.deepEqual(clone(m.data.catalogKnowledge),clone(CATALOG_KNOWLEDGE));
  assert.equal(m.data.catalogKnowledge.type,'suggestions_only');
  assert.equal(m.data.products.length,1,'2.479 referências não viram saldo ou produto ativo');
  assert.equal(Object.keys(m.data.productMemory.entries).length,0,'migração não inventa entradas anteriores');
});

test('revisão de janelas e estoque migra só premissas e permanece no backup sem alterar os registros',()=>{
  const E=environment(),p={id:'premise-product',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',stock:3,min:0,price:300,cost:0,costKnown:true,stockGroup:'general'};
  const input=dataset([p]);
  input.interfaceGuidelines={version:1,type:'interface_premises',motion:'Premissa antiga'};
  input.stockCatalogGuidelines={version:1,type:'stock_catalog_premises',rules:['Ordenação antiga']};
  input.catalogKnowledge={version:'1.0.1',total:2479};
  const records=clone({products:input.products,sales:input.sales,movements:input.movements}),m=new E.ERPModel(input);
  assert.equal(m.interfaceGuidelinesInstalled,true);
  assert.equal(m.stockCatalogGuidelinesInstalled,true);
  assert.equal(m.data.interfaceGuidelines.version,INTERFACE_GUIDELINES.version);
  assert.match(m.data.interfaceGuidelines.windows.placement,/centralizadas/);
  assert.match(m.data.interfaceGuidelines.windows.scrolling,/cortar/);
  assert.equal(m.data.stockCatalogGuidelines.version,5);
  assert.equal(m.data.catalogKnowledge.sourceTotal,2479);
  assert.equal(m.data.catalogKnowledge.appAdditions,40);
  assert.equal(m.data.catalogKnowledge.total,2519);
  const restored=new E.ERPModel(clone(m.data));
  assert.notEqual(restored.interfaceGuidelinesInstalled,true);
  assert.notEqual(restored.stockCatalogGuidelinesInstalled,true);
  assert.deepEqual(clone(restored.data.interfaceGuidelines),INTERFACE_GUIDELINES);
  assert.deepEqual(clone({products:restored.data.products,sales:restored.data.sales,movements:restored.data.movements}),records);
});

test('memória e instruções são idempotentes na reabertura e isoladas por conjunto de dados',()=>{
  const E=environment(),a=new E.ERPModel(dataset()),b=new E.ERPModel(dataset());
  const p=saveOwn(a,'Taioba da Ana',{unit:'Molho',stockInput:'5'});
  const initial=clone(a.data),again=new E.ERPModel(clone(initial));
  assert.equal(again.data.productMemory.scopeId,a.data.productMemory.scopeId);
  assert.notEqual(a.data.productMemory.scopeId,b.data.productMemory.scopeId);
  assert.deepEqual(clone(again.data.productMemory),initial.productMemory);
  assert.deepEqual(clone(again.data.catalogKnowledge),initial.catalogKnowledge);
  assert.equal(again.data.productMemory.entries[p.id].stockEntries,1);
  assert.equal(b.data.productMemory.entries[p.id],undefined);
  again.move(p.id,'add',2,'nova colheita');
  assert.equal(a.data.productMemory.entries[p.id].stockEntries,1,'instância restaurada não modifica a anterior');
  assert.equal(again.productMemoryInitialized,false);
  assert.notEqual(again.catalogKnowledgeInstalled,true);
});

test('só entradas confirmadas elevam frequência; validação, correção, perda e edição não elevam',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  const p=saveOwn(m,'Taioba',{stockInput:'0'}),id=p.id;
  assert.equal(m.data.productMemory.entries[id].stockEntries,0,'cadastro com saldo zero não é reposição');
  for(let i=0;i<3;i++)m.move(id,'add',2,'Colheita');
  assert.equal(m.data.productMemory.entries[id].stockEntries,3);
  assert.equal(m.data.productMemory.entries[id].lastStockAt,m.data.movements[0].date);
  const entry=clone(m.data.productMemory.entries[id]);
  m.move(id,'correct',5,'Conferência');m.move(id,'loss',1,'Perda');
  assert.throws(()=>m.move(id,'add',0,''));
  assert.throws(()=>m.move(id,'add',0.5,''));
  assert.throws(()=>m.move(id,'loss',99,'Perda'));
  const beforeInvalid=JSON.stringify(m.data);
  assert.throws(()=>m.saveProducts({name:'Produto inválido',category:'Hortifruti-Granjeiro'},[
    ownVariant(),ownVariant({unit:'Maço',stockInput:'-1'}),
  ]));
  assert.equal(JSON.stringify(m.data),beforeInvalid,'falha de validação não grava parte do lote');
  m.saveProducts({name:p.name,category:p.category},[ownVariant({...p,priceInput:'6,00',costInput:'2,00',stockInput:'999',minInput:'0'})],id);
  assert.deepEqual(clone(m.data.productMemory.entries[id]),entry,'editar preço e confirmar não representa entrada');
  assert.equal(m.product(id).stock,4,'edição não usa quantidade enviada no formulário');
  assert.equal(m.product(id).price,600);
  assert.equal(m.data.productLibrary.entries.filter(x=>x.productId===id).length,1);
});

test('primeiro saldo positivo conta uma vez e cancelar formulário não cria memória de uso',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  const unsaved=ownVariant({stockInput:'7'});
  assert.equal(Object.keys(m.data.productMemory.entries).length,0);
  const p=saveOwn(m,'Taioba fresca',unsaved);
  assert.equal(m.data.productMemory.entries[p.id].stockEntries,1);
  assert.equal(m.data.movements.filter(x=>x.kind==='initial').length,1);
  new E.ERPModel(m.data);
  assert.equal(m.data.productMemory.entries[p.id].stockEntries,1,'reabrir não conta novamente');
});

test('apresentações próprias conservam IDs, rótulo regional, perfil e valores após reabrir',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  const first=saveOwn(m,'Taioba da horta',{unit:'Molho',stockInput:'4',priceInput:'4,50',costInput:'1,20',brand:'Ana'});
  const second=saveOwn(m,'Taioba da horta',{unit:'kg',stockInput:'2,5',priceInput:'16,00',costInput:'6,00',brand:'Ana'});
  assert.notEqual(first.id,second.id);
  const reload=new E.ERPModel(clone(m.data));
  for(const p of [first,second]){
    assert.equal(reload.product(p.id).unit,p.unit);
    assert.equal(reload.product(p.id).stock,p.stock);
    assert.equal(reload.profile(reload.product(p.id)).price,p.price);
    assert.equal(reload.profile(reload.product(p.id)).cost,p.cost);
    const learned=reload.data.productLibrary.entries.find(x=>x.productId===p.id);
    assert.equal(learned.confirmed,true);
    assert.equal(learned.defaults.unit,p.unit);
  }
  assert.equal(reload.data.products.length,2);
});

test('catálogo mapeado bloqueia duplicata sem reescrever cadastro personalizado',()=>{
  const E=environment(),m=new E.ERPModel(dataset()),record=Catalog.searchCatalog('taioba').items[0];
  const p=saveReference(m,record,'Taioba da Ana',{priceInput:'9,75',costInput:'1,35',stockInput:'8'});
  m.data.catalog.photos[p.id]='data:image/png;base64,AA==';
  m.move(p.id,'add',2,'Colheita');
  const before=JSON.stringify(m.data),id=p.id;
  assert.throws(()=>saveReference(m,record),error=>error.code==='DUPLICATE_PRODUCT'&&error.productId===id);
  assert.equal(JSON.stringify(m.data),before,'erro não altera nome, ID, foto, preço, custo, saldo, movimento ou memória');
  assert.equal(m.product(id).name,'Taioba Da Ana');
  assert.equal(m.data.products.length,1);
});

test('cadastro antigo incompleto exige revisão; confirmar diferença cria variação sem mesclar',()=>{
  const E=environment(),legacy={id:'old-taioba',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',
    unit:'Maço',stock:7,stockGroup:'general',min:1,price:499,cost:110};
  const m=new E.ERPModel(dataset([legacy])),record=Catalog.searchCatalog('taioba').items[0];
  const before=JSON.stringify(m.data);
  assert.throws(()=>saveReference(m,record),error=>error.code==='INCOMPLETE_IDENTITY_REVIEW'&&error.candidates.includes(legacy.id));
  assert.equal(JSON.stringify(m.data),before);
  const added=saveReference(m,record,'Taioba embalada',{unit:'Pacote',weight:250,catalogPackaging:'Pacote'}, {identityReviewConfirmed:true});
  assert.notEqual(added.id,legacy.id);
  assert.equal(m.data.products.length,2);
  assert.deepEqual(clone(m.product(legacy.id)),legacy);
  assert.equal(added.unit,'Pacote');assert.equal(added.weight,250);
  assert.equal(m.product(legacy.id).stock,7);
});

test('Cacho, Molho e Pé mantêm unidade e plural sem conversão de saldo após reiniciar',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  const products=[['Banana Cacho','Cacho','cacho','cachos'],['Taioba Molho','Molho','molho','molhos'],['Alface Pé','Pé','pé','pés']]
    .map(([name,unit,singular,plural])=>({p:saveOwn(m,name,{unit,stockInput:'3'}),unit,singular,plural}));
  const r=new E.ERPModel(clone(m.data));
  for(const {p,unit,singular,plural} of products){
    assert.equal(r.product(p.id).unit,unit);assert.equal(r.product(p.id).stock,3);
    assert.equal(E.unitLabel(unit,1),singular);assert.equal(E.unitLabel(unit,2),plural);
    assert.equal(E.displayUnits(unit),unit);
  }
  assert.notEqual(Catalog.normalizeUnit('Cacho'),Catalog.normalizeUnit('Dúzia'));
});

test('custo ausente permanece desconhecido e zero confirmado permanece conhecido no cadastro',()=>{
  const E=environment(),m=new E.ERPModel(dataset());
  const absent=saveOwn(m,'Taioba sem custo informado',{costInput:''});
  const zero=saveOwn(m,'Taioba custo zero confirmado',{costInput:'0'});
  assert.equal(absent.costKnown,false);assert.equal(absent.cost,0);
  assert.equal(zero.costKnown,true);assert.equal(zero.cost,0);
  const r=new E.ERPModel(clone(m.data));
  assert.equal(r.product(absent.id).costKnown,false);assert.equal(r.product(zero.id).costKnown,true);
});
