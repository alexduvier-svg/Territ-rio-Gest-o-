const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:'+Number(process.argv[2]));
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost'));assert(page);
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:60000});
 assert(await page.evaluate(()=>['codex133','motion134'].includes(window.__AGRO_NATIVE_FIXTURE__)&&['codex133-synthetic','motion134-synthetic'].includes(ERPPreview.model().data.dataContext.id)));
 await page.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));
 // End the diagnostic connection without sending Browser.close to Android's WebView.
 console.log('Synthetic fixture ready and awake');process.exit(0);
})().catch(e=>{console.error(String(e));process.exit(1);});
