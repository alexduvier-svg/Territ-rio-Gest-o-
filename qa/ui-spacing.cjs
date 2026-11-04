const assert=require('node:assert/strict');
const contract=require('./ui-spacing-contract.json');
async function assertControlSpacing(page,label='interface'){
 const result=await page.evaluate(contract=>{
  const errors=[],measurements=[];
  function rect(el){
   if(!el||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')return null;
   const b=el.getBoundingClientRect();let r={left:Math.max(0,b.left),right:Math.min(innerWidth,b.right),top:Math.max(0,b.top),bottom:Math.min(innerHeight,b.bottom)};
   for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),x=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowX)){r.left=Math.max(r.left,x.left);r.right=Math.min(r.right,x.right);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){r.top=Math.max(r.top,x.top);r.bottom=Math.min(r.bottom,x.bottom);}}
   return r.right-r.left>.5&&r.bottom-r.top>.5?r:null;
  }
  const name=el=>el.dataset.action||el.id||el.className||el.tagName;
  function pair(a,b,min,group){const x=rect(a),y=rect(b);if(!x||!y)return;const overlapX=Math.min(x.right,y.right)-Math.max(x.left,y.left),overlapY=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top),dx=Math.max(0,x.left-y.right,y.left-x.right),dy=Math.max(0,x.top-y.bottom,y.top-x.bottom),gap=Math.hypot(dx,dy),overlap=overlapX>.5&&overlapY>.5;const m={group,a:name(a),b:name(b),gap,min,overlap};measurements.push(m);if(overlap||gap+contract.tolerance<min)errors.push(m);}
  for(const g of contract.groups)for(const parent of document.querySelectorAll(g.selector)){const es=[...parent.querySelectorAll(g.items)].filter(el=>rect(el));for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++)pair(es[i],es[j],g.gap,g.selector);}
  for(const g of contract.pairs){const a=document.querySelectorAll(g.a)[g.aIndex||0],b=document.querySelectorAll(g.b)[g.bIndex||0];if(a&&b)pair(a,b,g.gap,g.a+' / '+g.b);}
  return {label:document.getElementById('dialog-title')?.textContent||document.documentElement.dataset.page,measurements,errors};
 },contract);
 assert.deepEqual(result.errors,[],label+' · controles próximos/sobrepostos: '+JSON.stringify(result.errors));return {label,checks:result.measurements.length};
}
module.exports={assertControlSpacing,contract};
