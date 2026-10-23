import {forecastDays,weatherDayKey} from './forecast.js';
const num=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
export function weatherReading(question,{enabled=false,city='',uf='',data=null,now=Date.now(),event=null}={}){
  if(!enabled)return 'A previsão está desativada. Ative o Tempo na Área de Vendas; nenhuma permissão de GPS é necessária.';
  const place=[city,uf].filter(Boolean).join(' · ');
  if(!data||data.source!=='MET Norway'||!Number.isFinite(data.retrievedAt)||!Number.isFinite(data.expiresAt))return `Ainda não há previsão salva para ${place||'o município cadastrado'}. Abra o Tempo com internet para consultar. Não há confirmação de chuva.`;
  const stamp=new Date(data.retrievedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),source=`${place} · MET Norway · previsão salva em ${stamp} (Brasília).`;
  if(data.stale||now>data.expiresAt)return source+' A validade terminou. Atualize no Tempo antes de tomar uma decisão; não uso essa cópia para afirmar se vai chover.';
  const text=String(question||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase(),explicit=text.match(/\b(\d{4}-\d{2}-\d{2})\b/),target=explicit?.[1]||(/amanha/.test(text)?weatherDayKey(now+86400000):/feira|evento/.test(text)&&event?event.start:weatherDayKey(now));
  const day=forecastDays(data,now).find(d=>d.day===target);
  if(!day)return source+` A previsão disponível não cobre ${target}. Consulte mais perto da data; não estimo chuva fora do horizonte da fonte.`;
  const detail=day.rain===null?'Chuva sem estimativa nos intervalos disponíveis.':`${num(day.rain)} mm de chuva previstos nos intervalos disponíveis${day.partial?' (dia parcial)':''}${day.proportional?'; intervalos parciais estimados proporcionalmente':''}.`;
  const rainy=day.points.filter(p=>p.rain>0).slice(0,4).map(p=>new Date(p.time).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})+` (${num(p.rain)} mm / ${p.hours}h)`);
  return [source,`${target.split('-').reverse().join('/')} · ${num(day.min)}° a ${num(day.max)}° nos horários previstos. ${detail}`,rainy.length?'Intervalos com chuva: '+rainy.join('; ')+'.':'',day.rain>0?'O que avaliar: confirme cobertura e proteção dos produtos, transporte e validade. Confira estoque livre e pedidos antes de ajustar a carga. A previsão sozinha não justifica levar menos nem demonstra que suas vendas cairão.':'O que avaliar: confira as condições mais perto de sair e planeje estoque a partir das vendas e sobras registradas, sem supor procura pelo clima.','É previsão para a sede municipal, não medição no local nem garantia. Mais detalhes no Tempo da Área de Vendas.'].filter(Boolean).join('\n\n');
}
