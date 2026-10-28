// Synthetic Android helper test. Run ONLY after the native fixture journeys have finished.
// Usage: node qa/test-clone133-transfer.cjs EXPLICIT_ADB_SERIAL
// The only app this test stops or reads is br.com.territorio.gestao2.integration133.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const {makeSeed}=require('./codex133-seed.cjs');
const root=path.resolve(__dirname,'..');
const adb=path.resolve(root,'../New project/android-sdk/platform-tools/adb.exe');
const VIZ='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6';
const TARGET='br.com.territorio.gestao2.integration133',HELPER=TARGET+'.clone132transfer';
const SOURCE='br.com.territorio.gestaoclaude',VERSION='0.12.133';
const CLASS='br.com.territorio.gestao.Clone132DataInstrumentedTest';
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
function checksum(json){let value=2166136261;for(let i=0;i<json.length;i++)value=Math.imul(value^json.charCodeAt(i),16777619);return (value>>>0).toString(16).padStart(8,'0');}
function slot(data,seq){const json=JSON.stringify(data);return Buffer.from(JSON.stringify({seq,savedAt:new Date().toISOString(),length:json.length,checksum:checksum(json)})+'\n'+json);}
function decodeSlot(raw){
 const at=raw.indexOf('\n');assert(at>0,'Synthetic slot header missing');
 const header=JSON.parse(raw.slice(0,at)),json=raw.slice(at+1);assert.equal(header.length,json.length);
 if(header.checksum!=null)assert.equal(header.checksum,checksum(json));
 const data=JSON.parse(json);assert.equal(data.schema,1);assert.equal(data.dataContext?.id,'codex133-synthetic','Fixture data identity differs');
 return {header,data};
}
function saveCombinedReport(file,entry){
 const lock=file+'.lock';let descriptor=null;
 for(let i=0;i<400&&descriptor==null;i++){
  try{descriptor=fs.openSync(lock,'wx');}catch(error){if(error.code!=='EEXIST')throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25);}
 }
 assert(descriptor!=null,'Synthetic report lock is busy');
 try{
  const existing=fs.existsSync(file)?readJSON(file):{version:VERSION,scope:'synthetic-transfer-helper-only',productionDataAccessed:false,runs:[]};
  assert(Array.isArray(existing.runs)&&existing.scope==='synthetic-transfer-helper-only','Unexpected existing report');
  existing.runs.push(entry);
  const latest=[...new Map(existing.runs.map(run=>[run.deviceSerialSHA256,run])).values()];
  existing.passed=latest.every(run=>run.passed);existing.devices=latest.length;existing.updatedAt=new Date().toISOString();
  const temp=file+'.'+crypto.randomBytes(4).toString('hex')+'.tmp';
  fs.writeFileSync(temp,JSON.stringify(existing,null,2)+'\n');fs.renameSync(temp,file);
 }finally{fs.closeSync(descriptor);fs.unlinkSync(lock);}
}
function main(argv=process.argv.slice(2)){
 assert.equal(argv.length,1,'One explicit ADB serial is required');
 const serial=argv[0];assert(/^[A-Za-z0-9_.:-]+$/.test(serial),'Invalid ADB serial');
 assert(TARGET.endsWith('.integration133')&&HELPER===TARGET+'.clone132transfer','Synthetic target guard');
 const id='synthetic133-'+Date.now()+'-'+crypto.randomBytes(5).toString('hex');
 const out=path.join(VIZ,'clone133-transfer-test',id);fs.mkdirSync(out,{recursive:true});
 const logFile=path.join(out,'adb.log');let stage='preflight';
 const report={version:VERSION,scope:'synthetic-transfer-helper-only',synthetic:true,productionDataAccessed:false,targetPackage:TARGET,helperPackage:HELPER,deviceSerialSHA256:digest(serial),transferId:id,startedAt:new Date().toISOString(),checks:{}};
 const run=(args,{accepted=[0],timeout=120000,binary=false}={})=>{
  const result=cp.spawnSync(adb,['-s',serial,...args],{windowsHide:true,timeout,maxBuffer:32*1024*1024,encoding:binary?undefined:'utf8'});
  const bytes=Buffer.isBuffer(result.stdout)?result.stdout:Buffer.from(result.stdout||'');
  fs.appendFileSync(logFile,JSON.stringify({at:new Date().toISOString(),stage,args,status:result.status,stdout:binary?{bytes:bytes.length,sha256:digest(bytes)}:result.stdout||'',stderr:String(result.stderr||''),error:result.error?.message})+'\n');
  assert(!result.error&&accepted.includes(result.status),'ADB command failed; inspect synthetic VIZ log');
  return binary?bytes:String(result.stdout||'');
 };
 const text=(...args)=>run(args).trim();
 const stop=()=>{
  text('shell','am','force-stop',TARGET);
  assert.equal(run(['shell','pidof',TARGET],{accepted:[0,1]}).trim(),'','Synthetic fixture restarted');
 };
 const unlocked=()=>{
  const policy=text('shell','dumpsys','window','policy');
  assert(!/(?:mShowingLockscreen|isKeyguardShowing|keyguardShowing|showing|mDreamingLockscreen)\s*[=:]\s*true\b/.test(policy),'Phone is locked');
  assert(/(?:showing|isKeyguardShowing|keyguardShowing)\s*[=:]\s*false\b/.test(policy),'Unlocked state could not be confirmed');
 };
 const inventory=()=>{
  const dirs=text('shell','run-as',TARGET,'ls','files').split(/\r?\n/).filter(dir=>['territorio','territorio-training'].includes(dir));
  const items=[];
  for(const dir of dirs){
   for(const relative of text('shell','run-as',TARGET,'find','files/'+dir,'-type','f').split(/\r?\n/).filter(Boolean)){
    assert(/^files\/(territorio|territorio-training)\/[A-Za-z0-9_./-]+$/.test(relative)&&!relative.includes('..'),'Unexpected synthetic private file path');
    const raw=run(['exec-out','run-as',TARGET,'cat',relative],{binary:true});
    items.push({path:relative.slice(6),bytes:raw.length,sha256:digest(raw)});
   }
  }
  return items.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 };
 const instrument=(action,extra={},success=true)=>{
  stop();
  const args=['shell','am','instrument','-w','-r','-e','class',CLASS,'-e','action',action,'-e','transferId',id,'-e','sourceVersion',VERSION];
  for(const [key,value]of Object.entries(extra))args.push('-e',key,String(value));
  args.push(HELPER+'/androidx.test.runner.AndroidJUnitRunner');
  const output=run(args,{accepted:[0,1],timeout:180000});stop();
  if(success)assert(/OK \(1 test\)/.test(output)&&!/FAILURES!!!|INSTRUMENTATION_FAILED|shortMsg=|Process crashed/.test(output),'Synthetic instrumentation failed');
  else assert(!/OK \(1 test\)/.test(output)&&/Import manifest hash mismatch/.test(output),'Negative test failed for an unexpected reason');
  return output;
 };
 const remoteRoot='/sdcard/Android/data/'+TARGET+'/files';
 const remoteExport=remoteRoot+'/clone132-export/'+id;
 const expectedFiles=()=>{
  for(const entry of incoming.files){
   const installed=run(['exec-out','run-as',TARGET,'cat','files/'+entry.path],{binary:true});
   assert.equal(digest(installed),entry.sha256,'Installed synthetic file hash differs');
   assert.deepEqual(installed,fs.readFileSync(path.join(sourceDir,entry.path)),'Installed synthetic slot bytes differ');
  }
  const active=decodeSlot(run(['exec-out','run-as',TARGET,'cat','files/territorio/data-b.json'],{binary:true}).toString('utf8'));
  assert.equal(active.header.seq,5);assert.equal(active.data.settings.businessName,'Transferência Fictícia QA133');
  assert.deepEqual(inventory(),[...incoming.files].sort((a,b)=>a.path.localeCompare(b.path,'en')),'Unexpected active fixture files after transfer');
 };
 let incoming,sourceDir;
 try{
  assert(fs.existsSync(adb),'ADB executable missing');
  const pkg=text('shell','dumpsys','package',TARGET);assert(/versionName=0\.12\.133(?:\s|$)/.test(pkg),'Fixture version differs');stop();
  const slotNames=text('shell','run-as',TARGET,'ls','files/territorio').split(/\r?\n/).filter(name=>/^data-[ab]\.json$/.test(name));
  const beforeSlots=slotNames.map(name=>decodeSlot(run(['exec-out','run-as',TARGET,'cat','files/territorio/'+name],{binary:true}).toString('utf8')));
  assert(beforeSlots.length,'Fixture has no synthetic native slot');report.checks.syntheticIdentityGuard=true;
  stage='helper-install';
  const helperDir=path.join(VIZ,'clone132-transfer-build/fixture-test'),helperAPK=path.join(helperDir,'clone132-transfer.apk'),built=readJSON(path.join(helperDir,'build-report.json'));
  assert.equal(built.package,HELPER);assert.equal(built.target,TARGET);assert.equal(built.businessDataEmbedded,false);
  assert.equal(digest(fs.readFileSync(helperAPK)),built.sha256);report.helperSHA256=built.sha256;
  run(['install','--no-incremental','-r',helperAPK],{timeout:180000});
  const installedPath=text('shell','pm','path',HELPER).replace(/^package:/,'');
  assert(/^\/data\/app\/[A-Za-z0-9_./~+=-]+\/base\.apk$/.test(installedPath),'Unexpected synthetic helper APK path');
  assert.equal(text('shell','sha256sum',installedPath).split(/\s/)[0],built.sha256);report.checks.signedHelperHash=true;
  stop();
  stage='synthetic-source';sourceDir=path.join(out,'source');fs.mkdirSync(path.join(sourceDir,'territorio'),{recursive:true});
  const data=makeSeed({businessName:'Transferência Fictícia QA133'});assert.equal(data.dataContext.id,'codex133-synthetic');
  const stale=structuredClone(data);stale.settings.businessName='Snapshot Anterior Fictício QA133';
  incoming={version:1,sourcePackage:SOURCE,sourceVersion:VERSION,capturedAt:new Date().toISOString(),files:[]};
  for(const [name,seq,record]of [['a',4,stale],['b',5,data]]){
   const relative='territorio/data-'+name+'.json',bytes=slot(record,seq);fs.writeFileSync(path.join(sourceDir,relative),bytes,{flag:'wx'});
   incoming.files.push({path:relative,bytes:bytes.length,sha256:digest(bytes)});
  }
  const manifestFile=path.join(sourceDir,'manifest.json');fs.writeFileSync(manifestFile,JSON.stringify(incoming,null,2),{flag:'wx'});
  const manifestSHA256=digest(fs.readFileSync(manifestFile));report.sourceManifestSHA256=manifestSHA256;
  stage='export';const before=inventory();instrument('export');
  const backupFile=path.join(out,'backup.zip'),backupManifestFile=path.join(out,'backup-manifest.json');
  run(['pull',remoteExport+'/backup.zip',backupFile]);run(['pull',remoteExport+'/backup-manifest.json',backupManifestFile]);
  const backup=readJSON(backupManifestFile);assert.equal(backup.targetPackage,TARGET);assert.equal(backup.transferId,id);
  assert.equal(digest(fs.readFileSync(backupFile)),backup.backupSha256,'Exported synthetic backup hash differs');
  assert.deepEqual([...backup.files].sort((a,b)=>a.path.localeCompare(b.path,'en')),before,'Backup manifest differs from original synthetic files');
  assert.deepEqual(inventory(),before,'Export changed the original synthetic files');report.backupSHA256=backup.backupSha256;report.checks.backupHashAndInventory=true;
  stage='stage-import';const remoteIncoming=remoteRoot+'/clone132-import/'+id;
  for(const entry of incoming.files){
   const destination=remoteIncoming+'/'+entry.path;run(['shell','mkdir','-p',destination.slice(0,destination.lastIndexOf('/'))]);run(['push',path.join(sourceDir,entry.path),destination]);
   assert.equal(text('shell','sha256sum',destination).split(/\s/)[0],entry.sha256);
  }
  run(['push',manifestFile,remoteIncoming+'/manifest.json']);assert.equal(text('shell','sha256sum',remoteIncoming+'/manifest.json').split(/\s/)[0],manifestSHA256);
  const applyArgs={backupSha256:backup.backupSha256,manifestSha256:manifestSHA256,confirmClone:'CLAUDE132_TO_CODEX'};
  stage='negative-manifest';instrument('apply',{...applyArgs,manifestSha256:'0'.repeat(64)},false);
  assert.deepEqual(inventory(),before,'Rejected import changed the fixture slot hashes');report.checks.wrongManifestRejectedWithoutMutation=true;
  stage='apply';instrument('apply',applyArgs);expectedFiles();
  const receiptFile=path.join(out,'applied.json');run(['pull',remoteExport+'/applied.json',receiptFile]);
  const receiptRaw=fs.readFileSync(receiptFile),receipt=readJSON(receiptFile);
  assert.equal(receipt.targetPackage,TARGET);assert.equal(receipt.sourcePackage,SOURCE);assert.equal(receipt.transferId,id);
  assert.equal(receipt.manifestSha256,manifestSHA256);assert.equal(receipt.backupSha256,backup.backupSha256);
  assert.equal(receipt.filesCopied,incoming.files.length);assert.equal(receipt.status,'applied-offline-before-launch');
  assert.equal(receipt.counts.products,data.products.length);report.checks.appliedReceiptAndEverySlotByte=true;report.filesCopied=receipt.filesCopied;
  stage='idempotence';instrument('apply',applyArgs);expectedFiles();
  const repeatedReceipt=path.join(out,'applied-again.json');run(['pull',remoteExport+'/applied.json',repeatedReceipt]);
  assert.deepEqual(fs.readFileSync(repeatedReceipt),receiptRaw,'Idempotent apply changed its receipt');
  report.receiptSHA256=digest(receiptRaw);report.checks.idempotentReceiptAndAllFileHashes=true;
  stop();report.fixtureLeftStopped=true;report.passed=true;
 }catch(error){
  fs.appendFileSync(logFile,JSON.stringify({stage,error:String(error.stack||error)})+'\n');
  report.passed=false;report.failedStage=stage;report.error='Synthetic helper test failed; inspect its VIZ log.';process.exitCode=1;
 }finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');
  saveCombinedReport(path.join(__dirname,'clone133-transfer-test.json'),report);
  console.log(JSON.stringify(report));
 }
 return report;
}
module.exports={main,checksum,slot,decodeSlot};
if(require.main===module)main();
