# Diretriz do Conselho de Gestão — AGRO Gestão

**Aba Gestão · Superconsultor de resultados do produtor**
Versão 1.0 · 05/11/2026 · Autor: Alex Duvier · Base auditada: `codex/compilacao-148-claude` (0.12.148-teste.1, commit `52bddd3`)
Autoridade no app: `reference_only` — conhecimento versionado, nunca instrução executável.

---

## 1. Propósito em uma página

A aba Gestão passa a funcionar como um **Conselho de Gestão**: seis agentes especialistas, cada um com o método de uma referência mundial ou brasileira em análise de resultados, que leem os números do produtor e devolvem **uma conclusão clara e uma ação concreta**. Não se trata de criar novos motores. Os seis agentes são **lentes de método** aplicadas sobre o motor que o app já tem (a Orientação, `advisor/engine.js`), sobre os cálculos canônicos (`finance.js`, `kpi-engine.js`, `producer-calcs.js`) e sob a autoridade da Auditoria (`finance/audit.js`).

| Agente | Referência de método | Pergunta que responde |
|---|---|---|
| Conselheiro de Resultado (preside) | Lásaro do Carmo Jr. | O que importa agora para o seu resultado, quem faz e até quando? |
| Gerente da Rotina e das Metas | Vicente Falconi (Campos) | A meta foi atingida? Se não, qual é o problema e onde ele está? |
| Gestor de Ganho e Estoque | Eliyahu M. Goldratt | Qual produto mais ganha com o recurso que limita o seu negócio, e quanto dinheiro está parado? |
| Gestor de Clientes | Peter Fader | Quem são os clientes que sustentam o negócio e quem está deixando de voltar? |
| Gestor de Compras e Fornecedores | Peter Kraljic | Quais compras pesam no lucro e quais podem parar a produção? |
| Gestor de Caixa | Alan Miltz e Verne Harnish | Quanto dinheiro fica preso no ciclo e qual alavanca mais o libera? |

Acima de todos está a **Conferência** (a Auditoria já existente), que não é um agente: é um portão. **Nenhum agente fala antes da conferência**, e isso vale do mesmo modo no app de teste (Codex Teste, Codex Teste IA) e na versão publicada na Play Store.

> **Regra de ouro.** Os agentes interpretam; os motores canônicos calculam; a Auditoria confere; o produtor decide. Nenhum agente cria número, efetiva venda, baixa, compra, envio ou mudança de preço.

---

## 2. O que já existe e como cada peça é aproveitada

A auditoria de duplicidade foi feita sobre o ramo `codex/compilacao-148-claude`, seguindo o protocolo de `docs/motor/RELATORIO_DUPLICIDADE.md` e o `docs/motor/registry.json` (40 entradas). Classes: **D1** reaproveitar como está · **D4** estender · **T** transformar (o agente passa a ser o dono da regra, sem mudar o cálculo) · **N** novo, só depois de conferir o registro.

| Peça existente | Arquivo | Classe | Agente dono / uso |
|---|---|---|---|
| Motor de Orientação (`buildGuidance`, lista `RULES`) | `advisor/engine.js` | D4 | Único motor. Todas as regras dos seis agentes entram na lista `RULES` com o campo `lens`. |
| Liberação (até 3 conselhos, um por família, feedback) | `advisor/release.js` | D4 | Mantida. Ganha as famílias `rotina`, `ganho`, `cliente`, `compra`, `caixa`, `resultado`. O Conselheiro de Resultado só redige o resumo sobre o que ela libera. |
| Auditoria dos números (12 conferências) | `finance/audit.js` `runAudit` | D1 | Portão supremo. Não pode ser desligada por agente, Gemini ou edição do app. |
| Qualidade da evidência | `advisor/quality.js` | D1 | Define a confiança de todos os agentes. |
| Hipótese ≠ diagnóstico | `advisor/method.js` | T | Vira o ciclo PDCA do Gerente da Rotina. |
| Meta do mês e meta sugerida (`fin-meta`, `suggestedGoal`) | `finance-rules.js`, `finance.js` | T | Gerente da Rotina e das Metas. |
| Comparação entre períodos (efeito quantidade × efeito preço) | `kpi-engine.js` `periodChange` | D1 | Gerente da Rotina (Pareto do desvio da meta). |
| Curva ABC de contribuição, cobertura do estoque | `kpi-engine.js` | D1 | Gestor de Ganho e Estoque. |
| Margem de contribuição, abaixo do custo, papel do produto, encalhe, esgotou, repor | `finance.js`, `engine.js` | T | Gestor de Ganho e Estoque. |
| Recompra, fiéis, retorno, identificar, guias de CRM | `agent/core.js`, `engine.js` | T | Gestor de Clientes. |
| Fornecedores, cotações, compras e recebimentos | `suppliers/model.js` | D1 | Gestor de Compras e Fornecedores. |
| Ciclo de caixa, prazo × à vista, taxas de cartão | `producer-calcs.js` `cashCycle`, `cashOrTerm`, `cardNet` | D1 | Gestor de Caixa. |
| Fiado e recebimentos | `receivables/receivables.js` | D1 | Gestor de Caixa. |
| Ponto de equilíbrio, retirada, taxas (`fin-equilibrio`, `fin-retirada`, `fin-taxas`) | `finance-rules.js` | T | Gestor de Caixa. |
| Agente operacional local (propostas de venda, fala, catálogo) | `agent/*` | D1 | Fora do Conselho. Continua com vendas por voz e texto. |
| Gerente (perguntas em linguagem natural) | `agent/read-queries.js`, `business-query.js` | D4 | Passa a responder no formato do Conselho (seção 6.3), usando só valores canônicos. |
| Gemini online / Nano | `general-education`, `agent/worker.js` | D1 | Só interpreta a pergunta e explica conceitos fixos. Não recebe registros para calcular, não decide e não executa. |

**Lacunas reais (classe N), a confirmar no registro antes de escrever:**

1. `cliente:concentracao` — a regra `dependencia` existente mede dependência de **produto**, não de **cliente**.
2. `compra:matriz` — o módulo de fornecedores compara ofertas, mas não classifica itens de compra por impacto e risco.
3. `caixa:poder-do-um` — simulação das sete alavancas sobre o demonstrativo canônico. Só a tabela de cenários é nova; nenhuma fórmula de resultado é recriada.
4. `ganho:restricao` — ganho por unidade do recurso que limita, que exige o novo campo opcional "recurso que limita".
5. `resultado:basico` — índice de completude dos registros, que reaproveita as contagens da Auditoria.

---

## 3. Princípio supremo: conferência primeiro

O produtor precisa poder confiar em cada número antes de ouvir qualquer conselho. Por isso a conferência tem **primazia** sobre todos os agentes, em todas as edições do app.

### 3.1 Os quatro portões, em ordem

| Portão | O que verifica | Se falhar |
|---|---|---|
| 0 · Contexto | Origem dos dados (`real`, `demo` ou `unconfirmed`), produtor (`actorId`), período e local. | `unconfirmed` bloqueia todos os agentes, exceto o aviso de integridade. `demo` roda com o selo "Dados de demonstração". |
| 1 · Auditoria | As 12 conferências de `runAudit`: pagamentos, itens, estoque, negativo, custo, abaixo, futuro, duplicado, feiras, relógio, prova e cópia. | Erro bloqueia conclusões financeiras, de ganho e de caixa. Fala apenas o aviso de integridade, com o botão para corrigir. |
| 2 · Prova dos nove | Identidades contábeis do período (seção 3.2), conferidas em centavos inteiros. | Diferença diferente de zero vira conselho urgente de integridade e silencia os agentes afetados. |
| 3 · Evidência mínima | Amostra, período e dados exigidos pela lente (tabela de cada agente). | Sem o mínimo, o agente não conclui. Faz uma pergunta de esclarecimento específica ou declara a lacuna. |

### 3.2 Prova dos nove (identidades a fechar em centavos)

| Identidade | Fórmula | Onde já existe |
|---|---|---|
| Vendas | Soma das linhas de venda por produto = receita bruta do demonstrativo | `audit.js` `itens` e `prova` |
| Pagamentos | Soma dos pagamentos de cada venda = total da venda | `audit.js` `pagamentos` |
| Estoque | Saldo inicial + entradas − vendas − perdas ± ajustes = saldo atual, por variação | `audit.js` `estoque` |
| Fiado | Fiado lançado − recebimentos = saldo a receber | `receivables.js` `balance` |
| Resultado | Receita − devoluções − custo histórico − taxas − custos da feira − fixos = resultado | `finance.js` `statement` |
| Lotes | Soma dos lotes = saldo físico da variação, sem dupla baixa | `stock-lots/domain.js` |

Só a identidade que ainda não tiver conferência registrada entra como novo item da Auditoria, depois de consultado o `registry.json`.

### 3.3 Paridade entre teste e Play Store

A conferência e os conselhos **não podem depender da edição do app**. Isso garante que o que foi validado no Codex Teste é exatamente o que o produtor terá depois do lançamento.

1. O motor, a Auditoria e as regras dos agentes **não leem** `BuildConfig`, sabor (`edition`), sufixo do pacote nem qualquer indicador de teste. Um teste automático procura essas leituras nos arquivos de `advisor/`, `finance/`, `kpi/` e `agent/` e reprova o build se encontrar alguma.
2. Os mesmos testes-ouro (seção 9.3) rodam nas edições `original`, `codexteste`, `codextesteia` e na edição de lançamento, com a mesma saída byte a byte (`advice_id`, números e confiança).
3. Dados `demo` e `real` passam pela **mesma** matemática e pela mesma Auditoria. A diferença está só no selo da tela e no aprendizado: dados de demonstração e simulação nunca treinam limites, feedback ou memória do negócio real.
4. Limites (amostras mínimas, janelas, percentuais) moram em `management-council-guidelines.js`, versionados. Nenhum limite é alterado por feedback, por modelo de IA ou por edição.
5. Fuso de negócio, arredondamento meio-par na exibição, centavos inteiros, Kahan e Welford seguem `decision-guidelines.js`. Divisão por zero devolve `null` com motivo.

---

## 4. Os seis agentes

Cada agente leva o **nome da função** na tela e o **método de referência** como crédito discreto ("método inspirado em…"). O app não imita a voz das pessoas, não atribui a elas frases inventadas e não sugere endosso. Isso protege o produto comercial (direitos da personalidade e uso de nome) e mantém o foco no método.

### 4.1 Conselheiro de Resultado — preside o Conselho

**Referência:** Lásaro do Carmo Jr., ex-presidente da Jequiti e ex-vice-presidente do Grupo Silvio Santos, executivo com passagens por Natura (Argentina), Jafra e Jeunesse, conselheiro de empresas e autor de *O que importa é seu resultado* (Editora Gente, 2020).

**Método aplicado.** O livro não traz um método com nome próprio; o protocolo abaixo foi montado a partir dos eixos que o autor publica: resultado a partir de uma **gestão básica bem feita**; revisão da **rotina e dos processos** para cortar o que não gera valor; geração de **"dinheiro novo"** com ações diferentes das habituais; atenção ao **comportamento do consumidor** e à qualidade da venda; e operação com **indicadores econômico-financeiros** ligados a um planejamento. Nas palestras, ele soma a isso a cultura de resultado com feedback e disciplina para crescer.

**Papel no app.** Não calcula nada. Recebe os até três conselhos que a Liberação já selecionou e escreve o **Resumo do Resultado** no topo da aba Gestão:

1. **Básico bem feito primeiro.** Se o índice `resultado:basico` estiver abaixo de 80%, o resumo fala só de registros (vendas sem custo, sem forma de pagamento, feiras sem custo lançado, cópia de segurança antiga). Sem base confiável, não há resultado a analisar.
2. **Uma decisão da semana.** Entre os conselhos liberados, o resumo destaca um, no formato **número que deve mudar · ação · quem · até quando**. O "quem" é sempre o próprio produtor ou alguém que ele indicar; o prazo é sugerido e editável.
3. **Dinheiro novo.** Uma vez por mês, se houver evidência, aponta uma oportunidade que não depende de vender mais do mesmo: produto de alto ganho pouco exposto, cliente valioso adormecido ou compra que pode ser negociada.
4. **Fechamento.** No mês seguinte, confere se o número escolhido mudou (Check do PDCA, com o Gerente da Rotina) e registra o aprendizado na memória do negócio real.

| Regra | Dispara quando | Dados mínimos | Saída |
|---|---|---|---|
| `resultado:basico` | Completude < 80% em qualquer dimensão | Contagens da Auditoria | Lista curta do que registrar, com atalho |
| `resultado:semana` | Liberação com ≥ 1 item e Auditoria sem erro | Itens liberados | Decisão da semana com número, ação e prazo |
| `resultado:dinheiro-novo` | Uma vez por mês, com evidência de outro agente | ≥ 8 vendas no período e custos completos | Uma oportunidade, rotulada como hipótese a testar |

**Índice de gestão básica** (média simples, cada componente de 0 a 100%): vendas com custo histórico conhecido; vendas com forma de pagamento; feiras com custo lançado; movimentos de estoque reconciliados; cópia de segurança com até 7 dias. Todos já são contados pela Auditoria.

**Tom.** Direto, executivo e respeitoso: "O que importa este mês é…". Proibido incentivar jornadas exaustivas ou culpar o produtor; o foco é decisão e número, não esforço.

### 4.2 Gerente da Rotina e das Metas

**Referência:** Vicente Falconi Campos, professor emérito da UFMG e fundador da Falconi Consultores, autor de *Gerenciamento da Rotina do Trabalho do Dia a Dia* (8ª ed., Editora de Desenvolvimento Gerencial, 2004) e *Gerenciamento pelas Diretrizes*.

**Método aplicado.**

- **Problema é meta não alcançada:** a diferença entre o resultado e a meta é o próprio problema.
- **PDCA para melhorar** (Planejar: problema, meta, análise do fenômeno, análise das causas, plano; Executar; Verificar; Atuar: padronizar o que funcionou) e **SDCA para manter** o padrão da rotina.
- **Item de controle** mede o resultado (efeito); **item de verificação** mede a causa. Cada item de controle tem um ou mais itens de verificação.
- **Pareto:** poucos itens explicam a maior parte do desvio; ataca-se primeiro o que pesa mais.

**Papel no app.** Dono da cadência da Gestão: meta do mês, acompanhamento semanal e fechamento mensal.

| Regra | Transforma / cria | Dispara quando | Dados mínimos |
|---|---|---|---|
| `rotina:meta` | T de `fin-meta` e `fin-meta-ok` | Meta cadastrada pelo produtor | Meta + vendas do período |
| `rotina:desvio-pareto` | D1 de `periodChange` | Realizado abaixo da meta proporcional ao dia | Período atual e anterior equivalente |
| `rotina:pdca` | T de `test-pending` e `method.js` | Hipótese registrada sem verificação há ≥ 14 dias | Hipótese + data + item de controle |
| `rotina:padrao-banca` | T do checklist da banca | Feira com sobra ou falta repetida em ≥ 3 edições comparáveis | `fairFacts` |

**Itens de controle padrão:** receita do período; resultado do período (só com custos completos); taxa de venda da feira (vendido ÷ levado); clientes identificados. **Itens de verificação associados:** preço médio, quantidade por produto, itens por venda, horário de esgotamento, custo lançado.

**Exemplo-ouro.** Meta de outubro R$ 9.000,00; realizado R$ 7.600,00 → **problema de R$ 1.400,00**. O `periodChange` mostra que dois produtos explicam a maior parte da diferença, separada em efeito quantidade e efeito preço. Ação: atacar primeiro o produto de maior peso, com um teste de cada vez, registrado como PDCA.

**Limites.** A meta é sempre do produtor (`suggestedGoal` só sugere). Uma feira não é tendência. Meta nunca justifica baixar preço abaixo do custo.

### 4.3 Gestor de Ganho e Estoque

**Referência:** Eliyahu M. Goldratt, físico israelense, criador da Teoria das Restrições e autor de *A Meta* (1984).

**Método aplicado.**

- **Ganho (throughput)** = vendas − custos totalmente variáveis (no app: preço − custo histórico unitário − taxa de cartão da venda).
- **Investimento** = dinheiro preso no sistema, com o estoque valorizado só pelo custo variável, sem rateio de fixos.
- **Despesa operacional** = o que se gasta para gerar ganho (fixos, barraca, transporte, ajudante).
- **Lucro líquido** = ganho − despesa operacional.
- **Cinco passos de focalização:** identificar a restrição, explorá-la, subordinar o resto a ela, elevá-la e recomeçar.
- Quando há um recurso escasso, a ordem de prioridade dos produtos é pelo **ganho por unidade da restrição**, não pelo ganho por unidade vendida.

**Papel no app.** Responde sobre produtos e estoque: qual produto priorizar, quanto dinheiro está parado e onde o estoque falta ou sobra.

| Regra | Transforma / cria | Dispara quando | Dados mínimos |
|---|---|---|---|
| `ganho:restricao` | N (campo opcional "recurso que limita") | Produtor informou o recurso (litros de leite, horas de produção, espaço na banca, tachos) e o consumo por produto | Custo conhecido dos produtos envolvidos |
| `ganho:dinheiro-parado` | D1 de `stockCoverage.still` × custo | Itens com saldo e sem venda na janela | Custo conhecido; janela de 30 dias |
| `ganho:abaixo-custo` | T de `abaixo-custo` e `preco-90` | Ganho unitário ≤ 0 | Custo conhecido |
| `ganho:papel-produto` | T de `papel-produto` e `campeao-margem` | Curva ABC com cobertura de custo ≥ 70% da receita | `contributionAbc` |
| `ganho:falta-sobra` | T de `encalhe`, `esgotou`, `repor`, `acaba-logo`, `previsao-feira` | Regras atuais | Regras atuais |

**Exemplo-ouro (restrição = 400 litros de leite por semana).**

| Produto | Preço | Custo variável | Ganho por unidade | Leite por unidade | Ganho por litro |
|---|---|---|---|---|---|
| Queijo minas 1 kg | R$ 25,00 | R$ 13,00 | R$ 12,00 | 10 L | R$ 1,20 |
| Doce de leite 400 g | R$ 18,00 | R$ 9,00 | R$ 9,00 | 2 L | R$ 4,50 |
| Requeijão 200 g | R$ 16,00 | R$ 8,00 | R$ 8,00 | 4 L | R$ 2,00 |

Com demanda máxima semanal de 20 queijos, 60 doces e 40 requeijões: priorizar pelo ganho por unidade (queijo, doce, depois requeijão: 20, 60 e 20 unidades) gera **R$ 940,00** de ganho; priorizar pelo ganho por litro (doce, requeijão, depois queijo: 60, 40 e 12 unidades) gera **R$ 1.004,00**, ou seja, **R$ 64,00 a mais por semana** com o mesmo leite. O app mostra a comparação como cenário; a decisão de produção é do produtor.

**Limites.** Sem o recurso informado, não presume restrição. Quantidades só são comparadas na mesma unidade. Custo ausente nunca vira zero. Estoque esgotado não comprova procura não atendida.

### 4.4 Gestor de Clientes

**Referência:** Peter Fader, professor de Marketing da Wharton School (Universidade da Pensilvânia), autor de *Customer Centricity* e coautor de *The Customer Centricity Playbook*.

**Método aplicado.**

- Clientes são **diferentes** no valor que geram; médias escondem isso.
- **Contar clientes, não pedidos.**
- **RFM:** recência, frequência e valor monetário.
- Acompanhar **coortes** (grupos pela data da primeira compra) em vez de uma taxa de retenção única.
- Medir a **concentração** da receita nos melhores clientes.
- Investir retenção em clientes valiosos que respondem.

**Adaptação obrigatória ao app.** Pela decisão D3-2 do produtor (20/10/2026), o valor do cliente é **só o observado**, ou seja, o que ele já comprou. **Não se projeta valor futuro (CLV).** O RFM entra como leitura do histórico, não como previsão.

| Regra | Transforma / cria | Dispara quando | Dados mínimos |
|---|---|---|---|
| `cliente:rfm` | D4 sobre `rebuyFacts` | ≥ 10 clientes identificados com ≥ 2 compras em dias distintos | Vendas com cliente vinculado |
| `cliente:concentracao` | N | Os 3 maiores clientes somam ≥ 50% da receita identificada | ≥ 5 clientes identificados |
| `cliente:recompra` | T de `rebuy`, `retorno` e `fieis` | Regras atuais (mediana dos intervalos × 1,25) | ≥ 4 dias de compra |
| `cliente:identificar` | T de `identificar` e `qr` | < 30% das vendas com cliente identificado | Vendas do período |

**Segmentos RFM**, com limites relativos à **mediana do próprio produtor**, nunca a médias externas:

- **Campeões:** recência ≤ mediana, frequência ≥ mediana e valor ≥ mediana.
- **Valiosos sumindo:** valor ≥ mediana e recência > 1,5 × mediana dos intervalos de compra do cliente.
- **Novos:** uma compra nos últimos 30 dias.
- **Adormecidos:** sem compra há mais de 90 dias.

**Limites.** Contato só com consentimento registrado (LGPD, Lei 13.709/2018). Rascunho de mensagem é editável; compartilhar não comprova envio nem entrega. Venda sem cliente identificado não entra no RFM e é declarada como lacuna. Dados de um produtor nunca aconselham outro.

### 4.5 Gestor de Compras e Fornecedores

**Referência:** Peter Kraljic, então diretor da McKinsey & Company, autor de *Purchasing Must Become Supply Management* (Harvard Business Review, 1983).

**Método aplicado.** Classificar cada item comprado por dois eixos, **impacto no lucro** e **risco de fornecimento**, e tratar cada quadrante de um jeito:

| Quadrante | Impacto | Risco | Estratégia no app |
|---|---|---|---|
| Estratégico | Alto | Alto | Parceria e planejamento com o fornecedor principal; manter um segundo fornecedor qualificado. |
| Gargalo | Baixo | Alto | Garantir abastecimento: estoque de segurança e fornecedor alternativo cadastrado. |
| Alavancagem | Alto | Baixo | Pedir ao menos 3 cotações (`compareOffers`) e negociar volume e prazo. |
| Não crítico | Baixo | Baixo | Simplificar: comprar junto, menos pedidos, menos tempo gasto. |

**Como o app mede (só com registros):**

- **Impacto:** participação do item no total de compras do período. O item é de alto impacto se estiver entre os que somam 80% do gasto (Pareto).
- **Risco:** alto se o item tiver um único fornecedor cadastrado **ou** se tiver recebimento atrasado ou incompleto (`purchaseReceiptState`) em 2 das últimas 5 compras **ou** se o produtor marcar o item como "difícil de achar".

| Regra | Transforma / cria | Dispara quando | Dados mínimos |
|---|---|---|---|
| `compra:matriz` | N sobre `suppliers/model.js` | ≥ 6 compras registradas em ≥ 3 itens | Compras com item, valor e fornecedor |
| `compra:fornecedor-unico` | N | Item estratégico ou gargalo com um único fornecedor | Matriz calculada |
| `compra:cotacao` | D1 de `compareOffers` | Item de alavancagem sem cotação há ≥ 90 dias | Matriz calculada |

**Exemplo-ouro (laticínio artesanal).** Pote de vidro: 35% do gasto e um fornecedor → **estratégico**. Rótulo: 3% do gasto e um fornecedor → **gargalo**. Açúcar: 25% do gasto e três fornecedores → **alavancagem**. Sacolas: 2% do gasto e dois fornecedores → **não crítico**. Os outros 35% do gasto são leite, com dois fornecedores (alto impacto e baixo risco → **alavancagem**). Ordem do Pareto: pote 35%, leite 70%, açúcar 95%, rótulo 98%, sacolas 100%; é de alto impacto o item que começa antes de 80% acumulados.

**Limites.** O histórico de fornecedores é global (não por feira), não movimenta estoque nem caixa automaticamente e não duplica o custo histórico dos produtos em custos extras, como já define a Gestão 0.12.136. O agente nunca envia pedido nem aceita oferta.

### 4.6 Gestor de Caixa

**Referência:** Alan Miltz, fundador da Cash Flow Story e coautor do capítulo de caixa de *Scaling Up* (Verne Harnish, 2014). A ferramenta **Power of One** é atribuída ao trabalho de Miltz.

**Método aplicado.**

- **Sete alavancas** de lucro e caixa: preço, volume, custo direto, despesas fixas, dias para receber, dias de estoque e dias para pagar.
- **Mover cada uma em 1%** (ou 1 dia) mostra onde está o maior efeito.
- **Ciclo de caixa** = dias de estoque + dias para receber − dias para pagar.
- Lucro e caixa são coisas diferentes: empresa lucrativa pode ficar sem dinheiro.

**Papel no app.** Responde "por que vendi bem e o dinheiro não aparece?" e "qual alavanca mexer primeiro?".

| Regra | Transforma / cria | Dispara quando | Dados mínimos |
|---|---|---|---|
| `caixa:poder-do-um` | N (tabela de cenários sobre `statement`) | Mês com custos completos e Auditoria sem erro | Demonstrativo do mês |
| `caixa:ciclo` | D1 de `cashCycle` | Ciclo > 0 ou subindo há 2 meses | Estoque a custo, fiado e compras a prazo |
| `caixa:fiado` | T sobre `receivables.js` | Fiado vencido ≥ 15% da receita do mês ou cliente com 2 fiados abertos | Fiado lançado |
| `caixa:retirada` | T de `fin-retirada` e `fin-equilibrio` | Regras atuais | Regras atuais |
| `caixa:taxas` | T de `fin-taxas` | Regra atual (comparar taxa real × configurada) | Pagamentos por método |

**Exemplo-ouro (mês).** Receita R$ 8.000,00; custo dos produtos R$ 4.000,00; fixos R$ 1.500,00; resultado R$ 2.500,00. Recebe em 10 dias, mantém 20 dias de estoque e paga em 15 dias.

| Alavanca (1% ou 1 dia) | Efeito no resultado do mês | Caixa liberado uma vez |
|---|---|---|
| Preço +1% (mesmo volume) | +R$ 80,00 | — |
| Volume +1% (mesma margem) | +R$ 40,00 | — |
| Custo dos produtos −1% | +R$ 40,00 | — |
| Fixos −1% | +R$ 15,00 | — |
| Receber 1 dia antes | — | R$ 266,67 |
| Estoque 1 dia a menos | — | R$ 133,33 |
| Pagar 1 dia depois, dentro do combinado | — | R$ 133,33 |

O ciclo de caixa é de **15 dias** (20 + 10 − 15). Pela fórmula canônica de `cashCycle` (custo mensal de R$ 5.500,00 ÷ 30 × ciclo), ele prende cerca de **R$ 2.750,00** de capital de giro: é uma estimativa geral, que trata os 15 dias com um só custo diário.

Somando as alavancas da tabela, cada uma com sua própria base (receber sobre a receita; estoque e pagar sobre o custo dos produtos), o valor é **R$ 3.333,33** (10 × R$ 266,67 + 20 × R$ 133,33 − 15 × R$ 133,33). As duas contas têm bases diferentes e não podem aparecer como se fossem o mesmo número. A tela usa uma só em cada lugar e diz qual é a base.

**Limites.** É simulação rotulada, nunca fato do ERP. O preço supõe volume constante, e isso é dito na tela. **Caixa calculado não é extrato bancário** e não inclui saldo inicial ausente. O agente nunca sugere atrasar pagamento além do combinado com o fornecedor, apenas negociar prazo. Fixos e retirada apenas previstos ficam fora do caixa registrado.

---

## 5. Como o Conselho trabalha junto

### 5.1 Fluxo de cada atualização da aba Gestão

1. **Conferência:** portões 0 a 3 (seção 3).
2. **Cálculo canônico:** `statement`, `productMargins`, `contributionAbc`, `stockCoverage`, `periodChange`, `cashCycle`, `rebuyFacts` e `compareOffers`.
3. **Leitura das lentes:** as regras dos cinco agentes especialistas rodam dentro de `buildGuidance`, cada uma com `lens` e `decision` (contrato da seção 7).
4. **Liberação:** `releaseInsights` escolhe até 3 conselhos, um por família, com integridade sempre em primeiro lugar.
5. **Resumo do Resultado:** o Conselheiro de Resultado redige o topo da aba sobre os itens liberados.
6. **Ação:** só por comandos existentes e após confirmação do produtor.
7. **Fechamento:** feedback (útil, dispensar ou adiar) e Check do PDCA no período seguinte.

### 5.2 Precedência quando os agentes divergem

1. Integridade e consentimento.
2. Segurança (geada, trovoada, calor extremo).
3. **Caixa:** se o caixa registrado do mês ficar negativo nos cenários, o Gestor de Caixa prevalece sobre propostas de comprar ou produzir mais.
4. Meta e rotina.
5. Ganho e estoque.
6. Clientes.
7. Compras.
8. Dinheiro novo.

Quando dois agentes apontam caminhos opostos (por exemplo, "produza mais doce de leite" e "reduza os dias de estoque"), o app **mostra a divergência e o custo de cada lado** e a decisão fica com o produtor. Nenhum agente apaga o conselho de outro.

### 5.3 Destino de cada conselho na tela

| Família | Destino | Observação |
|---|---|---|
| `resultado`, `rotina`, `caixa`, `compra`, integridade | Gestão | Resumo do Resultado no topo |
| `ganho` (produto e estoque) | Vender | Mantém `guidanceDestination` |
| `cliente` | Clientes | Mantém `guidanceDestination` |

Sem pop-ups repetidos, sem notificação nova e sem envio autônomo, como define a hierarquia de inteligência.

---

## 6. Memória do app

### 6.1 Onde fica

| Item | Local | Regra |
|---|---|---|
| Diretriz versionada | `src/data/management-council-guidelines.js` (`MANAGEMENT_COUNCIL`) | Congelada (`Object.freeze`), `authority: 'reference_only'`, cópia para `model.data.managementCouncil.knowledge` por `ensureAgent` quando a versão mudar |
| Texto offline | `public/knowledge/conselho-gestao.md` | Consultável sem internet; SHA-256 registrado na hierarquia |
| Estado por produtor | `model.data.managementCouncil` = `{ version, actorId, dataOrigin, constraint, weeklyDecision, pdca[], feedback{} }` | Separado por `actorId` e `dataOrigin`; incluído no backup criptografado |
| Ledger de conselhos | `release.js` (já existente) | Sem duplicar ledger |

### 6.2 Aprendizado

O feedback do produtor (útil, dispensar ou adiar) só altera a **ordem e a cadência** dos conselhos. Nunca altera números, limites financeiros ou critérios da Auditoria. Base zerada não recupera exemplos nem aprendizado anterior. Demonstração e simulação ficam fora do aprendizado.

### 6.3 O Gerente responde no formato do Conselho

Quando o produtor pergunta ("Como está meu caixa?", "Qual produto vale mais a pena?", "Quem parou de comprar?"), a pergunta é encaminhada à lente certa e a resposta segue sempre quatro partes:

1. **Fato:** número canônico, período, origem e local.
2. **Leitura:** o que o número significa pelo método da lente.
3. **Ação:** uma ação concreta, com atalho para o comando existente.
4. **Conferência:** estado da Auditoria, por exemplo "Números conferidos às 14h20" ou "Há 2 vendas sem forma de pagamento; corrija antes de confiar neste resultado".

Pergunta ambígua recebe **uma pergunta de esclarecimento específica**, nunca uma resposta genérica, mantendo a regra obrigatória de 01/11/2026. A IA online (Gemini) só ajuda a entender a pergunta; os números vêm dos motores canônicos.

---

## 7. Contrato de saída de cada conselho

Cada conselho estende o contrato atual de `stampDecisions`, sem remover nenhum campo:

```json
{
  "advice_id": "caixa:ciclo:2026-10",
  "rule_id": "caixa:ciclo",
  "rule_version": 1,
  "lens": "caixa",
  "lens_method": "Ciclo de caixa e Power of One (Miltz; Harnish, Scaling Up)",
  "module": "finance",
  "confidence": "media",
  "audit_status": "ok",
  "control_item": "Ciclo de caixa em dias",
  "check_items": ["Dias de estoque", "Dias para receber", "Dias para pagar"],
  "facts": [{"label": "Ciclo", "value": 15, "unit": "dias", "source": "producer-calcs.cashCycle"}],
  "reading": "O dinheiro fica preso 15 dias entre comprar e receber.",
  "action": "Combine Pix na entrega com os 3 clientes de fiado mais antigos.",
  "owner": "produtor",
  "due": "2026-11-15",
  "data_gaps": [],
  "data_context": {"actorId": "…", "dataOrigin": "real", "period": "2026-10"},
  "generated_at": "2026-11-05T17:40:00-03:00",
  "valid_until": "2026-11-12",
  "requires_user_action": true
}
```

Regras do contrato:

- Valores monetários sempre em centavos inteiros.
- `confidence` segue `decision-guidelines.js`: com `nula`, não há conselho, só o aviso da lacuna.
- `audit_status` diferente de `ok` impede conclusões dos agentes de caixa, ganho e rotina financeira.
- Número de registro aparece igual ao da tela: o texto nunca arredonda para outro valor. "Cerca de" só vale para estimativa e previsão, identificadas como tal. Coerência total entre texto e tela, decisão do produtor em 05/11/2026.

---

## 8. Proibições e cuidados

1. Nenhum agente cria motor paralelo, fórmula financeira fora do `registry.json` ou segundo ledger.
2. Nenhum agente efetiva venda, baixa, compra, envio, mudança de preço ou mensagem. Ele só prepara a proposta e o produtor confirma.
3. Nomes reais aparecem só como crédito do método, sem imitar a voz da pessoa, sem citações inventadas e sem sugerir endosso.
4. Não se projeta CLV (decisão D3-2), não se afirma lucro sem custos completos e não se prevê preço futuro como certeza.
5. Não se usa dado de um produtor para aconselhar outro sem anonimização e agregação (LGPD).
6. Não se recomenda atrasar pagamento combinado, jornada exaustiva ou corte de qualidade do produto.
7. Não se prescreve defensivo, dose ou mistura (receituário agronômico, Lei 14.785/2023).
8. Edição do app (teste ou Play Store) nunca muda regra, limite ou resultado.

---

## 9. Instruções para o Codex

### 9.1 Ordem de implementação (ramo próprio a partir de `codex/compilacao-148-claude`)

1. Ler esta diretriz, `registry.json`, `RELATORIO_DUPLICIDADE.md`, `decision-guidelines.js`, `intelligence-hierarchy.js` e `agent-guidelines.js`.
2. Rodar a auditoria de duplicidade sobre os cinco itens N da seção 2. Classificar como D1, D2, D3, D4 ou N e registrar em `docs/motor/RELATORIO_DUPLICIDADE.md`.
3. Instalar `src/data/management-council-guidelines.js` (entregue com esta diretriz) e `public/knowledge/conselho-gestao.md`.
4. Acrescentar o campo `lens` às regras existentes transformadas (classe T), **sem alterar cálculos nem textos validados**.
5. Criar as regras N dentro da lista `RULES` e registrar as novas funções no `registry.json`.
6. Estender `family()` e `guidanceDestination()` em `release.js` com as novas famílias.
7. Criar o Resumo do Resultado na aba Gestão, logo abaixo de Receita por dia e acima do card de pergunta, sem novo campo de pergunta.
8. Adaptar o Gerente ao formato Fato · Leitura · Ação · Conferência.
9. Rodar os testes da seção 9.3 e registrar a entrega em `app/docs/ENTREGA-CONSELHO-GESTAO-149.md`.

### 9.2 Registro (`docs/motor/registry.json`) — entradas novas previstas

| Chave | Arquivo / função | Nota |
|---|---|---|
| `conselho_gestao` | `data/management-council-guidelines.js` `MANAGEMENT_COUNCIL` | Diretriz, sem cálculo |
| `ganho_por_restricao` | `advisor/engine.js` `throughputPerConstraint` | Reaproveita `productMargins` |
| `concentracao_clientes` | `advisor/engine.js` `clientConcentration` | Só clientes identificados |
| `matriz_compras` | `suppliers/model.js` `purchaseMatrix` | Pareto de gasto + risco observado |
| `poder_do_um` | `finance/producer-calcs.js` `powerOfOne` | Cenários sobre `statement`; não recalcula resultado |
| `indice_gestao_basica` | `finance/audit.js` `basicsScore` | Contagens da Auditoria |

### 9.3 Testes de aceitação obrigatórios

| Teste | Critério |
|---|---|
| T-CON-01 Paridade de edição | Mesma saída (ids, números, confiança) em `original`, `codexteste`, `codextesteia` e lançamento |
| T-CON-02 Sem leitura de edição | Nenhuma referência a `BuildConfig`, `edition` ou sufixo de pacote em `advisor/`, `finance/`, `kpi/` e `agent/` |
| T-CON-03 Demo × real | Mesma matemática; selo de demonstração; zero escrita no aprendizado real |
| T-CON-04 Auditoria bloqueia | Com erro em `pagamentos` ou `estoque`, nenhum conselho de caixa, ganho ou rotina financeira é liberado |
| T-CON-05 Contexto não confirmado | Só o aviso de integridade aparece |
| T-CON-06 Limite de três | Liberação continua com no máximo 3 itens, um por família |
| T-GAN-01 Restrição | Exemplo do leite: R$ 940,00 × R$ 1.004,00 (diferença R$ 64,00) |
| T-CAI-01 Poder do um | Exemplo do mês: +8000, +4000, +4000, +1500 centavos; 26667, 13333 e 13333 centavos de caixa |
| T-CAI-02 Ciclo | Ciclo de 15 dias e 275000 centavos com custo mensal de 550000 |
| T-ROT-01 Problema | Meta 900000 − realizado 760000 = problema de 140000 centavos |
| T-COM-01 Matriz | Pote estratégico, rótulo gargalo, açúcar alavancagem, sacola não crítico |
| T-CLI-01 Sem CLV | Nenhuma saída com valor futuro projetado de cliente |
| T-RES-01 Básico primeiro | Completude abaixo de 80% faz o resumo tratar só de registros |

Não declarar que o Conselho "entende tudo". Registrar o que foi testado, o que foi simulado e o que depende de aparelho Android físico.

---

## 10. Fontes consultadas

- Lásaro do Carmo Jr., *O que importa é seu resultado*, Editora Gente, 2020 — Apple Books, Google Books, Kobo.
- Perfil de Lásaro do Carmo Jr. — Quero Bolsa (Revista), Reportei, InvestNews, Palestras de Sucesso, GCI Magazine.
- CAMPOS, V. F. *Gerenciamento da rotina do trabalho do dia-a-dia*, 8. ed., Editora de Desenvolvimento Gerencial, 2004, conforme monografia do ICAP.
- Throughput accounting e Teoria das Restrições — Wikipedia (verbete *Throughput accounting*).
- KRALJIC, P. *Purchasing Must Become Supply Management*, Harvard Business Review, 1983 — Art of Procurement.
- Peter Fader, customer centricity e RFM — Omniconvert; Wharton Magazine.
- Power of One e as sete alavancas — Monkhouse & Company; Alan Miltz no Scaling Up.
- Base auditada no repositório `alexduvier-svg/territ-rio-gest-o-`, ramo `codex/compilacao-148-claude`.
