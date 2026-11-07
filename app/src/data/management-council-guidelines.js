// Conselho de Gestão (aba Gestão). Fonte: public/knowledge/conselho-gestao.md v1.0, de 05/11/2026.
// Conhecimento de referência compilado com o motor; sem cópia adicional nos dados do produtor.
// Não é instrução executável: não autoriza vendas, baixas, compras, envios, mensagens nem mudança de preço.
// Os agentes são lentes sobre o motor único (advisor/engine.js); cálculos ficam nos motores do registry.
export const MANAGEMENT_COUNCIL = Object.freeze({
  version: 1,
  id: 'management-council',
  authority: 'reference_only',
  source: 'public/knowledge/conselho-gestao.md v1.0, com exemplos corrigidos em 05/11/2026',
  document: 'knowledge/conselho-gestao.md',
  engine: 'advisor/engine.js (lista RULES); sem motor paralelo',
  release: 'advisor/release.js (até 3 itens, um por família); sem segundo ledger',
  goldenRule: 'Os agentes interpretam; os motores canônicos calculam; a Auditoria confere; o produtor decide.',

  // Conferência primeiro: vale igual para todas as edições do app e para dados demo e reais.
  conference: Object.freeze({
    gates: [
      'contexto: real, demo ou unconfirmed; unconfirmed bloqueia todos os agentes exceto o aviso de integridade; demo leva selo',
      'auditoria: runAudit (pagamentos, itens, estoque, negativo, custo, abaixo, futuro, duplicado, feiras, relogio, prova, copia); erro bloqueia caixa, ganho e rotina financeira',
      'prova-dos-nove: identidades em centavos (vendas, pagamentos, estoque, fiado, resultado, lotes); diferença diferente de zero gera aviso urgente de integridade',
      'evidencia-minima: amostra, período e dados exigidos por regra; sem o mínimo, pergunta específica ou lacuna declarada',
    ],
    editionParity: 'Motor, Auditoria e regras não leem BuildConfig, edition, sufixo de pacote nem indicador de teste; mesma saída em original, codexteste, codextesteia e lançamento na Play Store.',
    originParity: 'Dados demo e reais usam a mesma matemática e a mesma Auditoria; demo e simulação nunca entram no aprendizado real.',
    thresholdsLocked: 'Limites mudam só por nova versão desta diretriz; nunca por feedback, modelo de IA ou edição.',
  }),

  parameters: Object.freeze({
    basicsMinimum: 0.8,
    minimumSalesForOpportunity: 8,
    costCoverageForAbc: 0.7,
    pdcaReviewDays: 14,
    fairComparableEvents: 3,
    rfmMinimumClients: 10,
    rfmMinimumBuyingDays: 2,
    fadingRecencyMultiplier: 1.5,
    dormantDays: 90,
    newClientDays: 30,
    concentrationTop: 3,
    concentrationShare: 0.5,
    concentrationMinimumClients: 5,
    identifiedSalesMinimum: 0.3,
    purchaseMinimumRecords: 6,
    purchaseMinimumItems: 3,
    purchaseImpactPareto: 0.8,
    purchaseLateWindow: 5,
    purchaseLateCount: 2,
    quoteStaleDays: 90,
    receivableOverdueShare: 0.15,
    leverStepRatio: 0.01,
    leverStepDays: 1,
    backupMaxDays: 7,
  }),

  precedence: ['integridade_e_consentimento', 'seguranca_clima', 'caixa', 'rotina', 'ganho', 'cliente', 'compra', 'dinheiro_novo'],
  divergence: 'Mostrar os dois caminhos e o custo de cada lado; a decisão é do produtor; nenhum agente apaga o conselho de outro.',

  agents: Object.freeze([
    {
      id: 'resultado', name: 'Conselheiro de Resultado', role: 'preside', destination: 'Gestão',
      method: 'Inspirado em Lásaro do Carmo Jr., O que importa é seu resultado (Editora Gente, 2020)',
      principles: ['gestão básica bem feita antes de tudo', 'rotina e processos que geram valor', 'dinheiro novo com ação diferente da habitual', 'qualidade da venda e comportamento do consumidor', 'indicadores econômico-financeiros ligados ao planejamento', 'cultura de resultado com feedback'],
      rules: [
        {id: 'resultado:basico', kind: 'N', when: 'completude < basicsMinimum em qualquer dimensão', uses: ['finance/audit.js runAudit']},
        {id: 'resultado:semana', kind: 'N', when: 'Liberação com item e Auditoria sem erro', uses: ['advisor/release.js releaseInsights'], output: 'número que muda, ação, quem, até quando'},
        {id: 'resultado:dinheiro-novo', kind: 'N', when: 'mensal, com evidência de outro agente', uses: ['regras dos demais agentes'], label: 'hipótese a testar'},
      ],
      basics: ['vendas com custo conhecido', 'vendas com forma de pagamento', 'feiras com custo lançado', 'estoque reconciliado', 'cópia de segurança em até 7 dias'],
      computes: false,
      limits: ['não calcula números', 'não incentiva jornada exaustiva', 'não culpa o produtor'],
    },
    {
      id: 'rotina', name: 'Gerente da Rotina e das Metas', destination: 'Gestão',
      method: 'Inspirado em Vicente Falconi Campos, Gerenciamento da Rotina do Trabalho do Dia a Dia',
      principles: ['problema é meta não alcançada', 'PDCA para melhorar e SDCA para manter', 'item de controle mede o efeito; item de verificação mede a causa', 'Pareto: atacar primeiro o que pesa mais'],
      rules: [
        {id: 'rotina:meta', kind: 'T', from: ['fin-meta', 'fin-meta-ok']},
        {id: 'rotina:desvio-pareto', kind: 'D1', uses: ['kpi/kpi-engine.js periodChange']},
        {id: 'rotina:pdca', kind: 'T', from: ['test-pending', 'advisor/method.js explainMethod']},
        {id: 'rotina:padrao-banca', kind: 'T', from: ['checklist banca'], uses: ['agent/core.js fairFacts']},
      ],
      controlItems: ['receita do período', 'resultado do período (custos completos)', 'taxa de venda da feira', 'clientes identificados'],
      checkItems: ['preço médio', 'quantidade por produto', 'itens por venda', 'horário de esgotamento', 'custo lançado'],
      limits: ['a meta é do produtor', 'uma feira não é tendência', 'meta não justifica preço abaixo do custo'],
    },
    {
      id: 'ganho', name: 'Gestor de Ganho e Estoque', destination: 'Vender',
      method: 'Inspirado em Eliyahu M. Goldratt, Teoria das Restrições e contabilidade de ganhos',
      principles: ['ganho = venda − custo totalmente variável', 'estoque valorizado só pelo custo variável', 'cinco passos: identificar, explorar, subordinar, elevar, recomeçar', 'com recurso escasso, priorizar ganho por unidade da restrição'],
      rules: [
        {id: 'ganho:restricao', kind: 'N', requires: 'recurso que limita informado pelo produtor', uses: ['finance/finance.js productMargins']},
        {id: 'ganho:dinheiro-parado', kind: 'D1', uses: ['kpi/kpi-engine.js stockCoverage.still', 'custo histórico']},
        {id: 'ganho:abaixo-custo', kind: 'T', from: ['abaixo-custo', 'preco-90']},
        {id: 'ganho:papel-produto', kind: 'T', from: ['papel-produto', 'campeao-margem'], uses: ['kpi/kpi-engine.js contributionAbc']},
        {id: 'ganho:falta-sobra', kind: 'T', from: ['encalhe', 'esgotou', 'repor', 'acaba-logo', 'previsao-feira']},
      ],
      limits: ['sem recurso informado não presume restrição', 'quantidades só na mesma unidade', 'custo ausente nunca vira zero', 'esgotado não comprova procura não atendida'],
    },
    {
      id: 'cliente', name: 'Gestor de Clientes', destination: 'Clientes',
      method: 'Inspirado em Peter Fader (Wharton), Customer Centricity',
      principles: ['clientes são diferentes no valor que geram', 'contar clientes, não pedidos', 'RFM: recência, frequência e valor', 'coortes em vez de taxa única', 'medir concentração da receita'],
      constraint: 'Decisão D3-2 (20/10/2026): valor do cliente só observado; proibido projetar CLV.',
      rules: [
        {id: 'cliente:rfm', kind: 'D4', uses: ['agent/core.js rebuyFacts'], segments: ['campeoes', 'valiosos-sumindo', 'novos', 'adormecidos'], thresholds: 'relativos à mediana do próprio produtor'},
        {id: 'cliente:concentracao', kind: 'N', when: 'top 3 clientes ≥ 50% da receita identificada'},
        {id: 'cliente:recompra', kind: 'T', from: ['rebuy', 'retorno', 'fieis']},
        {id: 'cliente:identificar', kind: 'T', from: ['identificar', 'qr']},
      ],
      limits: ['contato só com consentimento (LGPD)', 'rascunho editável; compartilhar não comprova envio', 'dados de um produtor nunca aconselham outro'],
    },
    {
      id: 'compra', name: 'Gestor de Compras e Fornecedores', destination: 'Gestão',
      method: 'Inspirado em Peter Kraljic, Purchasing Must Become Supply Management (HBR, 1983)',
      principles: ['classificar compras por impacto no lucro e risco de fornecimento', 'estratégico: parceria e segundo fornecedor', 'gargalo: garantir abastecimento', 'alavancagem: cotar e negociar', 'não crítico: simplificar'],
      measure: {impact: 'itens que somam 80% do gasto do período (Pareto)', risk: 'fornecedor único, ou 2 de 5 recebimentos atrasados ou incompletos, ou item marcado como difícil de achar'},
      rules: [
        {id: 'compra:matriz', kind: 'N', uses: ['suppliers/model.js purchases', 'purchaseReceiptState']},
        {id: 'compra:fornecedor-unico', kind: 'N'},
        {id: 'compra:cotacao', kind: 'D1', uses: ['suppliers/model.js compareOffers']},
      ],
      limits: ['histórico de fornecedores é global', 'não movimenta estoque nem caixa automaticamente', 'não duplica custo histórico em custos extras', 'nunca envia pedido nem aceita oferta'],
    },
    {
      id: 'caixa', name: 'Gestor de Caixa', destination: 'Gestão',
      method: 'Inspirado em Alan Miltz (Cash Flow Story) e Verne Harnish (Scaling Up, capítulo Cash)',
      principles: ['sete alavancas: preço, volume, custo direto, fixos, dias para receber, dias de estoque, dias para pagar', 'mover cada uma em 1% ou 1 dia', 'ciclo de caixa = estoque + receber − pagar', 'lucro não é caixa'],
      rules: [
        {id: 'caixa:poder-do-um', kind: 'N', uses: ['finance/finance.js statement'], label: 'simulação; preço supõe volume constante'},
        {id: 'caixa:ciclo', kind: 'D1', uses: ['finance/producer-calcs.js cashCycle']},
        {id: 'caixa:fiado', kind: 'T', uses: ['receivables/receivables.js balance, outstanding']},
        {id: 'caixa:retirada', kind: 'T', from: ['fin-retirada', 'fin-equilibrio', 'fin-equilibrio-ok']},
        {id: 'caixa:taxas', kind: 'T', from: ['fin-taxas']},
      ],
      limits: ['caixa calculado não é extrato bancário', 'saldo inicial ausente não é inventado', 'nunca sugerir atrasar pagamento além do combinado', 'fixos e retirada previstos ficam fora do caixa registrado'],
    },
  ]),

  answerFormat: ['Fato: número canônico, período, origem e local', 'Leitura: significado pelo método da lente', 'Ação: uma ação concreta com atalho para comando existente', 'Conferência: estado da Auditoria'],
  outputFields: ['advice_id', 'rule_id', 'rule_version', 'lens', 'lens_method', 'module', 'confidence', 'audit_status', 'control_item', 'check_items', 'facts', 'reading', 'action', 'owner', 'due', 'data_gaps', 'data_context', 'generated_at', 'valid_until', 'requires_user_action'],

  prohibitions: [
    'Não criar motor paralelo, fórmula financeira fora do registry nem segundo ledger.',
    'Não efetivar venda, baixa, compra, envio, mensagem ou mudança de preço.',
    'Nomes reais só como crédito do método; sem imitar voz, sem citação inventada, sem sugerir endosso.',
    'Não projetar CLV; não afirmar lucro sem custos completos; não prever preço futuro como certeza.',
    'Não usar dado de um produtor para outro sem anonimização e agregação (LGPD).',
    'Não recomendar atraso de pagamento combinado, jornada exaustiva ou corte de qualidade.',
    'Não prescrever defensivo, dose ou mistura (Lei 14.785/2023).',
    'Edição do app nunca muda regra, limite ou resultado.',
  ],

  golden: Object.freeze({
    'T-GAN-01': {constraintLiters: 400, byUnitGainCents: 94000, byConstraintGainCents: 100400, differenceCents: 6400},
    'T-CAI-01': {price: 8000, volume: 4000, directCost: 4000, fixed: 1500, receiveDayCash: 26667, stockDayCash: 13333, payDayCash: 13333},
    // workingCents segue cashCycle (custo mensal ÷ 30 × ciclo); leversCents soma as alavancas, cada uma com sua base.
    'T-CAI-02': {stockDays: 20, receiveDays: 10, payDays: 15, monthlyCost: 550000, cycle: 15, workingCents: 275000, leversCents: 333333},
    'T-ROT-01': {goal: 900000, realized: 760000, problem: 140000},
    // Gasto: pote 35%, leite 35%, açúcar 25%, rótulo 3%, sacola 2%.
    'T-COM-01': {pote: 'estrategico', leite: 'alavancagem', rotulo: 'gargalo', acucar: 'alavancagem', sacola: 'nao-critico'},
  }),
});
