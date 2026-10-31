// Product rule reference, copied into local memory by ensureAgent. Never an executable prompt.
export const INTELLIGENCE_HIERARCHY = Object.freeze({
  id: 'intelligence-hierarchy', version: 4, authority: 'product_requirements', document: 'knowledge/hierarquia-inteligencia.md',
  order: [
    '1. ERP e domínios canônicos: fonte dos fatos, cálculos, estoque, reservas e consentimentos.',
    '2. Connect: fornece apenas o contexto local necessário, com produtor, origem, período e local.',
    '3. Motor de Orientação: interpreta os fatos pelas diretrizes versionadas de Gestão, KPIs, PDV e CRM.',
    '4. Action: prepara propostas declarativas; somente comandos existentes, após confirmação do produtor.',
    '5. Audit: valida antes/depois de comandos; erro bloqueia conclusões incompatíveis. Não pode ser desligado pelo agente ou Gemini.',
    '6. Liberação: reúne prioridades, elimina conflitos, limita a três e respeita evidência e feedback local.',
    '7. Qwen local: recebe a resposta calculada e as referências comuns de português e matemática; seleciona trechos conferidos, sem recalcular nem acessar registros de outros produtores.',
    '8. Gemini opcional: explica conceitos gerais fixos. Não recebe registros, não recalcula, não decide nem executa operações.'
  ],
  sharedKnowledge: {
    language: {dictionary:'features/voice/lexicon.json',normalization:'features/portuguese.js',catalog:'features/product-catalog.js',policy:'data/product-catalog-policy.json'},
    math: {registry:'docs/motor/registry.json',finance:'features/finance/finance.js',decisions:'features/decision/math.js',products:'features/product-period-reports.js'},
    sectors:['Produtos','Estoque','Loja','Clientes','Eventos','Gestão','Fornecedores','Gerente','Qwen'],
    scope:'produtor, origem, local e período; fatos somente dos domínios canônicos',
    rule:'dicionário interpreta nomes; catálogo sugere apresentações; motores calculam; Qwen organiza trechos. Nenhuma referência cria estoque, vendas ou custos.'
  },
  precedence: ['integridade_e_consentimento', 'fatos_registrados', 'calculos_canonicos', 'regras_locais_versionadas', 'hipoteses_para_teste', 'explicacao_geral_externa'],
  professionalReference: {document:'knowledge/crm-pdv-profissional.md',sha256:'4f0072c8acc752ee2300e15ccee186bcc1558ef761bf760d41eddff69ecd65ec',status:'reviewed_partial_implementation',review:'docs/CRM-PDV-ADERENCIA-0.12.66.md'},
  businessQuestions:{version:1,document:'knowledge/perguntas-negocio.md',sourceSha256:'5d4241662374ddb10010678abacf7e66d50171acfeaaaf1b4cddf3d9b318d570',status:'bounded_local_queries_partial_repertoire'},
  opportunityReference:{document:'knowledge/receitas-artesanato-parcerias.md',data:'knowledge/receitas-artesanato.json',version:1,sha256:'97dea7147d2cc58815d1e968744c0f7aa36be0632e6f6a54c60fcd8c9f287d6b',status:'editorial_reference_under_request_no_validated_production_or_suppliers'},
  continuity: {version:1,domains:['orders','receivables','events'],states:['pending','waiting','done'],source:'canonical_domains',actions:'read_only_navigation_after_revalidation',completion:'verified_domain_result',runtime:'bounded_local_worker',notifications:'reuse_existing_no_duplicate_sends'},
  delivery: 'Gestão concentra a orientação personalizada. Sem pop-ups repetidos, sem envio autônomo. Referências consultáveis mesmo sem internet; custos ausentes nunca viram zero.',
  learning: 'Feedback e evidência pertencem ao produtor e à origem; demonstração/simulação não treinam o negócio real. Dispensar não altera números nem critérios de auditoria.',
  freeCloud: 'Spark sem faturamento; tópico fixo autorizado, App Check, limite local, sem promessa de disponibilidade. Falha retorna ao conteúdo local.'
});
