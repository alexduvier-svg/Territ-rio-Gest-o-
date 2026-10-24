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
 additions.push({id:'agro_app_cafe_verde_'+slug+'_v1',categoria:'Cafés',subcategoria:'Café Verde',nome_base:base,nome_exibicao:base+' — '+variety,sabor:null,variedade:'Commodity',coffeeSpecies:species,coffeeVariety:variety,coffeeRoast:'',forma:'Verde',unidade_venda:'un',conteudo_quantidade:null,conteudo_unidade:null,embalagem:'Pacote',aliases:['Café Verde '+species+' '+variety,'Café Commodity '+variety],confirmar_denominacao:false,observacao:'Grão verde, sem torra. Confirme espécie, variedade, embalagem e peso real; nenhum peso, preço, custo ou saldo é presumido.',nome_singular:base,nome_plural:base, nome_busca_plural:base,unidades_permitidas:['un']});
}
export const PRODUCT_CATALOG_ADDITIONS=additions;
