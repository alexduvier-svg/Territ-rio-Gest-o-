const {seed:base}=require('./agenda071-seed.cjs');
const seed=structuredClone(base),day=n=>new Date(Date.now()+n*86400000).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}),stamp=new Date().toISOString();
const event=(id,name,extra={})=>({id,name,status:'active',start:day(0),end:day(0),from:'00:00',until:'23:59',city:'Carangola',uf:'MG',place:'Praça Fictícia',...extra});
seed.events=[event('event075-live','Feira em Andamento QA',{fairId:'official-qa'}),event('event075-stale','Feira Oficial já Conferida QA',{fairId:'official-qa',fairClosedAt:stamp,surplusCheck:{conferido:true},lossReviewedAt:stamp}),event('event075-pending','Feira para Conferir QA',{status:'finished',closedAutomatically:true,finishedAt:stamp,start:day(-1),end:day(-1)}),event('event075-legacy','Conferência Adiada Antiga QA',{fairId:'official-qa',fairClosedAt:stamp,finishedAt:stamp,surplusCheck:{conferido:false}}),event('event075-scheduled','Feira Agendada QA',{start:day(1),end:day(1),from:'08:00',until:'18:00'}),event('event075-cancelled','Feira Cancelada QA',{status:'finished',fairCancelled:true,fairClosedAt:stamp})];
seed.eventLoads=['event075-live','event075-stale','event075-pending','event075-legacy'].map(id=>({eventId:id,items:[{productId:'coffee500',name:'Café Especial',unit:'Pacote',qty:3}]}));
seed.settings.fairReports={'event075-stale':{closedAt:stamp},'event075-legacy':{closedAt:stamp,pending:true,payload:{status:'preliminar'}}};
seed.settings.financialVisible=false;
module.exports={seed};
