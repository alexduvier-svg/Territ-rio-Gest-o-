// Synthetic fixture only. The model's bundled seed supplies the schema; its records are discarded.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const scope = {Date, Math, JSON, Intl, crypto: require('node:crypto').webcrypto};
scope.window = scope;
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../app/src/legacy/erp-core.js'), 'utf8'), scope);
const seed = JSON.parse(JSON.stringify(scope.ERP.seed()));
Object.assign(seed, {
  products: [], sales: [], movements: [], expenses: [], events: [], eventLoads: [],
  clients: [{id:'qa-client', name:'Cliente Fictício QA', phone:'', uf:'MG', city:'Carangola', neighborhood:'Centro'}],
  dataContext: {id:'place135-synthetic', type:'real'},
  localOrders: [], orders: [], contacts: [], profiles: {},
});
seed.settings = {
  businessName:'Banca Fictícia QA', producerName:'Produtor Fictício QA', phone:'', email:'',
  city:'Carangola', uf:'MG', onboarding:'clean', layout:'feira', appearance:'light',
  largeText:false, reduceEffects:false, financialVisible:false, performanceMode:'auto',
  weatherEnabled:false, weatherBackgroundEnabled:false, backupReminder:false,
  firstUseAt:new Date().toISOString(), fairReports:{},
};
const add = (id, name, category, type='', extra={}) => seed.products.push({
  id, name, baseName:name, category, type, format:'Moído', unit:'Pacote', weight:250,
  stock:20, min:2, price:2500, cost:1000, costKnown:true, stockGroup:'general', ...extra,
});
for (const type of ['Especial','Gourmet','Superior','Tradicional']) {
  for (let i=0;i<9;i++) add('qa-'+type.toLowerCase()+'-'+i, 'Café '+type, 'Cafés', type, {
    baseName:'Café', coffeeRoast:['Clara','Média','Escura'][Math.floor(i/3)],
    coffeeSpecies:'Arábica', coffeeVariety:'Catuaí', coffeeProcess:'Natural',
    coffeeConfigurationVersion:2, weight:[250,500,1000][i%3], price:[2500,4500,6500][i%3],
  });
}
add('qa-banana-prata','Banana Prata','Hortifruti-Granjeiro','',{format:'Fresco',unit:'Dúzia',weight:0,price:1000,cost:500});
add('qa-banana-maca','Banana Maçã','Hortifruti-Granjeiro','',{format:'Fresco',unit:'Dúzia',weight:0,price:1400,cost:700});
add('qa-queijo','Queijo Meia Cura','Laticínios','',{format:'Inteiro',unit:'Unidade',weight:0,price:2800,cost:1600});
add('qa-betta','Betta Azul','Piscicultura','Ornamental',{format:'Vivo',unit:'Unidade',weight:0,price:1500,cost:500});
add('qa-tilapia','Tilápia','Piscicultura','Consumo',{format:'Inteiro',unit:'kg',weight:0,price:1800,cost:1000});
add('qa-salame-zero','Salame Artesanal','Charcutaria','',{format:'Inteiro',stock:0,price:4800});
const day = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
seed.events=[{id:'qa-future-fair',name:'Feira Fictícia QA',place:'Praça Fictícia',city:'Carangola',uf:'MG',start:day,end:day,from:'08:00',until:'18:00',status:'active'}];
function makeSeed(settings={}) {const data=structuredClone(seed);Object.assign(data.settings,settings);return data;}
module.exports = {seed,makeSeed};
