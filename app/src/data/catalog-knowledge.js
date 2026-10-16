// Local reference knowledge. This is vocabulary and registration policy, never business activity.
export const CATALOG_KNOWLEDGE = Object.freeze({
  version: '1.0.1', catalogVersion: '1.0.0', type: 'suggestions_only', total: 2479,
  sourceSHA256: 'd21cc68486f8cc478b5c31ccd4d565f7f8034b1927075bf27b5a3e327b1cc116',
  rules: [
    'O catálogo é referência de nomes, sabores, variedades, apresentações, unidades, plurais e aliases.',
    'Disponibilidade, estoque, preço, custo e desempenho vêm somente dos registros do produtor.',
    'Produtos próprios e escolhas confirmadas têm prioridade sobre sugestões genéricas.',
    'Duplicatas exigem a mesma identidade comercial; campos ausentes ou semelhança textual pedem revisão.',
    'Preserve apresentações distintas, IDs, nomes personalizados, saldos, custos, preços, fotos e histórico.',
    'Ofereça + Cadastrar novo produto quando a referência não atender ao produto real; produtos próprios abrem reposição.',
    'Maço e molho são rótulos regionais no campo de unidade; molho culinário é um nome de alimento.',
    'Maço, caixa, cacho, saco e peça não têm conteúdo fixo universal e não geram conversões automáticas.',
    'Aprenda somente no contexto local deste produtor; não publique escolhas no catálogo global.',
    'Consulte somente o trecho pertinente do catálogo, sem inserir a lista inteira na inteligência.',
  ],
  documents: {
    instructions: 'knowledge/catalogo-agro/INSTRUCOES_PARA_O_CODEX.md',
    readme: 'knowledge/catalogo-agro/LEIA_PRIMEIRO.md',
    list: 'knowledge/catalogo-agro/LISTA_COMPLETA.md',
    units: 'knowledge/catalogo-agro/unidades_e_plurais.json',
    summary: 'knowledge/catalogo-agro/resumo_categorias.json',
  },
});
