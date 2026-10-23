import { API } from '../server.js';
import {createWeatherClock,weatherDueAt,weatherPresentationDueAt} from './refresh.js';
import {weatherPeriod,weatherFreshness} from './presentation.js';
import {nativeWeather} from './native.js';
import { forecastWindow, nextForecastPoint, forecastDays, weatherDayKey } from './forecast.js';
import {weatherReading} from './query.js';
import {weatherIcon} from './icon.js';
const inflight=new Map(),failures=new Map(),controllers=new Map();let opened=null,appActive=true,clockEngine=null,nativeConfigKey=null,nativeConfigJob=null,epoch=0,checking=false,checkMessage='';
const bridge=()=>window.TerritorioWorkflowBridge;
const key=(city,uf)=>String(city||'').normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase()+'|'+String(uf||'').toUpperCase();
const location=event=>({city:event?.city||bridge().data().settings.city,uf:event?.uf||bridge().data().settings.uf});
const cache=()=>bridge().data().weatherCacheV1 ||= {};
const cached=loc=>{const d=cache()[key(loc.city,loc.uf)];return d?.version===1&&d.source==='MET Norway'&&Array.isArray(d.points)&&Number.isFinite(d.retrievedAt)&&Number.isFinite(d.expiresAt)?d:null;};
const number=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
const clock=t=>new Date(t).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
const date=t=>new Date(t).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit'});
const esc=value=>bridge().escape(value);
function freshness(data,loc){
  const state=weatherFreshness(data,weatherDueAt(data,retryAt(key(loc.city,loc.uf),data)),Date.now(),navigator.onLine!==false);
  return state?'<section class="weather-freshness" aria-label="Atualização da Previsão"><strong>'+esc(state.saved)+'</strong><span>'+esc(state.issued)+'</span>'+(state.checked?'<span>'+esc(state.checked)+'</span>':'')+'<span>'+esc(state.next)+'</span></section>':'';
}
async function syncNative(){
  if(!nativeWeather)return;
  const settings=bridge().data().settings,loc=location(),options={active:settings.weatherEnabled===true,enabled:settings.weatherEnabled===true&&settings.weatherBackgroundEnabled!==false,...loc};
  const signature=JSON.stringify(options);if(signature===nativeConfigKey)return nativeConfigJob;
  nativeConfigKey=signature;nativeConfigJob=Promise.resolve(nativeConfigJob).catch(()=>{}).then(()=>nativeWeather.configure(options)).catch(()=>{if(nativeConfigKey===signature)nativeConfigKey=null;});return nativeConfigJob;
}
function retryAt(id,data){return Math.max(data?.retryAt||0,(failures.get(id)||0)+15*60000);}
function validForecast(data,loc){return data?.version===1&&data.source==='MET Norway'&&key(data.city?.name,data.city?.uf)===key(loc.city,loc.uf)&&Array.isArray(data.points)&&Number.isFinite(data.expiresAt)&&Number.isFinite(data.retrievedAt);}
export async function getWeather(loc) {
  if(bridge().data().settings.weatherEnabled!==true)return null;
  const id=key(loc.city,loc.uf),old=cached(loc),now=Date.now();
  if(old&&now<weatherDueAt(old,retryAt(id,old)))return old;
  if(document.hidden||!appActive||navigator.onLine===false||!API||!loc.city||!loc.uf||now<retryAt(id,old))return old;
  if(inflight.has(id))return inflight.get(id);
  const token=epoch,job=(async()=>{try{
    let data;
    if(nativeWeather){await syncNative();if(token!==epoch)return null;data=(await nativeWeather.fetch(loc)).data;}
    else{
      const controller=new AbortController();controllers.set(id,controller);
      const response=await fetch(API+'/api/weather?city='+encodeURIComponent(loc.city)+'&uf='+encodeURIComponent(loc.uf),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
      if(!response.ok)throw Error('Sem previsão.');data=await response.json();data.checkedAt=now;
    }
    if(token!==epoch||bridge().data().settings.weatherEnabled!==true)return null;
    if(!validForecast(data,loc))throw Error('Previsão inválida.');
    data.points=data.points.filter(p=>Number.isFinite(Date.parse(p.time))&&Number.isFinite(p.temp)&&p.temp>=-80&&p.temp<=65&&Number.isFinite(p.hours)&&p.hours>=0&&p.hours<=12).slice(0,250);
    if(!data.points.length)throw Error('Sem dados.');
    // Keep provider validity and retrieval time; a cache check is not a new forecast.
    cache()[id]=data;for(const stale of Object.keys(cache()).sort((a,b)=>cache()[b].retrievedAt-cache()[a].retrievedAt).slice(10))delete cache()[stale];
    bridge().persist();failures.delete(id);return data;
  }catch(error){if(error?.name!=='AbortError'&&token===epoch)failures.set(id,now);return old?{...old,stale:true}:null;}finally{inflight.delete(id);controllers.delete(id);}})();
  inflight.set(id,job);return job;
}
export async function eventWeather(event,now=Date.now()) {
  const data=await getWeather(location(event)),summary=forecastWindow(data,event,now);
  if(!data||!summary.ready)return {status:'unavailable',text:'A previsão ainda não cobre todos os horários da feira. Consulte mais perto da data.'};
  return {status:'ready',city:data.city.name,rain:summary.rain,prob:summary.probability,partial:summary.partial,updatedAt:data.retrievedAt,stale:data.stale||now>data.expiresAt};
}
function eventLabel(data,event,summary=forecastWindow(data,event)){
  if(!data)return 'Tempo da feira · consultar';
  return summary.ready?'Chuva prevista · '+number(summary.rain)+' mm':'Previsão disponível mais perto da feira';
}
export function eventWeatherControl(event){const data=cached(location(event)),summary=forecastWindow(data,event);return bridge().button('weather-open',weatherIcon(summary.ready?{rain:summary.rain}:null)+'<span>'+esc(eventLabel(data,event,summary))+'</span>','weather-event',{event:event.id});}
export function localWeatherAnswer(question,event){if(/feira|evento/i.test(question)&&!event)return 'Qual feira, município e data? Selecione o evento na Gestão antes de consultar o tempo; não uso o endereço do negócio como se fosse o local da feira.';const loc=location(event);return weatherReading(question,{...loc,event,data:cached(loc),enabled:bridge().data().settings.weatherEnabled===true});}
function condition(point){
  const symbol=point?.symbol||'';
  if(/thunder/.test(symbol))return 'Trovoadas previstas';
  if(/sleet/.test(symbol))return 'Chuva e neve';
  if(/snow/.test(symbol))return 'Neve prevista';
  if(/heavyrain/.test(symbol))return 'Chuva forte';
  if(/lightrain/.test(symbol))return 'Chuva fraca';
  if(/rain/.test(symbol)||point?.rain>0)return 'Chuva prevista';
  if(/fog/.test(symbol))return 'Névoa';
  if(/partlycloudy/.test(symbol))return 'Parcialmente nublado';
  if(/cloudy/.test(symbol))return 'Nublado';
  if(/clearsky/.test(symbol))return 'Céu aberto';
  if(/fair/.test(symbol))return 'Poucas nuvens';
  return 'Previsão para agora';
}
function dayTitle(day){
  const today=weatherDayKey(Date.now()),tomorrow=weatherDayKey(Date.now()+86400000);
  if(day===today)return 'Hoje';if(day===tomorrow)return 'Amanhã';
  const label=new Date(day+'T12:00:00-03:00').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long'});
  return label.charAt(0).toUpperCase()+label.slice(1).replace('-feira','');
}
function hourCards(points,cls='weather-hours'){
  return '<div class="'+cls+'" tabindex="0" role="region" aria-label="Horários previstos; deslize para ver mais">'+points.map(p=>'<div class="weather-hour"><strong>'+clock(p.time)+'</strong><small>'+date(p.time)+'</small>'+weatherIcon(p)+'<span>'+number(p.temp)+'°</span><small>'+(Number.isFinite(p.rain)?number(p.rain)+' mm / '+p.hours+'h':'Chuva sem estimativa')+'</small></div>').join('')+'</div>';
}
function dailyCards(days){
  if(!days.length)return '';
  const low=Math.min(...days.map(d=>d.min)),high=Math.max(...days.map(d=>d.max)),span=Math.max(1,high-low);
  return '<section class="weather-days"><h3>Próximos dias</h3><p class="weather-hint">Toque no dia para ver os horários.</p>'+days.map(d=>{
    const representative={rain:d.rain,symbol:d.points.some(p=>/thunder/.test(p.symbol||''))?'thunder':''},left=Math.max(0,Math.min(95,(d.min-low)/span*100)),width=Math.max(5,Math.min(100-left,(d.max-d.min)/span*100));
    return '<details class="weather-day" data-day="'+d.day+'"><summary><span class="weather-day-name"><strong>'+esc(dayTitle(d.day))+'</strong><small>'+d.day.slice(8,10)+'/'+d.day.slice(5,7)+(d.partial?' · parcial':'')+'</small></span><span class="weather-day-condition">'+weatherIcon(representative)+'<span>'+(d.rain===null?'Sem estimativa':number(d.rain)+' mm')+'</span></span><span class="weather-day-range" aria-label="Mínima '+number(d.min)+' e máxima '+number(d.max)+' graus nos horários previstos"><span class="weather-min">'+Math.round(d.min)+'°</span><i class="weather-temperature-track" aria-hidden="true"><i style="left:'+left.toFixed(1)+'%;width:'+width.toFixed(1)+'%"></i></i><strong>'+Math.round(d.max)+'°</strong></span><svg class="weather-day-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="weather-day-body"><p class="weather-hint">Mínima e máxima dos horários disponíveis.'+(d.partial?' Previsão parcial para este dia.':'')+(d.proportional?' Chuva estimada proporcionalmente nos intervalos que cruzam os limites do dia.':'')+'</p>'+hourCards(d.points,'weather-day-hours')+'</div></details>';
  }).join('')+'<p class="weather-hint">Somente dias disponíveis na previsão. Hoje considera o restante do dia; mínima e máxima são dos horários previstos. Volumes podem ser estimados em intervalos parciais.</p></section>';
}
function content(event){
  if(bridge().data().settings.weatherEnabled!==true)return '<div class="weather-view"><h3>Tempo na sua cidade e nas feiras</h3><p>Ao ativar, cidade e UF cadastradas são enviadas ao servidor do AGRO Gestão para consultar a previsão do MET Norway. Não usa GPS nem envia vendas, clientes ou estoque. A conexão utiliza endereços IP técnicos. Guardamos a última previsão no aparelho para consulta sem internet. No Android, o cache compartilhado pode ser sincronizado em segundo plano com internet e pelo menos 50% de bateria; você pode pausar essa função.</p>'+bridge().button('weather-enable','Ativar previsão','success modal-action')+'<p class="small muted">Você pode desativar aqui a qualquer momento. Dados: MET Norway, licença CC BY 4.0. Referência municipal: IBGE. A previsão não é certeza de chuva.</p></div>';
  const loc=location(event),data=cached(loc),point=nextForecastPoint(data),summary=event&&forecastWindow(data,event),days=forecastDays(data),rows=(data?.points||[]).filter(p=>Date.parse(p.time)>=Date.now()-3600000).slice(0,12);
  return '<div class="weather-view"><p class="weather-city">'+esc(loc.city||'Cidade não cadastrada')+' · '+esc(loc.uf||'')+'</p>'+(data?freshness(data,loc):'<p>Previsão indisponível agora. Confira a conexão e o município em Ajustes. As vendas continuam funcionando.</p>')+(point?'<div class="weather-now">'+weatherIcon(point)+'<div><strong>'+number(point.temp)+'°C</strong><span>'+esc(condition(point))+'</span><small>'+esc(weatherPeriod(point))+'</small></div></div>':'')+(event?'<section class="weather-event-summary"><h3>'+esc(event.name)+'</h3><p>'+esc(eventLabel(data,event))+'</p>'+(summary?.ready&&summary.probability!==null?'<p>Maior chance entre os períodos informados: '+number(summary.probability)+'%.</p>':'')+(summary?.partial?'<p class="small muted">Volume estimado proporcionalmente nos intervalos parciais.</p>':'')+'</section>':'')+(rows.length?'<section><h3>Próximas horas</h3>'+hourCards(rows)+'</section>':'')+dailyCards(days)+'<p class="small muted">Horários de Brasília. Referência: sede municipal; não usa GPS. Previsão não é medição nem certeza de chuva. Sem internet, exibimos a última previsão salva, com data e horário.</p><p class="small muted">Só cidade e UF são consultadas no servidor do AGRO Gestão; não enviamos vendas, clientes ou estoque. O servidor consulta coordenadas públicas do IBGE. Conexões de internet envolvem endereços IP técnicos.</p><p class="weather-source">Dados: <a href="https://api.met.no/" target="_blank" rel="noopener">MET Norway</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Dados resumidos pelo AGRO Gestão. Coordenadas: IBGE, Localidades 2022.</p>'+'<p class="weather-observation-note">Já está chovendo aí? A previsão pode diferir do que acontece no seu local. Atualizar consulta a fonte; não transforma a previsão em medição da chuva.</p>'+bridge().button('weather-check',checking?'Verificando…':'Verificar Atualização','choice modal-action'+(checking?' disabled':''))+(checkMessage?'<p class="weather-check-status" role="status">'+esc(checkMessage)+'</p>':'')+'<p class="small muted">Conferência econômica a partir de 30 minutos, respeitando a validade da fonte. Sem consultas contínuas. Ao voltar ao app, verificamos atualizações pendentes.</p>'+(nativeWeather?'<p class="small muted">Segundo plano: somente cache compartilhado, internet e bateria a partir de 50%. O Android pode adiar a tarefa; não há garantia de previsão nova antes de sair sem sinal.</p>'+bridge().button('weather-background-toggle',bridge().data().settings.weatherBackgroundEnabled===false?'Ativar atualização em segundo plano':'Pausar atualização em segundo plano','choice modal-action'):'')+bridge().button('weather-disable','Desativar previsão','choice modal-action')+'</div>';
}
function paintOpen(){
  if(bridge().modal()?.kind!=='weather')return;
  const old=document.querySelector('#dialog .weather-view');if(!old)return;
  const scroll=document.getElementById('checkout-scroll'),offset=scroll?.scrollTop||0,firstForecast=!old.querySelector('.weather-now')&&!!nextForecastPoint(cached(location(opened)));
  const days=new Set([...old.querySelectorAll('.weather-day[open]')].map(el=>el.dataset.day));
  const tracks=[...old.querySelectorAll('.weather-hours,.weather-day-hours')].map(el=>el.scrollLeft);
  old.outerHTML=content(opened);
  const view=document.querySelector('#dialog .weather-view');
  for(const el of view.querySelectorAll('.weather-day'))el.open=days.has(el.dataset.day);
  view.querySelectorAll('.weather-hours,.weather-day-hours').forEach((el,i)=>el.scrollLeft=tracks[i]||0);
  if(scroll)scroll.scrollTop=firstForecast?0:offset;
}
function decorate(){
  const b=bridge(),root=document.getElementById('app');
  if(b.page()==='Vender'){
    const toolbar=root.querySelector('.glass-area-label')||root.querySelector('.glass-sales-toolbar');
    if(toolbar&&!toolbar.querySelector('[data-action=weather-open]'))toolbar.insertAdjacentHTML('beforeend',b.button('weather-open',weatherIcon(null)+'<span>—°</span>','weather-pill'));
    const loc=location(),point=b.data().settings.weatherEnabled===true?nextForecastPoint(cached(loc)):null,pill=toolbar?.querySelector('.weather-pill');
    if(pill){
      const label=point?Math.round(point.temp)+'°':'—°',markup=weatherIcon(point)+'<span>'+label+'</span>';
      const stamp=label+'|'+(point?.symbol||'')+'|'+(point?.rain>0);if(pill.dataset.weatherStamp!==stamp){pill.innerHTML=markup;pill.dataset.weatherStamp=stamp;}
      const hint='Previsão do tempo em '+(loc.city||'sua cidade')+(point?', '+label+'. '+weatherPeriod(point):'. Toque para consultar');
      pill.setAttribute('aria-label',hint);pill.setAttribute('title',hint);
    }
  }
  if(b.page()==='Eventos')for(const card of root.querySelectorAll('.event-card')){
    const id=card.querySelector('[data-action=event-detail]')?.dataset.id,event=b.data().events.find(e=>e.id===id);if(!event||event.status==='finished')continue;
    let pill=card.querySelector('.weather-event');if(!pill){card.querySelector('.event-meta')?.insertAdjacentHTML('afterend',b.button('weather-open',weatherIcon(null)+'<span></span>','weather-event',{event:id}));pill=card.querySelector('.weather-event');}
    if(pill){const label=eventLabel(cached(location(event)),event),span=pill.querySelector('span');if(span.textContent!==label)span.textContent=label;}
  }
}
function locations(){
  const result=[location()];
  if(bridge().page()==='Eventos')for(const event of bridge().data().events.filter(e=>e.status==='active').slice(0,15))result.push(location(event));
  if(bridge().modal()?.kind==='weather')result.push(location(opened));
  return [...new Map(result.filter(l=>l.city&&l.uf).map(l=>[key(l.city,l.uf),l])).values()];
}
const canRun=()=>bridge().data().settings.weatherEnabled===true&&!document.hidden&&appActive&&navigator.onLine!==false&&!!API&&(['Vender','Eventos'].includes(bridge().page())||bridge().modal()?.kind==='weather')&&locations().length>0;
function pause(){clockEngine?.pause();for(const controller of controllers.values())controller.abort();}
async function resume(){
  await syncNative();
  if(nativeWeather&&bridge().data().settings.weatherEnabled===true&&appActive&&!document.hidden){let changed=false;
    for(const loc of locations()){try{const data=(await nativeWeather.read(loc)).data,old=cached(loc);if(validForecast(data,loc)&&(!old||data.retrievedAt>old.retrievedAt||data.expiresAt!==old.expiresAt||data.checkedAt>old.checkedAt)){cache()[key(loc.city,loc.uf)]=data;changed=true;}}catch{}}
    if(changed)bridge().persist();
  }
  decorate();paintOpen();void clockEngine?.wake();
}
function update(){decorate();void syncNative();if(canRun())void clockEngine?.wake();else pause();}
export function installWeather(){
  clockEngine=createWeatherClock({canRun,nextAt:()=>Math.min(...locations().map(loc=>{const data=cached(loc),id=key(loc.city,loc.uf);return Math.min(weatherDueAt(data,retryAt(id,data)),weatherPresentationDueAt(data));})),
    refresh:async()=>{await syncNative();for(const loc of locations()){if(!canRun())break;await getWeather(loc);}},onDone:()=>{decorate();paintOpen();}});
  bridge().actions['weather-check']=async()=>{
    if(checking)return;checking=true;checkMessage='';paintOpen();
    try{await syncNative();const loc=location(opened),before=cached(loc),data=await getWeather(loc);
      checkMessage=!data||data.stale||Date.now()>data.expiresAt?'Sem uma nova previsão disponível. A última cópia foi preservada.':before?.issuedAt===data.issuedAt?'A fonte mantém a mesma previsão. Respeitamos seu prazo de atualização.':'Previsão disponível conferida. Veja o horário da fonte acima.';
    }finally{checking=false;decorate();paintOpen();update();}
  };
  bridge().actions['weather-enable']=()=>{bridge().data().settings.weatherEnabled=true;bridge().persist();paintOpen();void resume();};
  bridge().actions['weather-disable']=()=>{epoch++;bridge().data().settings.weatherEnabled=false;bridge().data().weatherCacheV1={};bridge().persist();pause();void syncNative();decorate();paintOpen();};
  bridge().actions['weather-background-toggle']=()=>{bridge().data().settings.weatherBackgroundEnabled=bridge().data().settings.weatherBackgroundEnabled===false;bridge().persist();void syncNative();paintOpen();};
  bridge().actions['weather-open']=async d=>{checkMessage='';opened=d.event?bridge().data().events.find(e=>e.id===d.event):null;bridge().open('Tempo',content(opened),bridge().button('close-modal','Voltar','sheet-back'),'weather');const dialog=document.getElementById('dialog');dialog.setAttribute('data-no-close','');dialog.setAttribute('data-bottom-back','');dialog.querySelector('.dialog-close')?.remove();await getWeather(location(opened));paintOpen();update();};
  new MutationObserver(update).observe(document.getElementById('app'),{childList:true});
  new MutationObserver(()=>{if(canRun())void clockEngine.wake();else pause();}).observe(document.getElementById('dialog'),{attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else void resume();});
  window.addEventListener('online',()=>{failures.clear();void resume();});window.addEventListener('offline',pause);
  nativeWeather?.observe(active=>{appActive=active;if(active)void resume();else pause();}).catch(()=>{});
  window.TerritorioWeatherRefresh=Object.freeze({snapshot:()=>({...clockEngine.snapshot(),intervalMinutes:30,backgroundMinimumBattery:50})});
  void resume();
}
