// Recorded product attributes only. Missing roast in legacy records stays unknown.
const norm=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
export const COFFEE_FIELDS=['coffeeSpecies','coffeeVariety','coffeeRoast','coffeeProcess','coffeeFermentation'];
export const COFFEE_OPTIONS={coffeeSpecies:['Arábica','Canéfora','Blend'],coffeeVariety:['Catuaí','Mundo Novo','Bourbon','Acaiá','Icatu','Catucaí','Topázio','Arara','Conilon','Robusta'],coffeeRoast:['Clara','Média','Escura'],coffeeProcess:['Tradicional','Natural','Cereja Descascado','Lavado'],coffeeFermentation:['Tradicional','Anaeróbica']};
export function roastCode(p){return p.category==='Cafés'?({clara:'TC',media:'TM',escura:'TE',tc:'TC',tm:'TM',te:'TE'}[norm(p.coffeeRoast||(/^torra\s+(clara|média|media|escura)$/i.test(String(p.flavor||'').trim())?p.flavor:'')).replace(/^torra\s+/, '')]||''):'';}
export function roastRank(p){return ({TC:0,TM:1,TE:2})[roastCode(p)]??3;}
export function coffeeName(p){const code=roastCode(p),name=String(p.name||'');if(!code)return name;const words=name.split(/\s+/).filter(Boolean).filter(word=>word.toUpperCase()!==code);words.splice(Math.min(2,words.length),0,code);return words.join(' ');}
export function coffeeOrigin(p){return p.category==='Cafés'?[p.coffeeSpecies,p.coffeeVariety].filter(Boolean).join(' – '):'';}
export function coffeeIdentity(p){return p.category==='Cafés'&&COFFEE_FIELDS.some(k=>p[k])?COFFEE_FIELDS.map(k=>norm(p[k])).join('|'):'';}
export function validateCoffee(p){if(p.category!=='Cafés')return;for(const k of COFFEE_FIELDS){if(p[k]!==undefined&&(typeof p[k]!=='string'||p[k].length>80))throw Error('Revise as configurações do café.');}if(p.coffeeRoast&&!COFFEE_OPTIONS.coffeeRoast.some(v=>norm(v)===norm(p.coffeeRoast)))throw Error('Escolha Torra Clara, Média ou Escura.');}

// Reference models only. A real stock balance, price or cost always comes from the producer.
export const STANDARD_COFFEE_TYPES=Object.freeze(['Especial','Gourmet','Superior','Tradicional']);
export function standardCoffeeModels(format='Moído'){
 return STANDARD_COFFEE_TYPES.flatMap(type=>['Clara','Média','Escura'].flatMap(coffeeRoast=>[250,500,1000].map(weight=>({baseName:'Café',name:'Café '+type,category:'Cafés',type,coffeeRoast,format,unit:'Pacote',weight}))));
}
