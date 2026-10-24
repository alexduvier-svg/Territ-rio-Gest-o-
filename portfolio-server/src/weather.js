import cities from './weather-cities.json' with { type: 'json' };

const norm = value => String(value || '').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
const lookup = new Map(cities.map(row => [norm(row[1])+'|'+row[2],row]));
const pending = new Map();
// A weather query is a grid cell, never an identified producer or a track.
export function weatherTarget(url) {
  const hasLat=url.searchParams.has('lat'),hasLon=url.searchParams.has('lon');
  if(!hasLat&&!hasLon){const city=weatherCity(url.searchParams.get('city'),url.searchParams.get('uf'));return city?{id:city[0],city,lat:city[3],lon:city[4],cachePath:'/weather-cache/v1/'+city[0]}:null;}
  const number=name=>{const raw=url.searchParams.get(name)||'';return /^-?\d{1,3}(?:\.\d{1,6})?$/.test(raw)?Number(raw):NaN;};
  const rawLat=number('lat'),rawLon=number('lon');
  if(!hasLat||!hasLon||!Number.isFinite(rawLat)||!Number.isFinite(rawLon)||Math.abs(rawLat)>90||Math.abs(rawLon)>180)return null;
  const lat=Math.round(rawLat*1000)/1000||0,lon=Math.round(rawLon*1000)/1000||0,id='point:'+lat.toFixed(3)+','+lon.toFixed(3);
  let nearest=null,distance=Infinity;
  for(const row of cities){const km=Math.hypot((lat-row[3])*111.2,(lon-row[4])*111.2*Math.cos(lat*Math.PI/180));if(km<distance){nearest=row;distance=km;}}
  const city=distance<=80?nearest:['point','Localização Atual','',lat,lon];
  return {id,city,lat,lon,cachePath:'/weather-cache/v2/'+id,location:{kind:'coordinates',latitude:lat,longitude:lon,gridDecimals:3,reference:'forecast-grid',municipalityNearby:distance<=80,distanceKm:distance<=80?Math.round(distance):null}};
}

export function weatherCity(name,uf) { return lookup.get(norm(name)+'|'+String(uf||'').toUpperCase()); }
const finite = value => typeof value === 'number' && Number.isFinite(value);
export function normalizeForecast(body, city, now=Date.now(), expires=now+1800000, location=null) {
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
    issuedAt:body.properties?.meta?.updated_at || new Date(now).toISOString(),retrievedAt:now,expiresAt:Math.max(now+1800000,expires),points:points.slice(0,250),stale:false,...(location?{location}:{})};
}
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
async function forecastResponse(data,request){
  const body=JSON.stringify(data),bytes=new TextEncoder().encode(body),hash=await crypto.subtle.digest('SHA-256',bytes);
  const etag='"'+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')+'"';
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','etag':etag};
  // A CDN can weaken the validator when compressing JSON. GET uses weak comparison.
  const matches=(request.headers.get('if-none-match')||'').split(',').some(value=>value.trim()==='*'||value.trim().replace(/^W\//,'')===etag);
  return matches?new Response(null,{status:304,headers}):new Response(body,{headers});
}
export async function weatherRoute(request,{cache=globalThis.caches?.default,fetcher=fetch,now=Date.now()}={}) {
  if(request.method!=='GET') return json({error:'Método não permitido.'},405);
  const url=new URL(request.url),target=weatherTarget(url),city=target?.city;
  if(!target)return json({error:'Local inválido. Confira município/UF ou as coordenadas da consulta.'},url.searchParams.has('lat')||url.searchParams.has('lon')?400:404);
  const key=new Request(url.origin+target.cachePath),cached=await cache?.match(key),old=cached?await cached.json():null;
  // Background clients may only synchronize the shared cache. Never call MET here.
  if(url.searchParams.get('cacheOnly')==='1')return old?.points&&now-old.retrievedAt<86400000?forecastResponse({...old,stale:old.stale||now>old.expiresAt},request):new Response(null,{status:204,headers:{'cache-control':'no-store'}});
  if(old&&old.expiresAt>now)return old.error?json(old,503):forecastResponse(old,request);
  if(pending.has(target.id))return forecastResponse(await pending.get(target.id),request);
  const job=(async()=>{
    try {
      const headers={'User-Agent':'AGRO-Gestao/0.12.85 https://github.com/alexduvier-svg/Territ-rio-Gest-o-','Accept':'application/json','Accept-Encoding':'gzip, deflate'};
      if(old?.lastModified)headers['If-Modified-Since']=old.lastModified;
      const response=await fetcher('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat='+target.lat.toFixed(4)+'&lon='+target.lon.toFixed(4),{headers,signal:AbortSignal.timeout(12000)});
      const expires=Date.parse(response.headers.get('expires'))||now+1800000;
      let data;
      if(response.status===304&&old)data={...old,retrievedAt:now,expiresAt:Math.max(now+1800000,expires),stale:false};
      else{if(!response.ok)throw Error('Previsão indisponível.');data=normalizeForecast(await response.json(),city,now,expires,target.location);data.lastModified=response.headers.get('last-modified')||'';}
      await cache?.put(key,new Response(JSON.stringify(data),{headers:{'content-type':'application/json','cache-control':'public, max-age=86400'}}));
      return data;
    } catch(error) { if(old?.points&&now-old.retrievedAt<86400000)return {...old,stale:true};await cache?.put(key,new Response(JSON.stringify({error:'Previsão temporariamente indisponível.',expiresAt:now+900000}),{headers:{'cache-control':'public, max-age=900'}}));throw error; }
  })();
  pending.set(target.id,job);
  try{return forecastResponse(await job,request);}catch{return json({error:'Previsão indisponível agora. Suas vendas continuam funcionando.'},503);}finally{pending.delete(target.id);}
}
