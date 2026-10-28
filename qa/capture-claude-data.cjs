// Authorized local migration. Raw business data is written only to the task's private directory.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [serial,device,outputArgument]=process.argv.slice(2);
assert(serial&&/^(reno|pkj)$/.test(device),'Device serial and known device label required');
const root=path.resolve(__dirname,'..'),adb=path.resolve(root,'../New project/android-sdk/platform-tools/adb.exe');
const out=path.resolve(outputArgument||process.env.AGRO_CAPTURE_OUTPUT||path.join(root,'.local-migrations','clone133',device,'source'));
const relativeOutput=path.relative(path.join(root,'.local-migrations'),out);assert(relativeOutput&&!relativeOutput.startsWith('..')&&!path.isAbsolute(relativeOutput),'Capture must stay in ignored private migration directory');
assert(!fs.existsSync(path.join(out,'manifest.json')),'Captured source exists; preserve it rather than overwrite');
const run=(...args)=>cp.execFileSync(adb,['-s',serial,...args],{windowsHide:true,maxBuffer:100*1024*1024,stdio:['ignore','pipe','pipe']});
const pkg='br.com.territorio.gestaoclaude';
const info=run('shell','dumpsys','package',pkg).toString();assert(/versionName=0\.12\.133(?:\s|$)/.test(info),'Expected Claude133 installed');
run('shell','am','force-stop',pkg);
const dirs=run('shell','run-as',pkg,'ls','files').toString().split(/\r?\n/).filter(d=>['territorio','territorio-training'].includes(d));
assert(dirs.includes('territorio'),'Claude business data missing');
const entries=[];
for(const dir of dirs){
 const names=run('shell','run-as',pkg,'find','files/'+dir,'-type','f').toString().split(/\r?\n/).filter(Boolean);
 for(const name of names){
  assert(name.startsWith('files/'+dir+'/')&&!name.includes('..'),'Unexpected source path');
  const relative=name.slice(6),bytes=run('exec-out','run-as',pkg,'cat',name),destination=path.join(out,relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
  entries.push({path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
}
function slot(file){
 const raw=fs.readFileSync(path.join(out,file),'utf8'),at=raw.indexOf('\n');assert(at>0);
 const header=JSON.parse(raw.slice(0,at)),json=raw.slice(at+1);assert.equal(json.length,header.length);
 let value=2166136261;for(let i=0;i<json.length;i++)value=Math.imul(value^json.charCodeAt(i),16777619);
 if(header.checksum!=null)assert.equal((value>>>0).toString(16).padStart(8,'0'),header.checksum);
 const data=JSON.parse(json);assert.equal(data.schema,1);assert(['products','sales','clients','events','movements','expenses'].every(k=>Array.isArray(data[k])));
 return {header,data};
}
const slots=entries.filter(e=>/^territorio\/data-[ab]\.json$/.test(e.path)).map(e=>slot(e.path));assert(slots.length);
const newest=slots.sort((a,b)=>b.header.seq-a.header.seq)[0],data=newest.data;
const manifest={version:1,sourcePackage:pkg,sourceVersion:'0.12.133',capturedAt:new Date().toISOString(),files:entries};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const summary={device,sourcePackage:pkg,sourceVersion:'0.12.133',files:entries.length,sequence:newest.header.seq,context:data.dataContext?.type||'unknown',counts:Object.fromEntries(['products','sales','clients','events','movements','expenses'].map(k=>[k,data[k].length])),appearance:data.settings?.appearance,weatherEnabled:data.settings?.weatherEnabled===true,trainingFiles:entries.filter(e=>e.path.startsWith('territorio-training/')).length,privateOutput:out};
fs.writeFileSync(path.join(path.dirname(out),'capture-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary));
