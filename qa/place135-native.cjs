const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed}=require('./place135-seed.cjs'),{exercise}=require('./place135-browser.cjs');
const [name,port,theme,serial]=process.argv.slice(2);
const fixturePackage='br.com.territorio.gestao2.place135';
const root=path.resolve(__dirname,'..'),out='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/place135-native';
const adb=path.resolve(root,'../New project/android-sdk/platform-tools/adb.exe');
const fixture='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/place135-fixture/fixture.apk';
fs.mkdirSync(out,{recursive:true});
const report={version:'0.12.135',device:name,theme,physical:true,synthetic:true,fixturePackage,fixtureSha256:crypto.createHash('sha256').update(fs.readFileSync(fixture)).digest('hex'),networkBlocked:true,productionDatabaseRead:false,startedAt:new Date().toISOString(),errors:[]};
let browser,page;
const command=(...args)=>cp.execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true});
function checkForeground(){
  assert(!command('shell','dumpsys','window','policy').includes('showing=true'),'Human unlock required');
  const top=command('shell','dumpsys','activity','activities').split('\n').find(l=>/topResumedActivity=|ResumedActivity:/.test(l));
  assert(top?.includes(fixturePackage+'/'),'Only the isolated fixture may be captured');
}
async function capture(label){
  checkForeground();
  command('shell','screencap','-p','/sdcard/place135-qa.png');
  command('pull','/sdcard/place135-qa.png',path.join(out,name+'-'+theme+'-'+label+'.png'));
}
(async()=>{try{
  browser=await chromium.connectOverCDP('http://127.0.0.1:'+Number(port));
  page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost'));
  assert(page,'Isolated WebView missing');page.setDefaultTimeout(20000);
  await page.waitForFunction(()=>window.__AGRO_NATIVE_FIXTURE__==='place135'&&window.__AGRO_UI_BOOT_READY__,null,{timeout:40000});
  assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.evaluate(async({seed,theme})=>{
    if(document.getElementById('dialog').open)ERPPreview.actions['close-modal']();
    ERPPreview.model().data=new ERP.ERPModel(seed).data;
    Object.assign(ERPPreview.model().data.settings,{appearance:theme,financialVisible:false});
    if(!ERPPreview.persist())throw Error('Synthetic fixture persistence failed');
    if(!await TerritorioNative.durable())throw Error('Synthetic fixture durable write failed');
  },{seed,theme});
  await page.reload();
  await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:40000});
  await page.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));
  checkForeground();
  report.result=await exercise(page,capture);
  assert(Object.values(report.result).every(Boolean));assert.equal(report.errors.length,0);
  report.passed=true;
}catch(error){report.errors.push(String(error.stack||error));process.exitCode=1;}
finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,name+'-'+theme+'.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  // This task still has physical measurement and delivery work; fixture uninstall releases KeepAwake.
  // Dropping the CDP connection leaves the fixture and its KeepAwake window intact for delivery.
  process.exit(process.exitCode||0);
}})();
