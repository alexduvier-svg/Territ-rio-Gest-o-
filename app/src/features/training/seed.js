import {standardCoffeeModels,roastCode} from '../coffee.js';
import * as Suppliers from '../suppliers/model.js';
// Peixes ornamentais de exemplo (vivos, por unidade). Preços e custos fictícios.
export const DEMO_FISH=[
 // Ornamentais: nove variedades de betta e outros oito peixes, vivos e por unidade.
 ...[['betta','Betta Halfmoon',3500],['betta-plakat','Betta Plakat',2800],['betta-crowntail','Betta Crowntail',3000],['betta-veu','Betta Véu',2000],['betta-orelha-de-elefante','Betta Orelha de Elefante',4500],['betta-koi','Betta Koi',4000],['betta-cauda-dupla','Betta Cauda Dupla',3200],['betta-gigante','Betta Gigante',4200],['betta-femea','Betta Fêmea',1500],
  ['guppy','Guppy',800],['kinguio','Kinguio',1500],['molinesia','Molinésia',900],['plati','Plati',800],['tetra-neon','Tetra Neon',600],['acara-bandeira','Acará-bandeira',1800],['corydoras','Corydoras',1500],['carpa-koi','Carpa Koi',4500]]
  .map(([k,name,price])=>({id:'training-fish-'+k,baseName:name,name,category:'Piscicultura',type:'Ornamental',format:'Vivo',unit:'Unidade',stock:k.startsWith('betta')?6:10,min:2,price,cost:Math.round(price*.5)})),
 // Para consumo: três peixes inteiros, por quilo.
 ...[['tilapia','Tilápia',2200],['tambaqui','Tambaqui',2800],['pacu','Pacu',2600]]
  .map(([k,name,price])=>({id:'training-fish-'+k,baseName:name,name,category:'Piscicultura',type:'Para consumo',format:'Inteiro',unit:'kg',stock:15,min:3,price,cost:Math.round(price*.55)}))];
export function trainingData({id,appearance='system',largeText=false,reduceEffects=false,performanceMode='auto',mode='examples',selected=[],now=new Date().toISOString()}={}){
 if(!id)throw Error('Identificação do treino ausente.');
 const prices={Especial:[2500,4500,6500],Gourmet:[1800,3000,5500],Superior:[1600,2800,5000],Tradicional:[1200,2200,4000]};
 let products=[...standardCoffeeModels().map((p,i)=>{const price=prices[p.type][[250,500,1000].indexOf(p.weight)];return{...p,coffeeProcess:['Tradicional','Natural','Anaeróbico'][i%3],id:i===0?'training-coffee':'training-coffee-'+p.type.toLowerCase()+'-'+roastCode(p).toLowerCase()+'-'+p.weight,stock:10,min:2,price,cost:Math.round(price*.6)};}),
 {id:'training-banana',baseName:'Banana Prata',name:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:12,min:2,price:1000,cost:500},
 {id:'training-cheese',baseName:'Queijo Meia Cura',name:'Queijo Meia Cura',category:'Laticínios',unit:'Unidade',stock:8,min:2,price:3500,cost:2000},
 {id:'training-honey',baseName:'Mel',name:'Mel',category:'Apicultura',unit:'Pote',weight:500,stock:6,min:2,price:3000,cost:1800},
 {id:'training-eggs',baseName:'Ovos Caipiras',name:'Ovos Caipiras',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:10,min:2,price:1500,cost:800},
 {id:'training-jam',baseName:'Geleia de Morango',name:'Geleia de Morango',category:'Doces',unit:'Pote',weight:250,stock:6,min:2,price:1800,cost:900}
 ,...DEMO_FISH].map(p=>({...p,actorId:id,stockGroup:'general',demo:true}));
 if(mode==='own'){if(selected.length>5)throw Error('Escolha até 5 produtos para o treino.');const fields=['baseName','name','category','coffeeSpecies','coffeeVariety','coffeeRoast','coffeeProcess','coffeeFermentation','type','format','unit','weight','volume','contentCount','contentUnit','stock','min','price','cost'];products=selected.map((p,i)=>({...Object.fromEntries(fields.filter(k=>p[k]!==undefined).map(k=>[k,p[k]])),id:'training-own-'+i,actorId:id,stockGroup:'general',demo:true}));}
 const data={schema:1,demoRevision:6,inventoryRevision:20,training:{version:1,actorId:id,mode,productLimit:mode==='own'?5:products.length},dataContext:{id,type:'demo'},products,sales:[],expenses:[],events:[],eventLoads:[],profiles:{},contacts:[],clients:['Ana Exemplo','Bruno Exemplo','Carla Exemplo','Daniel Exemplo','Elisa Exemplo','Fabio Exemplo'].map((name,i)=>({id:'training-client-'+i,name,phone:'',uf:'MG',city:'Carangola',neighborhood:'Centro',demo:true})),movements:products.map(p=>({id:'training-initial-'+p.id,productId:p.id,name:p.name,date:now,kind:'initial',qty:p.stock,before:0,after:p.stock,note:'Saldo Fictício de Treino',unit:p.unit})),settings:{onboarding:'demo',businessName:'Negócio de Exemplo',producerName:'Luiz Claudio',phone:'',email:'',city:'Carangola',uf:'MG',appearance,largeText,reduceEffects,performanceMode,financialVisible:false,backupReminder:false,firstUseAt:now},catalog:{title:'Produtos de Exemplo',story:'',publicUrl:'',photos:{}}};
 seedSuppliers(data,now);return data;
}

function seedSuppliers(data,now){
 const at=Date.parse(now),date=n=>Suppliers.day(at+n*86400000),uid=()=>{throw Error('Exemplo precisa de ID estável.');};
 for(const [suffix,name,category]of [['a','Embalagens Alfa · Exemplo','Embalagens'],['b','Cooperativa Beta · Exemplo','Produtos'],['c','Ateliê Gama · Exemplo','Artesanato']])Suppliers.saveSupplier(data,{name,category,city:'Cidade de Exemplo',notes:'Cadastro Fictício do Modo Teste'},{id:'training-supplier-'+suffix,uid,now});
 const r=Suppliers.requestFrom(data,{name:'Potes para Doce · Exemplo',unit:'Unidade',specification:'Pote de 250 ml com tampa, mesmo material',needed:'100',needBy:date(3),destination:'Cidade de Exemplo'},{id:'training-supplier-comparison',uid,now});
 r.offers=[['a','50','40','25',2],['b','100','95','0',7]].map(([supplier,packSize,price,freight,days])=>Suppliers.offerFrom({supplierId:'training-supplier-'+supplier,packLabel:'Caixa de '+packSize,packSize,price,freight,discount:'0',charges:'0',minimum:'1',multiple:'1',quotedAt:date(0),validUntil:date(10),delivery:date(days),payment:'Pix na Entrega · Exemplo',equivalent:true,available:true},{id:'training-quote-'+supplier,uid,now}));
 r.analysis=Suppliers.compareOffers(r,at);Suppliers.book(data,true).comparisons.push(r);
 for(const [suffix,supplier,goods,offset]of [['1','a','60',-3],['2','b','70',-2],['3','a','80',-1]]){
  const entry=Suppliers.recordPurchase(data,{supplierId:'training-supplier-'+supplier,name:'Potes para Doce · Exemplo',specification:'Pote de 250 ml com tampa, mesmo material',unit:'Unidade',quantity:'100',goods,freight:'20',discount:'0',charges:'0',occurredOn:date(offset),confirmed:true,payment:'Pix · Exemplo',notes:'Compra Fictícia do Modo Teste'},{id:'training-purchase-'+suffix,uid,now});entry.source='system-example';
 }
}
