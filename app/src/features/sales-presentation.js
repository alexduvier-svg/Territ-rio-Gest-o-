// Pure presentation helpers. Values remain attached to the original product ID.
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
const numeric=v=>Number(String(v??'').replace(',','.'));
export function productMeasure(p){
 const parse=(v,unit,kind)=>{const s=String(v??'').trim(),n=numeric(s.replace(/\s*(?:kg|g|ml|l)$/i,''));if(!(n>0))return null;const explicit=s.match(/\s*(kg|g|ml|l)$/i)?.[1],large=/^(kg|l|litro)$/i.test(explicit||unit||'');return {kind,value:n*(large?1000:1)};};
 return parse(p.weight,p.weightUnit,'mass')||parse(p.volume,p.volumeUnit,'volume')||(numeric(p.contentCount)>0?{kind:'count:'+norm(p.contentUnit||p.unit),value:numeric(p.contentCount)}:null);
}
export function saleBlockKey(p){const m=productMeasure(p);return [p.category,p.familyId||p.catalogBase||p.baseName||p.name,p.type||'',p.coffeeRoast||'',p.coffeeSpecies||'',p.coffeeVariety||'',p.coffeeProcess||'',p.coffeeFermentation||'',p.variety||'',p.flavor||'',p.material||'',p.format||'',p.unit,m?.kind||'unmeasured'].map(norm).join('|');}
export function groupSaleProducts(products,ordered){const groups=new Map();for(const p of ordered(products)){const key=saleBlockKey(p);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}for(const list of groups.values())list.sort((a,b)=>{const x=productMeasure(a),y=productMeasure(b);return (x?.value??Infinity)-(y?.value??Infinity)||norm(a.id).localeCompare(norm(b.id));});return [...groups.values()];}
export function saleDescription(p,quantity=n=>String(n).replace('.',',')){
 const m=productMeasure(p),parts=[p.format,p.flavor,p.material,p.size].filter(Boolean);if(p.unit==='Kit')parts.push('Kit'+(numeric(p.contentCount)>0?' com '+quantity(numeric(p.contentCount))+' '+(p.contentUnit||'unidades'):''));
 if(m?.kind==='mass')parts.push(m.value>=1000?quantity(m.value/1000)+' kg':quantity(m.value)+' g');
 else if(m?.kind==='volume')parts.push(m.value>=1000?quantity(m.value/1000)+' L':quantity(m.value)+' ml');
 else if(m?.kind.startsWith('count:'))parts.push(quantity(m.value)+' '+(p.contentUnit||'unidades')+' / '+p.unit);
 else if(['kg','g','Litro','ml'].includes(p.unit))parts.push('Venda por '+p.unit);
 else if(['Pacote','Pote','Vidro','Garrafa'].includes(p.unit))parts.push('Peso / volume não informado');
 else parts.push(p.unit||'Unidade');
 return [...new Set(parts)].join(' · ');
}
