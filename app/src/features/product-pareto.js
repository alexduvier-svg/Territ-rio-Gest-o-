// Finance supplies audited net rows in cents; no historical sale is repriced.
export function productPareto(rows,units={}){
 const sold=rows.filter(r=>Number.isFinite(r.revenue)&&Number.isFinite(r.qty)&&(r.revenue!==0||r.qty!==0)),known=r=>r.costKnown&&Number.isFinite(r.cost),missing=sold.filter(r=>!known(r)).length;
 const gross=r=>r.revenue-r.cost,margin=r=>gross(r)/r.revenue;
 const curve=key=>{const list=sold.map(r=>({...r,value:key==='revenue'?r.revenue:gross(r)})).filter(r=>r.value>0).sort((a,b)=>b.value-a.value||String(a.id).localeCompare(String(b.id))),total=list.reduce((n,r)=>n+r.value,0);let cumulative=0;const out=list.map(r=>{const before=cumulative;cumulative+=r.value;return{id:r.id,name:r.name,value:r.value,share:r.value/total,cumulative:cumulative/total,priority:before<total*.8};});return{total,rows:out,priority:out.filter(r=>r.priority).length};};
 const groups=new Map();for(const r of sold.filter(r=>known(r)&&r.qty>0&&r.revenue>0&&units[r.id]&&!/não comparável/.test(units[r.id]))){const u=units[r.id];if(!groups.has(u))groups.set(u,[]);groups.get(u).push(r);}
 // Sweep quantities, querying the greatest gross profit at a STRICTLY higher margin.
 // Equal quantities enter together, so they cannot be labeled "sold fewer". O(n log n).
 let pair=null;for(const [unit,list]of groups){
  list.sort((a,b)=>a.qty-b.qty||String(a.id).localeCompare(String(b.id)));
  const margins=[...new Set(list.map(margin))].sort((a,b)=>b-a),indices=new Map(margins.map((m,i)=>[m,i+1])),tree=Array(margins.length+1).fill(null);
  const better=(a,b)=>!a?b:!b?a:gross(a)>gross(b)||gross(a)===gross(b)&&String(a.id)<String(b.id)?a:b;
  const update=r=>{for(let i=indices.get(margin(r));i<tree.length;i+=i&-i)tree[i]=better(tree[i],r);};
  const query=end=>{let best=null;for(let i=end;i>0;i-=i&-i)best=better(best,tree[i]);return best;};
  for(let i=0;i<list.length;){let j=i;while(j<list.length&&list[j].qty===list[i].qty)j++;for(let k=i;k<j;k++){const b=list[k],a=query(indices.get(margin(b))-1);if(a&&gross(a)>gross(b)){const difference=gross(a)-gross(b);if(!pair||difference>pair.difference)pair={less:a,more:b,unit,difference};}}for(let k=i;k<j;k++)update(list[k]);i=j;}
 }
 return{revenue:curve('revenue'),profit:missing?null:curve('profit'),missingCostProducts:missing,pair,negativeProfit:sold.filter(r=>known(r)&&gross(r)<0).map(r=>r.id),method:'Concentração observada até atingir 80%, sem pressupor que 20% dos produtos geram esse valor. Lucro bruto positivo antes de taxas e despesas; prejuízos são mostrados à parte.'};
}
