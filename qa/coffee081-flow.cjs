const assert=require('node:assert/strict');
const{exercise:models}=require('./coffee080-flow.cjs');
async function exercise(p,capture){let checked=false;const result=await models(p,async label=>{if(label==='new-coffee-selling-pattern'){
 const parts=await p.locator('.feira-card .coffee-roast-code').evaluateAll(tags=>tags.map(tag=>{const second=tag.previousElementSibling,rest=tag.parentElement,s=second?.getBoundingClientRect(),r=rest.getBoundingClientRect(),t=tag.getBoundingClientRect(),card=tag.closest('.feira-card').getBoundingClientRect();return{type:second?.textContent,previousIsSecond:second?.classList.contains('cn-second'),insideRest:rest.classList.contains('cn-rest'),tag:tag.textContent,order:Array.from(rest.children).indexOf(second)<Array.from(rest.children).indexOf(tag),tagInCard:t.left>=card.left+5&&t.right<=card.right-5&&t.bottom<=card.bottom-8,room:s&&s.width+t.width+5<=card.width-18,sameLine:s&&Math.abs(s.top-t.top)<=3};}));assert.equal(parts.length,36);assert(parts.every(x=>x.previousIsSecond&&x.insideRest&&x.order&&x.tagInCard));assert.deepEqual([...new Set(parts.map(x=>x.type))],['Especial','Gourmet','Superior','Tradicional']);assert(parts.filter(x=>x.room).every(x=>x.sameLine),JSON.stringify(parts));checked=true;
 }if(capture)await capture(label);});assert(checked);
 const stock=p.evaluate(()=>ERPPreview.model().data.products.filter(p=>p.category==='Cafés').every(p=>{const code=TerritorioCoffee.roastCode(p);if(!code)return true;const text=TerritorioCoffee.coffeeName(p);return text.split(/\s+/)[Math.min(2,text.split(/\s+/).length-1)]===code;}));assert(await stock);
 return{...result,roastFollowsSecondWord:true,stockLabelsFollowSecondWord:true};
}
module.exports={exercise};
