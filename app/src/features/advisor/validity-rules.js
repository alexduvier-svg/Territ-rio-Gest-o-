// Deterministic facts supplied by the stock domain. Rules join the one advisor
// release flow; they do not buy, discount, discard or alter a label.
const qty=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:3});
const date=s=>s.split('-').reverse().join('/');
// Unidade por extenso no plural quando a quantidade não é 1 (10 pacotes, 12 dúzias); siglas (kg, g, L) ficam.
const unitText=(amount,unit)=>{const u=String(unit||'');if(!/^[A-ZÀ-Úa-zà-ú][a-zà-ú]+$/.test(u))return u;const low=u.toLocaleLowerCase('pt-BR');return Number(amount)===1||/s$/.test(low)?low:low+'s';};
// Nome como no Estoque (sigla da torra), para que os cafés não pareçam repetidos; lista curta, o detalhe fica nos números.
const SHOWN=5;
function advice(input,id,level,title,rows,todo,why,extra={}){
 const coffee=globalThis.TerritorioCoffee,names=new Map((input.products||[]).map(p=>[p.id,coffee?.coffeeName?coffee.coffeeName(p):p.name]));
 const line=r=>(names.get(r.productId)||'Produto')+': '+qty(r.amount)+' '+unitText(r.amount,r.unit)+(r.date?' · '+date(r.date):'');
 return{id,level,title,happened:rows.slice(0,SHOWN).map(line).join('; ')+(rows.length>SHOWN?'; e mais '+(rows.length-SHOWN)+(rows.length-SHOWN===1?' produto':' produtos'):'')+'.',todo,why,impact:rows.length,steps:[],topics:[],numbers:rows.map(r=>({label:names.get(r.productId)||'Produto',value:qty(r.amount)+' '+unitText(r.amount,r.unit),detail:r.date?'Data Registrada: '+date(r.date):'Quantidade Restante do Estoque Atual'})),cta:{label:'Conferir Lotes',action:'lots-agenda'},decision:{module:'estoque',confidence:'fato-registrado',rule_version:1,source:'lotes-canonicos'},...extra};
}
export function stockValidityRules(input){
 const v=input.stockValidity;if(!v||v.integrityIssues)return[];const rows=v.products||[],result=[];
 const expired=rows.filter(r=>r.expired>0).map(r=>({...r,amount:r.expired,date:r.earliest}));
 if(expired.length)result.push(advice(input,'validade-vencida','atencao','Conferir Lotes Vencidos',expired,'Confira os lotes e registre uma destinação, se houver perda. Eles já estão bloqueados para venda.','Vencimento não apaga o saldo físico. Nenhum descarte, desconto ou alteração de validade é realizado automaticamente.'));
 const upcoming=rows.filter(r=>r.expiring>0).map(r=>({...r,amount:r.expiring,date:r.earliestExpiring||r.eligibleEarliest||r.earliest}));
 if(upcoming.length)result.push(advice(input,'validade-proxima','atencao','Priorizar os Lotes que Vencem Primeiro',upcoming,'Confira as quantidades e datas antes de separar para a feira ou divulgar aos clientes.','Os registros mostram vencimentos próximos, sem prever procura. Antes de avaliar promoção, confira custos e despesas variáveis. Não se recomenda vender item vencido.'));
 const missing=rows.filter(r=>r.unknown>0).map(r=>({...r,amount:r.unknown,date:''}));
 if(missing.length)result.push(advice(input,'validade-nao-informada','atencao','Completar a Validade, se Disponível',missing,'Quando tiver a informação, complete a validade de cada entrada. O preenchimento continua opcional.','Sem data, o sistema não presume vencimento nem validade infinita. Não Se Aplica permanece separado.',{cadenceDays:7}));
 return result;
}
