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
export const PRODUCT_CATALOG_ADDITIONS=additions;
