import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual private transition lifecycle with independent outgoing/incoming clocks.
// The old exit callback discarded ownership 433ms before the entering spring could finish.
const source=fs.readFileSync(new URL('../src/features/motion/index.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function endPageTransition()'),source.indexOf('// Rules that depend on html'));
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const deferred=()=>{let resolve;const finished=new Promise(r=>resolve=r);return {finished,resolve,cancelled:0,cancel(){this.cancelled++;resolve(false);}};};
function harness(){const context={pageTransition:null};vm.createContext(context);vm.runInContext(body,context);return context;}
function transition(handles){return {handles,layer:{removed:0,remove(){this.removed++;}}};}

test('a completed outgoing spring does not discard ownership of the incoming spring',async()=>{
 const c=harness(),exit=deferred(),entry=deferred(),t=transition([exit,entry]);c.pageTransition=t;c.trackPageTransition(t);
 exit.resolve(true);await flush();assert.equal(c.pageTransition,t);
 entry.resolve(true);await flush();assert.equal(c.pageTransition,null);assert.equal(t.layer.removed,1);
});
test('an interrupt cancels every handle and removes the old visual layer',async()=>{
 const c=harness(),a=deferred(),b=deferred(),t=transition([a,b]);c.pageTransition=t;c.trackPageTransition(t);c.endPageTransition();
 assert.equal(a.cancelled,1);assert.equal(b.cancelled,1);assert.equal(c.pageTransition,null);assert(t.layer.removed);await flush();
});
test('completion from an interrupted page cannot clear a newer transition',async()=>{
 const c=harness(),oldHandle=deferred(),nextHandle=deferred(),old=transition([oldHandle]),next=transition([nextHandle]);
 c.pageTransition=old;c.trackPageTransition(old);c.endPageTransition();c.pageTransition=next;c.trackPageTransition(next);await flush();
 assert.equal(c.pageTransition,next);assert.equal(next.layer.removed,0);nextHandle.resolve(true);await flush();assert.equal(c.pageTransition,null);
});
test('an empty or unsupported motion group leaves no stale transition',()=>{
 const c=harness(),t=transition([null]);c.pageTransition=t;c.trackPageTransition(t);assert.equal(c.pageTransition,null);assert.equal(t.layer.removed,1);
});
