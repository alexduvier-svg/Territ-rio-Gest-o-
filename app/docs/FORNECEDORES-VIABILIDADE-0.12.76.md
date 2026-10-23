# Fornecedores — Viabilidade e Limites da Primeira Etapa

Decisão: implementar parcialmente agora, conforme escolha humana de cadastro e comparação. A auditoria encontrou estoque, apresentações, custos históricos, despesas, clientes compradores, reservas, fila de análise local, armazenamento durável e backup. Não encontrou uma cadeia operacional de pedidos de compra, recebimentos, produção e contas a pagar. Fazer essa cadeia inteira nesta entrega criaria risco de dupla baixa e custos incoerentes.

| Função | Estado encontrado / reaproveitamento | Entrega / conflito evitado | Risco e limite |
|---|---|---|---|
| Pessoas | clients é cadastro de compradores; consumidores legados pressupõem esse papel | Fornecedor independente ou referência clientId a pessoa existente, sem criar cliente nem copiar contato vinculado | Nomes/telefones semelhantes exigem revisão; sem fusão automática |
| Itens | products com IDs, apresentações, unidades e estoques | Seleção por ID ou necessidade digitada apenas para comparação | Sem converter automaticamente maço, caixa, kg, litro ou metro; especificação e conteúdo informados |
| Fornecedores/cotações | Sem módulo operacional equivalente | supplierBook v1 opcional, isolado por produtor e treino; IDs estáveis, arquivamento e rascunho | Migração aditiva, nenhum saldo antigo reescrito |
| Custo | Finance usa centavos e snapshots históricos | Total nominal da compra, conteúdo por apresentação, mínimo/múltiplo/excedente, custo por unidade | Cotação não atualiza custo histórico, preço ou despesa |
| Prazos/qualidade | Sem recebimentos reais para avaliar fornecedor | Datas explícitas, validade, equivalência e disponibilidade confirmadas; rendimento com origem opcional | Sem notas de qualidade/pontualidade inventadas; sem garantia de entrega |
| Caixa e dívida | Despesas e Fiado de clientes, sem contas a pagar de fornecedores | Condição de pagamento apresentada como informada | Sem selo de caixa suficiente ou projeção de saldo; sem dívida gerada |
| Motor | Agent Worker/fila/política de recursos e hierarquia de insights existentes | Novo comando local de comparação no mesmo Worker; Pareto na regra papel-produto existente | DTO sem banco ERP/contatos; sem IA online para calcular ou decidir |
| Relatórios | Margens históricas auditadas por período/local e unidades | Pareto de receita e lucro bruto positivo + giro/margem/resultado na mesma unidade | Custos ausentes bloqueiam curva completa de lucro; perdas fora do denominador positivo |
| Exportação | Backup completo JSON e ZIP de CSVs por área | supplierBook no backup existente e dois CSVs adicionais | CSV não é backup restaurável; não há novo serviço de nuvem |
| Interface | Materiais, rodapés, teclado/calendário e movimentos comuns | Chave Estoque/Fornecedores junto de Toque para Repor; formulários progressivos | Lista paginada20, seleção buscável50, máximo20 propostas por análise |

Regra econômica: apresentações inteiras suficientes para a necessidade, aplicando mínimo e múltiplo; mercadorias menos desconto confirmado mais frete e encargos confirmados. Campo ausente permanece desconhecido. Mostrar custo nominal menor separado da alternativa completa que respeita prazo e condições; empate permanece empate. Perecível com validade ausente ou excedente não confirmado não recebe conclusão de adequação. Preferência só registra uma escolha, não executa compra.

Pareto usa concentração observada até 80%; não afirma que exatamente20% dos produtos geram80%. Receita é após descontos/devoluções; lucro bruto é receita menos custo histórico, antes de taxas/despesas. Compara quantidades somente quando a unidade histórica é única e igual. A regra existente de papéis de produto recebe a mesma interpretação, sem um segundo alerta paralelo.

Estimativa de etapas futuras: pedidos/recebimento e contas a pagar exigem outra entrega de domínio e auditoria de idempotência; produção/fichas técnicas e projeção de caixa exigem dados e validação próprios. OCR, importação, pesos subjetivos, compras em lote e avaliações de fornecedor ficam posteriores. Esforço maior que um ajuste visual; não estão apresentados como funções disponíveis.

Referência recebida preservada offline em knowledge/fornecedores-diretriz.md. Suas fontes/ponderações são propostas de referência; não há alegação de certificação ou desempenho medido. Não foram ativadas APIs, cobrança, notificações, compras ou mensagens externas.

Adição humana durante a execução: histórico de compras do mesmo fornecedor e de fornecedores diferentes. Inclui confirmação explícita, data, quantidade/unidade base, especificação, produtos/frete/desconto/encargos e pagamento informado. É registro histórico, sem novo recebimento, conta a pagar ou despesa; preserva os controles atuais como fonte de verdade. Desconsiderar exige motivo e mantém original. Compara compra anterior do mesmo fornecedor e última anterior de até3 fornecedores diferentes na mesma especificação/unidade. Preço passado não é oferta atual. Backup e terceiro CSV adicional preservam estes registros.
