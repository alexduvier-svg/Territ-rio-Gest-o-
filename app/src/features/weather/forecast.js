const HOUR=3600000;
export function forecastWindow(data,event,now=Date.now()) {
  const windows=[];
  for(let t=Date.parse(event.start+'T12:00:00Z'),end=Date.parse(event.end+'T12:00:00Z');t<=end&&windows.length<15;t+=24*HOUR){
    const day=new Date(t).toISOString().slice(0,10),start=Math.max(now,Date.parse(day+'T'+event.from+':00-03:00')),until=Date.parse(day+'T'+event.until+':00-03:00');
    if(until>start)windows.push([start,until]);
  }
  const expected=windows.reduce((sum,[a,b])=>sum+b-a,0);let coverage=0,rain=0,probability=null,partial=false;
  for(const [a,b]of windows){let cursor=a;
    for(const p of data?.points||[]){const start=Date.parse(p.time),end=start+p.hours*HOUR,from=Math.max(a,start,cursor),to=Math.min(b,end);
      if(!(to>from)||!Number.isFinite(p.rain)||!p.hours)continue;
      rain+=p.rain*(to-from)/(p.hours*HOUR);coverage+=to-from;cursor=to;
      if(to-from<p.hours*HOUR)partial=true;
      if(Number.isFinite(p.probability))probability=Math.max(probability??0,p.probability);
    }
  }
  return {ready:expected>0&&coverage>=expected-1000,rain,probability,partial,coverage,expected};
}
export function nextForecastPoint(data,now=Date.now()) {
  return data?.points?.find(p=>Date.parse(p.time)>=now-3600000&&Date.parse(p.time)<=now+6*3600000)||null;
}
