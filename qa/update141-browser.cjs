const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {chromium} = require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed} = require('./place135-seed.cjs');
const assets = path.resolve(__dirname, '../app/dist');
const output = process.env.AGRO_QA_OUTPUT || 'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/update141-browser';
const mime = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const report = {version:'0.12.141',compiled:true,synthetic:true,physical:false,networkBlocked:true,productionDatabaseRead:false,startedAt:new Date().toISOString(),cases:[],errors:[]};
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
function assetSnapshot() {
  const entries=[];
  const visit=directory=>{
    for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
      const file=path.join(directory,item.name);
      const actual=fs.statSync(file);
      if(actual.isDirectory())visit(file);
      else if(actual.isFile()) {const bytes=fs.readFileSync(file);entries.push({path:path.relative(assets,file).replaceAll(path.sep,'/'),bytes:bytes.length,sha256:sha256(bytes)});}
    }
  };
  visit(assets);entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  return {fingerprint:sha256(JSON.stringify(entries)),files:entries};
}

const {exercise}=require('./update141-flow.cjs');

async function run() {
  fs.mkdirSync(output,{recursive:true});
  assert(fs.existsSync(path.join(assets,'index.html')),'Compiled app/dist/index.html is required');
  report.assetsBefore=assetSnapshot();
  const apk=path.resolve(__dirname,'../AGRO-Gestao-Codex-0.12.141.apk');
  report.apk=fs.existsSync(apk)?{name:path.basename(apk),sha256:sha256(fs.readFileSync(apk))}:null;
  report.contextConcurrency=2;
  let browser;
  try {
    browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const jobs=(process.env.AGRO_SINGLE?['light']:['light','dark']).flatMap(theme=>(process.env.AGRO_SINGLE?[Number(process.env.AGRO_WIDTH)||320]:[320,360,393,412]).map(width=>({theme,width})));
    async function runCase(theme,width) {
        const entry={theme,width,largeText:width===320,performanceMode:width===320?'lite':'auto',reducedMotion:width===320};
        const context=await browser.newContext({viewport:{width,height:width===320?568:820},hasTouch:true,isMobile:true,colorScheme:theme,reducedMotion:width===320?'reduce':'no-preference'});
        try {
          await context.route('**/*',route=>{
            const url=new URL(route.request().url());
            if(url.origin!=='https://localhost')return route.abort();
            const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''), file=path.resolve(assets,relative||'index.html');
            if(file!==assets&&!file.startsWith(assets+path.sep))return route.abort();
            if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
            return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
          });
          const data=structuredClone(seed);
          Object.assign(data.settings,{appearance:theme,largeText:entry.largeText,performanceMode:entry.performanceMode});
          await context.addInitScript(data=>{
            window.__AGRO_DIAGNOSTIC_SESSION__=true;
            if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data));
            localStorage.setItem('agro-notification-prompt-v1','answered');
          },data);
          const page=await context.newPage();
          const errors=[];page.on('pageerror',error=>errors.push(String(error.stack||error)));
          await page.goto('https://localhost');
          const capture=label=>page.screenshot({path:path.join(output,`${theme}-${width}-${label}.png`)});
          entry.result=await exercise(page,capture);
          assert.deepEqual(errors,[],'Uncaught browser errors');
          entry.passed=true;
        } catch(error) {
          entry.passed=false;entry.error=String(error.stack||error);report.errors.push({theme,width,error:entry.error});
          const page=context.pages()[0];if(page)await page.screenshot({path:path.join(output,`${theme}-${width}-failure.png`)}).catch(()=>{});
        } finally {
          report.cases.push(entry);
          await context.unrouteAll({behavior:'ignoreErrors'});await context.close();
          fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));
          console.log(JSON.stringify({theme,width,passed:entry.passed,error:entry.error}));
        }
    }
    const worker=async()=>{while(jobs.length){const {theme,width}=jobs.shift();await runCase(theme,width);}};
    await Promise.all([worker(),worker()]);
  } finally {
    await browser?.close();
    report.finishedAt=new Date().toISOString();
    report.assetsAfter=assetSnapshot();
    report.assetsUnchanged=report.assetsBefore.fingerprint===report.assetsAfter.fingerprint;
    if(!report.assetsUnchanged)report.errors.push({error:'Compiled asset contents changed during the test matrix'});
    if(report.apk&&sha256(fs.readFileSync(apk))!==report.apk.sha256)report.errors.push({error:'APK contents changed during the test matrix'});
    report.cases.sort((a,b)=>a.theme.localeCompare(b.theme)||a.width-b.width);
    report.passed=report.cases.length===(process.env.AGRO_SINGLE?1:8)&&report.cases.every(c=>c.passed)&&report.errors.length===0&&report.assetsUnchanged;
    fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors.length,report:path.join(output,'review.json')}));
    if(!report.passed)process.exitCode=1;
  }
}
module.exports={exercise,run};
if(require.main===module)run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
