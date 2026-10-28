// Owner-authorized, offline Claude 0.12.133 -> Codex data transfer.
// Usage: node qa/transfer-claude-data.cjs SERIAL reno|pkj EXPECTED_CODEX_APK_SHA256 [--transfer-id ID]
// This script deliberately leaves both apps stopped. Raw records and ADB logs stay ignored.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const SOURCE='br.com.territorio.gestaoclaude',TARGET='br.com.territorio.gestao2';
const HELPER=TARGET+'.clone132transfer',VERSION='0.12.133',CODE=174;
const CLASS='br.com.territorio.gestao.Clone132DataInstrumentedTest';
const VIZ='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6';
const root=path.resolve(__dirname,'..'),adb=path.resolve(root,'../New project/android-sdk/platform-tools/adb.exe');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const allowed=rel=>/^(?:territorio\/(?:data-[ab]|recovery-[ab])\.json|territorio\/backups\/\d{4}-\d{2}-\d{2}\.json|territorio-training\/[ab]\.json)$/.test(rel);
const crcTable=Array.from({length:256},(_,i)=>{let n=i;for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let value=0xffffffff;for(const n of bytes)value=crcTable[(value^n)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function immutableJSON(file,value){
 const raw=Buffer.from(JSON.stringify(value,null,2)+'\n');
 if(fs.existsSync(file)){assert.equal(sha(fs.readFileSync(file)),sha(raw),'Existing immutable record differs');return;}
 fs.writeFileSync(file,raw,{flag:'wx'});
}
function safeLocal(base,rel){
 assert(allowed(rel),'Unexpected business file path');
 const file=path.resolve(base,rel),inside=path.relative(base,file);
 assert(inside&&!inside.startsWith('..')&&!path.isAbsolute(inside),'Local path escapes transfer directory');
 return file;
}
// Validate every ZIP member without extracting business records or invoking an external shell.
function validateBackup(zipFile,manifest){
 const zip=fs.readFileSync(zipFile);assert.equal(sha(zip),manifest.backupSha256,'Pulled backup ZIP hash differs');
 assert.equal(manifest.targetPackage,TARGET);assert.equal(manifest.version,1);
 assert(Array.isArray(manifest.files)&&manifest.files.length<2000,'Invalid backup file manifest');
 const expected=new Map();
 for(const item of manifest.files){
  assert(allowed(item.path),'Unexpected file in destination backup');assert(!expected.has(item.path),'Repeated backup entry');
  assert(/^[a-f0-9]{64}$/.test(item.sha256)&&Number.isSafeInteger(item.bytes)&&item.bytes>=0,'Invalid backup metadata');
  expected.set(item.path,item);
 }
 let end=-1;
 for(let at=zip.length-22;at>=Math.max(0,zip.length-65557);at--){if(zip.readUInt32LE(at)===0x06054b50&&at+22+zip.readUInt16LE(at+20)===zip.length){end=at;break;}}
 assert(end>=0,'Backup ZIP end record is missing');
 assert.equal(zip.readUInt16LE(end+4),0);assert.equal(zip.readUInt16LE(end+6),0);
 const count=zip.readUInt16LE(end+10),centralBytes=zip.readUInt32LE(end+12),centralAt=zip.readUInt32LE(end+16);
 assert.equal(zip.readUInt16LE(end+8),count);assert.equal(count,expected.size,'Backup ZIP entry count differs');
 assert(centralAt+centralBytes===end,'Unexpected or ZIP64 archive layout');
 let at=centralAt,total=0;const seen=new Set();
 for(let i=0;i<count;i++){
  assert(at+46<=end&&zip.readUInt32LE(at)===0x02014b50,'Invalid ZIP central directory');
  const flags=zip.readUInt16LE(at+8),method=zip.readUInt16LE(at+10),crc=zip.readUInt32LE(at+16);
  const packed=zip.readUInt32LE(at+20),size=zip.readUInt32LE(at+24);
  const n=zip.readUInt16LE(at+28),extra=zip.readUInt16LE(at+30),comment=zip.readUInt16LE(at+32),offset=zip.readUInt32LE(at+42);
  assert(at+46+n+extra+comment<=end,'Truncated ZIP directory');
  const name=zip.subarray(at+46,at+46+n).toString('utf8'),item=expected.get(name);
  assert(item&&!seen.has(name),'Unlisted or repeated ZIP member');seen.add(name);
  assert.equal(flags&1,0,'Encrypted ZIP unsupported');assert(method===0||method===8,'Unsupported ZIP compression');
  assert(size<=128*1024*1024&&packed<=zip.length,'Backup member is too large');
  assert(offset+30<=centralAt&&zip.readUInt32LE(offset)===0x04034b50,'Invalid ZIP local header');
  const localName=zip.readUInt16LE(offset+26),localExtra=zip.readUInt16LE(offset+28);
  assert.equal(zip.subarray(offset+30,offset+30+localName).toString('utf8'),name,'ZIP local member differs');
  const dataAt=offset+30+localName+localExtra;assert(dataAt+packed<=centralAt,'Truncated ZIP member');
  const input=zip.subarray(dataAt,dataAt+packed),bytes=method===0?input:zlib.inflateRawSync(input,{maxOutputLength:128*1024*1024});
  assert.equal(bytes.length,size);assert.equal(size,item.bytes);assert.equal(crc32(bytes),crc,'Backup ZIP CRC differs');
  assert.equal(sha(bytes),item.sha256,'Backup entry hash differs');total+=size;assert(total<=512*1024*1024,'Backup total is too large');
  at+=46+n+extra+comment;
 }
 assert.equal(at,centralAt+centralBytes);return {files:count,bytes:total,sha256:manifest.backupSha256};
}
function packageInfo(text){
 const field=name=>text.match(new RegExp('(?:^|\\n)\\s*'+name+'=([^\\r\\n]+)'))?.[1]?.trim()||null;
 return {version:field('versionName'),code:Number(text.match(/versionCode=(\d+)/)?.[1]||0),firstInstallTime:field('firstInstallTime')};
}
function manifestFingerprint(manifest){return sha(JSON.stringify([...manifest.files].map(({path,bytes,sha256})=>({path,bytes,sha256})).sort((a,b)=>a.path.localeCompare(b.path,'en'))));}

function main(argv=process.argv.slice(2)){
 const [serial,label,expectedAPK,...rest]=argv;
 assert(serial&&/^[A-Za-z0-9_.:-]+$/.test(serial),'Explicit ADB serial is required');
 assert(/^(reno|pkj)$/.test(label||''),'Known device label is required');
 assert(/^[a-f0-9]{64}$/.test(expectedAPK||''),'Expected Codex APK SHA256 is required');
 assert(rest.length===0||rest.length===2&&rest[0]==='--transfer-id','Unexpected CLI arguments');
 const id=rest[1]||'clone133-'+Date.now()+'-'+crypto.randomBytes(6).toString('hex');
 assert(/^[A-Za-z0-9_-]{8,64}$/.test(id),'Transfer ID must have 8-64 safe characters');
 const privateRoot=path.resolve(root,'.local-migrations/clone133',label,id),sourceDir=path.join(privateRoot,'source');
 const stateFile=path.join(privateRoot,'state.json'),resultFile=path.join(privateRoot,'migration-result.json');
 fs.mkdirSync(privateRoot,{recursive:true});
 const logFile=path.join(privateRoot,'adb-private.log');let stage='preflight';
 const log=(event,data)=>fs.appendFileSync(logFile,JSON.stringify({at:new Date().toISOString(),event,...data})+'\n');
 const run=(args,{accepted=[0],timeout=120000,returnResult=false}={})=>{
  const result=cp.spawnSync(adb,['-s',serial,...args],{windowsHide:true,encoding:'utf8',timeout,maxBuffer:16*1024*1024});
  log('adb',{stage,args,status:result.status,stdout:result.stdout||'',stderr:result.stderr||'',error:result.error?.message});
  assert(!result.error&&accepted.includes(result.status),'ADB command failed; inspect the private log');
  return returnResult?result:result.stdout||'';
 };
 const text=(...args)=>run(args).trim();
 const saveState=value=>{
  const next={...readJSON(stateFile),...value,updatedAt:new Date().toISOString()};
  const temp=stateFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n');fs.renameSync(temp,stateFile);return next;
 };
 const unlocked=()=>{
  const policy=text('shell','dumpsys','window','policy');
  assert(!/(?:mShowingLockscreen|isKeyguardShowing|keyguardShowing|showing|mDreamingLockscreen)\s*[=:]\s*true\b/.test(policy),'Phone is locked');
  assert(/(?:showing|isKeyguardShowing|keyguardShowing)\s*[=:]\s*false\b/.test(policy),'Unlocked state could not be confirmed');
 };
 const stopped=pkg=>{const pid=run(['shell','pidof',pkg],{accepted:[0,1]}).trim();assert(!pid,'An app restarted; transfer stopped');};
 const stop=pkg=>{text('shell','am','force-stop',pkg);stopped(pkg);};
 const targetHash=()=>{
  const lines=text('shell','pm','path',TARGET).split(/\r?\n/);assert.equal(lines.length,1,'Split APK target is unsupported');
  const remote=lines[0].replace(/^package:/,'');assert(/^\/data\/app\/[A-Za-z0-9_./~+=-]+\/base\.apk$/.test(remote),'Unexpected installed APK path');
  const value=text('shell','sha256sum',remote).split(/\s/)[0];assert.equal(value,expectedAPK,'Installed Codex APK hash differs');return value;
 };
 const pullImmutable=(remote,local)=>{
  fs.mkdirSync(path.dirname(local),{recursive:true});
  const temp=local+'.download-'+crypto.randomBytes(4).toString('hex');
  run(['pull',remote,temp]);
  assert(fs.statSync(temp).isFile(),'ADB did not pull a regular file');
  if(fs.existsSync(local)){
   assert.equal(sha(fs.readFileSync(temp)),sha(fs.readFileSync(local)),'Existing preserved transfer file differs');fs.unlinkSync(temp);
  }else fs.renameSync(temp,local);
 };
 const instrument=(action,transferId,extra={})=>{
  unlocked();stopped(SOURCE);stop(TARGET);
  const args=['shell','am','instrument','-w','-r','-e','class',CLASS,'-e','action',action,'-e','transferId',transferId,'-e','sourceVersion',VERSION];
  for(const [key,value]of Object.entries(extra))args.push('-e',key,String(value));
  args.push(HELPER+'/androidx.test.runner.AndroidJUnitRunner');
  const output=run(args,{timeout:180000});
  assert(/OK \(1 test\)/.test(output)&&!/FAILURES!!!|INSTRUMENTATION_FAILED|shortMsg=|Process crashed/.test(output),'Transfer instrumentation failed; inspect private log');
  stop(TARGET);stopped(SOURCE);
 };
 const remoteRoot='/sdcard/Android/data/'+TARGET+'/files';
 const exportRoot=transferId=>remoteRoot+'/clone132-export/'+transferId;
 const sourceManifest=()=>{
  const manifest=readJSON(path.join(sourceDir,'manifest.json'));assert.equal(manifest.version,1);
  assert.equal(manifest.sourcePackage,SOURCE);assert.equal(manifest.sourceVersion,VERSION);
  assert(Array.isArray(manifest.files)&&manifest.files.length>0&&manifest.files.length<2000,'Invalid source file manifest');
  const seen=new Set();let bytes=0;
  for(const item of manifest.files){
   assert(allowed(item.path)&&!seen.has(item.path),'Unexpected or repeated source path');seen.add(item.path);
   assert(/^[a-f0-9]{64}$/.test(item.sha256)&&Number.isSafeInteger(item.bytes)&&item.bytes>=0&&item.bytes<=128*1024*1024,'Invalid source metadata');
   const data=fs.readFileSync(safeLocal(sourceDir,item.path));assert.equal(data.length,item.bytes);assert.equal(sha(data),item.sha256,'Preserved source hash differs');bytes+=data.length;
  }
  assert(bytes<=512*1024*1024,'Source total is too large');
  assert(manifest.files.some(x=>/^territorio\/data-[ab]\.json$/.test(x.path)),'Source business slots missing');return manifest;
 };
 const confirmSourceUnchanged=manifest=>{
  stopped(SOURCE);
  const directories=text('shell','run-as',SOURCE,'ls','files').split(/\r?\n/).filter(x=>['territorio','territorio-training'].includes(x));
  const listed=directories.flatMap(dir=>text('shell','run-as',SOURCE,'find','files/'+dir,'-type','f').split(/\r?\n/).filter(Boolean).map(x=>x.replace(/^files\//,''))).sort();
  assert.deepEqual(listed,manifest.files.map(x=>x.path).sort(),'Source file inventory changed since capture');
  for(const item of manifest.files){const hash=text('shell','run-as',SOURCE,'sha256sum','files/'+item.path).split(/\s/)[0];assert.equal(hash,item.sha256,'Claude changed since capture');}
  stopped(SOURCE);
 };
 try{
  assert(fs.existsSync(adb),'ADB executable missing');unlocked();
  const before=packageInfo(text('shell','dumpsys','package',TARGET)),sourceInfo=packageInfo(text('shell','dumpsys','package',SOURCE));
  assert.equal(before.version,VERSION,'Codex version differs');assert.equal(before.code,CODE,'Codex version code differs');
  assert.equal(sourceInfo.version,VERSION,'Claude version differs');targetHash();
  if(fs.existsSync(stateFile)){
   const previous=readJSON(stateFile);assert.equal(previous.serial,serial);assert.equal(previous.label,label);
   assert.equal(previous.expectedAPK,expectedAPK);assert.equal(previous.transferId,id);
  }else immutableJSON(stateFile,{version:1,serial,label,transferId:id,expectedAPK,targetPackage:TARGET,sourcePackage:SOURCE,sourceVersion:VERSION,targetVersion:VERSION,targetCode:CODE,firstInstallTime:before.firstInstallTime,createdAt:new Date().toISOString(),stage:'preflight'});
  if(fs.existsSync(resultFile)){
   const completed=readJSON(resultFile);assert.equal(completed.passed,true);assert.equal(completed.expectedAPK,expectedAPK);
   console.log(JSON.stringify(completed));return completed;
  }
  stage='helper';
  const helperAPK=path.join(VIZ,'clone132-transfer-build/clone132-transfer.apk'),helperReport=readJSON(path.join(VIZ,'clone132-transfer-build/build-report.json'));
  assert.equal(helperReport.package,HELPER);assert.equal(helperReport.target,TARGET);assert.equal(helperReport.businessDataEmbedded,false);
  assert.equal(sha(fs.readFileSync(helperAPK)),helperReport.sha256,'Signed helper APK hash differs');
  run(['install','--no-incremental','-r',helperAPK],{timeout:180000});
  const helperPath=text('shell','pm','path',HELPER).replace(/^package:/,'');
  assert(/^\/data\/app\/[A-Za-z0-9_./~+=-]+\/base\.apk$/.test(helperPath),'Unexpected installed helper APK path');
  assert.equal(text('shell','sha256sum',helperPath).split(/\s/)[0],helperReport.sha256,'Installed helper APK hash differs');
  stop(SOURCE);stop(TARGET);saveState({helperSHA256:helperReport.sha256,stage});
  stage='source-capture';
  if(!fs.existsSync(path.join(sourceDir,'manifest.json'))){
   assert(!fs.existsSync(sourceDir)||fs.readdirSync(sourceDir).length===0,'Partial source capture requires inspection; refusing overwrite');
   const result=cp.spawnSync(process.execPath,[path.join(__dirname,'capture-claude-data.cjs'),serial,label,sourceDir],{windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024,env:{...process.env,AGRO_CAPTURE_OUTPUT:sourceDir}});
   log('capture',{status:result.status,stdout:result.stdout||'',stderr:result.stderr||'',error:result.error?.message});
   assert(!result.error&&result.status===0,'Source capture failed; inspect private log');
  }
  const incoming=sourceManifest();confirmSourceUnchanged(incoming);
  const manifestFile=path.join(sourceDir,'manifest.json'),manifestSHA256=sha(fs.readFileSync(manifestFile));
  saveState({stage,manifestSHA256,sourceFiles:incoming.files.length});
  stage='destination-backup';
  instrument('export',id);
  const backupDir=path.join(privateRoot,'destination-before'),backupFile=path.join(backupDir,'backup.zip'),backupManifestFile=path.join(backupDir,'backup-manifest.json');
  pullImmutable(exportRoot(id)+'/backup-manifest.json',backupManifestFile);
  pullImmutable(exportRoot(id)+'/backup.zip',backupFile);
  const backupManifest=readJSON(backupManifestFile);assert.equal(backupManifest.transferId,id);
  const verifiedBackup=validateBackup(backupFile,backupManifest);saveState({stage,backupSHA256:verifiedBackup.sha256,backupFiles:verifiedBackup.files});
  const alreadyApplied=run(['shell','test','-f',exportRoot(id)+'/applied.json'],{accepted:[0,1],returnResult:true}).status===0;
  if(!alreadyApplied){
   stage='prepare-import';
   const remoteIncoming=remoteRoot+'/clone132-import/'+id;
   for(const item of incoming.files){
    const remote=remoteIncoming+'/'+item.path;run(['shell','mkdir','-p',remote.slice(0,remote.lastIndexOf('/'))]);
    run(['push',safeLocal(sourceDir,item.path),remote]);
    assert.equal(text('shell','sha256sum',remote).split(/\s/)[0],item.sha256,'Staged source file hash differs');
   }
   run(['push',manifestFile,remoteIncoming+'/manifest.json']);
   assert.equal(text('shell','sha256sum',remoteIncoming+'/manifest.json').split(/\s/)[0],manifestSHA256,'Staged source manifest hash differs');
   saveState({stage});
   stage='last-consistency-check';confirmSourceUnchanged(incoming);targetHash();
   // Re-export into a NEW ID, so a resumed run cannot silently rely on an obsolete backup.
   const checkId=id+'-'+crypto.randomBytes(4).toString('hex');
   assert(checkId.length<=80);instrument('export',checkId);
   const checkManifestFile=path.join(privateRoot,'destination-check-'+checkId+'.json');
   pullImmutable(exportRoot(checkId)+'/backup-manifest.json',checkManifestFile);
   const checkManifest=readJSON(checkManifestFile);
   assert.equal(manifestFingerprint(checkManifest),manifestFingerprint(backupManifest),'Codex data changed after safety backup; start a new transfer ID');
   saveState({stage,consistencyBackupId:checkId});
  }
  stage='apply';
  instrument('apply',id,{backupSha256:verifiedBackup.sha256,manifestSha256:manifestSHA256,confirmClone:'CLAUDE132_TO_CODEX'});
  const receiptFile=path.join(privateRoot,'applied.json');pullImmutable(exportRoot(id)+'/applied.json',receiptFile);
  const receipt=readJSON(receiptFile);
  assert.equal(receipt.targetPackage,TARGET);assert.equal(receipt.sourcePackage,SOURCE);assert.equal(receipt.transferId,id);
  assert.equal(receipt.manifestSha256,manifestSHA256);assert.equal(receipt.backupSha256,verifiedBackup.sha256);
  assert.equal(receipt.filesCopied,incoming.files.length);assert.equal(receipt.status,'applied-offline-before-launch');
  targetHash();stopped(SOURCE);stopped(TARGET);
  const after=packageInfo(text('shell','dumpsys','package',TARGET));assert.equal(after.firstInstallTime,before.firstInstallTime);
  const counts={};for(const key of ['products','sales','clients','events','movements','expenses']){
   assert(Number.isSafeInteger(receipt.counts?.[key])&&receipt.counts[key]>=0,'Invalid receipt count');counts[key]=receipt.counts[key];
  }
  const result={passed:true,status:'applied-offline-before-launch',label,transferId:id,version:VERSION,versionCode:CODE,expectedAPK,helperSHA256:helperReport.sha256,manifestSHA256,backupSHA256:verifiedBackup.sha256,receiptSHA256:sha(fs.readFileSync(receiptFile)),filesCopied:receipt.filesCopied,counts,firstInstallTimePreserved:true,appsLeftStopped:true,finishedAt:new Date().toISOString()};
  immutableJSON(resultFile,result);saveState({stage:'complete',resultSHA256:sha(fs.readFileSync(resultFile))});
  console.log(JSON.stringify(result));return result;
 }catch(error){
  log('failure',{stage,error:String(error.stack||error)});
  // No raw native output or business record is printed on failure.
  console.error(JSON.stringify({passed:false,label,transferId:id,stage,message:'Transfer stopped. Inspect the private migration log before resuming.'}));
  process.exitCode=1;return null;
 }
}
module.exports={main,validateBackup,crc32,packageInfo,manifestFingerprint};
if(require.main===module)main();
