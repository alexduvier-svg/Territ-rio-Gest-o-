import test from 'node:test';
import assert from 'node:assert/strict';
import {springTrack,compositorMotion} from '../src/features/motion/compositor.js';

test('surface track samples a finite spring with exact end pose and bounded overshoot',()=>{
 const t=springTrack({x:-130,y:300,scale:.12,opacity:.8},{x:0,y:0,scale:1,opacity:1},{stiffness:560,damping:35});
 assert(t.duration>200&&t.duration<800);assert.deepEqual(t.frames[0].values,{x:-130,y:300,scale:.12,opacity:.8});
 assert.deepEqual(t.frames.at(-1).values,{x:0,y:0,scale:1,opacity:1});
 assert(Math.max(...t.frames.map(f=>f.values.scale))<1.04);
 for(const f of t.frames)assert(Object.values(f.values).every(Number.isFinite));
});
test('compositor reversal keeps position/velocity; cancellation and stale completion clean once',async()=>{
 const animations=[];let cleanup=0;const registry=new Set();
 const element={animate(frames,options){let resolve;const a={frames,options,currentTime:0,finished:new Promise(r=>resolve=r),cancel(){this.cancelled=true;},resolve:()=>resolve()};animations.push(a);return a;}};
 const m=compositorMotion(element,{x:0,scale:.2},{x:200,scale:1},v=>({translate:v.x+'px 0',scale:v.scale}),()=>cleanup++,{stiffness:560,damping:35},registry);
 assert.equal(registry.size,1);animations[0].currentTime=90;const before=m.values;
 m.retarget({x:0,scale:.2});assert.equal(animations[0].cancelled,true);
 assert(Math.abs(parseFloat(animations[1].frames[0].translate)-before.x.position)<.000001);
 assert(Math.abs(m.values.x.velocity-before.x.velocity)<.000001);
 animations[0].resolve();await Promise.resolve();assert.equal(cleanup,0);
 m.cancel();m.cancel();assert.equal(registry.size,0);assert.equal(cleanup,1);
 animations[1].resolve();await Promise.resolve();assert.equal(cleanup,1);
});
test('native surface completion releases the registry without an idle frame loop',async()=>{
 let resolve,count=0;const registry=new Set();
 const element={animate(){return{currentTime:0,finished:new Promise(r=>resolve=r),cancel(){}};}};
 compositorMotion(element,{opacity:0},{opacity:1},v=>v,()=>count++,{},registry);
 assert.equal(registry.size,1);resolve();await Promise.resolve();assert.equal(registry.size,0);assert.equal(count,1);
});
