# Auditoria antes da integração — 19/10/2026

Base inspecionada: AGRO Gestão 2 0.12.15/code55, commit 1a55256. Baseline: 234 testes passaram. Híbrido Vite 8/JavaScript + Capacitor 8.5.3, Android Java, minSdk24/target36, AGP8.13/JDK21. Compilar Vite, cap sync, assembleRelease e assinar com certificado original. Preservar pacote br.com.territorio.gestao2; main é outra linha.

## Mapa encontrado

- Produtos/variações/unidade/preço/custo/saldo: ERPModel em src/legacy/erp-core.js, model.data.products; cada apresentação tem ID. Família/ordenação e catálogo em features/product-catalog.js, stock-order.js e data/catalog-knowledge.js. Catálogo geral efetivo: 2.480 referências; não presumir mais de 2.500, não são estoque real.
- Vendas/baixas/estorno: ERPModel.complete/refund; quote trabalha em centavos. chooseSaleRecipient em erp-ui.js cria cópia, valida, grava e só então troca estado. Origem PF/PJ/Evento e restrições de horário existentes. Não criar outro serviço de venda. Lacuna identificada: complete não tinha chave de idempotência persistida; acrescentar operação opcional e recibo na própria venda.
- Estoque e feiras: movements, eventLoads.items (qty já inclui reposições), event.surplusCheck e surplusCheckMetrics. features/fair-surplus.js aplica plano em cópia, fair-report.js gera relatório. Sobra calculada não é contagem real; análise nova exige conferência compatível e reconciliação, sem inventar retorno físico.
- Financeiro: finance/finance.js e financialInsightsInput/finStatement; custos históricos, descontos, cancelamentos e devoluções já tratados. Reutilizar métricas e alocação productNetItems. Não preencher custo ausente com zero nem chamar lucro bruto de líquido.
- Clientes: clients, sales.customerId, noticeConsent e rascunhos/compartilhamento em erp-ui.js. Não há confirmação de entrega WhatsApp; compartilhar manualmente.
- Persistência: src/native/storage.js, save-queue.js, arquivos privados alternados com checksum/leitura de verificação e cópia diária. Web localStorage só no navegador. Um modelo ativo por instalação; não há login multiusuário/servidor de contas no MVP. Respeitar dataContext.id/productMemory.scopeId e contexto explícito; nunca inferir produtor pelo nome. Se o contexto mudar, invalidar propostas e reinicializar estado do agente, sem misturar contas.
- Voz: AgroVoicePlugin.java + features/voice/controller.js/index.js/interpret.js. Um listener final com session, descarte de callbacks antigos; parciais só exibem. Reutilizar captura/modelo/microfone, sem assumir falha atual. Botão de Produtos permanece só para venda; modo consulta pode ser iniciado na Inteligência usando o mesmo adaptador.
- Orientação/insights existentes: features/advisor, product-period-reports.js, planejamentos advisorTests e financialInsightsInput. Integrar prioridades no espaço atual e preservar métricas, olhos de privacidade e navegação; não duplicar aba.
- Origem: dataContext.type ou settings.onboarding demo/clean explícitos. Não marcar registros reais como demonstração por texto do anexo. Exemplos isolados em QA; análises exibem origem confirmada ou não confirmada.
- Anexos de linguagem/finanças e premissas foram incorporados em conhecimento estruturado, com documentos em docs/references e public/knowledge. Nenhuma API paga/modelo generativo necessário. Não há entidade local completa de pedido/loja com transição de etapas comprovada: fora das ações disponíveis nesta entrega.

## Decisões de integração

Núcleo puro para consulta/regras e propostas, auditoria mínima persistida no modelo atual, índice do catálogo ativo versionado, esclarecimento multiitem e um gateway ao carrinho existente. Mutações de venda/estoque permanecem nos serviços existentes e confirmação final. Sem reserva de estoque inventada. Recompra exige quatro dias de compra, três intervalos positivos, consentimento e saldo; sugestões desativáveis. Evidências por regra/entidade/período, dispensar/adiar/feedback sem mudar limiares automaticamente.

Worker Android diário será apenas um sinal de revisão, sem abrir WebView, gravar vendas ou duplicar a base de negócio. O recálculo JS acontece por mudanças locais e ao reabrir. Não anunciar análises completas executadas com app fechado nem horário exato. WorkManager 2.11.2 (minSdk23) compatível com minSdk24 do app; uma tarefa única diária, bateria não baixa, backoff. Notificações financeiras automáticas não serão ativadas por esta integração.

Matriz de aceitação, medições e limites reais serão registrados no relatório de entrega; teste de UI com RPC simulado não vale como captura real ou precisão de feira. Não usar base real para testar vendas ou exportar seus dados.
