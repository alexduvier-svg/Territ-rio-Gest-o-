import {productOutlinePath} from '../product-outline.js';
import {printPages} from './model.js';
const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function lines(ctx,text,width,max){const words=String(text).split(/\s+/),out=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){out.push(line);line=word;}else line=next;}if(line)out.push(line);if(out.length>max){out.length=max;let last=out[max-1];while(last&&ctx.measureText(last+'…').width>width)last=last.slice(0,-1);out[max-1]=last+'…';}return out;}
function box(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export async function renderPrintImages(offer){
 await document.fonts.ready;const pages=printPages(offer),result=[];
 for(let index=0;index<pages.length;index++){
  await frame();const rows=pages[index],canvas=document.createElement('canvas');canvas.width=900;canvas.height=320+rows.length*216+150;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Não foi possível montar a imagem neste aparelho.');
  const dark=offer.theme==='dark',bg=dark?'#17191b':'#f3f4f8',face=dark?'#292d30':'#ffffff',edge=dark?'#51585d':'#dce2e8',text=dark?'#f5f7f8':'#171c1b',muted=dark?'#c0c6cc':'#58626b',accent=dark?'#b3cf91':'#527630';
  ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textBaseline='top';ctx.fillStyle=accent;ctx.font='700 24px "Inter Variable", sans-serif';ctx.fillText('AGRO GESTÃO · PRODUTOS DISPONÍVEIS',44,36);
  ctx.font='700 46px "Inter Tight Variable", sans-serif';ctx.fillStyle=text;lines(ctx,offer.brand,800,2).forEach((line,i)=>ctx.fillText(line,44,86+i*52));
  ctx.font='400 27px "Inter Variable", sans-serif';ctx.fillStyle=muted;ctx.fillText('Lista de '+new Date(offer.at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),44,212);
  ctx.fillText('Escolha e responda com o produto e a quantidade.',44,257);
  for(let i=0;i<rows.length;i++){
   const p=rows[i],y=320+i*216,gradient=ctx.createLinearGradient(40,y,850,y+194);gradient.addColorStop(0,face);gradient.addColorStop(1,dark?'#25292c':'#ecf1f5');ctx.fillStyle=gradient;box(ctx,36,y,828,194,26);ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();
   ctx.save();ctx.translate(58,y+38);ctx.scale(2,2);ctx.strokeStyle=accent;ctx.lineWidth=1.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(productOutlinePath(p)));ctx.restore();
   ctx.fillStyle=text;ctx.font='700 38px "Inter Tight Variable", sans-serif';lines(ctx,p.name,474,2).forEach((line,n)=>ctx.fillText(line,126,y+24+n*43));
   ctx.fillStyle=muted;ctx.font='400 28px "Inter Variable", sans-serif';lines(ctx,p.label||p.unit,474,2).forEach((line,n)=>ctx.fillText(line,126,y+116+n*33));
   ctx.fillStyle=text;ctx.font='700 39px "Inter Tight Variable", sans-serif';for(let size=38;ctx.measureText(money(p.price)).width>210&&size>=24;size--)ctx.font='700 '+size+'px "Inter Tight Variable", sans-serif';ctx.textAlign='right';ctx.fillText(money(p.price),838,y+45);ctx.fillStyle=accent;ctx.font='600 24px "Inter Variable", sans-serif';ctx.fillText('Disponível',838,y+109);ctx.textAlign='left';
  }
  const foot=canvas.height-120;ctx.fillStyle=muted;ctx.font='400 25px "Inter Variable", sans-serif';ctx.fillText('O produtor confirma a disponibilidade ao receber o pedido.',44,foot);
  if(offer.phone)ctx.fillText('WhatsApp do produtor: '+offer.phone,44,foot+41);ctx.textAlign='right';ctx.fillText((index+1)+' / '+pages.length,856,canvas.height-38);ctx.textAlign='left';
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.86));canvas.width=canvas.height=1;if(!blob)throw Error('Não foi possível preparar a imagem.');result.push(blob);
 }
 return result;
}
