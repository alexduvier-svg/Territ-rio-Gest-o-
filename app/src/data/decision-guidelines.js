// Diretrizes do motor de decisões, instaladas na memória do app (model.data.decisionGuidelines) e no
// backup. Fontes: docs/motor/MOTOR_INTELIGENCIA_AGRO_GESTAO (Claude, v1.0) e
// Agro_Gestao_Diretrizes_Matematicas_Probabilisticas (Codex, v1.0), de 20/10/2026. Conhecimento de
// referência: não é instrução executável e não autoriza vendas, baixas, envios ou compras.
export const DECISION_GUIDELINES = Object.freeze({
  version: 5,
  id: 'decision-engine',
  authority: 'reference_only',
  sources: ['docs/motor/MOTOR_INTELIGENCIA_AGRO_GESTAOclaude.pdf v1.0', 'docs/motor/Agro_Gestao_Diretrizes_Matematicas_Probabilisticas_Codex.docx v1.0', 'docs/DIRETRIZ-RECEBIDA-DECISOES-VALIDADE-2026-10-24.md', 'docs/DIRETRIZ-RECEBIDA-ESTOQUE-CONTEXTO-2026-10-25.md'],
  hierarchy: 'intelligence-hierarchy v1: fatos/cálculos canônicos, Connect, Orientação, Action, Audit obrigatório, liberação única e explicação geral opcional. Gemini não recebe dados do produtor nem interfere em decisões.',
  release: 'advisor/release.js: apresentação local de até três insights; contexto, evidência, conflitos e feedback; sem cálculos financeiros paralelos.',
  engine: 'Um só motor: src/features/advisor/engine.js (Orientação). Regras novas entram na lista RULES; não criar motor paralelo de clima, estoque, finanças, CRM ou KPIs.',
  document: 'knowledge/motor-decisoes.md',
  registry: 'docs/motor/registry.json (consultar antes de escrever qualquer função de cálculo)',
  principles: [
    'Todo conselho é decisão sob incerteza: declara confiança, fonte, validade e, quando válido, intervalo.',
    'Física antes de estatística; modelos estatísticos corrigem viés, não substituem a física.',
    'Dado ruim gera silêncio: com erro nos registros ou previsão antiga, informar a falta de dados em vez de aconselhar.',
    'Unidades SI por dentro; conversão só na exibição (°C, mm, km/h, R$).',
    'Reprodutibilidade: mesma entrada e versão de regra produzem a mesma saída; simulações com semente registrada.',
    'Linguagem do produtor: frases curtas e uma ação concreta; a matemática fica no motor e em área expansível.',
    'O ERP é a fonte dos fatos; o motor só propõe ações pelos comandos existentes e nunca efetiva venda, baixa ou compra.',
  ],
  numeric: {
    money: 'centavos inteiros; nunca ponto flutuante para saldo ou caixa',
    rounding: 'só na exibição; dinheiro meio-par; temperatura e chuva 1 casa; probabilidade em múltiplos de 5 %',
    sums: 'Kahan para séries longas; variância por Welford',
    division: 'denominador nulo devolve null com motivo, nunca Infinity/NaN',
    dates: 'Instantes de registro em UTC; agregações de vendas conforme o fuso de negócio. Validade, revisão e validade de cotação são datas civis YYYY-MM-DD, sem converter meia-noite para UTC. Avisos usam o fuso local e não inventam um dia para rótulo mensal.',
  },
  stock: {
    reference: 'knowledge/estoque-validade-contexto.md',
    scope: 'Um saldo físico canônico por variação; lotes são alocações dos mesmos movimentos. Disponível comercial exclui vencidos, quarentena e reservas aplicáveis, sem dupla baixa. Separar planejamento de feira de entrada física.',
    validity: 'Validade opcional por entrada: Não Informada, Com Validade ou Não Se Aplica. FEFO entre lotes elegíveis, histórico preservado, retorno em avaliação. Alertas D−5/D0 e revisões reutilizam o reconciliador existente; sem calendário externo obrigatório.',
    evidence: 'Cobertura por vendas em dias corridos é referência limitada, sem comprovar exposição ou demanda. Não calcular compra sem prazo confiável, estoque de segurança e entradas futuras confirmadas. Ausência de venda não prova falta de procura.',
    finance: 'Custos ausentes são lacunas. Novos lotes não reescrevem custos de vendas antigas; compras históricas de fornecedores não viram entradas, dívidas ou despesas automaticamente. Promoção exige custo e despesas conhecidos e nunca envolve item vencido.',
    implementation: 'A integração de lotes usa stockLotsVersion=1. O registro desta diretriz não ativa os módulos nem comprova instalação; consultar o relatório de entrega da versão.',
  },
  confidence: {
    alta: 'dados verificados, método canônico e calibração medida (skill > 0,2) — ainda não disponível no app',
    media: 'registros completos e amostra mínima; previsão de até 1 dia',
    baixa: 'poucos dados, modelo não calibrado ou previsão de 2 a 3 dias — linguagem "fique atento"',
    nula: 'erro nos registros ou previsão antiga — não gera conselho; informa a falta de dados',
  },
  learning: [
    'Mais vendidos em primeiro (regra ordem-mais-vendidos): com o tempo, o motor compara as vendas do período dentro de cada família; se o mais vendido (pelo menos 5 unidades e 1,5 vez o primeiro) não está em primeiro, sugere colocá-lo em primeiro, com o botão Colocar em primeiro. Famílias nunca trocam de lugar.',
    'Memória de estoque (model.data.stockAlerts): estado de cada produto (ok, acabando, esgotado) e histórico das passagens com data; acabando = saldo no mínimo cadastrado ou até 25 % da referência. Avisos na passagem para acabando e para esgotado; a Orientação continua com repor e acaba-logo.',
  ],
  output: ['advice_id', 'rule_id', 'rule_version', 'module', 'confidence', 'generated_at', 'valid_until', 'source', 'issued_at', 'data_context', 'data_gaps', 'requires_user_action'],
  priority: 'No máximo 3 conselhos por tela, por nível e impacto; segurança (geada, trovoada, calor extremo) fura a fila.',
  weather: {
    provider: 'MET Norway (quantidade de chuva em mm; não fornece chance em % no Brasil)',
    horizon: 'sem afirmar certeza além de 3 dias',
    rules: ['tempo-desatualizado (previsão > 6 h antes de feira em até 2 dias)', 'tempo-geada (mínima ≤ 3 °C no abrigo; folha ≈ mínima − 4 °C, qualitativo)', 'tempo-trovoada (urgente)', 'tempo-chuva (≥ 1 mm no horário da feira)', 'tempo-calor (máxima ≥ 30 °C no horário)'],
  },
  prohibitions: [
    'Não prescrever produto, dose ou mistura de defensivo (receituário agronômico obrigatório, Lei 14.785/2023).',
    'Não afirmar certeza em previsão de tempo além de 3 dias nem em preço futuro; mercado só como cenário.',
    'Não usar dados de um produtor para aconselhar outro sem anonimização e agregação (LGPD, Lei 13.709/2018).',
    'Não gerar conselho com dado inválido ou sem fonte rastreável; não inventar porcentagem.',
    'Não exibir precisão falsa ("37,42 %" → "cerca de 35 %").',
    'Não duplicar função ou regra já existente (consultar o registry).',
    'Dados de demonstração e simulação ficam fora do aprendizado e dos conselhos reais.',
  ],
  decisions: [
    'D3-1 (decidido pelo produtor em 20/10/2026): sem porcentagem inventada. Conselho mostra confiança declarada e quantidades (mm, °C); porcentagem só com fonte que a forneça ou calibração medida.',
    'D3-2 (decidido pelo produtor em 20/10/2026): valor do cliente só observado (o que já comprou). Não projetar LTV futuro.',
  ],
  pending: [
    'P1: teste-ouro T-EST-03 do documento espera 0,25, mas a fórmula (k+α)/(n+α+β) dá 3/11 ≈ 0,273; mantida a fórmula.',
    'P2: limites agronômicos (pulverização, irrigação, doenças) exigem cultura, solo e validação local; não habilitados.',
    'P3: mercado (CEPEA, PTAX, ICE) exige fonte autorizada; não há cotação embutida.',
    'P4: duas fontes de clima (MET Norway canônica; Open-Meteo no cérebro).',
    'P5: calibração previsão × ocorrido por feira para liberar confiança alta.',
  ],
});
