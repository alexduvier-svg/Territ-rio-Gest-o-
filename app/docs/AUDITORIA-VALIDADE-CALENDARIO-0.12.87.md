# Auditoria Inicial — Lotes, Validade, Decisões e Calendário

Estado: auditoria e planejamento; funções ainda não entregues. Documento de origem: DIRETRIZ-RECEBIDA-DECISOES-VALIDADE-2026-10-24.md. A entrega 0.12.86 de continuidade é independente desta alteração de estoque.

## Fontes existentes conferidas

| Área | Implementação atual | Decisão de integração |
| --- | --- | --- |
| Estoque físico | legacy/erp-core.js: ERPModel.product, move, saveProducts, complete, refund | product.stock continua sendo o único saldo físico. Alocações por lote devem participar do mesmo auditCommit e rollback. |
| Auditoria de domínio | auditStock, auditSale, auditCommit | Preservar verificações de identidade/unidade/precisão/preço/pagamento. Lotes não podem ser atualizados depois da transação em uma gravação independente. |
| Preparação de feira | eventLoads e estoque geral | É alocação do mesmo estoque. Disponibilidade na data da feira deve excluir lotes que vencerem antes dela, sem apagar unidades físicas. |
| Loja e reservas locais | features/store/availability.js e local-catalog/model.js | Reutilizar limites por canal e reservas, com disponibilidade comercial separada do saldo físico. |
| Pedidos públicos | portfolio-server/src/shop.js, reservas atômicas e inventário com stock/homeStock | O servidor também precisa aplicar vencimento por data; depender somente do app aberto deixaria um caminho de compra incorreto. Preservar compatibilidade com inventários anteriores. |
| Fornecedores | features/suppliers/model.js | validUntil é validade da cotação; expiry é informação do produto ofertado. Histórico de compra não movimenta estoque atualmente. Não converter registros antigos em recebimentos. |
| Calendário municipal | features/municipal-calendar/model.js | Agenda de planejamento local, com limites próprios. Não inserir vencimentos em data.events, que são feiras e alimentam vendas/estatísticas. Compor uma visão interna a partir dos lotes/cotações. |
| Agenda do aparelho | plugin AgroCalendar e exportação ICS | Integração opcional. Validade e calendário interno devem funcionar sem conta Google ou acesso ao calendário pessoal. |
| Notificações | native/followups.js, LocalNotifications | Estender o reconciliador existente com tipos e identificadores estáveis; não adicionar outro serviço permanente ou agendador no ChatGPT. |
| Persistência | native/storage.js: snapshots A/B, verificação e backups diários | Preservar dados e intenção de agendamento no mesmo snapshot. Falha de notificação não pode desfazer ou perder o lote salvo. |
| Recomendações | advisor/engine.js e decision-guidelines.js | Um motor de decisão. Próximas Ações coordena o andamento e não recalcula dinheiro ou estoque. Validade, perguntas prontas e cenários devem consultar a mesma leitura canônica. |

## Condições de implementação

A migração de estoque legado deve marcar a origem como não informada, preservar saldos e histórico e não criar vencimento, fornecedor ou fabricação fictícios. Lotes representam entradas e alocações do mesmo estoque; não haverá produtos duplicados nem outro saldo que se torne independente de product.stock. Divergência de alocação precisa ser detectada antes de vender.

Novos campos são opcionais e recolhidos. Não Informada, Com Validade e Não Se Aplica são estados diferentes. Datas calculadas exigem referência e confirmação; meses são de calendário, com ajuste para o último dia válido. Precisão mensal não gera um dia exato inventado. A data de uma cotação não é data sanitária do item.

Saídas comerciais usam os lotes elegíveis com vencimento mais próximo. Lotes vencidos permanecem fisicamente registrados, mas bloqueados para venda. Devoluções mantêm a ligação ao lote, quando conhecida, e aguardam avaliação da condição antes da disponibilidade comercial. Ajustes/perdas continuam exigindo ação do produtor. Sem diagnóstico de segurança alimentar por IA.

O calendário é derivado, por entidade/tipo estáveis, sem alterar contagens de feiras. D−5 e D0 respeitam data civil/fuso/preferências; avisos atrasados não são disparados em série. Saldo zero, data removida ou edição cancelam agendas antigas. Negativa de permissão preserva a indicação dentro do app, sem prometer notificação entregue.

## Sequência autorizada

1. Validar e encerrar a correção 0.12.86 nos aparelhos e Git.
2. Implementar migração e domínio de lotes com transações, devoluções e disponibilidade em todos os caminhos, inclusive pedidos públicos.
3. Integrar campos opcionais, visão interna de calendário e reconciliação D−5/D0 à infraestrutura de notificações.
4. Vínculos de recebimentos e cotações; agrupamento das prioridades; perguntas prontas no motor existente.
5. Comparações condicionais e histórico de decisões, sem probabilidades ou resultados inventados. Recursos livres/mais pesados somente em etapa posterior.

A aprovação exige os 14 casos do documento, testes de domínio/migração/rollback/reservas e ensaios visuais claros/escuros em telas pequenas e nos dois aparelhos disponíveis. Não foi medido consumo de bateria, FPS, GPU ou desempenho em aparelho básico físico. Registrar pendências de forma explícita; não apresentar esta auditoria ou o texto registrado como recurso implementado.
