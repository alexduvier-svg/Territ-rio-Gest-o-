import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/native/shell.js',import.meta.url),'utf8');
const start=source.indexOf('function notificationId('),fragment=source.slice(start,source.indexOf('\nfunction installStockAlerts()',start));
function harness(){
 const values=new Map(),notices=[],ack={};let at=100000000,stock=0,permission=async()=>({display:'granted'});
 class Clock extends Date{static now(){return at;}}
 const level=()=>({id:'qa',name:'Produto Fictício',stock,unit:'Unidade',ratio:stock?1:0});
 const ctx={Date:Clock,Math,Number,String,JSON,Map,Promise,console,stockFlight:Promise.resolve(),stockActor:()=> 'qa-actor',sellingAtFair:()=>false,STOCK_STATE_KEY:'qa-stock-',ALERTED_KEY:'qa-legacy',STOCK_CHANNEL:'qa-channel',STOCK_FAIR_CHANNEL:'qa-fair',LOW_STOCK:.2,stockPermission:'',localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},LocalNotifications:{checkPermissions:()=>permission(),schedule:async n=>notices.push(n)},window:{TerritorioWorkflowBridge:{data:()=>({stockAlerts:{ack}})},TerritorioShell:{stockLevels:()=>[level()]}}};
 vm.createContext(ctx);vm.runInContext(fragment+'\nthis.probe=checkStock;',ctx);
 return {ctx,ack,notices,check:()=>ctx.probe(),time:n=>{at=n;},stock:n=>{stock=n;},permission:f=>{permission=f;}};
}
test('empty-stock notice repeats only after its reminder interval',async()=>{
 const h=harness();await h.check();assert.equal(h.notices.length,1);h.time(100000000+20*3600000-1);await h.check();assert.equal(h.notices.length,1);h.time(100000000+20*3600000+1);await h.check();assert.equal(h.notices.length,2);
});
test('producer acknowledgment suppresses reminders; replenishment rearms the next stock-out',async()=>{
 const h=harness();await h.check();h.ack.qa='ack';h.time(200000000);await h.check();assert.equal(h.notices.length,1);h.stock(2);await h.check();delete h.ack.qa;h.stock(0);await h.check();assert.equal(h.notices.length,2);
});
test('an acknowledgment made while permission is checked prevents a late notice',async()=>{
 const h=harness();let release;h.permission(()=>new Promise(r=>{release=r;}));const job=h.check();while(!release)await Promise.resolve();h.ack.qa='ack';release({display:'granted'});await job;assert.equal(h.notices.length,0);
});
