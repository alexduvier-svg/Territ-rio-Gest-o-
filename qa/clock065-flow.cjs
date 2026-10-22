const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),cp=require('child_process');
async function exercise(p,cfg){
 p.setDefaultTimeout(15000);await p.waitForFunction(()=>window.TerritorioEvents?.enhanceForm);await p.waitForTimeout(300);
 const before=await p.evaluate(()=>JSON.stringify({products:ERPPreview.model().data.products,sales:ERPPreview.model().data.sales,movements:ERPPreview.model().data.movements,clients:ERPPreview.model().data.clients,eventLoads:ERPPreview.model().data.eventLoads,events:ERPPreview.model().data.events.map(({id,name,start,end,from,until,status})=>({id,name,start,end,from,until,status}))}));
 await p.evaluate(()=>ERPPreview.actions['new-event']());await p.waitForSelector('.event-form-cards');await p.waitForTimeout(600);
 const inspect=()=>p.locator('.event-schedule-row').evaluateAll(rows=>rows.map(row=>{const button=row.querySelector('.event-time-field'),text=button.querySelector('strong'),range=document.createRange();range.selectNodeContents(text);const t=range.getBoundingClientRect(),b=button.getBoundingClientRect(),date=row.querySelector('.date-field-button'),dr=document.createRange();dr.selectNodeContents(date.querySelector('span'));const d=dr.getBoundingClientRect(),icon=date.querySelector('svg').getBoundingClientRect();return{value:text.textContent,fontSize:getComputedStyle(text).fontSize,lines:range.getClientRects().length,buttonWidth:b.width,textWidth:t.width,textInside:t.left>=b.left+4&&t.right<=b.right-4&&t.top>=b.top&&t.bottom<=b.bottom,center:Math.abs((t.left+t.right-b.left-b.right)/2),dateIconGap:icon.left-d.right,noIcon:!button.querySelector('svg'),noOverflow:button.scrollWidth<=button.clientWidth+1};}));
 let initial=await inspect();assert.deepEqual(initial.map(r=>r.value),['08:00','18:00']);
 function verify(rows){for(const row of rows){assert(row.lines===1&&row.textInside&&row.center<=1&&row.noIcon&&row.noOverflow&&row.dateIconGap>=4,JSON.stringify(row));}}
 verify(initial);
 // Simulate extra font enlargement without changing the input value or control width.
 await p.locator('.event-time-field>strong').evaluateAll(elements=>elements.forEach(el=>el.style.setProperty('font-size','30px','important')));await p.waitForFunction(()=>[...document.querySelectorAll('.event-time-field>strong')].every(el=>Math.abs(parseFloat(getComputedStyle(el).fontSize)-30)<.01));const enlarged=await inspect();verify(enlarged);assert(enlarged.every(row=>Math.abs(parseFloat(row.fontSize)-30)<.01),JSON.stringify(enlarged));
 await p.locator('.event-time-field>strong').evaluateAll(elements=>elements.forEach(el=>el.style.removeProperty('font-size')));
 for(const [field,hour,minute] of [['event-from','09','17'],['event-until','14','00']]){
  await p.locator('[data-field='+field+']').click();assert(await p.locator('#event-clock-editor').isVisible());
  await p.locator('.event-clock-grid [data-value="'+hour+'"]').click();
  if(minute==='17')await p.locator('[data-action=event-clock-precise]').click();
  await p.locator('.event-clock-grid [data-value="'+minute+'"]').click();assert(await p.locator('#event-clock-editor').isHidden());assert.equal(await p.locator('#'+field).inputValue(),hour+':'+minute);
 }
 const chosen=await inspect();verify(chosen);assert.deepEqual(chosen.map(r=>r.value),['09:17','14:00']);
 const layout=await p.locator('#dialog').evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x,right:b.right,width:innerWidth,document:document.documentElement.scrollWidth};});assert(layout.x>=10&&layout.right<=layout.width-10&&layout.document<=layout.width+1);
 const image=path.join(__dirname,'clock065-'+cfg.theme+(cfg.name?'-'+cfg.name:'-'+cfg.width)+(cfg.large?'-large':'')+'.png');
 if(cfg.physical){const adb=path.resolve(__dirname,'../android-sdk/platform-tools/adb.exe'),serial=process.env.AGRO_QA_SERIAL,file='/sdcard/agro-clock065.png';cp.execFileSync(adb,['-s',serial,'shell','screencap','-p',file]);cp.execFileSync(adb,['-s',serial,'pull',file,image]);}else await p.screenshot({path:image,fullPage:true});
 await p.evaluate(()=>ERPPreview.actions['close-modal']());await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>JSON.stringify({products:ERPPreview.model().data.products,sales:ERPPreview.model().data.sales,movements:ERPPreview.model().data.movements,clients:ERPPreview.model().data.clients,eventLoads:ERPPreview.model().data.eventLoads,events:ERPPreview.model().data.events.map(({id,name,start,end,from,until,status})=>({id,name,start,end,from,until,status}))})),before);
 return{...cfg,initial,enlarged,chosen,wholeTime:true,timeCentered:true,noDecorativeClock:true,customPickerWorks:true,recordsPreserved:true,layout};
}
module.exports={exercise};
