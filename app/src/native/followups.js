import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {LocalNotifications} from '@capacitor/local-notifications';
import {followupNotices} from '../features/followups.js';
const channel='pedidos-recebimentos',kind=n=>['order-followup','credit-followup'].includes(n.extra?.kind)||(Number(n.id)>=1800000000&&Number(n.id)<1900000000);
function noticeId(key){let h=5381;for(const c of key)h=(Math.imul(h,33)^c.charCodeAt(0))>>>0;return 1800000000+(h%100000000);}
export function installFollowupNotifications(){
 if(!Capacitor.isNativePlatform())return;
 let flight=null,timer;
 const bounded=p=>{let timeout;return Promise.race([p,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Tempo esgotado na notificação')),10000);})]).finally(()=>clearTimeout(timeout));};
 const bridge=()=>window.TerritorioWorkflowBridge;
 function sync(){if(flight)return flight.then(sync);flight=performSync().finally(()=>{flight=null;});return flight;}
 async function performSync(){
  if(!bridge())return;
  try{
   const list=followupNotices(bridge().data()),scope=bridge().data().dataContext?.id||bridge().data().productMemory?.scopeId;
   const wanted=new Map(list.map(n=>[noticeId(scope+':'+n.key),n]));
   const pending=(await bounded(LocalNotifications.getPending())).notifications||[],rawDelivered=(await bounded(LocalNotifications.getDeliveredNotifications())).notifications||[];
   // Android's delivered schema omits `extra`. Recover it by id from the plugin's
   // persisted schedule, so reopening does not dismiss and repeat the same notice.
   const byId=new Map(pending.map(n=>[n.id,n]));
   const delivered=rawDelivered.map(n=>({...n,extra:n.extra||byId.get(n.id)?.extra}));
   const stale=n=>{const target=wanted.get(n.id);return !target||!!n.extra&&(n.extra.scope!==scope||n.extra.signature!==target.signature);};
   const cancel=pending.filter(n=>kind(n)&&stale(n)).map(n=>({id:n.id}));if(cancel.length)await bounded(LocalNotifications.cancel({notifications:cancel}));
   // cancel() keeps already-triggered records on Android. Dismiss the union,
   // including a notice that fired between getDelivered() and cancel().
   const remove=new Map(cancel.map(n=>[n.id,{id:n.id,title:'',body:''}]));
   for(const n of delivered.filter(n=>kind(n)&&stale(n)))remove.set(n.id,{id:n.id,tag:n.tag,title:'',body:''});
   if(remove.size)await bounded(LocalNotifications.removeDeliveredNotifications({notifications:[...remove.values()]}));
   const permission=await bounded(LocalNotifications.checkPermissions());if(permission.display!=='granted')return;
   // Recheck after native awaits; never resurrect a just-paid debt or a completed delivery.
   const current=new Map(followupNotices(bridge().data()).map(n=>[noticeId(scope+':'+n.key),n]));if((bridge().data().dataContext?.id||bridge().data().productMemory?.scopeId)!==scope)return;
   const keep=new Set([...pending,...delivered].filter(n=>kind(n)&&!stale(n)).map(n=>n.id));
   const notifications=[...wanted].filter(([id,n])=>current.get(id)?.signature===n.signature&&!keep.has(id)).map(([id,n])=>({id,channelId:channel,title:n.title,body:n.body,smallIcon:'ic_stat_territorio',iconColor:'#D99955',ongoing:true,autoCancel:false,extra:{kind:n.kind,scope,signature:n.signature,reminderKey:n.key},schedule:{at:new Date(n.at),allowWhileIdle:true},isExactNotification:false}));
   if(notifications.length)await bounded(LocalNotifications.schedule({notifications}));
  }catch(error){console.warn('Acompanhamento não agendado',error);}
 }
 const queue=()=>{clearTimeout(timer);timer=setTimeout(sync,600);};
 LocalNotifications.createChannel({id:channel,name:'Pedidos e Recebimentos',description:'Acompanhamento dos pedidos recebidos e datas do Fiado.',importance:3,visibility:0,vibration:false,lights:false}).catch(()=>{});
 LocalNotifications.addListener('localNotificationActionPerformed',event=>{if(!kind(event.notification))return;const scope=bridge()?.data().dataContext?.id||bridge()?.data().productMemory?.scopeId;if(event.notification.extra?.scope!==scope)return;setTimeout(()=>{if(event.notification.extra.kind==='credit-followup')bridge()?.actions['receivables-due']?.();else bridge()?.actions['store-orders']?.();},450);});
 window.addEventListener('territorio:saved',queue);window.addEventListener('territorio:resume',queue);App.addListener('resume',queue);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});setTimeout(queue,2500);
 window.TerritorioFollowupNotifications={sync,notices:()=>followupNotices(bridge().data())};
 bridge().actions['followup-enable']=async()=>{try{let permission=await bounded(LocalNotifications.checkPermissions());if(permission.display==='prompt'||permission.display==='prompt-with-rationale')permission=await bounded(LocalNotifications.requestPermissions());if(permission.display!=='granted'){bridge().toast('Permita as notificações nas configurações do celular. Os avisos dentro do app continuam disponíveis.');return;}await sync();bridge().toast('Lembretes no celular ativados. O Android controla o horário de entrega.');}catch{bridge().toast('Não foi possível ativar agora. Tente novamente.');}};
}
