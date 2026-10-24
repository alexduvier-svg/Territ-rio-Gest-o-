import assert from 'node:assert/strict';
import {installContinuity} from '../../src/features/agent/continuity-ui.js';
const ctx={actorId:'fixture-producer',dataOrigin:'real'},memory={...ctx,records:[],audit:[]};
let calls=0,fail=false,version=1,release;
globalThis.window={addEventListener(){}};globalThis.document={hidden:false,addEventListener(){},querySelectorAll:()=>[],getElementById:()=>null};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};
const make=()=>({memory,changed:false,counts:{pending:version,waiting:0,done:0},tasks:[],history:[]});
const api=installContinuity({b:{escape:String,actions:{}},getContext:()=>ctx,getSource:()=>{if(fail)throw Error('Source temporarily unavailable');return{...ctx,rows:[],version};},run:async()=>{calls++;if(process.argv[2]==='concurrent')await new Promise(r=>release=r);return make();},state:()=>({}),persist(){}});
if(process.argv[2]==='cached'){
 await api.refresh(true);assert.equal(calls,1);await api.refresh();assert.equal(calls,1);version++;
 await api.refresh(true);assert.equal(calls,2);assert.equal(api.diagnostics().counts.pending,2);
}else if(process.argv[2]==='source-error'){
 fail=true;assert.equal(await api.refresh(true),null);assert(api.diagnostics().paused);fail=false;
 assert(await api.refresh(true));assert.equal(calls,1);assert(!api.diagnostics().paused);
}else if(process.argv[2]==='concurrent'){
 const a=api.refresh(),b=api.refresh();await Promise.resolve();assert.equal(calls,1);release();await Promise.all([a,b]);assert.equal(calls,1);
}else throw Error('Unknown scenario');
console.log('PASS '+process.argv[2]);
