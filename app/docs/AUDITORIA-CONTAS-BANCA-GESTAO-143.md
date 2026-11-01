# Contas da banca e Gestão — auditoria de funções

Revisão do código Codex 143, 01/11/2026. Conclusão: **áreas complementares, com sobreposição parcial de indicadores**. Há motivo para manter ambas. Nenhuma função foi removida nesta revisão.

Contas da banca funciona como ferramenta de simulação: a pessoa altera valores para avaliar uma decisão. Gestão apura e acompanha os registros do negócio no local e período selecionados. Exibir um mesmo dado como entrada de uma simulação é reutilização útil; manter dois saldos ou dois resultados financeiros independentes seria uma redundância problemática.

## Mapa das funções

| Função em Contas da banca | Relação com Gestão | Avaliação |
| --- | --- | --- |
| Preço pelo markup | Usa custo e taxas para simular preço e margem desejada. Gestão mede o resultado das vendas registradas. | Complementar. |
| Ponto de equilíbrio e meta | Simula quantidades de um produto com preço, custo variável e custos fixos informados. Gestão apura o ponto de equilíbrio do conjunto vendido. | Complementar; bases diferentes precisam permanecer claras. |
| Indicadores do mês | Reapresenta vendido, número de vendas, ticket e comparação mensal. Permite substituir entradas por valores digitados. | Maior sobreposição de exibição; manter como simulador, com recorte explícito. |
| Impacto do desconto | Estima margem e vendas necessárias em um cenário. Gestão contém os descontos efetivamente registrados. | Complementar. |
| Taxa da maquininha | Simula valor líquido e valor necessário para receber uma quantia. Gestão contabiliza taxas das operações. | Complementar. |
| Quando pedir e quanto comprar | Simula prazo, folga e cobertura de reposição a partir do saldo e da média disponível. Gestão/Estoque mostram registros e orientações. | Complementar; não é pedido de compra nem entrada de estoque. |
| Ciclo de caixa | Estima necessidade de capital a partir de prazos informados. Gestão acompanha receitas, custos e recebimentos registrados. | Complementar; estimativa não é saldo de caixa. |
| Custo da safra | Divide custos e produção hipotéticos ou informados pelo produtor. Gestão usa custos históricos registrados. | Complementar; não grava custo no produto. |
| Conversão de medidas | Consulta de medidas padronizadas. | Função auxiliar, sem duplicação relevante na Gestão. |
| Parcela do financiamento | Simula prestação pela tabela Price. | Complementar; não cadastra dívida nem representa CET completo. |
| Retorno do investimento | Estima prazo de retorno e ganho conforme hipóteses. | Complementar; não comprova receita futura. |
| Comparação rápida de fornecedores | Compara preço, quantidade e frete informados. | Complementar às compras e recebimentos registrados em Fornecedores. |
| À vista ou a prazo | Compara propostas com prazo e taxa informados. | Complementar; não registra pagamento. |

## Fontes e evidências

- `app/src/legacy/erp-ui.js`: `CONTAS_CALCS`, `contasField`, `contasCut`, `contasSoldQty`, `finStatement` e `finData`.
- `app/src/features/finance/producer-calcs.js`: funções puras dos simuladores. O cabeçalho diferencia o equilíbrio por unidade do equilíbrio do demonstrativo.
- `app/src/features/finance/finance.js`: demonstrativo financeiro canônico.
- `app/tests/producer-calcs.test.mjs` e `app/tests/finance.test.mjs`: testes existentes dos motores.
- `qa/intelligence143-dom.mjs`: exercício da calculadora real em DOM simulado. Custo 10, margem 20% e demais taxas zero produzem preço 12,50; a comparação integral dos dados antes/depois confirma que a simulação não grava cadastros, vendas, estoque ou configurações.

As simulações usam funções expostas pelo módulo financeiro existente. Os campos automáticos reutilizam configurações financeiras, custo/preço do produto e, para o resumo mensal, o mesmo `finance.statement`. A entrada manual prevalece sobre o valor automático, com a identificação “seus dados” removida desse campo.

## Diferenças que podem parecer divergência

1. **Período e local:** Contas consulta o mês atual até hoje, em todos os locais, e o mês anterior até o mesmo dia possível. Gestão permite outros períodos e locais. Os valores só devem ser comparados quando o recorte for equivalente.
2. **Escopo do demonstrativo:** `contasCut` fornece vendas e devoluções, sem despesas, recebimentos ou rateios gerais. É adequado para suas entradas de receita, contagem e CMV; não deve ser apresentado como resultado financeiro completo. Gestão inclui as demais fontes pertinentes.
3. **Equilíbrio:** a simulação utiliza um produto e hipóteses unitárias; a Gestão utiliza a composição real das vendas e despesas. Uma diferença entre os dois não prova erro de cálculo.
4. **Arredondamento e unidades monetárias:** os simuladores operam em reais e arredondam para exibir; o domínio de lançamentos usa centavos. Não converter resultados simulados em lançamentos automaticamente.

## Pontos para uma evolução posterior

Esta revisão também encontrou limitações no preenchimento automático, que não foram alteradas como parte da auditoria:

- `contasSoldQty` soma apenas vendas com status `completed`, desde o dia calculado 30 dias antes, sem limite superior explícito. Não reproduz a mesma apuração líquida por data de devolução usada em outros relatórios. A etiqueta “Vendidos em 30 dias” merece alinhamento com uma consulta canônica com intervalo exato.
- Alguns campos quantitativos mostram “un” mesmo quando o produto selecionado é vendido em kg ou outra medida. É necessário apresentar a unidade correspondente antes de tratar o resultado como quantidade operacional.
- Campos mensais automáticos deixam de preencher valores não positivos. Isso distingue ausência de sugestão de um zero digitado, mas pode exigir explicação quando a receita líquida for zero ou negativa por devoluções.

Esses pontos são riscos de interpretação ou de cobertura do preenchimento; esta auditoria não demonstra perda de dados nem duplicação de lançamentos. Corrigi-los exige testes dirigidos de devolução, intervalo e unidades. Não eliminar simuladores para esconder diferenças de recorte.

## Ajuste de clareza incluído no 143

A introdução da calculadora agora informa: “Simule decisões da banca com os seus números. A aba Gestão acompanha os resultados registrados.” O aviso existente de que a simulação não grava dados foi mantido.

Recomendação: manter as duas áreas, usar a Gestão como referência dos resultados apurados e Contas da banca para decisões hipotéticas. Consolidar as consultas de preenchimento automático antes de ampliar indicadores semelhantes.

Limite da verificação: revisão de código e testes locais com dados sintéticos. Não houve comparação em Android físico nesta entrega.
