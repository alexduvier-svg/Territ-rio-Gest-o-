// Local preparation notice, not a background alarm. A dismissal belongs to the
// scheduled occurrence, so it cannot reappear the next day after being dismissed.
export const preparationCutoff=e=>Date.parse(e.start+'T'+(e.from||'00:00')+':00-03:00')-3600000;
export const preparationKey=e=>'prep|'+e.id+'|'+e.start+'|'+(e.from||'00:00');
export function preparationReminders(events,seen={},now=Date.now(),today){
 today||=new Date(now).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 return(events||[]).filter(e=>e.status==='active'&&!e.fairClosedAt&&!e.fairCancelled).flatMap(e=>{
  const days=Math.round((Date.parse(e.start+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000),key=preparationKey(e),cutoff=preparationCutoff(e);
  // Honour a previous-version dismissal too; the date identifies this occurrence.
  const dismissed=seen[key]||Object.keys(seen).some(k=>k.startsWith(e.id+'|'+e.start+'|')&&seen[k]);
  return Number.isFinite(cutoff)&&now<cutoff&&days>=0&&days<=5&&!dismissed?[{event:e,days,key,cutoff}]:[];
 }).sort((a,b)=>a.cutoff-b.cutoff||a.event.name.localeCompare(b.event.name,'pt-BR'));
}
