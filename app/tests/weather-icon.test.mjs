import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherIcon} from '../src/features/weather/icon.js';
test('rain and positive precipitation use wet cloud without inventing thunder',()=>{for(const point of [{symbol:'lightrain'},{symbol:'rainshowers_day'},{symbol:'sleet'},{symbol:'snow'},{rain:1}]){const svg=weatherIcon(point);assert.match(svg,/weather-wet/);assert.match(svg,/weather-rain/);assert.doesNotMatch(svg,/weather-lightning/);}});
test('only explicit forecast thunder enables the lightning drawing',()=>{for(const symbol of ['rainandthunder','heavyrainshowersandthunder_day','thunder'])assert.match(weatherIcon({symbol}),/weather-lightning/);});
test('unknown, dry and invalid precipitation do not imply rain',()=>{for(const point of [null,{}, {symbol:'cloudy',rain:0},{rain:NaN},{rain:'1'},{rain:Infinity}])assert.doesNotMatch(weatherIcon(point),/weather-wet|weather-lightning/);});
test('icons contain static local vectors without interpolated symbols or resources',()=>{const svg=weatherIcon({symbol:'rain<img src=x onerror=alert(1)>'});assert.doesNotMatch(svg,/<img|onerror|href=|<animate|<image/);assert.match(svg,/weather-cloud-shape/);});
