import {standardCoffeeModels,roastCode} from '../features/coffee.js';
// App additions are separate from the supplied 2,479-record source catalogue.
// These are suggestions only: never provide price, cost or available stock.
const additions = [{
  id: 'agro_app_queijo_ralado_pacote_50g_v1',
  categoria: 'Laticínios', subcategoria: 'Queijos e requeijões',
  nome_base: 'Queijo ralado', nome_exibicao: 'Queijo ralado — Ralado, 50 g',
  sabor: null, variedade: null, forma: 'Ralado', unidade_venda: 'un',
  conteudo_quantidade: 50, conteudo_unidade: 'g', embalagem: 'Pacote',
  aliases: ['Queijos ralados'], confirmar_denominacao: false,
  observacao: 'Confira o tipo de queijo e os dados da embalagem real. Nenhum valor ou saldo é preenchido pelo catálogo.',
  nome_singular: 'Queijo ralado', nome_plural: 'Queijos ralados',
  nome_busca_plural: 'Queijos ralados', unidades_permitidas: ['un'],
}];

// The source already provides Especial/Gourmet/Tradicional. Complete Superior separately.
for(const format of ['Moído','Em grãos'])for(const model of standardCoffeeModels(format).filter(p=>p.type==='Superior')){
 const code=roastCode(model),grain=format==='Moído'?'moido':'graos';
 additions.push({id:'agro_app_cafe_superior_'+code.toLowerCase()+'_'+grain+'_'+model.weight+'g_v1',categoria:'Cafés',subcategoria:'Café Torrado',nome_base:'Café',nome_exibicao:'Café Superior Torra '+model.coffeeRoast.toLocaleLowerCase('pt-BR')+' — '+format+', '+model.weight+' g',sabor:null,variedade:'Superior',coffeeRoast:model.coffeeRoast,forma:format,unidade_venda:'un',conteudo_quantidade:model.weight,conteudo_unidade:'g',embalagem:'Pacote',aliases:['Café Superior '+code],confirmar_denominacao:false,observacao:'Confirme a torra e os dados da embalagem. Preço, custo e saldo são informados pelo produtor.',nome_singular:'Café Superior',nome_plural:'Cafés Superiores',nome_busca_plural:'Cafés Superiores',unidades_permitidas:['un']});
}
// Explicit Drip Coffee references: the producer confirms net content and actual packaging.
// A total pack weight does not imply how many individual filters it contains.
for(const coffeeRoast of ['Clara','Média','Escura'])for(const weight of [10,250,500,1000]){
 const code=roastCode({category:'Cafés',coffeeRoast});
 additions.push({id:'agro_app_drip_coffee_'+code.toLowerCase()+'_'+weight+'g_v1',categoria:'Cafés',subcategoria:'Café Torrado',nome_base:'Drip coffee',nome_exibicao:'Drip Coffee Torra '+coffeeRoast.toLocaleLowerCase('pt-BR')+' — Dose individual, '+weight+' g',sabor:null,variedade:'Drip coffee',coffeeRoast,forma:'Dose individual',unidade_venda:'un',conteudo_quantidade:weight,conteudo_unidade:'g',embalagem:'Pacote',aliases:['Drip Coffee '+code,'Café Drip','Café em Filtro Individual'],confirmar_denominacao:false,observacao:'Confirme a torra, o peso total e a embalagem real. O número de doses não é presumido; preço, custo e saldo são informados pelo produtor.',nome_singular:'Drip Coffee',nome_plural:'Drip Coffees',nome_busca_plural:'Drip Coffees',unidades_permitidas:['un']});
}
// Green-coffee references describe the grain, never a roast or a fixed lot weight.
for(const [species,variety,base] of [...['Catuaí','Mundo Novo','Bourbon','Acaiá','Icatu','Catucaí','Topázio','Arara'].map(v=>['Arábica',v,'Café arábica verde']),['Canéfora','Robusta','Café robusta verde']]){
 const slug=variety.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,'_');
 additions.push({id:'agro_app_cafe_verde_'+slug+'_v1',categoria:'Cafés',subcategoria:'Café Verde',nome_base:base,nome_exibicao:base+' — '+variety,sabor:null,variedade:'Commodity',coffeeSpecies:species,coffeeVariety:variety,coffeeRoast:'',forma:'Verde',unidade_venda:'un',conteudo_quantidade:60,conteudo_unidade:'kg',embalagem:'Saca',aliases:['Café Verde '+species+' '+variety,'Café Commodity '+variety],confirmar_denominacao:false,observacao:'Grão verde, sem torra, em saca de 60 kg (a medida padrão do café). Confirme espécie, variedade e se o comprador usa outra medida; nenhum preço, custo ou saldo é presumido.',nome_singular:base,nome_plural:base, nome_busca_plural:base,unidades_permitidas:['un']});
}
// Hortifrúti regional (pedido do produtor, 03/11/2026): folhas, PANCs e ervas da roça mineira que
// faltavam no catálogo. Sugestão de venda por maço (ou kg nas raízes); nada de preço, custo ou saldo.
// Nome popular não garante a espécie nem a parte comestível: quem vende confirma.
const PANC_NOTE='Planta alimentícia não convencional. Confirme a espécie e a parte comestível; o nome popular muda de região para região.';
const HERB_NOTE='Erva de uso popular. Venda como planta ou tempero; o app não indica uso medicinal.';
for(const [name,plural,sub,note,aliases,unit] of [
 ['Assa-peixe','Assa-peixes','Verduras e folhas',PANC_NOTE,['Folha de assa-peixe','Assa-peixe para fritar']],
 ['Capuchinha','Capuchinhas','Verduras e folhas',PANC_NOTE,['Chagas','Flor de capuchinha']],
 ['Jambu','Jambus','Verduras e folhas',PANC_NOTE,['Agrião-do-pará']],
 ['Vinagreira','Vinagreiras','Verduras e folhas',PANC_NOTE,['Hibisco vinagreira','Caruru-azedo','Quiabo-roxo']],
 ['Couve-manteiga','Couves-manteiga','Verduras e folhas',null,['Couve manteiga']],
 ['Folha de mandioca','Folhas de mandioca','Verduras e folhas','Folha de mandioca só se come cozida, conforme o preparo tradicional. Confirme a variedade.',['Maniva']],
 ['Folha de batata-doce','Folhas de batata-doce','Verduras e folhas',PANC_NOTE,['Rama de batata-doce']],
 ['Dente-de-leão','Dentes-de-leão','Verduras e folhas',PANC_NOTE,[]],
 ['Bredo','Bredos','Verduras e folhas',PANC_NOTE,['Caruru-de-mancha']],
 ['Major-gomes','Majores-gomes','Verduras e folhas',PANC_NOTE,['Maria-gorda','Beldroega-grande']],
 ['Urtiga','Urtigas','Verduras e folhas',PANC_NOTE,['Cansanção']],
 ['Tansagem','Tansagens','Verduras e folhas',PANC_NOTE,['Tanchagem','Transagem']],
 ['Flor de abóbora','Flores de abóbora','Flores e cabeças',null,[]],
 ['Umbigo de banana','Umbigos de banana','Flores e cabeças',null,['Coração de banana','Mangará']],
 ['Broto de bambu','Brotos de bambu','Legumes e frutos culinários','Broto de bambu precisa ser cozido antes de comer. Confirme a espécie.',[]],
 ['Jurubeba','Jurubebas','Legumes e frutos culinários',PANC_NOTE,[]],
 ['Gueroba','Gueirobas','Legumes e frutos culinários',null,['Guariroba','Palmito amargo']],
 ['Fisális','Fisális','Legumes e frutos culinários',null,['Physalis','Camapu']],
 ['Mangarito','Mangaritos','Raízes e tubérculos',null,[],'kg'],
 ['Cará-do-ar','Carás-do-ar','Raízes e tubérculos',null,['Cará-moela'],'kg'],
 ['Yacon','Yacons','Raízes e tubérculos',null,['Batata yacon'],'kg'],
 ['Boldo','Boldos','Temperos frescos',HERB_NOTE,[]],
 ['Poejo','Poejos','Temperos frescos',HERB_NOTE,[]],
 ['Arruda','Arrudas','Temperos frescos',HERB_NOTE,[]],
 ['Manjerona','Manjeronas','Temperos frescos',null,[]],
 ['Guaco','Guacos','Temperos frescos',HERB_NOTE,[]],
 ['Losna','Losnas','Temperos frescos',HERB_NOTE,['Absinto']],
 ['Capim-santo','Capins-santos','Temperos frescos',HERB_NOTE,['Capim-cidreira','Capim-limão']],
 ['Mastruz','Mastruzes','Temperos frescos',HERB_NOTE,['Erva-de-santa-maria']],
 ['Pariparoba','Pariparobas','Verduras e folhas',PANC_NOTE,[]],
]){
 const slug=name.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'_');
 const kg=unit==='kg';
 additions.push({id:'agro_app_hortifruti_'+slug+'_v1',categoria:'Hortifruti',subcategoria:sub,nome_base:name,nome_exibicao:name+(kg?' — kg':' — Maço'),sabor:null,variedade:null,forma:kg?'In natura':'Maço',unidade_venda:kg?'kg':'maco',conteudo_quantidade:null,conteudo_unidade:null,embalagem:kg?'Granel':'Maço',aliases,confirmar_denominacao:!!note&&note!==HERB_NOTE,observacao:note,nome_singular:name,nome_plural:plural,nome_busca_plural:plural,unidades_permitidas:kg?['kg','un']:['maco','kg']});
}
export const PRODUCT_CATALOG_ADDITIONS=additions;
