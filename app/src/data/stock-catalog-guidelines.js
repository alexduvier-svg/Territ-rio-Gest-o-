// Shipped with the app, independently of producer data and reset counters.
// Copying this premise to a backup is useful; loading it never activates products.
export const STOCK_CATALOG_GUIDELINES = Object.freeze({
  version: 1,
  type: 'stock_catalog_premises',
  initialFamilyLimit: 12,
  ownHeading: 'Você já tem cadastrado',
  suggestionsHeading: 'Sugestões para cadastrar',
  newProductAction: '+ Cadastrar novo produto',
  customNameAction: 'Usar este nome no cadastro',
  rules: Object.freeze([
    'Produtos próprios aparecem em verde e abrem a reposição do mesmo cadastro, ID, unidade e apresentação.',
    'Sugestões para cadastrar têm título laranja e pertencem ao catálogo de referência, sem criar estoque, preços, custos ou vendas.',
    'Selecionar uma categoria permite consultar suas sugestões. Nome próprio e apresentação personalizada continuam disponíveis.',
    'A primeira página contém pelo menos 12 famílias; Café Tradicional Torra Escura não fica oculto atrás das primeiras oito sugestões de café.',
    'Tipo, torra, moagem e conteúdo de café são diferenças comerciais: não unir variantes nem substituir o cadastro do produtor.',
    'Catálogo, textos e regras padrão são recursos embarcados. Recomeçar a demonstração, limpar dados do app ou reinstalar restaura esses padrões sem limite de reinicializações.',
    'Reiniciar não ativa sugestões como produtos reais nem copia atividade de demonstração para a operação real.',
    'Cadastros, preferências pessoais e transações apagados do armazenamento do aparelho exigem backup para serem recuperados; esta premissa não promete recuperá-los após restauração de fábrica.',
  ]),
});
