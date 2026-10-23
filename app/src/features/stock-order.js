import {roastRank} from './coffee.js';
import {productMeasure} from './sales-presentation.js';
// Presentation order only: no inventory mutation, price change, or product merging.
const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
const compare=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true}).compare;
const categories=['Cafés','Hortifruti-Granjeiro','Laticínios','Doces','Bolos','Panificação','Charcutaria','Grãos','Piscicultura','Artesanato','Beleza','Bebidas','Mel e apícolas','Conservas e temperos','Carnes e aves','Plantas e flores','Outros'];
const categoryRanks=new Map(categories.map((c,i)=>[normalize(c),i]));
const coffeeRanks=new Map(['especial','gourmet','superior','tradicional','commodity','drip coffee'].map((t,i)=>[t,i]));
const rank=(map,key)=>map.get(key)??100;
const positive=value=>Number.isFinite(Number(String(value).replace(',','.')))&&Number(String(value).replace(',','.'))>0?Number(String(value).replace(',','.')):0;

function descriptor(p){
 const category=normalize(p.category==='Hortifruti'?'Hortifruti-Granjeiro':p.category);
 const name=normalize(p.catalogBase||p.baseName||p.name),coffee=category==='cafes';
 let family=name;
 if(coffee)family='cafe';
 else if(/^bananas?\b/.test(name))family='banana';
 else if(/^fuba\b/.test(name))family='fuba';
 else if(/^(mandioca|aipim|macaxeira)\b/.test(name))family='mandioca';
 const type=normalize(p.type||p.variety||(coffee?['especial','gourmet','superior','tradicional','commodity','drip coffee'].find(t=>normalize(p.name).includes(t))||p.catalogBase||p.name:''));
 // A cultivar/named line stays together inside its quality tier. Comparing
 // only type + weight interleaved Catuaí 500 g with ordinary Especial 500 g.
 const coffeeFamily=coffee?name.replace(/^cafes?\s*/, '').replace(/\b(especial|gourmet|superior|tradicional|commodity|drip coffee|moido|em graos?|graos?|pacote)\b/g,'').replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g)\b/g,'').replace(/\s+/g,' ').trim():'';
 const format=normalize(p.format||p.catalogForm),formatRank=/moido/.test(format)?0:/graos?|grao/.test(format)?1:/verde/.test(format)?2:3;
 const unit=normalize(p.unit),measure=productMeasure(p),weight=measure?.kind==='mass'?measure.value:0,volume=measure?.kind==='volume'?measure.value:0,content=positive(p.contentCount),measureRank=measure?.kind==='mass'?0:measure?.kind==='volume'?1:measure?.kind?.startsWith('count:')?2:3;
 return {p,category,categoryRank:rank(categoryRanks,category),family,coffee,coffeeFamily,type,typeRank:coffee?rank(coffeeRanks,type):0,format,formatRank,unit,weight,volume,content,measureRank,price:positive(p.price)};
}
function compareDescriptors(a,b){
 return a.categoryRank-b.categoryRank||compare(a.category,b.category)||compare(a.family,b.family)
  ||(a.coffee&&b.coffee?(a.typeRank-b.typeRank||compare(a.type,b.type)):compare(a.type,b.type))
  ||(a.coffee&&b.coffee?roastRank(a.p)-roastRank(b.p)||(roastRank(a.p)===3?compare(a.coffeeFamily,b.coffeeFamily):0):0)
  ||(a.coffee&&b.coffee?a.formatRank-b.formatRank:0)||compare(a.format,b.format)
  ||compare(a.unit,b.unit)||a.measureRank-b.measureRank||a.weight-b.weight||a.volume-b.volume||a.content-b.content
  ||(a.coffee&&b.coffee?compare(a.coffeeFamily,b.coffeeFamily):0)||b.price-a.price||compare(a.p.flavor||'',b.p.flavor||'')||compare(a.p.name,b.p.name)||compare(a.p.id,b.p.id);
}
export const stockProductComparator=(a,b)=>compareDescriptors(descriptor(a),descriptor(b));
export const stockFamily=p=>descriptor(p).family;
// A section names the whole family, never whichever variety happens to be first.
// Keep the normalized query separate: "Bananas" is a title, "banana" finds its varieties.
const familyLabels=new Map([['cafe','Cafés'],['banana','Bananas'],['fuba','Fubás'],['mandioca','Mandiocas']]);
export const stockFamilyLabel=p=>familyLabels.get(stockFamily(p))||String(p.catalogBase||p.baseName||p.name||'Produtos').trim();
export const stockGroupKey=p=>{const d=descriptor(p);return d.category+'|'+d.family;};

// The producer's own order (hold and drag): it reorders products inside their family only, so
// families never interleave and categories keep their place. Products never placed by hand keep
// the catalog order after the ones that were.
let manualOrder=new Map();
export function setManualOrder(ids){manualOrder=new Map((Array.isArray(ids)?ids:[]).filter(id=>typeof id==='string').map((id,i)=>[id,i]));}
export function applyManualOrder(sorted,order=manualOrder){
 if(!order.size)return sorted;
 const out=[];let group=[],key=null;
 const flush=()=>{group.sort((a,b)=>(order.get(a.d.p.id)??Infinity)-(order.get(b.d.p.id)??Infinity)||a.i-b.i);out.push(...group.map(g=>g.d));group=[];};
 sorted.forEach((d,i)=>{const k=d.category+'|'+d.family;if(k!==key){flush();key=k;}group.push({d,i});});
 flush();return out;
}
export function orderStockProducts(products,order){const sorted=[...(products||[])].map(descriptor).sort(compareDescriptors);return applyManualOrder(sorted,order?new Map(order.map((id,i)=>[id,i])):manualOrder).map(d=>d.p);}
