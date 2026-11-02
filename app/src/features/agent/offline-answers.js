// 148 · Respostas diretas dos motores locais para perguntas frequentes do produtor.
// Funciona sem internet e sem modelo de IA. Somente leitura: nunca grava, nunca presume.
// Cada resposta informa o período, o critério e o que ficou de fora (vendas sem cliente,
// custos ausentes etc.), no mesmo formato do readQuery.
import {contextOf,eligible,scopeSales} from './core.js';
import {normalize,queryPeriod} from '../stock-entries.js';

const qty=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((n||0)/100);
const pct=(a,b)=>b>0?(a/b*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
const within=(d,p)=>{const t=Date.parse(d);return Number.isFinite(t)&&t>=p.start&&t<=p.end;};
const WEEKDAYS=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const LOW_RATIO=.25; // mesmo critério do Estoque (STOCK_LOW_RATIO)

// Abreviações e grafias comuns em mensagens de celular.
const ABBREVIATIONS=[[/\bqto\b/g,'quanto'],[/\bqtos\b/g,'quantos'],[/\bqta\b/g,'quanta'],[/\bqtas\b/g,'quantas'],[/\bqtd\b|\bqtde\b/g,'quantidade'],[/\bvc\b/g,'voce'],[/\bpq\b/g,'por que'],[/\btb\b|\btbm\b/g,'tambem'],[/\bhj\b/g,'hoje'],[/\bmes passado\b/g,'mes passado'],[/\bp\/\s*/g,'para '],[/\bpro\b/g,'para o'],[/\bpra\b/g,'para'],[/\bkilo\b|\bquilos?\b/g,'kg']];
export function expandAbbreviations(text){let q=normalize(text);for(const [re,to] of ABBREVIATIONS)q=q.replace(re,to);return q;}

function result(text,source,{needsClarification=false,now=Date.now()}={}){
 return {intent:'integrated-read',referenceProductIds:null,needsClarification,text,generatedAt:now,specialists:[{name:'Consulta local validada',source}],confidence:'Somente registros deste produtor e do local selecionado. Informações ausentes permanecem explícitas.',insights:[],rebuys:[]};
}
function periodOf(q,now,period){
 try{return queryPeriod(q,now,period);}catch{return period?{...period,label:period.label||'período selecionado na Gestão'}:{start:0,end:now,label:'histórico disponível'};}
}
function salesIn(data,scopeId,p,now){return scopeSales(data,scopeId,now).filter(s=>s.status==='completed'&&within(s.date,p));}
function activeProducts(data){const ctx=contextOf(data);return (data.products||[]).filter(p=>eligible(p,ctx)&&p.active!==false&&!p.archived);}
function label(p){return [p.name,p.type&&!String(p.name||'').includes(p.type)?p.type:'',p.format,p.weight?(p.weight>=1000?qty(p.weight/1000)+' kg':qty(p.weight)+' g'):''].filter(Boolean).join(' · ');}
function reference(data,p){let ref=0;for(const m of (data.movements||[]).filter(m=>m.productId===p.id).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))){if(['initial','correct','unify'].includes(m.kind))ref=m.after;else if(m.kind==='add')ref=Math.max(ref,m.after);}return Math.max(ref,p.stock||0,0);}

export function offlineAnswer(data,text,{scopeId='all',period=null,now=Date.now(),financialComparison=null}={}){
 const q=expandAbbreviations(text);
 const asksSales=/vend|fatur|receita|ganh/.test(q);

 // Forma de pagamento.
 if(/(?:forma|meio|metodo|tipo)s? de pagamento|\bpix\b|\bdinheiro\b|\bcartao\b|\bcredito\b|\bdebito\b/.test(q)&&/vend|receb|pag|entrou|mais|menos|qual|quanto/.test(q)&&!/fiado.*(?:aberto|devend)|a receber/.test(q)){
  const p=periodOf(q,now,period),sales=salesIn(data,scopeId,p,now),by=new Map();let total=0;
  for(const s of sales){const parts=Array.isArray(s.payments)&&s.payments.length?s.payments:[{method:s.payment||'Não informado',amount:s.total}];for(const part of parts){const m=part.method||'Não informado',v=Number(part.amount)||0;by.set(m,(by.get(m)||{amount:0,count:0}));by.get(m).amount+=v;by.get(m).count++;total+=v;}}
  const rows=[...by].sort((a,b)=>b[1].amount-a[1].amount);
  return result(rows.length?'Vendas por forma de pagamento · '+p.label+'\n'+rows.map(([m,r])=>m+': '+money(r.amount)+' ('+pct(r.amount,total)+', '+r.count+(r.count===1?' venda':' vendas')+')').join('\n')+'\nMais usada: '+rows[0][0]+'. Vendas concluídas; pagamentos divididos contam em cada forma.':'Nenhuma venda concluída em '+p.label+' para comparar formas de pagamento.','Vendas concluídas · pagamentos registrados',{now});
 }

 // Preço: mais caro / mais barato (cadastro, não vendas).
 if(/mais car[oa]s?|mais barat[oa]s?|preco mais (?:alto|baixo)|maior preco|menor preco/.test(q)&&!/vend(?:eu|i|ido)? mais|mais vendid/.test(q)){
  const rows=activeProducts(data).filter(p=>Number.isSafeInteger(p.price)&&p.price>0).sort((a,b)=>b.price-a.price);
  if(!rows.length)return result('Nenhum produto ativo tem preço de venda cadastrado.','Cadastro de produtos',{now});
  const top=rows.slice(0,3),bottom=rows.slice(-3).reverse(),line=p=>label(p)+': '+money(p.price)+(p.unit?' por '+p.unit.toLowerCase():'');
  return result('Preços de venda cadastrados · '+rows.length+' produtos ativos\nMais caros: '+top.map(line).join('; ')+'\nMais baratos: '+bottom.map(line).join('; ')+'\nComparação pelo preço de cada apresentação; não converte para preço por kg.','Cadastro de produtos · preço de venda atual',{now});
 }

 // Produtos sem venda no período.
 if(/(?:nao|nenhum[ao]?|sem) (?:vend|saiu|tiveram? (?:venda|saida))|nao venderam|ficou parado|encalhad/.test(q)&&/produt|item|ite[mn]s|o que|quais/.test(q)){
  const p=periodOf(q,now,period),sold=new Set(salesIn(data,scopeId,p,now).flatMap(s=>(s.items||[]).map(i=>i.productId)));
  const rows=activeProducts(data).filter(x=>!sold.has(x.id)&&(x.stock||0)>0);
  return result('Produtos com estoque e sem venda · '+p.label+'\n'+(rows.length?rows.slice(0,25).map(x=>label(x)+': '+qty(x.stock)+' '+(x.unit||'')).join('\n')+(rows.length>25?'\n… e mais '+(rows.length-25)+' produtos.':''):'Todos os produtos com estoque tiveram venda no período.')+'\nNão indica a causa; confira preço, exposição e época.','Vendas concluídas e saldo físico atual',{now});
 }

 // Quem mais comprou / melhores clientes.
 if(/quem (?:mais )?compr|melhor(?:es)? client|client\w* (?:que )?mais|maior(?:es)? client|principa(?:l|is) client/.test(q)){
  const p=periodOf(q,now,period),ctx=contextOf(data),by=new Map();let anonymous=0,anonymousCount=0;
  for(const s of salesIn(data,scopeId,p,now)){const c=(data.clients||[]).find(c=>c.id===(s.customerId||s.clientId)&&eligible(c,ctx)),name=c?.name||s.customerName||'';if(!name){anonymous+=s.total||0;anonymousCount++;continue;}const r=by.get(name)||{amount:0,count:0};r.amount+=s.total||0;r.count++;by.set(name,r);}
  const rows=[...by].sort((a,b)=>b[1].amount-a[1].amount).slice(0,10);
  return result('Clientes que mais compraram · '+p.label+'\n'+(rows.length?rows.map(([n,r],i)=>(i+1)+'. '+n+': '+money(r.amount)+' em '+r.count+(r.count===1?' compra':' compras')).join('\n'):'Nenhuma venda com cliente identificado no período.')+(anonymousCount?'\nSem cliente identificado: '+anonymousCount+' vendas ('+money(anonymous)+'), fora da classificação.':''),'Vendas concluídas · cliente informado na venda',{now});
 }

 // Dia da semana e horário.
 if(/dia da semana|que dia (?:eu )?(?:mais )?vend|melhor dia|dias? (?:que|de) mais vend/.test(q)||/(?:horario|que horas?|hora do dia|melhor hora)/.test(q)&&asksSales){
  const p=periodOf(q,now,period),sales=salesIn(data,scopeId,p,now),byHour=/horario|hora/.test(q),by=new Map();
  for(const s of sales){const d=new Date(Date.parse(s.date));const k=byHour?d.getHours():d.getDay();const r=by.get(k)||{amount:0,count:0};r.amount+=s.total||0;r.count++;by.set(k,r);}
  const rows=[...by].sort((a,b)=>b[1].amount-a[1].amount),name=k=>byHour?String(k).padStart(2,'0')+'h às '+String(k+1).padStart(2,'0')+'h':WEEKDAYS[k];
  return result((byHour?'Vendas por horário':'Vendas por dia da semana')+' · '+p.label+'\n'+(rows.length?rows.map(([k,r])=>name(k)+': '+money(r.amount)+' · '+r.count+(r.count===1?' venda':' vendas')).join('\n')+'\nMelhor '+(byHour?'horário':'dia')+': '+name(rows[0][0])+'.':'Nenhuma venda concluída no período.')+(sales.length&&sales.length<10?'\nPoucas vendas no período; use como indicação, não como padrão.':''),'Vendas concluídas · data e hora do registro',{now});
 }

 // Acabando / repor.
 if(/acaband|vai acabar|estoque baixo|pouco estoque|baixo estoque|o que (?:devo|preciso) repor|precis\w* (?:de )?repor|devo repor|repor (?:o que|quais)|reposic/.test(q)){
  const rows=activeProducts(data).map(p=>{const ref=reference(data,p),stock=p.stock||0,min=Number(p.min)||0;return {p,stock,state:stock<=0?'out':(min>0&&stock<=min)||(ref>0&&stock/ref<=LOW_RATIO)?'low':'ok'};});
  const out=rows.filter(r=>r.state==='out'),low=rows.filter(r=>r.state==='low'),line=r=>label(r.p)+': '+qty(r.stock)+' '+(r.p.unit||'');
  return result('Reposição · posição atual do estoque\nEsgotados ('+out.length+'): '+(out.length?out.slice(0,15).map(line).join('; '):'nenhum')+'\nEstoque baixo ('+low.length+'): '+(low.length?low.slice(0,15).map(line).join('; '):'nenhum')+'\nCritério do Estoque: baixo quando chega ao mínimo cadastrado ou a 25% da última carga.','Saldo físico atual e movimentações de entrada',{now});
 }

 // Valor do estoque.
 if(/valor (?:total )?(?:do|de|em|no) (?:meu |seu )?estoque|quanto vale (?:o |meu )?estoque|estoque vale|dinheiro (?:parado )?(?:em|no) estoque/.test(q)){
  const rows=activeProducts(data).filter(p=>(p.stock||0)>0);let cost=0,missing=0,sale=0;
  for(const p of rows){sale+=(p.price||0)*p.stock;if(Number.isFinite(p.cost)&&p.cost>0)cost+=p.cost*p.stock;else missing++;}
  return result('Valor do estoque atual · '+rows.length+' produtos com saldo\nPelo custo: '+money(Math.round(cost))+(missing?' ('+missing+' produtos sem custo cadastrado ficaram de fora)':'')+'\nPelo preço de venda: '+money(Math.round(sale))+'\nO valor pelo preço de venda não é lucro garantido: depende de vender tudo pelo preço atual.','Saldo físico atual × custo e preço cadastrados',{now});
 }

 // Quantos produtos cadastrados.
 if(/quantos produtos|quantidade de produtos|quantos itens/.test(q)&&/cadastr|tenho|exist|ativos?/.test(q)&&!/vend|estoque/.test(q)){
  const rows=activeProducts(data),by=new Map();for(const p of rows)by.set(p.category||'Sem categoria',(by.get(p.category||'Sem categoria')||0)+1);
  return result('Produtos cadastrados ativos: '+rows.length+'\n'+[...by].sort((a,b)=>b[1]-a[1]).map(([c,n])=>c+': '+n).join('\n')+'\nCom saldo em estoque: '+rows.filter(p=>(p.stock||0)>0).length+'. Esgotados: '+rows.filter(p=>(p.stock||0)<=0).length+'.','Cadastro de produtos',{now});
 }

 // Comparação com o mês anterior.
 if(financialComparison&&(/compar\w*.*mes|mes (?:passado|anterior).*compar|vendi mais (?:que|do que) (?:no )?mes|cresc\w* .*mes|(?:melhor|pior) (?:que|do que) (?:o )?mes/.test(q)))
  return {...result(financialComparison(text),'finance.statement e kpi.periodChange',{now}),specialists:[{name:'Gestão e Finanças',source:'finance.statement e kpi.periodChange'}],confidence:'Mesmos demonstrativos e limites da Gestão.'};

 return null;
}
