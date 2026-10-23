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
  const points=(data?.points||[]).filter(p=>Number.isFinite(Date.parse(p.time))&&Number.isFinite(p.temp)).slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
  const current=points.filter(p=>Date.parse(p.time)<=now&&now<Date.parse(p.time)+HOUR).at(-1);
  return current||points.find(p=>Date.parse(p.time)>now&&Date.parse(p.time)<=now+6*HOUR)||null;
}

// The app labels all forecast times in Brasília (UTC-3), including day boundaries.
export const weatherDayKey = time => new Date(time - 3 * HOUR).toISOString().slice(0,10);
export function forecastDays(data,now=Date.now()) {
  const today=weatherDayKey(now),groups=new Map(),seen=new Set();
  const points=(data?.points||[]).filter(p=>Number.isFinite(Date.parse(p.time))&&Number.isFinite(p.temp))
    .slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time)).filter(p=>{if(seen.has(p.time))return false;seen.add(p.time);return true;});
  for(const point of points){
    const stamp=Date.parse(point.time),day=weatherDayKey(stamp);
    if(day<today||stamp<now-HOUR)continue;
    if(!groups.has(day))groups.set(day,[]);
    groups.get(day).push(point);
  }
  return [...groups].slice(0,10).map(([day,rows])=>{
    const start=Date.parse(day+'T00:00:00-03:00'),end=start+24*HOUR,from=Math.max(start,now);
    let cursor=from,rain=0,coverage=0,proportional=false;
    // MET amounts refer to following 1/6/12h intervals, not to instants.
    // Split midnight crossings proportionally and never add overlaps twice.
    for(const p of points){
      if(!Number.isFinite(p.hours)||p.hours<=0||p.hours>12||!Number.isFinite(p.rain)||p.rain<0)continue;
      const a=Date.parse(p.time),b=a+p.hours*HOUR,left=Math.max(from,a,cursor),right=Math.min(end,b);
      if(right<=left)continue;
      rain+=p.rain*(right-left)/(p.hours*HOUR);coverage+=right-left;cursor=right;
      if(right-left<p.hours*HOUR)proportional=true;
    }
    const temperatures=rows.map(p=>p.temp);
    return {day,points:rows,min:Math.min(...temperatures),max:Math.max(...temperatures),
      rain:coverage?rain:null,coverage,partial:from>start||coverage<end-from-1000,proportional};
  });
}
