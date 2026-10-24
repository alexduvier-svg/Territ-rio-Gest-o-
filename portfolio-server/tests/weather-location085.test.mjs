import test from 'node:test';import assert from 'node:assert/strict';
import {weatherTarget,weatherRoute} from '../src/weather.js';
const url=params=>new URL('https://server.test/api/weather?'+params),now=Date.parse('2026-10-24T18:00:00Z');
const body={properties:{meta:{updated_at:new Date(now).toISOString()},timeseries:[{time:new Date(now).toISOString(),data:{instant:{details:{air_temperature:31}},next_1_hours:{summary:{symbol_code:'lightrainshowers_day'},details:{precipitation_amount:.1}}}}]}};
class Cache{map=new Map();async match(k){return this.map.get(k.url)?.clone();}async put(k,v){this.map.set(k.url,v.clone());}}
test('point targets use normalized cells, keep municipal routes unchanged and reject partial/invalid coordinates',()=>{
 const t=weatherTarget(url('lat=-20.733456&lon=-42.029456'));assert.equal(t.id,'point:-20.733,-42.029');assert.equal(t.location.kind,'coordinates');assert.equal(t.city[1],'Carangola');assert.equal(t.lat,-20.733);assert.equal(t.lon,-42.029);
 assert.equal(weatherTarget(url('city=Carangola&uf=MG')).cachePath,'/weather-cache/v1/3113305');
 for(const q of ['lat=90.01&lon=0','lat=0&lon=-180.1','lat=0','lon=0','lat=NaN&lon=0','lat=Infinity&lon=0','lat=1e2&lon=0','lat=https://evil.test&lon=0'])assert.equal(weatherTarget(url(q)),null);
});
test('identified point queries coalesce per cell, preserve provider symbols, and do not reuse another point',async()=>{
 const cache=new Cache();let calls=0;const fetcher=async(input,{headers})=>{calls++;assert(input.startsWith('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=-20.7330&lon=-42.0290'));assert(headers['User-Agent'].includes('AGRO-Gestao'));return Response.json(body,{headers:{expires:new Date(now+1800000).toUTCString()}});};
 const req=()=>new Request(url('lat=-20.733456&lon=-42.029456'));
 const results=await Promise.all([weatherRoute(req(),{cache,fetcher,now}),weatherRoute(req(),{cache,fetcher,now})]);assert.equal(calls,1);const data=await results[0].json();assert.equal(data.location.latitude,-20.733);assert.equal(data.points[0].symbol,'lightrainshowers_day');assert.equal(data.points[0].rain,.1);assert.equal(data.points[0].temp,31);assert.equal(data.location.gridDecimals,3);
 await weatherRoute(req(),{cache,fetcher:()=>{throw Error('must use cache')},now:now+1000});assert.equal(calls,1);
 const missing=await weatherRoute(new Request(url('lat=-20.730&lon=-42.029&cacheOnly=1')),{cache,fetcher:()=>{throw Error('never fetch on background')},now});assert.equal(missing.status,204);
});
test('point cache-only/invalid requests never query MET and conditional responses retain the same grid',async()=>{
 const cache=new Cache(),req=new Request(url('lat=0&lon=0&cacheOnly=1')),noFetch=()=>{throw Error('must not fetch')};assert.equal((await weatherRoute(req,{cache,fetcher:noFetch,now})).status,204);
 assert.equal((await weatherRoute(new Request(url('lat=91&lon=0')),{cache,fetcher:noFetch,now})).status,400);
 const response=await weatherRoute(new Request(url('lat=0&lon=0')),{cache,fetcher:async()=>Response.json(body),now}),data=await response.json();assert.equal(data.location.latitude,0);assert.equal(data.location.longitude,0);assert.equal(data.location.municipalityNearby,false);
 const cached=await weatherRoute(req,{cache,fetcher:noFetch,now}),etag=cached.headers.get('etag');assert(etag);assert.equal((await weatherRoute(new Request(req,{headers:{'If-None-Match':etag}}),{cache,fetcher:noFetch,now})).status,304);
});
