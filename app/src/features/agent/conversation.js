import {contextOf,eligible,scopeSales,revisionOf} from './core.js';
import {productReferences} from '../business-assistant.js';
import {balance,outstanding,day,validDay} from '../receivables/receivables.js';
import {normalizePortuguese as norm} from '../portuguese.js';
export function businessMessages(data,{scopeId='all',now=Date.now()}={}){
 const ctx=contextOf(data);if(!['real','demo','simulation'].includes(ctx.dataOrigin))return [];
 const messages=[],low=(data.products||[]).filter(p=>eligible(p,ctx)&&p.active!==false&&!p.archived&&Number.isFinite(p.stock)&&Number.isFinite(p.min)&&p.stock<=p.min);
 if(low.length)messages.push({id:'stock',text:`Há ${low.length} produto(s) no mínimo de estoque ou abaixo dele. Quer conferir?`,question:'Quais produtos preciso repor no estoque?'});
 const debts=outstanding(scopeSales(data,scopeId,now));if(debts.length&&debts.every(s=>Number.isSafeInteger(balance(s))))messages.push({id:'credit',text:`Há ${debts.length} venda(s) com fiado em aberto neste local. Vamos conferir?`,question:'Quem está me devendo?'});
 const next=(data.events||[]).filter(e=>eligible(e,ctx)&&validDay(e.start||e.date)&&(e.start||e.date)>=day(now)).sort((a,b)=>String(a.start||a.date).localeCompare(String(b.start||b.date)))[0];
 if(next)messages.push({id:'event',text:`Próximo evento cadastrado: ${next.name}, em ${next.start||next.date}. Quer conferir a agenda?`,question:'Quais os próximos eventos?'});return messages.slice(0,3);
}
export function rememberQuestion(question,data,describe){
 const products=productReferences(question,data,describe),q=' '+norm(question).replace(/[?.,]/g,' ')+' ',clients=(data.clients||[]).filter(c=>eligible(c,contextOf(data))&&norm(c.name)&&q.includes(' '+norm(c.name)+' '));
 const subject=clients.length===1?{kind:'client',name:clients[0].name}:products.length===1?{kind:'product',name:products[0].name+' '+describe(products[0])}:null;
 return {subject,question,actorId:contextOf(data).actorId,revision:revisionOf(data)};
}
export function resolveFollowUp(question,memory,data){
 const temporal=/^e (?:hoje|ontem)\??$/i.test(question.trim()),pronoun=/\b(?:dele|dela|desse|dessa)\b/i.test(question);
 if(!temporal&&!pronoun)return question;
 if(!memory||memory.actorId!==contextOf(data).actorId||memory.revision!==revisionOf(data))throw Error('Informe novamente o produto ou cliente para consultar os dados atuais.');
 if(temporal)return memory.question.replace(/\b(?:hoje|ontem)\b/gi,'').replace(/[?]+$/,'')+' '+question.trim().replace(/^e /i,'');
 if(!memory.subject)throw Error('A qual produto ou cliente você se refere? Informe o nome e a apresentação.');
 return question.replace(/\b(?:desse produto|dessa cliente|dele|dela|desse|dessa)\b/gi,()=>memory.subject.name);
}
export function followUpQuestions(m){
 if(m?.subject?.kind==='product')return ['Qual o estoque de '+m.subject.name+'?','Como está '+m.subject.name+'?'];
 if(m?.subject?.kind==='client')return ['Qual a última compra de '+m.subject.name+'?','Quanto '+m.subject.name+' deve?','Quais os pedidos de '+m.subject.name+'?'];
 return ['Como estão meus produtos?','Quem está me devendo?','Qual a previsão do tempo hoje?'];
}
