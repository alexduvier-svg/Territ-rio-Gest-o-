import test from 'node:test';import assert from 'node:assert/strict';
import {gridPosition,isPointLocation,weatherLocationKey,weatherQuery,forecastMatchesLocation} from '../src/features/weather/location.js';
import {weatherIcon} from '../src/features/weather/icon.js';
import {weatherReading} from '../src/features/weather/query.js';
const point={latitude:-20.733456,longitude:-42.029456};
test('device coordinates are bounded and rounded before keys or requests; zero is a valid point',()=>{
 assert.deepEqual(gridPosition(point),{latitude:-20.733,longitude:-42.029});assert.equal(weatherLocationKey(point),'point:-20.733,-42.029');assert.equal(weatherQuery(point),'lat=-20.733&lon=-42.029');
 assert(isPointLocation({latitude:0,longitude:0}));for(const p of [{latitude:91,longitude:0},{latitude:0,longitude:-181},{latitude:NaN,longitude:1},{latitude:'-20',longitude:-42},{latitude:Infinity,longitude:1}])assert.equal(gridPosition(p),null);
});
test('municipality and point caches cannot be substituted or matched to a different cell',()=>{
 const municipal={city:'Carangola',uf:'MG'},data={city:{name:'Carangola',uf:'MG'}},geo={...data,location:{kind:'coordinates',...gridPosition(point)}};
 assert(forecastMatchesLocation(data,municipal));assert(forecastMatchesLocation(geo,point));assert(!forecastMatchesLocation(data,point));assert(!forecastMatchesLocation(geo,municipal));assert(!forecastMatchesLocation(geo,{latitude:-20.730,longitude:-42.029}));
 assert(!forecastMatchesLocation({...geo,location:{kind:'coordinates',latitude:NaN,longitude:0}},{latitude:0,longitude:0}));assert.equal(weatherQuery(municipal),'city=Carangola&uf=MG');
});
test('same grid cell is stable across extra sensor precision and negative zero',()=>{
 assert.equal(weatherLocationKey(point),weatherLocationKey({...point,latitude:-20.73349}));assert.equal(weatherLocationKey({latitude:-0,longitude:0}),weatherLocationKey({latitude:0,longitude:-0}));assert.deepEqual(gridPosition(gridPosition(point)),gridPosition(point));
});
test('sun, night, showers and sustained rain retain distinct static provider symbols',()=>{
 const clear=weatherIcon({symbol:'clearsky_day',temp:31,rain:0});assert.match(clear,/weather-sun/);assert.doesNotMatch(clear,/weather-rain|weather-cloud-shape/);
 assert.match(weatherIcon({symbol:'clearsky_night',rain:0}),/weather-moon/);
 const shower=weatherIcon({symbol:'lightrainshowers_day',temp:31,rain:.1});assert.match(shower,/weather-sun/);assert.match(shower,/weather-cloud-shape/);assert.match(shower,/weather-rain/);assert.doesNotMatch(shower,/weather-lightning/);
 const rain=weatherIcon({symbol:'heavyrain',temp:31,rain:2.5});assert.match(rain,/weather-rain/);assert.doesNotMatch(rain,/weather-sun|weather-moon/);
 assert.doesNotMatch(weatherIcon({temp:40,rain:0}),/weather-sun|weather-rain/);
});
test('GPS weather answers identify the area and never claim a municipal-seat observation',()=>{
 const now=Date.parse('2026-10-24T15:00:00-03:00'),data={source:'MET Norway',retrievedAt:now,expiresAt:now+1800000,location:{kind:'coordinates',...gridPosition(point)},points:[{time:new Date(now).toISOString(),temp:31,hours:1,rain:.1,symbol:'lightrainshowers_day'}]};
 const answer=weatherReading('Vai chover hoje?',{enabled:true,city:'Localização Atual',data,now});assert.match(answer,/área consultada pela localização do aparelho/);assert.doesNotMatch(answer,/É previsão para a sede municipal/);assert.match(answer,/não medição no local/);
});
