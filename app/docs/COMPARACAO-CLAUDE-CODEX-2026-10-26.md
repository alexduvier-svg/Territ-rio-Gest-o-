# Comparação — Codex 0.12.91 e Claude 0.12.92

Consulta ao Git em26/10/2026 após pedido do usuário. Claude: `fbdcdb9698d442d5cc1f12281b65964bf810622d`, confirmado em `alexduvier-svg/agro-gestao-claude/main`. Codex91 deriva da entrega final88, commit `4bf346ee64ea79b23db6b2793930985ffe5d8827`, apenas renomeada/renumerada nesta tarefa.

**Não houve cópia integral das mudanças do Claude para o Codex.** Ter números semelhantes não significa ter implementações iguais.

| Área | Claude atual | Codex atual |
|---|---|---|
| Contas principais | Markup, equilíbrio, indicadores, descontos e maquininha | Mesmas finalidades com implementação própria |
| Composição de custos e tributos | Campos de custo e taxas das simulações | Composição expansível de fixos, variáveis e tributos; arquivo de referência sem alíquotas presumidas |
| Contas de fornecedores | Comparação rápida e à vista versus prazo | Ainda não incorporadas |
| Contas de estoque e caixa | Quando pedir/quanto comprar e ciclo de caixa | Ainda não incorporadas na calculadora |
| Produção rural | Custo da safra e conversão de medidas | Ainda não incorporadas |
| Crédito/investimento | Parcela Price e retorno do investimento | Ainda não incorporadas |
| Lote vencido | Botão direto Registrar Como Perda no lote selecionado | Não incorporado; conserva fluxo da base88 |
| Antecedência de validade | 1 a90dias por produto | Conserva antecedência da base88 |
| Compra de fornecedor | Rascunhos para entrada em estoque e lançamento em custos | Atalhos não incorporados |
| Finanças | Regra costKnown compartilhada; taxa padrão identificada; retirada por mês e notas de caixa | Correções adicionais do Claude não incorporadas ao módulo financeiro; calculadora Codex tem suas próprias guardas de origem/custo |
| Gestão | Relatórios reorganizados e cache durante a montagem | Estrutura final da base88 |
| Desempenho | Cache de formatadores de datas | Otimização do Claude não incorporada |
| Cards | Altura por fileira na91; não estica a grade inteira | CSS da base88 preservado nesta renomeação |
| Ajustes em tela estreita | Na92, detalhe da linha desce sem quebrar palavras | Não incorporado |
| Identificação | AGRO Gestão Claude0.12.92 nas telas/arquivos | AGRO Gestão Codex0.12.91; Ajustes mostra0.12.91·Codex |
| Exemplos da primeira abertura | Desde90, podem persistir e permitir vendas | Conserva Modo Teste isolado, sem concluir vendas |

A92alterou nome/versão, textos de identificação e quebra de detalhes de Ajustes em telas estreitas. Os arquivos `finance/producer-calcs.js`, `finance/finance.js` e `stock-lots/ui.js` permanecem idênticos aos do commitClaude89/d051181.

## Cuidados para uma futura integração

A revisão independente da89registrou763testes aprovados e reproduziu dois problemas fora dessa suíte: perda sem rollback quando persistir falha e Sobra no Caixa ainda descontando previstos. A comparação rápida também pode apontar vencedor quando um frete é desconhecido, com uma ressalva posterior. Os trechos permanecem iguais na92; não foram corrigidos por esta comparação.

A integração deve ser seletiva, preservando as melhorias próprias do Codex na composição de custos/taxas, teclado comum, origem dos valores, carga elegível e treinamento isolado. Não substituir o arquivo financeiro ou a interface inteira apenas pelo número da versão. Esta solicitação foi uma auditoria: não autoriza ou representa um merge automático de todas as diferenças.

Repositórios, pacotes, assinaturas e bases de dados continuam separados. Nenhum código do checkoutClaude foi alterado nesta comparação e nenhum servidor foi publicado.

## Atualização posterior — Codex0.12.92

A correção de descrição de Ajustes em telas estreitas foi incorporada por pedido explícito. As demais diferenças da comparação continuam separadas; não houve merge integral. Ver ENTREGA-CODEX-0.12.92.md.
