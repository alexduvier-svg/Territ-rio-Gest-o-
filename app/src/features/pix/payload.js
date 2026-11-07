// BR Code estático. Sem rede, consulta ao banco ou confirmação de liquidação.
const ascii=(value,max)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9 .-]/g,'').trim().toUpperCase().slice(0,max);
const tlv=(id,value)=>{const n=new TextEncoder().encode(value).length;if(n>99)throw Error('Campo Pix excede o tamanho permitido.');return id+String(n).padStart(2,'0')+value;};
export function crc16(value){let crc=0xffff;for(const c of new TextEncoder().encode(value)){crc^=c<<8;for(let i=0;i<8;i++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;}return crc.toString(16).toUpperCase().padStart(4,'0');}
export function pixPayload({key,name,city,amount,reference='***'}){
 if(typeof key!=='string'||!key.trim()||key.length>77||/[\s\x00-\x1f]/.test(key))throw Error('Confira a chave Pix cadastrada.');
 if(!Number.isSafeInteger(amount)||amount<=0||amount>99999999999)throw Error('Confira o valor da cobrança.');
 const receiver=ascii(name,25),place=ascii(city,15);if(!receiver||!place)throw Error('Informe recebedor e cidade.');
 const txid=String(reference).replace(/[^a-zA-Z0-9]/g,'').slice(0,25)||'***';
 const payload=tlv('00','01')+tlv('26',tlv('00','br.gov.bcb.pix')+tlv('01',key))+tlv('52','0000')+tlv('53','986')+tlv('54',(amount/100).toFixed(2))+tlv('58','BR')+tlv('59',receiver)+tlv('60',place)+tlv('62',tlv('05',txid))+'6304';return payload+crc16(payload);
}
export function paymentAmount(quote){const payments=quote?.payments||[];return payments.filter(p=>p.method==='Pix').reduce((sum,p)=>sum+p.amount,0);}
export function chargeSignature(owner,draft,quote){return JSON.stringify([owner,draft?.operationId||'',quote.items?.map(i=>[i.productId,i.qty,i.total]),quote.total,quote.payments]);}
