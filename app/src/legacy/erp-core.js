// Migrado de territorio-gestao-mockup.html (script erp-core).
(function(global){
'use strict';
const STATES=[['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
const CATEGORIES=['Cafés','Hortifruti-Granjeiro','Laticínios','Doces','Bolos','Panificação','Charcutaria','Grãos','Piscicultura','Artesanato','Beleza','Bebidas','Mel e apícolas','Conservas e temperos','Carnes e aves','Plantas e flores','Outros'];
const COFFEE_TYPES=['Especial','Gourmet','Tradicional','Commodity','Drip coffee'];
const PAYMENTS=['Pix','Dinheiro','Débito','Crédito','Outro'];
const COFFEE_PROFILES={Especial:{format:'Moído',unit:'Pacote',weight:250,price:2500,cost:1500,min:5},Gourmet:{format:'Moído',unit:'Pacote',weight:500,price:3000,cost:1800,min:5},Tradicional:{format:'Moído',unit:'Pacote',weight:1000,price:4000,cost:2400,min:5},Commodity:{format:'Verde',unit:'kg',weight:1000,price:2800,cost:1800,min:5},'Drip coffee':{format:'Dose individual',unit:'Pacote',weight:10,price:500,cost:250,min:5}};
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const number=value=>{if(typeof value==='number')return value;let s=String(value||'').replace(/[^\d,.-]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return Number(s);};
const cents=value=>Math.round(number(value)*100);
const currencyFormatter=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const quantityFormatter=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3});
const money=value=>currencyFormatter.format(value/100);
const quantity=value=>quantityFormatter.format(Number(value));
const uid=()=>global.crypto&&global.crypto.randomUUID?global.crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
const monthFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'});
const dayKey=date=>{const parts=dayFormatter.formatToParts(new Date(date));return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');};
const monthKey=date=>{const d=new Date(date);const parts=monthFormatter.formatToParts(d);return parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;};
function classify(name){
 const n=normalize(name);
 if(/cafe|coffee|cappuccino/.test(n))return{category:'Cafés',unit:'Pacote',type:'Especial',format:'Moído',weight:250,price:2500,cost:1500,min:5};
 if(/^ovos?\b/.test(n))return{category:'Hortifruti-Granjeiro',unit:'Dúzia',type:/codorna/.test(n)?'Codorna':/pato/.test(n)?'Pato':/granja/.test(n)?'Granja':'Caipira',price:0,cost:0,min:3,weight:0};
 if(/bolo|brownie|cupcake|muffin|rocambole|torta doce/.test(n))return{category:'Bolos',unit:'Unidade',format:'Inteiro',flavor:'Natural',weight:1000,price:0,cost:0,min:3};
 if(/pao|biscoito|broa|rosca|croissant|ciabatta|focaccia|brioche|baguete|torrada|sequilho/.test(n))return{category:'Panificação',unit:'Unidade',format:'Inteiro',weight:50,price:0,cost:0,min:3};
 if(/banana/.test(n))return{category:'Hortifruti-Granjeiro',unit:'Dúzia',price:1000,cost:500,min:3,weight:0};
 if(/^(mamao|mamoes)\b/.test(n))return{category:'Hortifruti-Granjeiro',unit:'Unidade',price:0,cost:0,min:3,weight:0};
 if(/tilapia|peixe|truta|pacu|tambaqui|piscicultura/.test(n))return{category:'Piscicultura',unit:'Unidade',price:1800,cost:1000,min:3,weight:0};
 if(/queijo|leite|iogurte|manteiga|requeijao|laticinio/.test(n))return{category:'Laticínios',unit:/leite/.test(n)?'Vidro':'Unidade',price:/leite/.test(n)?800:2800,cost:/leite/.test(n)?450:1600,min:3,weight:/leite/.test(n)?1000:0};
 if(/salame|linguica|bacon|presunto|charcutaria|defumado/.test(n))return{category:'Charcutaria',unit:'Pacote',weight:250,price:2200,cost:1300,min:3};
 if(/goiabada|doce|mel|geleia/.test(n))return{category:'Doces',unit:/mel|geleia/.test(n)?'Vidro':'Pacote',weight:250,price:1500,cost:800,min:3};
 if(/suco|bebida|cerveja|cachaca|vinho/.test(n))return{category:'Bebidas',unit:'Vidro',weight:1000,price:1200,cost:600,min:3};
 if(/abacate|tomate|feijao|alface|laranja|manga|mandioca|hortifruti|legume/.test(n))return{category:'Hortifruti-Granjeiro',unit:/abacate|alface/.test(n)?'Unidade':'kg',price:0,cost:0,min:3,weight:0};
 return{category:'Outros',unit:'Unidade',price:0,cost:0,min:3,weight:0};
}
function unitLabel(unit,q){const units={Pacote:['pacote','pacotes'],Dúzia:['dúzia','dúzias'],'Meia Dúzia':['meia dúzia','meias dúzias'],Caixa:['caixa','caixas'],Unidade:['unidade','unidades'],Vidro:['vidro','vidros'],Pote:['pote','potes'],kg:['kg','kg'],g:['g','g'],Litro:['litro','litros'],ml:['ml','ml'],Sacola:['sacola','sacolas'],Maço:['maço','maços'],Molho:['molho','molhos'],Pé:['pé','pés'],Cacho:['cacho','cachos'],Penca:['penca','pencas'],Bandeja:['bandeja','bandejas'],Garrafa:['garrafa','garrafas'],Frasco:['frasco','frascos'],Bisnaga:['bisnaga','bisnagas'],Saco:['saco','sacos'],Lata:['lata','latas'],Barra:['barra','barras'],Peça:['peça','peças'],Par:['par','pares'],Pedaço:['pedaço','pedaços'],Fatia:['fatia','fatias'],Kit:['kit','kits'],Rolo:['rolo','rolos']};return(units[unit]||[unit,unit])[q===1?0:1];}
function description(p){p={...p,unit:p.unit,contentUnit:EUnits(p.contentUnit)};const measure=p.volume?(p.volume>=1000?quantity(p.volume/1000)+' L':quantity(p.volume)+' ml'):p.weight?(p.weight>=1000&&p.weight%1000===0?quantity(p.weight/1000)+' kg':quantity(p.weight)+' g'):'';return [p.category!=='Cafés'?p.type:'',p.variety&&!normalize(p.baseName||p.name).includes(normalize(p.variety))?p.variety:'',p.flavor,p.material,p.size,p.format,measure,p.unit==='Caixa'&&p.contentCount?quantity(p.contentCount)+' '+(p.contentUnit||'unidades')+' por caixa':''].filter(Boolean).join(' · ')||'Venda por '+p.unit.toLowerCase();}
function EUnits(value){return String(value==null?'':value);}
function productKey(p){return[normalize(p.baseName||p.name),normalize(p.category),p.type||'',p.format||'',p.unit,['Pacote','Pote','Vidro'].includes(p.unit)?p.weight||0:0,p.unit==='Vidro'?p.volume||0:0,p.unit==='Caixa'?p.contentCount||0:0,p.unit==='Caixa'?p.contentUnit||'unidades':'','general'].join('|')+((p.variety||p.flavor||p.material||p.size||p.volume&&p.unit!=='Vidro'||p.weight&&!['Pacote','Pote','Vidro','kg','Litro'].includes(p.unit))?'|'+[p.variety||'',p.flavor||'',p.material||'',p.size||'',p.unit!=='Vidro'?p.volume||0:0,!['Pacote','Pote','Vidro','kg','Litro'].includes(p.unit)?p.weight||0:0].join('|'):'');}
function eventSellingNow(e,now){if(!e||e.status!=='active')return false;const stamp=now==null?Date.now():Number(now),day=dayKey(stamp);if(day<e.start||day>e.end)return false;const start=Date.parse(day+'T'+(e.from||'00:00')+':00-03:00'),end=Date.parse(day+'T'+(e.until||'23:59')+':00-03:00');return Number.isFinite(start)&&Number.isFinite(end)&&stamp>=start&&stamp<end;}
function seed(){
 const products=[
 {id:'banana',baseName:'Banana Prata',name:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:30,min:5,price:1000,cost:500},
 {id:'especial',baseName:'Café',name:'Café especial',category:'Cafés',type:'Especial',format:'Moído',unit:'Pacote',weight:250,stock:48,min:10,price:2500,cost:1500},
 {id:'gourmet',baseName:'Café',name:'Café gourmet',category:'Cafés',type:'Gourmet',format:'Moído',unit:'Pacote',weight:500,stock:8,min:10,price:3000,cost:1800},
 {id:'tradicional',baseName:'Café',name:'Café tradicional',category:'Cafés',type:'Tradicional',format:'Moído',unit:'Pacote',weight:1000,stock:60,min:10,price:4000,cost:2400},
 {id:'banana-caixa',baseName:'Banana Nanica',name:'Banana Nanica',category:'Hortifruti-Granjeiro',unit:'Caixa',contentCount:12,contentUnit:'dúzias',stock:4,min:2,price:12000,cost:6000},
 {id:'tilapia',baseName:'Tilápia',name:'Tilápia',category:'Piscicultura',unit:'Unidade',stock:12,min:3,price:1800,cost:1000},
 {id:'queijo',baseName:'Queijo meia cura',name:'Queijo meia cura',category:'Laticínios',unit:'Unidade',stock:6,min:3,price:2800,cost:1600},
 {id:'salame',baseName:'Salame artesanal',name:'Salame artesanal',category:'Charcutaria',unit:'Pacote',weight:250,stock:0,min:3,price:2200,cost:1300}
 ];
 for(const [id,weight,stock,price,cost] of [['gourmet-250',250,16,1800,1000],['gourmet-1000',1000,12,5500,3200]])products.push({id,baseName:'Café',name:'Café gourmet',category:'Cafés',type:'Gourmet',format:'Moído',unit:'Pacote',weight,stock,min:5,price,cost});
 for(const [id,weight,stock,price,cost] of [['especial-500',500,3,4500,2700],['especial-1000',1000,12,6500,3900]])products.push({id,baseName:'Café',name:'Café Especial',category:'Cafés',type:'Especial',format:'Moído',unit:'Pacote',weight,stock,min:5,price,cost});
 for(const [id,variety,stock,price] of [['banana-maca','Maçã',6,1400]])products.push({id,baseName:'Banana '+variety,name:'Banana '+variety,category:'Hortifruti-Granjeiro',unit:'Dúzia',stock,min:3,price,cost:price/2});
 const sales=[['banana',2,'22:05'],['banana',1,'22:25'],['banana-caixa',1,'22:45']].map((s,i)=>{const original=products.find(p=>p.id===s[0]),p={...original,price:1000,cost:500,unit:s[0]==='banana'?'Dúzia':'Caixa',contentUnit:'unidades'};return{id:'exemplo-'+i,date:'2026-10-09T'+s[2]+':00-03:00',scope:'loja',items:[{productId:p.id,name:p.name,unit:p.unit,description:description(p),qty:s[1],price:p.price,cost:p.cost,total:p.price*s[1],costTotal:p.cost*s[1]}],subtotal:p.price*s[1],discount:0,total:p.price*s[1],cost:p.cost*s[1],payments:[{method:'Pix',amount:p.price*s[1]}],customerId:['cliente-ana','cliente-carlos','cliente-mariana'][i],customerName:['Ana Oliveira','Carlos Souza','Mariana Silva'][i],customerUF:'MG',customerCity:'Carangola',customerNeighborhood:'Centro',status:'completed'};});
 const movements=products.map(p=>({id:uid(),productId:p.id,name:p.name,date:'2026-10-09T09:00:00-03:00',kind:'initial',qty:p.stock,before:0,after:p.stock,note:'Estoque dos exemplos',unit:p.unit}));
 return{schema:1,demoRevision:6,products,sales,movements,clients:[{id:'cliente-ana',name:'Ana Oliveira',phone:'',uf:'MG',city:'Carangola',neighborhood:'Centro'},{id:'cliente-carlos',name:'Carlos Souza',phone:'',uf:'ES',city:'Guaçuí',neighborhood:'Centro'},{id:'cliente-mariana',name:'Mariana Silva',phone:'',uf:'MG',city:'Carangola',neighborhood:'Santa Maria'}],events:[{id:'demo-inventario',name:'Feira do Inventário',place:'Carangola · evento de exemplo',start:'2026-10-16',end:'2026-10-17',from:'08:00',until:'18:00',status:'active',demo:true,qrKind:'site',website:'https://www.visitecarangolamg.com.br'},{id:'demo-sexta',name:'Feira de Sexta 3ª Idade',place:'Carangola · evento de exemplo',start:'2026-10-16',end:'2026-10-16',from:'08:00',until:'13:00',status:'active',demo:true,qrKind:'catalog'}],expenses:[],profiles:{}};
}
function productName(value){return String(value??'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR').replace(/(^|[\s/–\-('])(\p{L})/gu,(m,space,letter)=>space+letter.toLocaleUpperCase('pt-BR')).replace(/(\d\s*)(Kg|G|Ml)\b/g,(m,n,u)=>n+u.toLowerCase());}
class ERPModel{
 constructor(data){this.data=data||seed();for(const p of this.data.products||[])for(const field of ['name','baseName'])if(p[field]&&p[field]!==productName(p[field])){p[field]=productName(p[field]);this.productNamesNormalized=true;}this.data.productLibrary=this.data.productLibrary&&typeof this.data.productLibrary==='object'?this.data.productLibrary:{entries:[],dimensions:{}};this.data.productLibrary.entries=Array.isArray(this.data.productLibrary.entries)?this.data.productLibrary.entries.filter(p=>p&&typeof p.name==='string'&&typeof p.category==='string').map(p=>({...p,defaults:p.defaults&&typeof p.defaults==='object'?p.defaults:{}})):[];this.data.productLibrary.dimensions=this.data.productLibrary.dimensions&&typeof this.data.productLibrary.dimensions==='object'?Object.fromEntries(Object.entries(this.data.productLibrary.dimensions).filter(([key,values])=>Array.isArray(values)).map(([key,values])=>[key,values.filter(value=>typeof value==='string'||typeof value==='number'&&Number.isFinite(value))])):{};for(const category of [...this.data.productLibrary.entries.map(p=>p.category),...this.data.products.map(p=>p.category)])if(category&&!CATEGORIES.includes(category))CATEGORIES.push(category);this.data.profiles=this.data.profiles||{};this.data.ai=this.data.ai&&typeof this.data.ai==='object'?this.data.ai:{provider:'',providers:{},includeNames:false};this.data.ai.providers=this.data.ai.providers||{};this.data.settings={businessName:'AGRO Gestão',producerName:'Luiz Claudio',phone:'',email:'',city:'Carangola',uf:'MG',appearance:'dark',largeText:false,reduceEffects:false,financialVisible:false,website:'',instagram:'',...(this.data.settings||{})};this.data.catalog={title:'Produtos Martins',story:'Somos a Produtos Martins, uma família que cultiva o cuidado em cada escolha.\nDo café da manhã aos sabores da feira, aproximamos o campo da sua mesa.\nNossa história se renova a cada encontro com quem valoriza a produção local.',publicUrl:'',photos:{},...(this.data.catalog||{})};this.data.catalog.photos=this.data.catalog.photos||{};this.data.reminders=this.data.reminders||{seen:{}};this.data.reminders.seen=this.data.reminders.seen||{};
  // Only recognizable demonstration data receives the new sample presentations.
  // Saved prices, stock balances and transaction snapshots are preserved.
  if(!this.data.demoRevision&&this.data.products.some(p=>p.id==='especial'&&p.category==='Cafés')&&this.data.sales.some(s=>/^exemplo-/.test(s.id))){
   const samples=seed();for(const id of ['especial-500','especial-1000']){const candidate=samples.products.find(p=>p.id===id);if(!this.product(id)&&!this.data.products.some(p=>productKey(p)===productKey(candidate))){this.data.products.push({...candidate});this.data.movements.unshift({id:uid(),productId:id,name:candidate.name,date:new Date().toISOString(),kind:'initial',qty:candidate.stock,before:0,after:candidate.stock,note:'Nova apresentação dos exemplos',unit:candidate.unit});}}
   for(const id of ['banana','banana-caixa']){const p=this.product(id);if(p&&normalize(p.name)==='banana'){p.name='Banana Prata';if(!this.data.products.some(x=>x.id!==id&&normalize(x.baseName)==='banana prata'&&x.unit===p.unit))p.baseName='Banana Prata';}}
   const large=this.product('especial-1000');if(large&&large.price===8500&&large.cost===5100&&!this.data.profiles[productKey(large)]&&!this.data.sales.some(s=>s.items.some(i=>i.productId===large.id))){large.price=6500;large.cost=3900;}
   this.data.demoRevision=4;
  }
   if(this.data.demoRevision&&this.data.demoRevision<5){const banana=this.product('banana'),box=this.product('banana-caixa');if(banana&&normalize(banana.name)==='banana prata'&&banana.unit==='Dúzia')banana.unit='Dúzia';if(box&&normalize(box.name)==='banana prata'&&box.unit==='Caixa'){box.contentCount=12;box.contentUnit='dúzias';box.price=12000;box.cost=6000;}for(const e of seed().events)if(!this.data.events.some(x=>x.id===e.id))this.data.events.push({...e});this.data.demoRevision=5;}
   if(this.data.demoRevision&&this.data.demoRevision<6){if(!this.data.clients.some(c=>c.id==='cliente-mariana'))this.data.clients.push({id:'cliente-mariana',name:'Mariana Silva',phone:'',uf:'MG',city:'Carangola',neighborhood:'Santa Maria'});this.data.demoRevision=6;}
  this.renamePresentationUnits();
  this.unifyInventory();
  this.renameSampleBanana();
  this.correctPapayaUnits();
  this.initProductMemory();
 }
 initProductMemory(){
  const saved=this.data.productMemory,entries=saved&&typeof saved==='object'&&saved.entries&&typeof saved.entries==='object'&&!Array.isArray(saved.entries)?saved.entries:{};
  this.productMemoryInitialized=!saved;
  this.data.productMemory={...(saved&&typeof saved==='object'?saved:{}),version:2,scopeId:saved?.scopeId||uid(),threshold:3,policy:'Escolhas confirmadas deste produtor. Sugestões editáveis; sem misturar demonstração, sem inventar vendas e sem mudar preços, unidades ou estoque automaticamente.',entries};
  if(global.TerritorioCatalogKnowledge&&(!this.data.catalogKnowledge||String(this.data.catalogKnowledge.version||'0').localeCompare(global.TerritorioCatalogKnowledge.version,'en',{numeric:true})<0)){this.data.catalogKnowledge=JSON.parse(JSON.stringify(global.TerritorioCatalogKnowledge));this.catalogKnowledgeInstalled=true;}
  const guidelines=global.TerritorioInterfaceGuidelines;
  if(guidelines&&(!this.data.interfaceGuidelines||(Number(this.data.interfaceGuidelines.version)||0)<guidelines.version)){this.data.interfaceGuidelines=JSON.parse(JSON.stringify(guidelines));this.interfaceGuidelinesInstalled=true;}
  const stockGuidelines=global.TerritorioProductCatalog?.STOCK_CATALOG_GUIDELINES;
  if(stockGuidelines&&(!this.data.stockCatalogGuidelines||(Number(this.data.stockCatalogGuidelines.version)||0)<stockGuidelines.version)){this.data.stockCatalogGuidelines=JSON.parse(JSON.stringify(stockGuidelines));this.stockCatalogGuidelinesInstalled=true;}
  const voice=global.TerritorioVoiceGuidelines;
  if(voice&&(!this.data.voiceGuidelines||(Number(this.data.voiceGuidelines.version)||0)<voice.version)){this.data.voiceGuidelines=JSON.parse(JSON.stringify(voice));this.voiceGuidelinesInstalled=true;}
  const decision=global.TerritorioDecisionGuidelines;
  if(decision&&(!this.data.decisionGuidelines||(Number(this.data.decisionGuidelines.version)||0)<decision.version)){this.data.decisionGuidelines=JSON.parse(JSON.stringify(decision));this.decisionGuidelinesInstalled=true;}
  const adaptation=global.TerritorioAdaptationGuidelines;
  if(adaptation&&(!this.data.adaptationGuidelines||this.data.adaptationGuidelines.version<adaptation.version)){this.data.adaptationGuidelines=JSON.parse(JSON.stringify(adaptation));this.adaptationGuidelinesInstalled=true;}
  const engagement=global.TerritorioEngagementGuidelines;
  if(engagement&&(!this.data.engagementGuidelines||(Number(this.data.engagementGuidelines.version)||0)<engagement.version)){this.data.engagementGuidelines=JSON.parse(JSON.stringify(engagement));this.engagementGuidelinesInstalled=true;}
 }
 rememberProduct(p,{stockEntry=false,at=new Date().toISOString()}={}){
  const memory=this.data.productMemory,old=memory.entries[p.id]||{},count=Number.isFinite(old.stockEntries)?Math.max(0,Math.floor(old.stockEntries)):0;
  const total=count+(stockEntry?1:0),profile={category:p.category,unit:p.unit,type:p.type||'',format:p.format||'',weight:p.weight||0,volume:p.volume||0,contentCount:p.contentCount||0,contentUnit:p.contentUnit||''};
  memory.entries[p.id]={...old,confirmedAt:old.confirmedAt||at,stockEntries:total,...(stockEntry?{lastStockAt:at}:{}),...(total>=3?{learned:true,profile,learnedAt:old.learnedAt||at}:{}),actorId:this.data.dataContext?.id||memory.scopeId};
 }
 correctPapayaUnits(){
  // Desligada: era uma correção única de uma versão antiga (já aplicada). Num cadastro real, quem vende
  // mamão por kg vende por kg; quantidade inteira não prova o contrário. O histórico fica em productUnitCorrections.
  return;
  for(const p of this.data.products){
   if(p.papayaUnitCorrected||p.category!=='Hortifruti-Granjeiro'||p.unit!=='kg'||!/^(mamao|mamoes)\b/.test(normalize(p.baseName||p.name)))continue;
   const counts=[p.stock,p.min,...this.data.movements.filter(m=>m.productId===p.id).flatMap(m=>[m.qty,m.before,m.after]),...this.data.sales.flatMap(s=>s.items.filter(i=>i.productId===p.id).map(i=>i.qty))].filter(v=>v!=null);
   if(!counts.every(Number.isInteger))continue;
   const previousProduct={...p};Object.assign(p,{unit:'Unidade',weight:0,volume:0,papayaUnitCorrected:true});
   this.data.productUnitCorrections=this.data.productUnitCorrections||[];this.data.productUnitCorrections.push({revision:30,productId:p.id,previousProduct,to:'Unidade',date:new Date().toISOString()});
   this.data.profiles[productKey(p)]={...p};
  }
 }
 renameSampleBanana(){
  if(this.data.settings?.onboarding!=='demo'&&this.data.dataContext?.type!=='demo')return;
  const p=this.data.products.find(p=>p.id==='banana-caixa');if(!p||normalize(p.name)!=='banana prata'||normalize(p.baseName||p.name)!=='banana prata')return;
  p.name='Banana Nanica';p.baseName='Banana Nanica';this.data.profiles[productKey(p)]={...p};
 }
 renamePresentationUnits(){
  // Cacho is a genuine commercial unit. An old display migration must never rewrite it on reload.
  return;
 }
 unifyInventory(){
  const d=this.data;d.productAliases=d.productAliases||{};
  const category=c=>c==='Hortifruti'?'Hortifruti-Granjeiro':c;
  d.products.forEach(p=>p.category=category(p.category));d.productLibrary.entries.forEach(p=>p.category=category(p.category));
  Object.entries(d.productLibrary.dimensions).forEach(([key,values])=>{if(key.startsWith('Hortifruti|')){const next=key.replace('Hortifruti|','Hortifruti-Granjeiro|');d.productLibrary.dimensions[next]=[...new Set([...(d.productLibrary.dimensions[next]||[]),...values])];delete d.productLibrary.dimensions[key];}});
  if(d.inventoryRevision>=20&&d.products.every(p=>p.stockGroup==='general'))return;
  if(d.products.every(p=>!p.stockGroup||p.stockGroup==='general')){d.products.forEach(p=>p.stockGroup='general');d.inventoryRevision=20;return;}
  const stamp=new Date().toISOString(),archive=JSON.parse(JSON.stringify(d.products)),groups=new Map(),kept=[];
  d.products.forEach(p=>{const key=productKey({...p,stockGroup:'general'});if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);});
  groups.forEach(items=>{
   const main=items.find(p=>!p.stockGroup||['general','daily-pf'].includes(p.stockGroup))||items[0],before=main.stock,total=Math.round(items.reduce((n,p)=>n+p.stock,0)*1000)/1000;
   for(const p of items){if(p.id!==main.id){d.productAliases[p.id]=main.id;if(d.catalog.photos[p.id]&&!d.catalog.photos[main.id])d.catalog.photos[main.id]=d.catalog.photos[p.id];}}
   main.stock=total;main.stockGroup='general';kept.push(main);
   if(items.length>1)d.movements.unshift({id:uid(),productId:main.id,name:main.name,date:stamp,kind:'unify',qty:total-before,before,after:total,note:'Consolidação dos saldos anteriores no estoque geral',unit:main.unit});
   d.profiles[productKey(main)]={...main};
  });
  d.products=kept;d.inventoryRevision=20;d.inventoryMigrations=d.inventoryMigrations||[];d.inventoryMigrations.push({revision:20,date:stamp,previousProducts:archive,aliases:{...d.productAliases},quantityPreserved:true});
 }

 product(id){const aliases=this.data.productAliases||{},seen=new Set();while(aliases[id]&&!seen.has(id)){seen.add(id);id=aliases[id];}return this.data.products.find(p=>p.id===id);}
 status(p){return p.stock<=0?'out':p.stock<=p.min?'low':'ok';}
 profile(p){const exact=this.data.profiles[productKey(p)]||this.data.products.find(x=>productKey(x)===productKey(p));if(exact)return{...exact};const c=COFFEE_PROFILES[p.type]||COFFEE_PROFILES.Especial;if(p.category==='Cafés'){const factor=(p.unit==='kg'?1000:p.weight||c.weight)/c.weight;return{...c,price:Math.round(c.price*factor),cost:Math.round(c.cost*factor)};}return classify(p.baseName||p.name);}
 move(id,kind,qty,note){
  const p=this.product(id);if(!p)throw Error('Produto não encontrado.');
  qty=number(qty);if(!Number.isFinite(qty)||qty<0||(!['kg','Litro','g','ml'].includes(p.unit)&&!Number.isInteger(qty)))throw Error('Informe uma quantidade válida na unidade de venda.');
  if(kind!=='correct'&&qty<=0)throw Error('Informe uma quantidade maior que zero.');
  const before=p.stock;const after=kind==='correct'?qty:kind==='loss'?before-qty:before+qty;
  if(after<0)throw Error('A perda é maior que o estoque disponível.');
  if(kind==='loss'&&!String(note||'').trim())throw Error('Informe o motivo da perda.');
  if(after===before)throw Error('Não há alteração no estoque.');
  p.stock=Math.round(after*1000)/1000;
  const m={id:uid(),productId:id,name:p.name,date:new Date().toISOString(),kind,qty:Math.abs(p.stock-before),before,after:p.stock,note:note||'',unit:p.unit,cost:p.cost||0};this.data.movements.unshift(m);if(kind==='add')this.rememberProduct(p,{stockEntry:true,at:m.date});return m;
 }
 saveProducts(base,variants,editId){
  if(!String(base.name||'').trim())throw Error('Informe o nome do produto.');
  const incoming=variants.map(v=>{const p={...v,stockGroup:'general',baseName:base.name.trim(),category:base.category,name:base.category==='Cafés'?base.name.trim().replace(/\s+(especial|gourmet|tradicional|commodity|drip coffee)$/i,'')+' '+(v.type||'Especial').toLowerCase():base.name.trim(),price:cents(v.priceInput),cost:cents(v.costInput),costKnown:String(v.costInput??'').trim()!=='',stock:number(v.stockInput),min:number(v.minInput)};
   if(!String(p.unit||'').trim())throw Error('Escolha a unidade de venda.');
   if([p.weight,p.volume].some(v=>v!==undefined&&(!Number.isFinite(number(v))||number(v)<0)))throw Error('Informe um peso ou volume válido.');
   if(![p.price,p.cost,p.stock,p.min].every(Number.isFinite)||p.price<0||p.cost<0||p.stock<0||p.min<0)throw Error('Valores e quantidades precisam ser válidos e positivos ou zero.');
   if(!['kg','Litro','g','ml'].includes(p.unit)&&(!Number.isInteger(p.stock)||!Number.isInteger(p.min)))throw Error('Use quantidades inteiras para '+p.unit.toLowerCase()+'.');
   if(p.unit==='Caixa'&&!(number(p.contentCount)>0))throw Error('Informe quantas unidades há na caixa.');
   if(p.unit==='Vidro'&&!(number(p.volume)>0)&&!(number(p.weight)>0))throw Error('Informe o peso ou volume do vidro.');
   if(base.category==='Cafés'&&p.unit==='Pacote'&&!(p.weight>0))throw Error('Informe o peso do pacote.');
   p.name=productName(p.name);p.baseName=productName(p.baseName);delete p.priceInput;delete p.costInput;delete p.stockInput;delete p.minInput;return p;
  });
  const catalog=global.TerritorioProductCatalog,keys=new Set();incoming.forEach(p=>{
   const identity=catalog?.commercialIdentity(p),key=identity?.complete?identity.key:productKey(p);
   if(keys.has(key))throw Error('Há opções de venda repetidas. Altere formato, peso ou embalagem.');keys.add(key);
   const others=this.data.products.filter(x=>x.id!==editId),duplicates=catalog?.duplicateCandidates(others,p),exact=duplicates?duplicates.exact?.[0]:others.find(x=>productKey(x)===productKey(p));
   if(exact){const error=Error('Este produto já está cadastrado.');error.code='DUPLICATE_PRODUCT';error.productId=exact.id;throw error;}
   if(!editId&&!base.identityReviewConfirmed&&duplicates?.review?.length){const error=Error('Há cadastros parecidos com informações incompletas. Confira antes de criar esta variação.');error.code='INCOMPLETE_IDENTITY_REVIEW';error.candidates=duplicates.review.map(x=>x.id);throw error;}
  });
  if(editId&&incoming.length!==1)throw Error('Edite uma opção por vez; outras opções podem ser cadastradas em Novo produto.');
  incoming.forEach(p=>{if(editId){const old=this.product(editId);if(!old)throw Error('Produto não encontrado.');if(p.unit!==old.unit&&old.stock>0)throw Error('Zere o saldo por uma movimentação antes de trocar a unidade de venda.');p.stock=old.stock;Object.assign(old,p);p=old;}else{p.id=uid();this.data.products.push(p);this.data.movements.unshift({id:uid(),productId:p.id,name:p.name,date:new Date().toISOString(),kind:'initial',qty:p.stock,before:0,after:p.stock,note:'Cadastro do produto',unit:p.unit});}this.rememberProduct(p,{stockEntry:!editId&&p.stock>0});this.data.profiles[productKey(p)]={unit:p.unit,type:p.type,variety:p.variety,flavor:p.flavor,material:p.material,size:p.size,format:p.format,weight:p.weight,volume:p.volume,contentCount:p.contentCount,contentUnit:p.contentUnit,price:p.price,cost:p.cost,costKnown:p.costKnown,min:p.min};});
  incoming.forEach(p=>{const entry={productId:p.id,name:p.baseName,category:p.category,confirmed:true,defaults:Object.fromEntries(['type','variety','flavor','material','size','format','unit','weight','volume','contentCount','contentUnit'].filter(key=>p[key]!==undefined).map(key=>[key,p[key]]))},list=this.data.productLibrary.entries,index=list.findIndex(x=>x.productId===p.id);if(index>=0)list[index]={...list[index],...entry};else list.push(entry);});
  return incoming;
 }
  availableStock(id,excludeOrder){const p=this.product(id);if(!p)return 0;const actor=this.data.dataContext?.id||this.data.productMemory.scopeId,local=this.data.localCommerce?.actors?.[actor]?.orders||[],online=this.data.onlineShop,orders=[...local,...(online&&online.slug===this.data.portfolio?.slug&&online.actorId===actor?online.orders||[]:[])];const held=orders.filter(o=>o.id!==excludeOrder&&!['review','cancelled'].includes(o.status)&&(o.status!=='delivered'||local.includes(o))&&!o.accountedSale&&!this.data.sales.some(s=>(s.localOrderId===o.id||s.operationId==='order-'+o.id)&&s.status==='completed')).reduce((n,o)=>n+(o.items||[]).filter(i=>i.productId===id).reduce((v,i)=>v+i.quantity,0),0);return Math.max(0,Math.round((p.stock-held)*1000)/1000);}

  quote(draft){
   const perItem=draft.discountScope==='item';
   const items=draft.items.map((i,index)=>{
    const p=this.product(i.productId),q=number(i.rawQty),total=p&&Math.round(p.price*q);
    const item={productId:p&&p.id,name:p&&p.name,unit:p&&p.unit,description:p&&description(p),qty:q,price:p&&p.price,cost:p&&p.cost,costKnown:!!p&&(p.costKnown===true||p.costKnown!==false&&Number.isFinite(p.cost)&&p.cost>0),total,costTotal:p&&Math.round(p.cost*q)};
    if(perItem){
     const active=index===draft.active,mode=(active?draft.discountMode:i.discountMode)||'R$',value=(active?draft.discountValue:i.discountValue)||'',rate=number(value),discount=mode==='%'?Math.round(total*rate/100):cents(value);
     Object.assign(item,{discountMode:mode,discountValue:String(value),discount,netTotal:total-discount,discountValid:['R$','%'].includes(mode)&&Number.isFinite(rate)&&rate>=0&&(mode!=='%'||rate<=100)&&Number.isFinite(discount)&&discount>=0&&discount<=total});
    }
    return item;
   });
   const subtotal=items.reduce((s,i)=>s+(Number.isFinite(i.total)?i.total:0),0),d=number(draft.discountValue),discount=perItem?items.reduce((s,i)=>s+i.discount,0):draft.discountMode==='%'?Math.round(subtotal*d/100):cents(draft.discountValue),total=subtotal-discount,cost=items.reduce((s,i)=>s+(Number.isFinite(i.costTotal)?i.costTotal:0),0);
   return {items,subtotal,discount,total,cost,...(perItem?{discountScope:'item'}:{})};
  }
 complete(draft){
  const operationId=typeof draft.operationId==='string'?draft.operationId.slice(0,120):'',operationFingerprint=JSON.stringify({scope:draft.scope||'loja',recipientType:draft.recipientType||'',items:(draft.items||[]).map(i=>[i.productId,number(i.rawQty),i.discountMode||'',i.discountValue||'']),discountScope:draft.discountScope,discountMode:draft.discountMode,discountValue:draft.discountValue,payment:draft.payment,split:draft.split,parts:draft.parts,clientId:draft.clientId||'',clientName:draft.clientName||''});
  if(operationId){const prior=this.data.sales.find(s=>s.operationId===operationId);if(prior){if((draft.orderId||draft.localOrderId)&&prior.status!=='completed')throw Error('A venda deste pedido foi devolvida. Atualize os pedidos antes de continuar.');if(prior.operationFingerprint!==operationFingerprint)throw Error('Esta operação já foi registrada com outros dados. Abra uma nova venda.');return prior;}}
  if(draft.localOrderId){const actor=this.data.dataContext?.id||this.data.productMemory.scopeId,o=this.data.localCommerce?.actors?.[actor]?.orders.find(o=>o.id===draft.localOrderId);if(!o||['review','cancelled'].includes(o.status)||draft.scope!=='loja'||o.items.length!==draft.items.length||o.items.some(i=>!draft.items.some(d=>d.productId===i.productId&&number(d.rawQty)===i.quantity)||this.product(i.productId)?.price!==i.price))throw Error('Confira o pedido, preços e reserva antes de registrar a venda.');}
  if(draft.orderId){const shop=this.data.onlineShop,order=shop?.orders.find(o=>o.id===draft.orderId);if(!shop||shop.actorId!==(this.data.dataContext?.id||this.data.productMemory.scopeId)||shop.slug!==this.data.portfolio?.slug||!order||order.status!=='requested'||order.accountedSale||draft.scope&&draft.scope!=='loja'||order.items.length!==draft.items.length||order.items.some(i=>!draft.items.some(d=>d.productId===i.productId&&number(d.rawQty)===i.quantity)||this.product(i.productId)?.price!==i.price))throw Error('O pedido mudou. Confira os produtos, preços e quantidades em Pedidos e entregas.');}
  if(draft.recipientType){const running=this.data.events.filter(e=>eventSellingNow(e,Date.now()));if(!['PF','PJ','EVENT'].includes(draft.recipientType))throw Error('Escolha o destinatário da venda.');if(draft.recipientType==='EVENT'&&!running.some(e=>e.id===draft.scope)||draft.recipientType!=='EVENT'&&((!draft.orderId&&!draft.localOrderId&&running.length)||draft.scope!=='loja'))throw Error('O destino da venda não está disponível neste horário.');}
  const quote=this.quote(draft);if(!quote.items.length)throw Error('Adicione um produto.');
  const seen=new Set();quote.items.forEach(i=>{const p=this.product(i.productId);if(!p||seen.has(p.id))throw Error('Produto inválido ou repetido.');seen.add(p.id);if(!Number.isFinite(i.qty)||i.qty<=0)throw Error('Informe a quantidade de cada produto.');if(!['kg','Litro','g','ml'].includes(p.unit)&&!Number.isInteger(i.qty))throw Error('A quantidade precisa ser inteira para '+p.unit.toLowerCase()+'.');const available=this.availableStock(p.id,draft.orderId||draft.localOrderId);if(i.qty>available)throw Error('Estoque insuficiente para '+p.name+'. Disponível: '+quantity(available)+' '+unitLabel(p.unit,available)+'.');});
  if(!Number.isFinite(quote.discount)||quote.discount<0||quote.discount>quote.subtotal||quote.total<=0)throw Error('O desconto deve ser válido e menor que o valor dos produtos.');
  if(draft.discountScope==='item'&&quote.items.some(i=>!i.discountValid))throw Error('O desconto de cada produto deve ser válido e não superar seu valor.');
   if(draft.uf&&!STATES.some(s=>s[0]===draft.uf))throw Error('Selecione uma UF válida.');
  let payments=draft.split?draft.parts.map(p=>({method:p.method,amount:cents(p.value)})):[{method:draft.payment||'Pix',amount:quote.total}];
  if(payments.some(p=>!PAYMENTS.includes(p.method)||!Number.isFinite(p.amount)||p.amount<=0)||payments.reduce((s,p)=>s+p.amount,0)!==quote.total)throw Error('A soma dos pagamentos deve ser igual ao total da venda.');
  let client=null;if(String(draft.clientName||'').trim()){client=this.data.clients.find(c=>c.id===draft.clientId)||this.data.clients.find(c=>normalize(c.name)===normalize(draft.clientName)&&c.uf===(draft.uf||''));if(!client){client={id:uid(),name:draft.clientName.trim(),uf:draft.uf||'',city:draft.city||'',neighborhood:draft.neighborhood||''};this.data.clients.push(client);}else{client.uf=draft.uf||client.uf;client.city=draft.city||client.city;client.neighborhood=draft.neighborhood||client.neighborhood;}}
  const sale={id:uid(),...(draft.localOrderId?{localOrderId:draft.localOrderId}:{}),...(draft.orderId?{orderId:draft.orderId}:{}),...(operationId?{operationId,operationFingerprint}:{}),date:new Date().toISOString(),scope:draft.scope||'loja',recipientType:draft.recipientType||((draft.scope&&draft.scope!=='loja')?'EVENT':draft.customerType||'PF'),sourceType:draft.recipientType||((draft.scope&&draft.scope!=='loja')?'EVENT':draft.customerType||'PF'),customerType:draft.customerType||'PF',...quote,payments,customerId:client&&client.id,customerName:client&&client.name||'',customerUF:draft.uf||client&&client.uf||'',customerCity:draft.city||client&&client.city||'',customerNeighborhood:draft.neighborhood||client&&client.neighborhood||'',status:'completed'};
  quote.items.forEach(i=>{const p=this.product(i.productId);const before=p.stock;p.stock=Math.round((before-i.qty)*1000)/1000;this.data.movements.unshift({id:uid(),productId:p.id,name:p.name,date:sale.date,kind:'sale',qty:i.qty,before,after:p.stock,note:'Venda '+sale.id.slice(0,6),unit:p.unit,saleId:sale.id});});this.data.sales.unshift(sale);
  const proposal=operationId&&this.data.agent?.proposals?.find(p=>p.proposalId===operationId&&p.actorId===this.data.agent.actorId);if(proposal){proposal.status='CONFIRMED';proposal.confirmedAt=Date.now();this.data.agent.audit.push({requestId:proposal.requestId,event:'confirmed',proposalId:proposal.proposalId,at:proposal.confirmedAt});proposal.status='EXECUTED';proposal.receiptId=sale.id;proposal.executedAt=Date.now();this.data.agent.audit.push({requestId:proposal.requestId,event:'confirmed-and-executed',proposalId:proposal.proposalId,receiptId:sale.id,scopeId:sale.scope,at:Date.now()});this.data.agent.audit=this.data.agent.audit.slice(-200);}
  return sale;
 }
 refund(id){const sale=this.data.sales.find(s=>s.id===id);if(!sale||sale.status!=='completed')throw Error('Essa venda já foi devolvida ou não foi encontrada.');sale.items.forEach(i=>{const p=this.product(i.productId);if(p){const before=p.stock;p.stock=Math.round((before+i.qty)*1000)/1000;this.data.movements.unshift({id:uid(),productId:p.id,name:p.name,date:new Date().toISOString(),kind:'return',qty:i.qty,before,after:p.stock,note:'Devolução da venda',unit:p.unit,saleId:id});}});sale.status='returned';sale.returnedAt=new Date().toISOString();return sale;}
 metrics(month,scope){
  const sales=this.data.sales.filter(s=>s.status==='completed'&&monthKey(s.date)===month&&(!scope||scope==='all'||s.scope===scope));const expenses=this.data.expenses.filter(e=>monthKey(e.date)===month&&(!scope||scope==='all'||e.scope===scope));
  const revenue=sales.reduce((s,v)=>s+v.total,0),cost=sales.reduce((s,v)=>s+v.cost,0),expense=expenses.reduce((s,e)=>s+e.amount,0),gross=revenue-cost;
  const daily={},rank={},payments={};sales.forEach(s=>{const day=Number(dayKey(s.date).slice(-2));daily[day]=(daily[day]||0)+s.total;s.items.forEach(i=>{const r=rank[i.productId]||(rank[i.productId]={id:i.productId,name:i.name,description:i.description,amount:0,qty:0});r.amount+=s.items.every(x=>Number.isFinite(x.netTotal)&&x.netTotal>=0)&&s.items.reduce((n,x)=>n+x.netTotal,0)===s.total?i.netTotal:i.total-Math.round(s.discount*i.total/(s.subtotal||1));r.qty+=i.qty;});s.payments.forEach(p=>payments[p.method]=(payments[p.method]||0)+p.amount);});
  return{sales,revenue,cost,expense,gross,result:gross-expense,margin:revenue?gross/revenue*100:0,ticket:sales.length?Math.round(revenue/sales.length):0,daily,rank:Object.values(rank).sort((a,b)=>b.amount-a.amount),payments};
 }
}

/* QR code encoder, adapted from Kazuhiko Arase (2009) and Open End AB (2014).
 * MIT License: Copyright (c) 2009 Kazuhiko Arase; Copyright (c) 2014 Open End AB.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE. QR code is a registered trademark of DENSO WAVE INCORPORATED.
 */
const QR_RS_M=[[1,26,16],[1,44,28],[1,70,44],[2,50,32],[2,67,43],[4,43,27],[4,49,31],[2,60,38,2,61,39],[3,58,36,2,59,37],[4,69,43,1,70,44],[1,80,50,4,81,51],[6,58,36,2,59,37],[8,59,37,1,60,38],[4,64,40,5,65,41],[5,65,41,5,66,42],[7,73,45,3,74,46],[10,74,46,1,75,47],[9,69,43,4,70,44],[3,70,44,11,71,45],[3,67,41,13,68,42],[17,68,42],[17,74,46],[4,75,47,14,76,48],[6,73,45,14,74,46],[8,75,47,13,76,48],[19,74,46,4,75,47],[22,73,45,3,74,46],[3,73,45,23,74,46],[21,73,45,7,74,46],[19,75,47,10,76,48],[2,74,46,29,75,47],[10,74,46,23,75,47],[14,74,46,21,75,47],[14,74,46,23,75,47],[12,75,47,26,76,48],[6,75,47,34,76,48],[29,74,46,14,75,47],[13,74,46,32,75,47],[40,75,47,7,76,48],[18,75,47,31,76,48]],QR_ALIGN=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];
function qrEncode(text, fixedMask){
 const bytes=[];for(const ch of String(text)){const n=ch.codePointAt(0);if(n<128)bytes.push(n);else if(n<2048)bytes.push(192|(n>>6),128|(n&63));else if(n<65536)bytes.push(224|(n>>12),128|((n>>6)&63),128|(n&63));else bytes.push(240|(n>>18),128|((n>>12)&63),128|((n>>6)&63),128|(n&63));}
 let version=1,blocks,capacity;for(;version<=40;version++){const row=QR_RS_M[version-1];blocks=[];for(let i=0;i<row.length;i+=3)for(let k=0;k<row[i];k++)blocks.push({total:row[i+1],data:row[i+2]});capacity=blocks.reduce((n,b)=>n+b.data,0);if(12+4+(version<10?8:16)+bytes.length*8<=capacity*8)break;}if(version>40)throw Error('O resumo é muito longo para um único QR code.');
 const bits=[];const put=(value,count)=>{for(let i=count-1;i>=0;i--)bits.push((value>>>i)&1);};put(7,4);put(26,8);put(4,4);put(bytes.length,version<10?8:16);bytes.forEach(b=>put(b,8));put(0,Math.min(4,capacity*8-bits.length));while(bits.length%8)bits.push(0);let data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((n,b)=>n*2+b,0));let pad=0;while(data.length<capacity)data.push(pad++%2?17:236);
 const exp=Array(512),log=Array(256);let value=1;for(let i=0;i<255;i++){exp[i]=value;log[value]=i;value<<=1;if(value&256)value^=285;}for(let i=255;i<512;i++)exp[i]=exp[i-255];const mul=(a,b)=>a&&b?exp[log[a]+log[b]]:0;
 const dc=[],ec=[];let offset=0;for(const b of blocks){const n=b.total-b.data;let poly=[1];for(let i=0;i<n;i++){const next=Array(poly.length+1).fill(0);poly.forEach((v,j)=>{next[j]^=v;next[j+1]^=mul(v,exp[i]);});poly=next;}const chunk=data.slice(offset,offset+b.data);offset+=b.data;const rem=chunk.concat(Array(n).fill(0));for(let i=0;i<chunk.length;i++){const factor=rem[i];if(factor)for(let j=0;j<poly.length;j++)rem[i+j]^=mul(poly[j],factor);}dc.push(chunk);ec.push(rem.slice(chunk.length));}
 const words=[];for(let i=0;i<Math.max(...dc.map(b=>b.length));i++)dc.forEach(b=>{if(i<b.length)words.push(b[i]);});for(let i=0;i<Math.max(...ec.map(b=>b.length));i++)ec.forEach(b=>{if(i<b.length)words.push(b[i]);});
 const size=17+version*4;const bch=(value,shift,polynomial)=>{let rem=value<<shift;const length=n=>n?32-Math.clz32(n):0;while(length(rem)>=length(polynomial))rem^=polynomial<<(length(rem)-length(polynomial));return(value<<shift)|rem;};
 const masks=[(r,c)=>(r+c)%2===0,(r,c)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r*c)%3+(r+c)%2)%2===0];
 const make=mask=>{const m=Array.from({length:size},()=>Array(size).fill(null));const probe=(r,c)=>{for(let y=-1;y<=7;y++)for(let x=-1;x<=7;x++){const yy=r+y,xx=c+x;if(yy<0||xx<0||yy>=size||xx>=size)continue;m[yy][xx]=y>=0&&y<=6&&x>=0&&x<=6&&(y===0||y===6||x===0||x===6||(y>=2&&y<=4&&x>=2&&x<=4));}};probe(0,0);probe(size-7,0);probe(0,size-7);
  for(const r of QR_ALIGN[version-1])for(const c of QR_ALIGN[version-1]){if(m[r][c]!==null)continue;for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)m[r+y][c+x]=Math.abs(y)===2||Math.abs(x)===2||(y===0&&x===0);}
  for(let i=8;i<size-8;i++){if(m[i][6]===null)m[i][6]=i%2===0;if(m[6][i]===null)m[6][i]=i%2===0;}
  const info=bch(mask,10,1335)^21522;for(let i=0;i<15;i++){const bit=!!((info>>i)&1);m[i<6?i:i<8?i+1:size-15+i][8]=bit;m[8][i<8?size-i-1:i<9?15-i:14-i]=bit;}m[size-8][8]=true;
  if(version>=7){const v=bch(version,12,7973);for(let i=0;i<18;i++){const bit=!!((v>>i)&1);m[Math.floor(i/3)][i%3+size-11]=bit;m[i%3+size-11][Math.floor(i/3)]=bit;}}
  let row=size-1,direction=-1,bitIndex=0;for(let col=size-1;col>0;col-=2){if(col===6)col--;while(true){for(let x=0;x<2;x++){const c=col-x;if(m[row][c]!==null)continue;const byte=words[Math.floor(bitIndex/8)]||0;const dark=!!((byte>>(7-bitIndex%8))&1);bitIndex++;m[row][c]=dark!==masks[mask](row,c);}row+=direction;if(row<0||row>=size){row-=direction;direction=-direction;break;}}}return m;};
 const penalty=m=>{let score=0,dark=0;for(let r=0;r<size;r++)for(let c=0;c<size;c++){if(m[r][c])dark++;if(r<size-1&&c<size-1&&m[r][c]===m[r+1][c]&&m[r][c]===m[r][c+1]&&m[r][c]===m[r+1][c+1])score+=3;}for(let axis=0;axis<2;axis++)for(let i=0;i<size;i++){const line=Array.from({length:size},(_,j)=>axis?m[j][i]:m[i][j]);let run=1;for(let j=1;j<size;j++){if(line[j]===line[j-1])run++;else{if(run>=5)score+=run-2;run=1;}}if(run>=5)score+=run-2;const str=line.map(v=>v?'1':'0').join('');for(let j=0;j<=size-11;j++)if(['00001011101','10111010000'].includes(str.slice(j,j+11)))score+=40;}return score+Math.floor(Math.abs(dark*100/(size*size)-50)/5)*10;};
 let matrix,mask=fixedMask===undefined?0:fixedMask,best=Infinity;if(fixedMask!==undefined)matrix=make(mask);else for(let i=0;i<8;i++){const candidate=make(i),score=penalty(candidate);if(score<best){best=score;matrix=candidate;mask=i;}}
 return{matrix,version,mask,size,bytes:bytes.length};
}
function qrSVG(payload){const qr=qrEncode(payload),quiet=4,n=qr.size+quiet*2;let path='';qr.matrix.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)path+='M'+(x+quiet)+' '+(y+quiet)+'h1v1h-1z';}));return'<svg class="receipt-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+n+' '+n+'" role="img" aria-label="QR code para leitura pela câmera" shape-rendering="crispEdges"><rect width="'+n+'" height="'+n+'" fill="#fff"/><path d="'+path+'" fill="#000"/></svg>';}

global.ERP={productName,displayUnits:EUnits,eventSellingNow,qrEncode,qrSVG,ERPModel,STATES,CATEGORIES,COFFEE_TYPES,PAYMENTS,COFFEE_PROFILES,normalize,number,cents,money,quantity,uid,dayKey,monthKey,classify,unitLabel,description,productKey,seed};
})(typeof window!=='undefined'?window:globalThis);
