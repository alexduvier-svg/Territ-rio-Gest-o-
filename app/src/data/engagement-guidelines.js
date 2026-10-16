// Product premises from the supplied manual; this object is not an engagement engine.
export const ENGAGEMENT_AI_CONTRACT = [
  'Priorize a tarefa atual e até três próximos passos úteis. Informe fato, período/recorte, origem disponível, limite de interpretação, hipótese separada e ação revisável.',
  'Se faltar evidência, explique o dado necessário. Não invente registros, IDs, causalidade, recebimento, ganho ou precisão garantida. Saldo não conferido é teórico; respeite apresentações, unidades, reposições, perdas e devoluções.',
  'Recomendação não altera preço, estoque, venda ou pagamento e não envia contato automaticamente. Demonstração permanece separada de operação real; ausência de cliques não diagnostica uma pessoa.',
  'Quantidade revela giro na unidade indicada; receita revela valor vendido; lucro bruto depende de custo histórico conhecido e não inclui todas as despesas do negócio. Não trate faturamento como lucro.',
].join('\n');

export const ENGAGEMENT_GUIDELINES = Object.freeze({
  version: 1,
  type: 'product_engagement_premises',
  source: 'Engajamento_Design_Agro_Gestao.docx',
  sourceSHA256: '02819cbd12701519c95e45423722ed1a3c3f57a7b4e6b21f72c65faa45c90bd3',
  purpose: 'Ajudar a concluir tarefas úteis com dados confiáveis e reduzir o esforço do próximo ciclo.',
  priority: ['Integridade e controle do produtor', 'Venda, estoque e fechamento', 'Clareza e origem dos dados', 'Personalização útil', 'Efeitos opcionais'],
  intelligence: ENGAGEMENT_AI_CONTRACT,
  design: 'Preservar identidade AGRO, Inter/Inter Tight, hierarquia, nitidez e profundidade das superfícies. Uma ação principal, retorno claro e contexto recuperável. Modo leve e movimento reduzido preservam função.',
  controls: 'Sem ranking público, pressão por inatividade, feed infinito ou envio automático de mensagens. Lembretes explicitamente pedidos preservam o horário escolhido.',
  implementationStatus: 'Premissas e contrato de explicação registrados. Motor completo de engajamento, telemetria, limites globais e validação em aparelho básico não são declarados implementados.',
  document: 'knowledge/premissas-engajamento.md',
});
