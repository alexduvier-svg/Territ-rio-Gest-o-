const {start}=require('./lib.cjs');
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Gestão'});await p.waitForTimeout(800);
 await p.evaluate(()=>document.querySelectorAll('#app details').forEach(d=>d.open=true));
 await p.evaluate(()=>document.querySelectorAll('#app [aria-expanded="false"]').forEach(x=>x.click()));await p.waitForTimeout(800);
 const t=await p.evaluate(()=>{const out=[];const walk=(el,d)=>{for(const c of el.children){if(/^(H2|H3|H4|SUMMARY|BUTTON)$/.test(c.tagName)){out.push('  '.repeat(d)+c.tagName+': '+c.innerText.replace(/\s+/g,' ').slice(0,70));} if(c.matches('section,article,details,div'))walk(c,c.matches('section,article,details,.card,[class*=card]')?d+1:d); else walk(c,d);}};walk(document.querySelector('#app'),0);return out.join('\n');});
 console.log(t);console.log('ERR',p.errs);await b.close();})();
