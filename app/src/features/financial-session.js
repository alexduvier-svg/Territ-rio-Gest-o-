// Revealing financial totals is a foreground-session choice, never a startup preference.
export function installFinancialSession({data,conceal,life=window,doc=document}){
 const lock=()=>{const settings=data()?.settings;if(!settings?.financialVisible)return false;settings.financialVisible=false;conceal();return true;};
 const events=['pagehide','pageshow','territorio:pause','territorio:resume'],options={capture:true};
 for(const event of events)life.addEventListener(event,lock,options);
 doc.addEventListener('visibilitychange',lock,options);
 lock();
 return Object.freeze({lock,dispose(){for(const event of events)life.removeEventListener(event,lock,options);doc.removeEventListener('visibilitychange',lock,options);}});
}
