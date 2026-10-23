// Recorded product attributes only. Missing roast in legacy records stays unknown.
const norm=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
export const COFFEE_FIELDS=['coffeeSpecies','coffeeVariety','coffeeRoast','coffeeProcess','coffeeFermentation'];
export const COFFEE_OPTIONS={coffeeSpecies:['Arábica','Canéfora','Blend'],coffeeVariety:['Catuaí','Mundo Novo','Bourbon','Acaiá','Icatu','Catucaí','Topázio','Arara','Conilon','Robusta'],coffeeRoast:['Clara','Média','Escura'],coffeeProcess:['Tradicional','Natural','Cereja Descascado','Lavado'],coffeeFermentation:['Tradicional','Anaeróbica']};
export function roastCode(p){return p.category==='Cafés'?({clara:'TC',media:'TM',escura:'TE'}[norm(p.coffeeRoast)]||''):'';}
export function roastRank(p){return ({TC:0,TM:1,TE:2})[roastCode(p)]??3;}
export function coffeeName(p){const code=roastCode(p);return String(p.name||'')+(code&&!new RegExp('\\b'+code+'$').test(p.name||'')?' '+code:'');}
export function coffeeOrigin(p){return p.category==='Cafés'?[p.coffeeSpecies,p.coffeeVariety].filter(Boolean).join(' – '):'';}
export function coffeeIdentity(p){return p.category==='Cafés'&&COFFEE_FIELDS.some(k=>p[k])?COFFEE_FIELDS.map(k=>norm(p[k])).join('|'):'';}
export function validateCoffee(p){if(p.category!=='Cafés')return;for(const k of COFFEE_FIELDS){if(p[k]!==undefined&&(typeof p[k]!=='string'||p[k].length>80))throw Error('Revise as configurações do café.');}if(p.coffeeRoast&&!COFFEE_OPTIONS.coffeeRoast.some(v=>norm(v)===norm(p.coffeeRoast)))throw Error('Escolha Torra Clara, Média ou Escura.');}
