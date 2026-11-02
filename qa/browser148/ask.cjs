const {start}=require('./lib.cjs');const fs=require('fs');
(async()=>{const {b,p}=await start();
 const qs=JSON.parse(fs.readFileSync(process.argv[2]||'/home/claude/repo/qa/questions148.json')).questions;
 const out=[];
 for(const q of qs){
  await p.A('close').catch(()=>{});await p.evaluate(()=>{try{ERPPreview.actions['close']?.()}catch{} document.getElementById('dialog')?.close?.();});
  await p.A('nav',{page:'Gestão'});await p.waitForTimeout(250);
  const t0=Date.now();await p.evaluate(async q=>{await window.TerritorioAgent.ask(q,'management');},q);const ms=Date.now()-t0;
  const r=await p.evaluate(()=>{const d=document.getElementById('dialog');return {title:document.getElementById('dialog-title')?.textContent||'',text:(d?.innerText||'').replace(/^[\s\S]*?Este mês\n\n/,'').replace(/\s+/g,' ')};});
  out.push({q,ms,...r});
 }
 for(const r of out)console.log('Q: '+r.q+' ('+r.ms+' ms)\n   ['+r.title+'] '+r.text.slice(0,260));
 console.log('ERR',p.errs.slice(0,3));await b.close();})();
