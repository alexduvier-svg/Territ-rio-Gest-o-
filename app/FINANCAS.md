# AGRO Gestão — método financeiro e conferência dos números

Como o app calcula cada número e como ele se confere sozinho. Código: `src/features/finance/finance.js`
(cálculo) e `src/features/finance/audit.js` (conferência), com testes em `tests/finance.test.mjs`.

## Regime

**Competência**: cada fato entra no dia em que aconteceu.

- Venda: na data da venda (mesmo que seja devolvida depois).
- Devolução: na data da devolução — estorna receita e custo do produto (o produto volta ao estoque).
  A taxa do cartão **não** é estornada (a maquininha não devolve).
- Custo lançado: no dia escolhido (pode ser lançado depois; o cálculo daquele dia se refaz).
- Perda de estoque: no dia da perda, pelo custo do produto (gravado na perda; nas antigas, o custo atual).
- Meses fechados não mudam quando algo acontece depois.

## Demonstrativo (Gestão → Finanças)

```
  Vendas do período
− Devoluções (do período)
= Total vendido
− Custo dos produtos vendidos      (custo do cadastro no momento da venda — sempre entra)
− Taxas de cartão                  (débito e crédito, % configurável)
− Impostos sobre vendas            (% configurável, ex.: Funrural; começa em 0)
= Margem de contribuição
− Custos da feira                  (barraca, transporte, ajudante — lançados)
− Produção e insumos               (só o que NÃO está no custo do produto)
− Divulgação
− Perdas de estoque                (só em "Todos os locais")
− Custos fixos                     (mensais, rateados pelo período; só em "Todos os locais")
− Retirada (pró-labore)            (a lançada; se não houver, a planejada — nunca as duas)
= Resultado
```

Investimentos (barraca nova, freezer, reforma) **saem do caixa, mas não do resultado**.

## Caixa do período

Recebido por forma de pagamento − devoluções − taxas e impostos − custos, fixos e retirada − investimentos
= sobra no caixa. Caixa ≠ resultado: perdas entram no resultado e não saem do caixa; investimentos o contrário.

## Indicadores

- Margem de contribuição % = margem ÷ total vendido.
- Ponto de equilíbrio do mês = (fixos + retirada mensal) ÷ margem de contribuição %.
- Lucro por local = vendas − custo dos produtos − taxas − custos lançados naquele local.
- Margem por produto = (venda − custo) ÷ venda, com o desconto da venda repartido pelos itens.
- Meta do mês: a definida, ou a média dos últimos 3 resultados positivos + 10%.

## Resumo do dia (ícone de papel, em Vender)

Mesmo cálculo, para o dia e o local de venda (sem fixos e retirada, que são do mês):
total vendido, lucro do dia, recebimentos por forma de pagamento (dinheiro para conferir na gaveta;
débito/crédito com o valor que cai na conta), descontos e devoluções do dia, o que vendeu, o que sobrou
e os custos do dia.

## Conferência dos números (12 verificações, a cada abertura)

| # | Verificação | Gravidade |
|---|---|---|
| 1 | Pagamentos de cada venda somam o total | erro |
| 2 | Itens − desconto = total; custo da venda = soma dos custos dos itens | erro |
| 3 | Estoque de cada produto = última movimentação | aviso |
| 4 | Nenhum estoque negativo | erro |
| 5 | Produtos vendidos têm custo | aviso |
| 6 | Nenhum produto vendido abaixo do custo | aviso |
| 7 | Nenhum custo com data no futuro | erro |
| 8 | Nenhum custo lançado duas vezes (descrição, valor, dia, local) | aviso |
| 9 | Dias de feira encerrados têm custos lançados | aviso |
| 10 | Nenhuma venda com data no futuro (relógio do celular) | erro |
| 11 | Prova real: as linhas do demonstrativo somam o resultado | erro |
| 12 | Cópia de segurança nos últimos 7 dias | aviso |

Erros aparecem como **urgente** na Orientação ("Há números que não conferem") antes de qualquer outra decisão.

## Auditoria de 14/10/2026 (versão 0.9.0)

Encontrado e corrigido:

1. Perdas de estoque não entravam no resultado → linha "Perdas de estoque".
2. Devolução mudava meses já fechados → devolução entra na data da devolução.
3. Lucro do Resumo do dia não descontava taxa de cartão → mesmo cálculo das Finanças.
4. Retirada planejada + lançada contavam duas vezes → vale a lançada.
5. Faltava fechamento de caixa por forma de pagamento → "Recebimentos" no Resumo e "Caixa do período".
6. Faltavam imposto sobre vendas e investimentos → configuração e tipo de custo próprios.
7. Risco de lançar insumos em dobro → aviso no formulário de "Produção e insumos".

Cenário conferido à mão no app: vendas R$ 160 (crédito R$ 100, dinheiro R$ 60), devolução R$ 60, custo dos
produtos R$ 40, taxa R$ 4,98, barraca R$ 20, perda R$ 10, fixos R$ 90, retirada R$ 300 → resultado
−R$ 364,98, caixa −R$ 314,98, ponto de equilíbrio R$ 708,83, lucro do dia R$ 35,02. Todos os números batem.
