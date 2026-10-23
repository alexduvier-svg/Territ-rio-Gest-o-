# Aderência CRM/PDV profissional — 0.12.66

Documento recebido em22/10/2026, versão1.0. A leitura inclui todas as20seções e os28casos propostos. O documento é especificação proposta; não foi tratado como evidência de implementação nem como autorização para migração integral. Fonte preservada no conhecimento offline com SHA256.

| Requisito | Evidência atual | Estado e decisão | Aceitação/limite |
|---|---|---|---|
| PDV idempotente e estoque único | legacy/erp-core.js, sale-round.js, tests/sale-round.test.mjs | Existente; preservar | Intenção/operação impede segunda baixa; não testar com vendas reais |
| Receita, recebível e recebimento | finance/finance.js, receivables/receivables.js | Existente | Receber Fiado não cria nova venda nem baixa |
| Preço/custo histórico e rateio de desconto | itens do ERP, finance.productMargins | Existente | Custos ausentes permanecem desconhecidos; cadastro atual não corrige passado |
| Separar comprador e evento | customerType/recipientType/scope | Parcial | Não migrar histórico ambíguo sem proposta; canal não é sinônimo de PF/PJ |
| Devolução parcial/estorno financeiro independente | fluxo returned atual | Parcial | Não afirmar suporte completo aosT05/T06 apenas por haver devolução total |
| Relatórios coesos e auditáveis | management-reporting.js, metric-interpretation.js, mgDetail | Implementado nesta entrega | Um recorte, sete capítulos, qualidade antes de saída; valores do Finance canônico |
| Conversão de atendimentos | conversionReading compartilhado com KPI/consulta | Opcional | Pedido humano: contagem não é obrigatória em feira, loja ou pessoa; sem denominador não há taxa |
| CRM identificado/consentimento/recompra | agent/core.js, workflows, Clientes | Parcial | Política existente de recompra difere de quatro compras/três intervalos; não substituir limiar silenciosamente |
| Coortes completas e RFM com50clientes | não há módulo completo | Ausente | Não liberar segmentos/probabilidades fictícios |
| ABC de contribuição, giro diário, afinidade com30cestas | relatórios/forecasts parciais | Parcial | Não anunciar cumprimento integral de fórmulas e limiares propostos |
| Simulação promocional com taxas e capacidade | priceFor atual e propostas de teste | Parcial/conflitante | priceFor calcula alvo bruto; não é o piso de contribuição do manual. Criar simulação específica em etapa posterior, sem alterar preços |
| Comparações | advisor financialInsightsInput(comparable=false), quality/method | Parcial | Não inventar benchmark, significância ou causa. Custos/taxas atuais ainda têm limitações históricas |
| Hierarquia Connect/Action/Audit e liberação | intelligence-hierarchy, release.js | Implementado nesta entrega | Audit prioriza; até3prioridades, feedback por produtor/origem; execução sempre por comandos existentes |
| PDV/CRM em rotação | practiceCandidates e release | Implementado nesta entrega | Uma dica de referência por vez, estável por dia; só ocupa espaço após alertas/fatos; sem promessa causal |
| Agenda municipal e contexto local | municipal-calendar | Implementado nesta entrega | Arquivos locais, ICS revisado, manual, fontes/status, sem outra agenda de vendas ou consulta automática |
| Feriados e datas calculadas | national.js | Parcial e explícito | Dez referências federais2026; Corpus é marco móvel calculado, sem status nacional inventado; anos não carregados não ganham feriados supostos |
| Gemini | GeneralEducation nativo e porta de fornecedor | Opcional compatível | Só tópico fixo geral autorizado; sem ERP. Não audita números nem gera fatos do produtor |
| Metas de100ms/300ms/1s | não medidas | Não comprovado | Não declarar FPS/GPU/aparelho básico ou todosT01–T28 aprovados |

## Correções e decisões

- Black Friday: não é sempre a quarta sexta-feira. Em2024 aconteceu29/11(5ªsexta). Calcular após a4ªquinta-feira; esta revisão não introduz um calendário de promoções completo. Fonte primária: https://agenciasebrae.com.br/cultura-empreendedora/prepare-se-a-black-friday-vem-ai/ .
- Parâmetros30vendas/50clientes/5coocorrências/1,5mediana são propostas do projeto, não padrões Sebrae/FGV nem limites que comprovam significância.
- Conversão: soma de atendimentos não ligados individualmente à venda é uma observação agregada, não atribuição causal de produto/campanha. Não exigir contagem em venda comum.
- Carangola7/1 e Santa Luzia13/12 têm apoio nas fontes citadas; datas de shows/feiras/locais exigem confirmação por edição. Não foram transformadas em programação futura automaticamente.
- As contas do exemplo de desconto e das duas feiras são aritmeticamente coerentes nas hipóteses informadas. Um cenário não prevê o volume adicional necessário.
- O layout único tem precedência sobre os exemplos tipográficos do manual; dados reais e identidade doAPK são preservados.

Próximas lacunas ficam registradas, sem criar tarefas não autorizadas nem anunciar o manual inteiro como concluído.
