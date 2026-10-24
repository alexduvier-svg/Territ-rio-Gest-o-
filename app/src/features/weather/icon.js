// Static local outline vectors; provider symbols never become markup.
const cloud='<path class="weather-cloud-shape" d="M18 15.5H6.5a4 4 0 0 1-.3-8A6 6 0 0 1 17.7 9a3.3 3.3 0 0 1 .3 6.5Z"/>';
const sun='<g class="weather-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g>';
const moon='<path class="weather-moon" d="M19.3 15.5A8 8 0 0 1 8.5 4.7a8 8 0 1 0 10.8 10.8Z"/>';
export function weatherIcon(point){
 const symbol=String(point?.symbol||''),storm=/thunder/.test(symbol),wet=storm||/rain|sleet|snow/.test(symbol)||Number.isFinite(point?.rain)&&point.rain>0;
 const clear=/^clearsky_(day|night|polartwilight)$/.test(symbol)&&!wet,partial=/^(fair|partlycloudy)_|showers_/.test(symbol),night=/_night$/.test(symbol),celestial=night?moon:sun;
 const sky=clear?celestial:(partial?'<g transform="translate(9 -1) scale(.65)">'+celestial+'</g>':'')+cloud;
 return '<svg class="icon weather-cloud'+(wet?' weather-wet':'')+(storm?' weather-storm':'')+'" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+sky+(wet?'<path class="weather-rain" d="'+(storm?'m6 19-1 2m14-2-1 2':'m7 19-1 2m6-2-1 2m6-2-1 2')+'"/>':'')+(storm?'<path class="weather-lightning" d="m12 16-3 4h3l-1 3 5-6h-3l1-1Z"/>':'')+'</svg>';
}
