export function trainingData({id,appearance='system',largeText=false,reduceEffects=false,performanceMode='auto',mode='examples',selected=[],now=new Date().toISOString()}={}){
 if(!id)throw Error('Identificação do treino ausente.');
 let products=[
 {id:'training-coffee',baseName:'Café',name:'Café Especial',category:'Cafés',type:'Especial',format:'Moído',unit:'Pacote',weight:250,stock:10,min:2,price:2500,cost:1500},
 {id:'training-banana',baseName:'Banana Prata',name:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:12,min:2,price:1000,cost:500},
 {id:'training-cheese',baseName:'Queijo Meia Cura',name:'Queijo Meia Cura',category:'Laticínios',unit:'Unidade',stock:8,min:2,price:3500,cost:2000},
 {id:'training-honey',baseName:'Mel',name:'Mel',category:'Apicultura',unit:'Pote',weight:500,stock:6,min:2,price:3000,cost:1800},
 {id:'training-eggs',baseName:'Ovos Caipiras',name:'Ovos Caipiras',category:'Hortifruti-Granjeiro',unit:'Dúzia',stock:10,min:2,price:1500,cost:800},
 {id:'training-jam',baseName:'Geleia de Morango',name:'Geleia de Morango',category:'Doces',unit:'Pote',weight:250,stock:6,min:2,price:1800,cost:900}
 ].map(p=>({...p,actorId:id,stockGroup:'general',demo:true}));
 if(mode==='own'){if(selected.length>5)throw Error('Escolha até 5 produtos para o treino.');const fields=['baseName','name','category','type','format','unit','weight','volume','contentCount','contentUnit','stock','min','price','cost'];products=selected.map((p,i)=>({...Object.fromEntries(fields.filter(k=>p[k]!==undefined).map(k=>[k,p[k]])),id:'training-own-'+i,actorId:id,stockGroup:'general',demo:true}));}
 return{schema:1,demoRevision:6,inventoryRevision:20,training:{version:1,actorId:id,mode,productLimit:mode==='own'?5:6},dataContext:{id,type:'demo'},products,sales:[],expenses:[],events:[],eventLoads:[],profiles:{},contacts:[],clients:['Ana Exemplo','Bruno Exemplo','Carla Exemplo','Daniel Exemplo','Elisa Exemplo','Fabio Exemplo'].map((name,i)=>({id:'training-client-'+i,name,phone:'',uf:'MG',city:'Carangola',neighborhood:'Centro',demo:true})),movements:products.map(p=>({id:'training-initial-'+p.id,productId:p.id,name:p.name,date:now,kind:'initial',qty:p.stock,before:0,after:p.stock,note:'Saldo Fictício de Treino',unit:p.unit})),settings:{onboarding:'demo',businessName:'Negócio de Exemplo',producerName:'Produtor de Exemplo',phone:'',email:'',city:'Carangola',uf:'MG',appearance,largeText,reduceEffects,performanceMode,financialVisible:false,backupReminder:false,firstUseAt:now},catalog:{title:'Produtos de Exemplo',story:'',publicUrl:'',photos:{}}};
}
