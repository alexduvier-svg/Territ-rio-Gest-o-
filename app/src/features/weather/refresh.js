export const WEATHER_INTERVAL = 30 * 60 * 1000;
export function weatherDueAt(data, retryAt=0) {
  const checked=Number.isFinite(data?.checkedAt)?data.checkedAt:data?.retrievedAt;
  return Math.max(Number.isFinite(checked)?checked+WEATHER_INTERVAL:0,Number.isFinite(data?.expiresAt)?data.expiresAt:0,retryAt);
}

// One deadline, no polling interval. Visibility/network/app state are external gates.
export function createWeatherClock({canRun,nextAt,refresh,onDone=()=>{},now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}) {
  let timer=null,deadline=null,running=null,stopped=false;
  const pause=()=>{if(timer!==null)clearTimer(timer);timer=deadline=null;};
  function schedule(){
    if(stopped||!canRun()){pause();return;}
    const due=nextAt();if(!Number.isFinite(due)){pause();return;}
    const at=Math.max(now()+1000,due);
    if(timer!==null&&deadline===at)return;
    pause();deadline=at;timer=setTimer(()=>{timer=deadline=null;return wake(true);},at-now());
  }
  function wake(scheduled=false){
    if(stopped||!canRun()){pause();return Promise.resolve();}
    if(running)return running;
    if(!scheduled&&nextAt()>now()){schedule();return Promise.resolve();}
    pause();running=Promise.resolve().then(refresh).then(()=>{if(!stopped&&canRun())onDone();}).catch(()=>{}).finally(()=>{running=null;schedule();});
    return running;
  }
  return {wake,pause,stop(){stopped=true;pause();},snapshot:()=>({scheduledFor:deadline,running:!!running})};
}

// Repaint the next forecast hour from the existing cache; this does not request the network.
export function weatherPresentationDueAt(data,now=Date.now()){
 const times=(data?.points||[]).map(p=>Date.parse(p.time)).filter(Number.isFinite);
 const future=times.filter(t=>t>now);
 const end=times.filter(t=>t<=now&&now<t+3600000).map(t=>t+3600000);
 return Math.min(...future,...end);
}
