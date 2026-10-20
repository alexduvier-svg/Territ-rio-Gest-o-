import cities from './weather-cities.json' with { type: 'json' };

const norm = value => String(value || '').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
const lookup = new Map(cities.map(row => [norm(row[1])+'|'+row[2],row]));
const pending = new Map();
export function weatherCity(name,uf) { return lookup.get(norm(name)+'|'+String(uf||'').toUpperCase()); }
const finite = value => typeof value === 'number' && Number.isFinite(value);
export function normalizeForecast(body, city, now=Date.now(), expires=now+3600000) {
  const points = [];
  for (const row of body?.properties?.timeseries || []) {
    const time = Date.parse(row.time), temp = row.data?.instant?.details?.air_temperature;
    if (!Number.isFinite(time) || (!finite(temp)||temp< -80||temp>65)) continue;
    const span = [1,6,12].find(hours => row.data?.['next_'+hours+'_hours']);
    const next = row.data?.['next_'+span+'_hours'], details = next?.details || {};
    points.push({time:row.time,temp,hours:span||0,rain:finite(details.precipitation_amount)&&details.precipitation_amount>=0?details.precipitation_amount:null,
      probability:finite(details.probability_of_precipitation)&&details.probability_of_precipitation>=0&&details.probability_of_precipitation<=100?details.probability_of_precipitation:null,symbol:String(next?.summary?.symbol_code||'').slice(0,64)});
  }
  if (!points.length) throw Error('Previsão sem dados válidos.');
  return {version:1,city:{id:city[0],name:city[1],uf:city[2],lat:city[3],lon:city[4]},source:'MET Norway',license:'CC BY 4.0',
    issuedAt:body.properties?.meta?.updated_at || new Date(now).toISOString(),retrievedAt:now,expiresAt:Math.max(now+3600000,expires),points:points.slice(0,250),stale:false};
}
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export async function weatherRoute(request,{cache=globalThis.caches?.default,fetcher=fetch,now=Date.now()}={}) {
  if(request.method!=='GET') return json({error:'Método não permitido.'},405);
  const url=new URL(request.url),city=weatherCity(url.searchParams.get('city'),url.searchParams.get('uf'));
  if(!city)return json({error:'Município não encontrado na base IBGE. Confira cidade e UF.'},404);
  const key=new Request(url.origin+'/weather-cache/v1/'+city[0]),cached=await cache?.match(key),old=cached?await cached.json():null;
  if(old&&old.expiresAt>now)return json(old,old.error?503:200);
  if(pending.has(city[0]))return json(await pending.get(city[0]));
  const job=(async()=>{
    try {
      const headers={'User-Agent':'AGRO-Gestao/0.12.24 https://github.com/alexduvier-svg/Territ-rio-Gest-o-','Accept':'application/json','Accept-Encoding':'gzip, deflate'};
      if(old?.lastModified)headers['If-Modified-Since']=old.lastModified;
      const response=await fetcher('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat='+city[3].toFixed(4)+'&lon='+city[4].toFixed(4),{headers,signal:AbortSignal.timeout(12000)});
      const expires=Date.parse(response.headers.get('expires'))||now+3600000;
      let data;
      if(response.status===304&&old)data={...old,retrievedAt:now,expiresAt:Math.max(now+3600000,expires),stale:false};
      else{if(!response.ok)throw Error('Previsão indisponível.');data=normalizeForecast(await response.json(),city,now,expires);data.lastModified=response.headers.get('last-modified')||'';}
      await cache?.put(key,new Response(JSON.stringify(data),{headers:{'content-type':'application/json','cache-control':'public, max-age=86400'}}));
      return data;
    } catch(error) { if(old?.points&&now-old.retrievedAt<86400000)return {...old,stale:true};await cache?.put(key,new Response(JSON.stringify({error:'Previsão temporariamente indisponível.',expiresAt:now+900000}),{headers:{'cache-control':'public, max-age=900'}}));throw error; }
  })();
  pending.set(city[0],job);
  try{return json(await job);}catch{return json({error:'Previsão indisponível agora. Suas vendas continuam funcionando.'},503);}finally{pending.delete(city[0]);}
}
