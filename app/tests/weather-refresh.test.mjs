import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeatherClock,weatherDueAt,WEATHER_INTERVAL} from '../src/features/weather/refresh.js';
test('refresh deadline respects 30min floor, provider validity, legacy cache and retry',()=>{
 assert.equal(weatherDueAt({checkedAt:1000,expiresAt:2000}),1000+WEATHER_INTERVAL);
 assert.equal(weatherDueAt({checkedAt:1000,expiresAt:9999999}),9999999);
 assert.equal(weatherDueAt({retrievedAt:1000,expiresAt:2000}),1000+WEATHER_INTERVAL);
 assert.equal(weatherDueAt(null,999),999);
});
function fixture(){
 let time=1000,active=true,online=true,due=1000,requests=0,nextId=0,updates=0;const timers=new Map();let release=null;
 const engine=createWeatherClock({canRun:()=>active&&online,nextAt:()=>due,now:()=>time,
  setTimer:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,delay});return id;},clearTimer:id=>timers.delete(id),
  refresh:async()=>{requests++;if(release)await new Promise(resolve=>release.resolve=resolve);due=time+WEATHER_INTERVAL;},onDone:()=>updates++});
 return {engine,timers,get requests(){return requests;},get updates(){return updates;},get due(){return due;},set active(v){active=v;},set online(v){online=v;},set time(v){time=v;},hold(){release={};return ()=>release.resolve();}};
}
test('many UI updates share one request and one deadline, with no repeated polling',async()=>{
 const f=fixture();await Promise.all(Array.from({length:100},()=>f.engine.wake()));assert.equal(f.requests,1);assert.equal(f.timers.size,1);
 const timer=[...f.timers.values()][0];assert.equal(timer.delay,WEATHER_INTERVAL);
 for(let i=0;i<100;i++)await f.engine.wake();assert.equal(f.requests,1);assert.equal(f.timers.size,1);assert.equal([...f.timers.values()][0],timer);
 f.time=f.due;await f.engine.wake();assert.equal(f.requests,2);assert.equal(f.timers.size,1);
});
test('hidden/offline pauses entirely and reopening only refreshes an overdue forecast',async()=>{
 const f=fixture();await f.engine.wake();f.active=false;await f.engine.wake();assert.equal(f.timers.size,0);
 f.time=f.due+1;await f.engine.wake();assert.equal(f.requests,1);f.active=true;f.online=false;await f.engine.wake();assert.equal(f.requests,1);assert.equal(f.timers.size,0);
 f.online=true;await f.engine.wake();assert.equal(f.requests,2);assert.equal(f.timers.size,1);f.engine.stop();assert.equal(f.timers.size,0);
});
test('pausing or stopping during a request never paints hidden UI or resurrects a timer',async()=>{
 const f=fixture(),release=f.hold(),job=f.engine.wake();await Promise.resolve();f.active=false;f.engine.pause();release();await job;
 assert.equal(f.updates,0);assert.equal(f.timers.size,0);f.engine.stop();f.active=true;await f.engine.wake();assert.equal(f.requests,1);
});
