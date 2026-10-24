// Shipped with the app, independently of producer data and reset counters.
// Copying this premise to a backup is useful; loading it never activates products.
export const STOCK_CATALOG_GUIDELINES = Object.freeze({
  version: 3,
  type: 'stock_catalog_premises',
  initialFamilyLimit: 12,
  ownHeading: 'Você já tem cadastrado',
  suggestionsHeading: 'Sugestões para cadastrar',
  newProductAction: '+ Cadastrar novo produto',
  customNameAction: 'Usar este nome no cadastro',
  rules: Object.freeze([
    'Produtos próprios aparecem em verde e abrem a reposição do mesmo cadastro, ID, unidade e apresentação.',
    'Você já tem cadastrado e o estoque disponível usam a mesma ordenação de categorias, famílias e apresentações. Frequência de uso e ordem de cadastro não intercalam famílias.',
    'Cafés permanecem juntos: Especial, Gourmet, Superior e Tradicional; cada tipo segue TC250/500/1000g, TM250/500/1000g, TE250/500/1000g. Torra, formato e peso permanecem atributos separados.',
    'Cadastrar novo produto começa sem categoria presumida. A categoria é escolhida ou confirmada pelo produtor, sem selecionar Cafés automaticamente.',
    'Formatos e pesos são explícitos e independentes da unidade de venda. Barras, ralado e 50 g ficam disponíveis onde pertinentes; concluir uma escolha recolhe a seção.',
    'Custo zero informado é um valor conhecido e válido; campo vazio continua desconhecido. Salvar captura os valores visíveis antes de validar, sem substituir entradas ou duplicar estoque.',
    'Sugestões para cadastrar têm título laranja e pertencem ao catálogo de referência, sem criar estoque, preços, custos ou vendas.',
    'Selecionar uma categoria permite consultar suas sugestões. Nome próprio e apresentação personalizada continuam disponíveis.',
    'A primeira página inclui as quatro famílias de café. Dentro de cada uma ficam as torras TC/TM/TE e pesos em ordem; escolher uma sugestão preenche a torra explícita no campo próprio, sem tratá-la como sabor.',
    'Tipo, torra, moagem e conteúdo de café são diferenças comerciais: não unir variantes nem substituir o cadastro do produtor.',
    'Catálogo, textos e regras padrão são recursos embarcados. Recomeçar a demonstração, limpar dados do app ou reinstalar restaura esses padrões sem limite de reinicializações.',
    'Reiniciar não ativa sugestões como produtos reais nem copia atividade de demonstração para a operação real.',
    'Cadastros, preferências pessoais e transações apagados do armazenamento do aparelho exigem backup para serem recuperados; esta premissa não promete recuperá-los após restauração de fábrica.',
  ]),
});
