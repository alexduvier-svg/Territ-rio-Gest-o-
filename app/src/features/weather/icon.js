// Static outline vectors: no bitmaps, animation, timers or extra requests.
const cloud='<path class="weather-cloud-shape" d="M18 15.5H6.5a4 4 0 0 1-.3-8A6 6 0 0 1 17.7 9a3.3 3.3 0 0 1 .3 6.5Z"/>';
export function weatherIcon(point){
 const symbol=point?.symbol||'',storm=/thunder/.test(symbol),wet=storm||/rain|sleet|snow/.test(symbol)||Number.isFinite(point?.rain)&&point.rain>0;
 return '<svg class="icon weather-cloud'+(wet?' weather-wet':'')+(storm?' weather-storm':'')+'" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+cloud+(wet?'<path class="weather-rain" d="'+(storm?'m6 19-1 2m14-2-1 2':'m7 19-1 2m6-2-1 2m6-2-1 2')+'"/>':'')+(storm?'<path class="weather-lightning" d="m12 16-3 4h3l-1 3 5-6h-3l1-1Z"/>':'')+'</svg>';
}
