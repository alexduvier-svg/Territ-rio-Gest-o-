import { normalizePortuguese } from '../portuguese.js';
// Conservative adapter for the user's language seed. No transaction, price inference or storage.
import lexicon from './lexicon.json' with { type: 'json' };

export const cleanSpeech = value => String(value ?? '').normalize('NFKC')
  .replace(/[\u200b-\u200f\u2060\ufeff]/g, '').replace(/[，。！？；：]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
const norm = value => normalizePortuguese(cleanSpeech(value));
const lemma = word => Object.hasOwn(lexicon.numerals,word) ? word : ({cafes:'cafe',especiais:'especial',graos:'grao',moi:'maco',mois:'maco',duzias:'duzia',quilos:'quilo',gramas:'grama'}[word] || (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word));
const tokens = s => norm(s).replace(/(\d)([a-z])/g, '$1 $2').match(/\d+(?:[.,]\d+)?|[a-z]+/g) || [];
const aliases = lexicon.products.flatMap(p => [p.plural, ...p.aliases].map(a => [norm(a), norm(p.name)]))
  .filter(([a,b]) => a && a !== b).sort((a,b) => b[0].length-a[0].length);
const aliasMatchers=aliases.map(([from,to])=>[new RegExp('(?<![a-z])'+from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![a-z])','g'),to]);
const labelCache=new Map();
function canonical(text) {
  let result=' '+norm(text)+' ';
  for (const [pattern,to] of aliasMatchers) result=result.replace(pattern,to);
  return tokens(result).map(lemma);
}
const numerals = lexicon.numerals;
function numberAt(words,start) {
  const first=words[start];if (/^\d/.test(first||'')) return {value:Number(first.replace(',','.')),end:start+1};
  if (!Object.hasOwn(numerals,first||'')) return null;
  let value=0,group=0,end=start;
  for(let i=start;i<words.length;i++) {
    const w=words[i];if(w==='e'&&Object.hasOwn(numerals,words[i+1]||'')){end=i+1;continue;}
    if(!Object.hasOwn(numerals,w))break;
    const n=numerals[w];if(n===1000){value+=(group||1)*1000;group=0;}else group+=n;end=i+1;
  }
  return {value:value+group,end};
}
const ignore = new Set(['vendi','vende','vender','venda','adicionar','adicione','coloca','coloque','quero','eu','de','do','da','o','a','os','as','um','uma','por','favor','no','na','em','e','para','pacote','pacotes','unidade','unidades','pct','un','duzia','dz','maco','molho','quilo','kg','grama','g','litro','l','ml','mililitro']);
const physical = new Map([['g',1],['grama',1],['kg',1000],['quilo',1000],['ml',1],['mililitro',1],['l',1000],['litro',1000]]);
export function interpretSpeech(text, products) {
  const original=cleanSpeech(text),words=canonical(original);
  for(let i=0;i<words.length;i++){const n=numberAt(words,i);if(n&&['quilo','kg','litro','duzia'].includes(words[n.end])&&words[n.end+1]==='e'&&['meio','meia'].includes(words[n.end+2])){words.splice(i,n.end-i+3,String(n.value+.5),words[n.end]);break;}}
  const fail=message=>({original,status:'review',message,candidates:[],quantity:null});
  if(!original)return fail('Não ouvi uma frase. Tente novamente ou digite.');
  if(words.some(w=>['nao','nunca','ontem','amanha','anteontem','perdi','sobrou','sobraram','levei','devolvi','cancela','cancelar','quanto','custa','custou','sera'].includes(w))||/[?？]/.test(original))return fail('Essa fala não é uma inclusão de produto. Nenhuma venda foi alterada.');
  // Money/payment is deliberately not inferred: price and payment stay in the normal sale flow.
  if(words.some(w=>['real','reais','conto','centavo','pix','pics','dinheiro','credito','debito','cartao','cada','total'].includes(w))||/\br\$/i.test(original))return fail('Diga só produto, apresentação e quantidade. Confira preço e pagamento no carrinho.');
  const measures=[],numbers=[];
  for(let i=0;i<words.length;i++){const n=numberAt(words,i);if(!n)continue;const unit=words[n.end];numbers.push({...n,start:i});if(physical.has(unit))measures.push({...n,start:i,unit,amount:n.value*physical.get(unit)});i=n.end-1;}
  if(measures.length>1)return fail('Diga uma apresentação por vez, por exemplo: três cafés especiais de 250 gramas.');
  // "3 cafés gourmet 250": the trailing number is a package size only if the real catalog matches it.
  if(!measures.length&&numbers.length===2){const last=numbers[1];if(last.end===words.length&&last.start>numbers[0].end)measures.push({...last,unit:'grama',amount:last.value,bare:true});}
  const measured=new Set(measures.flatMap(m=>Array.from({length:m.end-m.start+(m.bare?0:1)},(_,j)=>m.start+j)));
  const amounts=numbers.filter(n=>!measures.some(m=>m.start===n.start));
  if(amounts.length>1)return fail('Ouvi mais de uma quantidade. Diga um produto por vez ou corrija o texto.');
  let quantity=amounts[0]?.value??null;
  const numericIndexes=new Set(numbers.flatMap(n=>Array.from({length:n.end-n.start},(_,j)=>n.start+j)));
  const request=words.filter((w,i)=>!numericIndexes.has(i)&&!measured.has(i)&&!ignore.has(w));
  if(!request.length)return fail('Diga o nome do produto que está no seu estoque.');
  const candidates=[];
  for(const p of products||[]){
    if(!p.id||p.archived||p.active===false)continue;
    const labelKey=[p.id,p.name,p.type,p.format].join('|');if(!labelCache.has(labelKey)){if(labelCache.size>6000)labelCache.clear();labelCache.set(labelKey,canonical([p.name,p.type,p.format].filter(Boolean).join(' ')));}const label=labelCache.get(labelKey);
    if(!request.every(w=>label.includes(w)))continue;
    // All name qualifiers must be spoken, otherwise the person chooses the variety.
    if(measures.length){const m=measures[0],liquid=['l','litro','ml','mililitro'].includes(m.unit),bulk=liquid?['Litro','ml'].includes(p.unit):['kg','g'].includes(p.unit);
      if(bulk){if(quantity!==null||m.bare)continue;}
      else if(Math.abs(Number(liquid?p.volume:p.weight)-m.amount)>0.001)continue;
    }
    if(words.includes('duzia')||words.includes('dz')){if(!['Dúzia','Meia Dúzia','Unidade'].includes(p.unit))continue;}
    if(words.includes('maco')||(words.includes('molho')&&!canonical(p.name).includes('molho'))){if(p.unit!=='Maço')continue;}
    if(words.includes('pacote')||words.includes('pct')){if(p.unit!=='Pacote')continue;}
    candidates.push(p);
  }
  let selected=candidates.length===1?candidates[0]:null;
  if(selected&&measures.length&&['kg','g','Litro','ml'].includes(selected.unit)){const m=measures[0];quantity=['kg','Litro'].includes(selected.unit)?m.amount/1000:m.amount;}
  if(selected&&(words.includes('duzia')||words.includes('dz'))&&quantity!==null)quantity*=selected.unit==='Unidade'?12:selected.unit==='Meia Dúzia'?2:1;
  const result={original,candidates:candidates.slice(0,60),quantity,productId:selected?.id||null,status:'review',message:''};
  if(!candidates.length)result.message='Não encontrei esse produto e apresentação no seu cadastro. Corrija o texto ou escolha manualmente.';
  else if(!selected)result.message='Escolha o produto e a apresentação que você quis dizer.';
  else if(!Number.isFinite(quantity)||quantity<=0)result.message='Informe a quantidade. O peso da embalagem não é a quantidade de pacotes.';
  else if(!['kg','g','Litro','ml'].includes(selected.unit)&&!Number.isInteger(quantity))result.message='Essa unidade exige quantidade inteira no carrinho. Confira a unidade ou faça a inclusão manual.';
  else if(quantity>selected.stock)result.message='A quantidade é maior que o estoque disponível. Confira antes de continuar.';
  else {result.status='ready';result.message='Confira antes de levar ao carrinho.';}
  return result;
}

export function voiceHints(products) {
  const weights={50:'cinquenta',100:'cem',125:'cento e vinte e cinco',200:'duzentos',250:'duzentos e cinquenta',300:'trezentos',350:'trezentos e cinquenta',400:'quatrocentos',500:'quinhentos',750:'setecentos e cinquenta',1000:'mil'};
  return [...new Set((products||[]).filter(p=>p.stock>0).map(p=>cleanSpeech([p.name,p.format,weights[p.weight]?`${weights[p.weight]} gramas`:''].filter(Boolean).join(' '))))].slice(0,60);
}
