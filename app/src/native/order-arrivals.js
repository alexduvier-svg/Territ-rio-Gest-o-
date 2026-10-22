import {Capacitor,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {LocalNotifications} from '@capacitor/local-notifications';
const native=registerPlugin('AgroOrders');
export function installOrderArrivals(){
 if(!Capacitor.isNativePlatform())return;
 let timer,flight=Promise.resolve(),fingerprint='';
 const bridge=()=>window.TerritorioWorkflowBridge;
 const sync=()=>{flight=flight.catch(()=>{}).then(async()=>{
  const b=bridge();if(!b)return;const d=b.data(),s=d.onlineShop,actor=d.dataContext?.id||d.productMemory?.scopeId;
  const permission=await LocalNotifications.checkPermissions();
  const config={enabled:!!(d.settings.orderReminders&&permission.display==='granted'&&s?.enabled&&s.actorId===actor&&s.slug===d.portfolio?.slug),actor,slug:d.portfolio?.slug||'',token:d.portfolio?.token||'',seen:(s?.orders||[]).map(o=>o.id)};
  const serial=JSON.stringify(config);if(serial===fingerprint)return;
  await native.configure(config);fingerprint=serial;
 });return flight;};
 const queue=()=>{clearTimeout(timer);timer=setTimeout(()=>sync().catch(()=>{}),300);};
 async function opened(){queue();try{const result=await native.consumeOpen();if(result.open){await window.TerritorioStore?.refresh();bridge()?.actions['store-orders']?.();}}catch{}}
 window.addEventListener('territorio:saved',queue);window.addEventListener('territorio:orders-updated',queue);window.addEventListener('territorio:reminders-enabled',queue);
 App.addListener('resume',opened);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue();});setTimeout(opened,1800);
 window.TerritorioOrderArrivals={sync};
}
