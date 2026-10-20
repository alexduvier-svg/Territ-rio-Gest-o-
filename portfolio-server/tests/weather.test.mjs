import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherCity,normalizeForecast,weatherRoute} from '../src/weather.js';
const city=weatherCity('carangola','MG'),now=Date.parse('2026-10-20T09:00:00Z');
const body={properties:{meta:{updated_at:'2026-10-20T08:00:00Z'},timeseries:[{time:'2026-10-20T09:00:00Z',data:{instant:{details:{air_temperature:24}},next_1_hours:{summary:{symbol_code:'rain'},details:{precipitation_amount:1}}}}]}};
class Cache{map=new Map();async match(key){return this.map.get(key.url)?.clone();}async put(key,value){this.map.set(key.url,value.clone());}}
const request=()=>new Request('https://server.test/api/weather?city=Carangola&uf=MG');
test('IBGE municipal coordinates resolve accents and ambiguous cities require UF',()=>{assert.equal(city[0],'3113305');assert.equal(weatherCity('sao paulo','SP')[1],'São Paulo');assert.equal(weatherCity('Carangola','XX'),undefined);});
test('MET summary never manufactures missing rain probabilities or invalid temperatures',()=>{const data=normalizeForecast(body,city,now);assert.equal(data.points[0].probability,null);assert.equal(data.source,'MET Norway');assert.throws(()=>normalizeForecast({},city,now));});
test('identified cache proxy coalesces requests, hides client IP and serves a cached city',async()=>{
 const cache=new Cache();let count=0;
 const fetcher=async(url,{headers})=>{count++;assert(url.includes('lat=-20.7335'));assert(headers['User-Agent'].includes('AGRO-Gestao'));assert(!('CF-Connecting-IP' in headers));return Response.json(body,{headers:{expires:new Date(now+3600000).toUTCString(),'last-modified':'Tue, 20 Oct 2026 08:00:00 GMT'}});};
 const responses=await Promise.all([weatherRoute(request(),{cache,fetcher,now}),weatherRoute(request(),{cache,fetcher,now})]);assert.equal(count,1);assert(responses.every(r=>r.status===200));
 await weatherRoute(request(),{cache,fetcher,now:now+1000});assert.equal(count,1);
 const offline=await weatherRoute(request(),{cache,now:now+7200000,fetcher:async()=>{throw Error('offline');}});assert.equal((await offline.json()).stale,true);
});
test('unknown municipality and invalid methods cannot become arbitrary upstream URLs',async()=>{
 const fetcher=()=>{throw Error('Must not request');};assert.equal((await weatherRoute(new Request('https://server.test/api/weather?city=wrong&uf=MG'),{fetcher})).status,404);
 assert.equal((await weatherRoute(new Request(request(),{method:'POST'}),{fetcher})).status,405);
});

test('background cache-only requests never call MET, even with missing or expired cache',async()=>{
 const cache=new Cache(),background=()=>new Request(request().url+'&cacheOnly=1');
 const noFetch=()=>{throw Error('Background must not call provider');};
 assert.equal((await weatherRoute(background(),{cache,fetcher:noFetch,now})).status,204);
 const data=normalizeForecast(body,city,now-7200000,now-3600000);
 await cache.put(new Request('https://server.test/weather-cache/v1/'+city[0]),Response.json(data));
 const response=await weatherRoute(background(),{cache,fetcher:noFetch,now});assert.equal(response.status,200);assert.equal((await response.clone().json()).stale,true);
 const etag=response.headers.get('etag');assert(etag);
 const conditional=new Request(background(),{headers:{'If-None-Match':etag}});
 assert.equal((await weatherRoute(conditional,{cache,fetcher:noFetch,now})).status,304);
 const compressed=new Request(background(),{headers:{'If-None-Match':'W/'+etag}});
 assert.equal((await weatherRoute(compressed,{cache,fetcher:noFetch,now})).status,304);
});

test('forecast revalidation respects provider expiry and supports a 30-minute minimum',async()=>{
 const cache=new Cache();let requests=0;
 const fetcher=async()=>{requests++;return Response.json(body,{headers:{expires:new Date(now+1800000).toUTCString()}});};
 const response=await weatherRoute(request(),{cache,fetcher,now});assert.equal((await response.clone().json()).expiresAt,now+1800000);
 await weatherRoute(request(),{cache,fetcher,now:now+1799999});assert.equal(requests,1);
 const conditional=new Request(request(),{headers:{'If-None-Match':response.headers.get('etag')}});
 assert.equal((await weatherRoute(conditional,{cache,fetcher,now:now+1000})).status,304);assert.equal(requests,1);
});
