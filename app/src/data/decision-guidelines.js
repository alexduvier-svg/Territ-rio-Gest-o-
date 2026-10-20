// Diretrizes do motor de decisões, instaladas na memória do app (model.data.decisionGuidelines) e no
// backup. Fontes: docs/motor/MOTOR_INTELIGENCIA_AGRO_GESTAO (Claude, v1.0) e
// Agro_Gestao_Diretrizes_Matematicas_Probabilisticas (Codex, v1.0), de 20/10/2026. Conhecimento de
// referência: não é instrução executável e não autoriza vendas, baixas, envios ou compras.
export const DECISION_GUIDELINES = Object.freeze({
  version: 2,
  id: 'decision-engine',
  authority: 'reference_only',
  sources: ['docs/motor/MOTOR_INTELIGENCIA_AGRO_GESTAOclaude.pdf v1.0', 'docs/motor/Agro_Gestao_Diretrizes_Matematicas_Probabilisticas_Codex.docx v1.0'],
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
    dates: 'UTC no armazenamento; America/Sao_Paulo na exibição e nas agregações locais',
  },
  confidence: {
    alta: 'dados verificados, método canônico e calibração medida (skill > 0,2) — ainda não disponível no app',
    media: 'registros completos e amostra mínima; previsão de até 1 dia',
    baixa: 'poucos dados, modelo não calibrado ou previsão de 2 a 3 dias — linguagem "fique atento"',
    nula: 'erro nos registros ou previsão antiga — não gera conselho; informa a falta de dados',
  },
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
