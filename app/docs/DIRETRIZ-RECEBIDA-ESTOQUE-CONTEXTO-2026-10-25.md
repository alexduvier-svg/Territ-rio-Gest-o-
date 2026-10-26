# AGRO Gestão — Diretriz do universo de estoque

**Estrutura:** Objetivo → Contexto → Ação → Output (entrega ao produtor)  
**Destinatários:** Codex e Claude Code  
**Versão:** 1.0 — 25 de outubro de 2026  
**Natureza:** especificação proposta para implementação; não comprova que as funções já estejam presentes no APK.

## 1. Diretriz central

O estoque do AGRO Gestão deve transformar os registros de produtos e suas movimentações em controle confiável das quantidades e orientações práticas sobre venda, reposição e prevenção de perdas. A operação deve ser simples, funcionar localmente nas funções essenciais e atender também a celulares básicos.

Toda orientação deve responder: **o que aconteceu, quais dados sustentam a análise e qual próximo passo o produtor pode avaliar**. O sistema deve distinguir fatos registrados, estimativas e sugestões.

## 2. Objetivo — para quê?

Permitir que o produtor saiba o que possui, quanto está disponível para vender, quais produtos precisam de atenção e quando avaliar uma reposição.

Resultados esperados:

- Registrar entradas, vendas, devoluções, perdas e ajustes com rastreabilidade.
- Reduzir divergências de quantidade, desperdícios e vendas acima do disponível.
- Identificar produtos próximos do vencimento, com baixa saída ou risco de falta.
- Apoiar decisões sobre quantidade de compra, prioridade de venda e uso do capital.
- Relacionar estoque, vendas, custos e fornecedores sem duplicar cadastros ou regras.

O sucesso deve ser acompanhado por divergências de estoque, perdas registradas, faltas e tempo necessário para concluir tarefas. Comparações devem usar períodos equivalentes e informar quando os registros estiverem incompletos.

## 3. Contexto — para quem e em quais condições?

O módulo atende pequenos produtores rurais, agricultores familiares, artesãos e vendedores em feiras, com diferentes níveis de familiaridade digital, acesso variável à internet e aparelhos de capacidades distintas.

Os produtos podem ter unidades, pesos, embalagens, conservação e ritmos de venda diferentes. Café de 250 g e café de 500 g pertencem à mesma família, mas possuem saldos próprios. Produtos da mesma variação podem chegar em lotes com custos e validades diferentes.

### 3.1 Informações disponíveis

O sistema deve trabalhar com os dados efetivamente registrados:

| Grupo | Informações |
|---|---|
| Produto e variação | Identificador, nome, família, condição ou apresentação, peso ou volume, embalagem e unidade de controle |
| Quantidade | Saldo físico, reservas quando existentes e saldo disponível |
| Entrada ou lote | Quantidade recebida, data de entrada, custo e fornecedor quando informados |
| Validade e origem | Validade, fabricação, colheita, lote, propriedade ou talhão, conforme o produto e o preenchimento |
| Movimentação | Tipo, quantidade, data, motivo, origem e vínculo com a operação |
| Histórico | Vendas, perdas, devoluções, ajustes e prazo de entrega observado ou informado |

Os campos de validade e rastreabilidade devem ser opcionais no cadastro simples. O sistema não deve inventar dados ausentes nem apresentar o registro de origem como certificação.

### 3.2 Regras de identificação e quantidade

- Reaproveitar o cadastro já existente de produtos, variações e fornecedores.
- Manter um estoque geral por produto ou variação. Vendas para pessoa física, empresa ou evento devem registrar a origem comercial e consumir a mesma fonte de saldo.
- Associar quantidades e validades aos respectivos lotes quando houver controle por lote.
- Não somar unidades incompatíveis. Conversões entre caixa, unidade, quilo ou outra medida exigem um fator explícito e validado.
- Diferenciar **validade informada**, **validade não informada** e **não se aplica**. Campo vazio não significa produto sem vencimento.
- Manter produtos da mesma família próximos e, quando comparáveis, ordenar os pesos de forma crescente.

## 4. Ação — o que o sistema faz?

### 4.1 Registrar e conferir as movimentações

Cada entrada, venda, devolução, perda ou ajuste deve gerar uma movimentação vinculada à operação de origem. Correções devem preservar o histórico, por estorno ou mecanismo equivalente já utilizado no aplicativo.

O saldo físico deve resultar do saldo inicial e das movimentações válidas. A contagem manual deve gerar um ajuste justificado, preservando a diferença encontrada.

Se houver reservas implementadas:

**Saldo disponível = saldo físico − reservas ativas.**

A reserva reduz a disponibilidade; a venda confirmada reduz o saldo físico e encerra a reserva correspondente. Cancelamentos e tentativas repetidas não podem duplicar a baixa. O momento da baixa deve ser único e coerente com o fluxo de venda existente.

### 4.2 Avaliar os dados antes de recomendar

Antes de produzir uma orientação, o motor deve verificar:

1. Qual produto, variação, lote e período estão sendo analisados.
2. Se as quantidades e unidades são comparáveis.
3. Quais registros estão ausentes, desatualizados ou inconsistentes.
4. Se existem dados suficientes para a conclusão pretendida.
5. Se outra regra já emitiu a mesma orientação para aquela situação.

Sem dados suficientes, entregar o controle disponível e indicar o dado necessário para melhorar a análise. Não classificar um item como pouco procurado apenas porque faltam vendas registradas.

### 4.3 Acompanhar validade e lotes

Quando o usuário informar a validade de um lote, criar ou atualizar um lembrete no calendário interno, com alertas previstos para cinco dias antes e no dia do vencimento. Se o cadastro ocorrer dentro dessa janela, mostrar a atenção correspondente sem gerar notificações retroativas repetidas.

Os avisos devem considerar apenas a quantidade restante daquele lote. Alteração de data, esgotamento ou exclusão válida deve atualizar ou cancelar os lembretes vinculados. Exportação para a agenda do celular deve ser uma ação separada e voluntária.

Priorizar a saída dos lotes com vencimento mais próximo, quando adequados à venda. Lotes vencidos devem ficar indisponíveis para venda e ser apresentados para conferência e destinação. Não sugerir extensão de validade nem desconto para escoar produto vencido. A baixa definitiva como perda exige registro e confirmação.

As notificações do aparelho dependem das permissões e condições de execução do sistema. O calendário interno e a conferência ao abrir o aplicativo devem permitir consultar pendências mesmo quando uma notificação não for entregue.

### 4.4 Identificar risco de falta e avaliar reposição

Começar com regras locais simples: limite mínimo definido pelo usuário e, quando houver histórico suficiente, consumo observado no período.

Uma estimativa inicial pode usar:

**Cobertura estimada em dias = quantidade disponível ÷ média diária de vendas.**

Informar o período e o número de dias considerados. Não dividir por zero, nem apresentar cobertura numérica sem vendas válidas. Feiras pontuais e dias em que o item esteve indisponível precisam ser considerados para evitar projeções enganosas.

Quando houver prazo de entrega confiável e estoque de segurança definido:

**Ponto de reposição estimado = venda diária estimada × prazo de reposição + estoque de segurança.**

Comparar o saldo disponível e as entradas confirmadas previstas para o período, evitando recomendar uma compra já atendida por um pedido. Sem prazo ou histórico suficiente, usar o limite manual e explicar a limitação.

Para produtos perecíveis, avaliar se a quantidade sugerida pode ser vendida dentro da validade. Reposição é uma recomendação; não deve gerar pedido ao fornecedor automaticamente.

### 4.5 Identificar baixa saída e risco de perda

Cruzar saldo, tempo desde a entrada, vendas recentes e validade quando disponíveis. Considerar sazonalidade e contexto de venda antes de afirmar que há excesso.

Apresentar alternativas como priorizar divulgação, levar quantidade menor à próxima feira, reorganizar a exposição ou revisar a próxima compra. Sugestões de promoção devem considerar custo conhecido, despesas variáveis conhecidas e margem de contribuição. Sem esses dados, não afirmar que um desconto é rentável.

Produtos diferentes podem ter ritmos de giro distintos. Não impor o mesmo prazo de baixa saída a hortaliças, café e artesanato.

### 4.6 Conectar os módulos existentes

- **Vendas:** confirmar a movimentação e atualizar o saldo pelo fluxo único já adotado.
- **Fornecedores:** consultar histórico de entrada, custo e prazo, quando registrados.
- **Calendário:** registrar validade e lembretes sem criar eventos duplicados.
- **Gestão:** apresentar perdas, giro e valores de estoque apenas quando os dados permitirem; custo ausente deve aparecer como informação incompleta, não como zero.
- **Feiras:** sugerir quantidades a levar a partir de eventos comparáveis; separar planejamento de evento e movimentação física efetivamente registrada.

## 5. Output — o que o produtor recebe?

### 5.1 Entrega operacional

Saldo atualizado por produto e variação, consulta de lotes, histórico de movimentações, registro de perdas e ajustes, lembretes de validade e lista de itens que precisam de atenção.

A tela principal deve priorizar nome completo, apresentação, peso ou volume e quantidade com sua unidade. Detalhes e análises devem ficar em áreas expansíveis. A cor pode reforçar um status, mas o texto precisa explicar seu significado.

### 5.2 Entrega para decisão

Cada orientação deve conter:

| Parte | Conteúdo esperado |
|---|---|
| Situação | O que precisa de atenção |
| Evidência | Quantidade, lote, período e registros usados |
| Análise | Cálculo ou regra aplicada; indicar quando for estimativa |
| Limitação | Dado ausente ou condição que pode mudar o resultado |
| Próximo passo | Ação prática que o produtor pode avaliar |

Mostrar orientações automaticamente quando uma regra relevante for acionada. O produtor também pode consultá-las pelo módulo de estoque ou pelo campo de perguntas do negócio, se esse recurso existir. O funcionamento não deve depender de o usuário formular uma pergunta.

Usar um aviso principal por situação, permitindo ver detalhes, dispensar ou adiar. Registrar essas escolhas para reduzir repetição, sem esconder o estado atual do produto.

## 6. Exemplos ilustrativos

**Validade:** “Há 12 unidades deste lote com vencimento em cinco dias. No período analisado, foram vendidas em média duas unidades por dia. Mantido esse ritmo, a projeção é vender dez até a data. Considere priorizar a divulgação e acompanhe o saldo.” A projeção depende de vendas comparáveis e não garante demanda.

**Reposição:** “Restam seis pacotes de café especial moído de 250 g. A média observada foi de dois pacotes por dia, equivalente a cerca de três dias de cobertura. O prazo informado do fornecedor é de quatro dias. Confira as entradas previstas e avalie antecipar a reposição.”

**Sem histórico:** “Restam oito unidades. Ainda não há histórico suficiente para estimar a duração do estoque. Você pode definir uma quantidade mínima para receber avisos.”

**Ajuste:** “O aplicativo registra 20 unidades e a contagem encontrou 18. Confira vendas e perdas pendentes. Se a diferença for confirmada, registre um ajuste de duas unidades com o motivo.”

**Baixa saída:** “Este artesanato não teve vendas registradas nos últimos 30 dias e há dez unidades disponíveis. Verifique se esteve à venda nesse período antes de revisar a próxima compra.”

Todos os números desta seção são fictícios e não devem ser incorporados como dados do usuário ou limites universais.

## 7. Instruções de implementação para Codex e Claude Code

Antes de alterar o aplicativo, mapear os cadastros, banco local, movimentações, cálculos, calendário, notificações e diretrizes existentes. Identificar duplicidades e conflitos e consolidar a regra aplicável em uma única fonte, preservando dados e compatibilidade. Registrar a decisão de implementação e seu motivo.

Este documento orienta a implementação: anexá-lo à memória do projeto não cria funções executáveis. Os cálculos devem usar serviços ou regras verificáveis, com mensagens geradas a partir dos resultados reais.

Implementar em etapas:

1. **Base:** movimentações confiáveis, unidades, variações e saldo único.
2. **Atenção:** lotes, validade opcional, limites mínimos e calendário.
3. **Análise:** cobertura, reposição, giro e risco de perda com indicação de limitações.
4. **Integração:** recomendações com fornecedores, feiras e perguntas do negócio, conforme os módulos disponíveis.

Executar cálculos fora das tarefas que mantêm a interface responsiva, consultar somente os registros necessários e recalcular os itens afetados por uma mudança. Não carregar todo o histórico a cada abertura de tela. Preservar as funções essenciais em aparelhos básicos e sem conexão, sem depender de serviço pago ou modelo de linguagem para calcular saldos e avisos.

Usar o fuso local e tratar validade como data de calendário. Persistir os vínculos dos alertas para que reaberturas, alterações e reinicializações não criem duplicatas. Notificações externas e integrações futuras não devem comprometer o controle local.

## 8. Critérios de aceite

- Entrada de dez unidades e venda confirmada de três resultam em saldo sete; repetir a confirmação não altera novamente o saldo.
- Vendas para pessoa física, empresa e evento consomem a mesma fonte de estoque.
- Variações de 250 g, 500 g e 1 kg mantêm saldos próprios; conversões só ocorrem com fator validado.
- Reserva, confirmação e cancelamento preservam a diferença entre saldo físico e disponível, quando houver reservas.
- Dois lotes da mesma variação com validades distintas mantêm quantidades e alertas separados.
- Validade vazia permite salvar e não produz data ou prazo inventado.
- Validade informada gera lembretes vinculados ao lote; alteração ou esgotamento atualiza as pendências sem duplicação.
- Lote vencido não pode ser vendido nem recebe sugestão de promoção para escoamento.
- Histórico insuficiente gera orientação limitada aos fatos disponíveis, sem previsão fictícia.
- Custos ausentes não produzem lucro, margem ou valor total de estoque apresentados como completos.
- Falta de internet ou de permissão para notificações não impede consultar saldos, registrar operações e visualizar pendências internas.
- Migrações preservam o histórico; recomendações não alteram preço, compram mercadoria ou lançam perdas sem confirmação.

## 9. Definição para a memória do projeto

> No universo de estoque, o AGRO Gestão deve transformar entradas, saídas, lotes e histórico de vendas em quantidades confiáveis e orientações práticas sobre disponibilidade, validade, reposição e prevenção de perdas. Cada orientação deve mostrar os dados utilizados, distinguir fatos de estimativas, explicar suas limitações e permitir que o produtor avalie o próximo passo. A implementação deve reaproveitar módulos existentes, evitar duplicidades e manter operação simples e local nas funções essenciais, inclusive em celulares básicos.
