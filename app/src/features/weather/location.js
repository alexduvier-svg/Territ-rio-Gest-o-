// No browser permission or sensor is accessed by these pure helpers.
export function gridPosition(value){
  const latitude=value?.latitude,longitude=value?.longitude;
  if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
  return {latitude:Math.round(latitude*1000)/1000||0,longitude:Math.round(longitude*1000)/1000||0};
}
export function isPointLocation(loc){return !!gridPosition(loc);}
export function weatherLocationKey(loc){const p=gridPosition(loc);return p?'point:'+p.latitude.toFixed(3)+','+p.longitude.toFixed(3):String(loc?.city||'').normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase()+'|'+String(loc?.uf||'').toUpperCase();}
export function weatherQuery(loc){const p=gridPosition(loc);return p?'lat='+p.latitude.toFixed(3)+'&lon='+p.longitude.toFixed(3):'city='+encodeURIComponent(loc?.city||'')+'&uf='+encodeURIComponent(loc?.uf||'');}
export function forecastMatchesLocation(data,loc){const point=gridPosition(loc);return point?data?.location?.kind==='coordinates'&&weatherLocationKey(data.location)===weatherLocationKey(point):!data?.location&&weatherLocationKey({city:data?.city?.name,uf:data?.city?.uf})===weatherLocationKey(loc);}
