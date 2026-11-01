import {contextOf,eligible} from './core.js';
import {normalize} from '../stock-entries.js';
export function isUnavailableStockQuestion(text){
 const q=normalize(text);
 if(/\bacab(?:ou|aram) de\b/.test(q))return false;
 return /\b(?:acabou|acabaram|esgotad[oa]s?|zerou|zeraram|zerad[oa]s?)\b|\bsem (?:estoque|saldo|produto)|\bnao tenho mais\b/.test(q);
}
export function stockAvailability(data,{productIds=null,all=false}={}){
 const ctx=contextOf(data),products=(data.products||[]).filter(p=>eligible(p,ctx)&&p.active!==false&&!p.archived),rows=productIds?products.filter(p=>productIds.includes(p.id)):all?products:[];
 if(!rows.length)return {needsClarification:!all,text:all?'Não há produtos ativos cadastrados nesta base para conferir o estoque.':'Não identifiquei o produto ou a família no cadastro. Qual nome e apresentação você quer conferir?'};
 const number=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n),label=p=>p.name+(p.weight?' · '+p.weight+' g':'');
 for(const p of rows)if(!Number.isFinite(p.stock)||!p.unit)throw Error('O saldo ou a unidade de '+label(p)+' não está registrado de forma válida. Confira esse produto no Estoque.');
 const empty=rows.filter(p=>p.stock<=0),line=p=>label(p)+': '+number(p.stock)+' '+p.unit;
 return {needsClarification:false,referenceProductIds:(empty.length?empty:rows).map(p=>p.id),text:empty.length?'Produtos sem estoque físico disponível agora\n'+empty.map(line).join('\n')+'\nSaldo físico geral do produtor. Estoque zerado não comprova que o produto tenha sido vendido.':'Nenhum dos produtos consultados está sem estoque físico.\nSaldos atuais:\n'+rows.map(line).join('\n')};
}
