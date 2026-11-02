const {chromium}=require('playwright-core');
exports.start=async(w=360,h=780)=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1.5});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto('http://localhost:4173/',{waitUntil:'networkidle'});
 await p.fill('input >> nth=0','Alex');await p.fill('input >> nth=2','Carangola');
 await p.getByText('Ver com dados de exemplo').click();await p.waitForTimeout(1200);
 p.A=(name,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[name,d]);
 p.shot=async(n,full=true)=>p.screenshot({path:'/tmp/claude-0/qa/shots/'+n+'.png',fullPage:full});
 return {b,p};
};
