import { API } from '../server.js';
import { forecastWindow, nextForecastPoint } from './forecast.js';
const inflight=new Map(),failures=new Map();let opened=null;
const bridge=()=>window.TerritorioWorkflowBridge;
const key=(city,uf)=>String(city||'').normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase()+'|'+String(uf||'').toUpperCase();
const location=event=>({city:event?.city||bridge().data().settings.city,uf:event?.uf||bridge().data().settings.uf});
const cache=()=>bridge().data().weatherCacheV1 ||= {};
const cached=loc=>{const d=cache()[key(loc.city,loc.uf)];return d?.version===1&&d.source==='MET Norway'&&Array.isArray(d.points)&&Number.isFinite(d.retrievedAt)&&Number.isFinite(d.expiresAt)?d:null;};
const number=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
const clock=t=>new Date(t).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
const date=t=>new Date(t).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit'});
// Compact vector, no emoji/font dependency or idle animation.
const cloud='<path d="M18 15.5H6.5a4 4 0 0 1-.3-8A6 6 0 0 1 17.7 9a3.3 3.3 0 0 1 .3 6.5Z"/>';
const weatherIcon=point=>'<svg class="icon weather-cloud" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+cloud+(point&&(/rain|sleet|snow/.test(point.symbol||'')||point.rain>0)?'<path class="weather-rain" d="m7 19-1 2m6-2-1 2m6-2-1 2"/>':'')+'</svg>';
const esc=value=>bridge().escape(value);
function age(data){return (data.stale||!navigator.onLine||Date.now()>data.expiresAt?'Última previsão salva':'Atualizado')+' às '+clock(data.retrievedAt)+' · '+date(data.retrievedAt);}
export async function getWeather(loc) {
  if(bridge().data().settings.weatherEnabled!==true)return null;
  const id=key(loc.city,loc.uf),old=cached(loc),now=Date.now();
  if(old&&now<old.expiresAt)return old;
  if(document.hidden||!API||!loc.city||!loc.uf||now-(failures.get(id)||0)<15*60000)return old;
  if(inflight.has(id))return inflight.get(id);
  const job=(async()=>{try{
    const response=await fetch(API+'/api/weather?city='+encodeURIComponent(loc.city)+'&uf='+encodeURIComponent(loc.uf),{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Sem previsão.');
    const data=await response.json();
    if(data.version!==1||data.source!=='MET Norway'||key(data.city?.name,data.city?.uf)!==id||!Array.isArray(data.points)||!Number.isFinite(data.expiresAt)||!Number.isFinite(data.retrievedAt))throw Error('Previsão inválida.');
    data.points=data.points.filter(p=>Number.isFinite(Date.parse(p.time))&&Number.isFinite(p.temp)&&p.temp>=-80&&p.temp<=65&&Number.isFinite(p.hours)&&p.hours>=0&&p.hours<=12).slice(0,250);
    if(!data.points.length)throw Error('Sem dados.');
    data.expiresAt=Math.max(now+3600000,data.expiresAt)+Math.floor(Math.random()*240000);
    cache()[id]=data;for(const stale of Object.keys(cache()).sort((a,b)=>cache()[b].retrievedAt-cache()[a].retrievedAt).slice(10))delete cache()[stale];
    bridge().persist();failures.delete(id);return data;
  }catch{failures.set(id,now);return old?{...old,stale:true}:null;}finally{inflight.delete(id);}})();
  inflight.set(id,job);return job;
}
export async function eventWeather(event,now=Date.now()) {
  const data=await getWeather(location(event)),summary=forecastWindow(data,event,now);
  if(!data||!summary.ready)return {status:'unavailable',text:'A previsão ainda não cobre todos os horários da feira. Consulte mais perto da data.'};
  return {status:'ready',city:data.city.name,rain:summary.rain,prob:summary.probability,partial:summary.partial,updatedAt:data.retrievedAt,stale:data.stale||now>data.expiresAt};
}
function eventLabel(data,event){
  if(!data)return 'Tempo da feira · consultar';
  const summary=forecastWindow(data,event);
  return summary.ready?'Chuva prevista · '+number(summary.rain)+' mm':'Previsão disponível mais perto da feira';
}
function content(event){
  if(bridge().data().settings.weatherEnabled!==true)return '<div class="weather-view"><h3>Tempo na sua cidade e nas feiras</h3><p>Ao ativar, cidade e UF cadastradas são enviadas ao servidor do AGRO Gestão para consultar a previsão do MET Norway. Não usa GPS nem envia vendas, clientes ou estoque. A conexão utiliza endereços IP técnicos. Guardamos a última previsão no aparelho para consulta sem internet.</p>'+bridge().button('weather-enable','Ativar previsão','success modal-action')+'<p class="small muted">Você pode desativar aqui a qualquer momento. Dados: MET Norway, licença CC BY 4.0. Referência municipal: IBGE. A previsão não é certeza de chuva.</p></div>';
  const loc=location(event),data=cached(loc),point=nextForecastPoint(data),summary=event&&forecastWindow(data,event),rows=(data?.points||[]).filter(p=>Date.parse(p.time)>=Date.now()-3600000).slice(0,12);
  return '<div class="weather-view"><p class="weather-city">'+esc(loc.city||'Cidade não cadastrada')+' · '+esc(loc.uf||'')+'</p>'+(data?'<p class="small muted">'+esc(age(data))+'</p>':'<p>Previsão indisponível agora. Confira a conexão e o município em Ajustes. As vendas continuam funcionando.</p>')+(point?'<div class="weather-now">'+weatherIcon(point)+'<strong>'+number(point.temp)+'°C</strong><span>Previsão para agora</span></div>':'')+(event?'<section class="weather-event-summary"><h3>'+esc(event.name)+'</h3><p>'+esc(eventLabel(data,event))+'</p>'+(summary?.ready&&summary.probability!==null?'<p>Maior chance entre os períodos informados: '+number(summary.probability)+'%.</p>':'')+(summary?.partial?'<p class="small muted">Volume estimado proporcionalmente nos intervalos parciais.</p>':'')+'</section>':'')+(rows.length?'<h3>Próximos horários</h3><div class="weather-hours">'+rows.map(p=>'<div><strong>'+date(p.time)+' · '+clock(p.time)+'</strong><span>'+number(p.temp)+'°C</span><small>'+(p.rain===null?'Chuva sem estimativa':number(p.rain)+' mm / '+p.hours+'h')+'</small></div>').join('')+'</div>':'')+'<p class="small muted">Horários de Brasília. Referência: sede municipal; não usa GPS. Previsão não é medição nem certeza de chuva. Sem internet, exibimos a última previsão salva, com data e horário.</p><p class="small muted">Só cidade e UF são consultadas no servidor do AGRO Gestão; não enviamos vendas, clientes ou estoque. O servidor consulta coordenadas públicas do IBGE. Conexões de internet envolvem endereços IP técnicos.</p><p class="weather-source">Dados: <a href="https://api.met.no/" target="_blank" rel="noopener">MET Norway</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Dados resumidos pelo AGRO Gestão. Coordenadas: IBGE, Localidades 2022.</p>'+bridge().button('weather-disable','Desativar previsão','choice modal-action')+'</div>';
}
function paintOpen(){if(bridge().modal()?.kind!=='weather')return;const old=document.querySelector('#dialog .weather-view');if(!old)return;const scroll=document.getElementById('checkout-scroll'),offset=scroll?.scrollTop||0,firstForecast=!old.querySelector('.weather-now')&&!!nextForecastPoint(cached(location(opened)));old.outerHTML=content(opened);if(scroll)scroll.scrollTop=firstForecast?0:offset;}
function decorate(){
  const b=bridge(),root=document.getElementById('app');
  if(b.page()==='Vender'){
    const toolbar=root.querySelector('.glass-sales-toolbar');
    if(toolbar&&!toolbar.querySelector('[data-action=weather-open]'))toolbar.insertAdjacentHTML('beforeend',b.button('weather-open',weatherIcon(null)+'<span>—°</span>','weather-pill'));
    const loc=location(),point=b.data().settings.weatherEnabled===true?nextForecastPoint(cached(loc)):null,pill=toolbar?.querySelector('.weather-pill');
    if(pill){
      const label=point?Math.round(point.temp)+'°':'—°',markup=weatherIcon(point)+'<span>'+label+'</span>';
      if(pill.innerHTML!==markup)pill.innerHTML=markup;
      const hint='Previsão do tempo em '+(loc.city||'sua cidade')+(point?', '+label+' para agora':'. Toque para consultar');
      pill.setAttribute('aria-label',hint);pill.setAttribute('title',hint);
    }
  }
  if(b.page()==='Eventos')for(const card of root.querySelectorAll('.event-card')){
    const id=card.querySelector('[data-action=event-detail]')?.dataset.id,event=b.data().events.find(e=>e.id===id);if(!event||event.status==='finished')continue;
    let pill=card.querySelector('.weather-event');if(!pill){card.querySelector('.event-meta')?.insertAdjacentHTML('afterend',b.button('weather-open',weatherIcon(null)+'<span></span>','weather-event',{event:id}));pill=card.querySelector('.weather-event');}
    if(pill)pill.querySelector('span').textContent=eventLabel(cached(location(event)),event);
  }
}
async function update(){
  decorate();if(document.hidden||!['Vender','Eventos'].includes(bridge().page()))return;
  const events=bridge().page()==='Eventos'?bridge().data().events.filter(e=>e.status==='active').slice(0,15):[null];
  const done=new Set();for(const event of events){if(document.hidden||!['Vender','Eventos'].includes(bridge().page()))break;const loc=location(event),id=key(loc.city,loc.uf);if(done.has(id))continue;done.add(id);await getWeather(loc);decorate();paintOpen();}
}
export function installWeather(){
  bridge().actions['weather-enable']=()=>{bridge().data().settings.weatherEnabled=true;bridge().persist();paintOpen();void update();};
  bridge().actions['weather-disable']=()=>{bridge().data().settings.weatherEnabled=false;bridge().data().weatherCacheV1={};bridge().persist();decorate();paintOpen();};
  bridge().actions['weather-open']=async d=>{opened=d.event?bridge().data().events.find(e=>e.id===d.event):null;bridge().open('Previsão do tempo',content(opened),bridge().button('close-modal','Voltar','sheet-back'),'weather');const dialog=document.getElementById('dialog');dialog.setAttribute('data-no-close','');dialog.setAttribute('data-bottom-back','');dialog.querySelector('.dialog-close')?.remove();await getWeather(location(opened));paintOpen();};
  new MutationObserver(()=>{void update();}).observe(document.getElementById('app'),{childList:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void update();});
  document.addEventListener('online',()=>{failures.clear();void update();});void update();
}
