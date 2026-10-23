// Verified against MGI's published 2026 calendar. No points facultativos or invented future years.
const source='https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026';
export const NATIONAL_REFERENCE=Object.freeze({year:2026,verifiedAt:'2026-10-22',source,authority:'Portaria MGI nº 11.460/2025',note:'Calendário federal de 2026. Paixão de Cristo consta na referência federal; confirme as regras locais de funcionamento. Pontos facultativos não foram incluídos. Não determina autorização para vender nem funcionamento do comércio.'});
const days=[['01-01','Confraternização Universal'],['04-03','Paixão de Cristo'],['04-21','Tiradentes'],['05-01','Dia Mundial do Trabalho'],['09-07','Independência do Brasil'],['10-12','Nossa Senhora Aparecida'],['11-02','Finados'],['11-15','Proclamação da República'],['11-20','Dia Nacional de Zumbi e da Consciência Negra'],['12-25','Natal']];
export const NATIONAL_DATES=Object.freeze(days.map(([date,name])=>Object.freeze({id:'national-2026-'+date,name,start:'2026-'+date,end:'2026-'+date,source,city:'Brasil',uf:'BR',confirmed:true,national:true})));
export function corpusChristi(year){
 if(!Number.isInteger(year)||year<1900||year>2199)throw Error('Ano fora do calendário suportado.');
 // Gregorian Easter (Meeus/Jones/Butcher) +60 days; not a legal holiday decision.
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
 const at=new Date(Date.UTC(year,month-1,day+60,12)).toISOString().slice(0,10);
 return {id:'commercial-corpus-'+year,name:'Corpus Christi',start:at,end:at,city:'Brasil',uf:'BR',confirmed:true,commercial:true,source:'Data calculada pelo calendário gregoriano: Páscoa + 60 dias. Confirmar programação e regras do município.'};
}
