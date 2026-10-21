const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {exercise}=require('./hierarchy053.cjs');
const name=process.argv[2],port=Number(process.argv[3]||9341),report={version:'0.12.53',device:name,physicalAndroid:true,synthetic:true,networkBlockedByFixture:true,productionDatabaseAccessed:false,cases:[],errors:[]};
let browser;
(async()=>{try{browser=await chromium.connectOverCDP('http://127.0.0.1:'+port,{timeout:15000});const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://fixture.agro.test/'));assert(page,'Separate fixture WebView required');page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',msg=>{if(msg.type()==='error'&&!/CORS policy|Failed to load resource: net::ERR_FAILED/.test(msg.text()))report.errors.push('console: '+msg.text().slice(0,1000));});
 for(const theme of ['light','dark']){assert(page.url().startsWith('https://fixture.agro.test/'));await page.evaluate(()=>localStorage.clear());await page.goto('https://fixture.agro.test/?theme='+theme,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__AGRO_TOUCH_FIXTURE__==='candidate');assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.dataContext.id),'hierarchy053-synthetic');console.log('Fixture version '+await page.evaluate(()=>window.TERRITORIO_VERSION));report.cases.push(await exercise(page,{name,theme,physical:true}));}
 assert.equal(report.errors.length,0);report.passed=true;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{fs.writeFileSync(path.join(__dirname,'hierarchy053-native-'+name+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await Promise.race([browser?.close(),new Promise(r=>setTimeout(r,1000))]);process.exit(process.exitCode||0);}})();
