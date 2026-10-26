# AGRO Gestão Claude 0.12.88 — análise da 0.12.87 e mudanças aplicadas

**Data:** 26 de outubro de 2026. **Base:** AGRO Gestão 2 0.12.87, o APK do Codex com código 127 (commit `a4dab1f` do ramo `codex/atualizacao-agro-gestao2`), conferido contra o APK que você trouxe: mesmo pacote, mesma versão e mesmos arquivos. **Novo app:** AGRO Gestão Claude, pacote `br.com.territorio.gestaoclaude`, versão 0.12.88 (código 128), ramo `claude/agro-gestao-claude`.

O AGRO Gestão Claude é um **app separado**. Ele tem pacote próprio e começa vazio: não lê nem altera os dados do AGRO Gestão nem do AGRO Gestão 2. O APK foi gerado no PC e **não foi instalado** em nenhum celular.

## 1. Resumo

A 0.12.87 é sólida. Os números são conservadores, nada é inventado e há conferência própria. A validade por lote e a comparação de fornecedores são cuidadosas. Os problemas encontrados são de três tipos:

1. **Finanças com regras diferentes para a mesma coisa.** Custo 0 informado era tratado como "sem custo" em três lugares, a taxa padrão do cartão entrava sem aviso e o caixa misturava valores previstos com valores pagos.
2. **Repetições.** Seis relatórios abriam a mesma tela por dois caminhos. Pagamentos repetia o Caixa, e "Onde vendeu" repetia "Lucro por local". Uma compra de fornecedor precisava ser digitada até três vezes.
3. **Aparência desigual nas janelas de segundo nível.** A janela de datas era diferente das outras. Havia ação principal azul e textos de apoio em seis tamanhos. Oito textos eram cortados em 320 px, e esses cortes já existiam na 0.12.87.

Tudo isso foi corrigido no AGRO Gestão Claude, exceto os itens da seção 5.

## 2. Finanças: estão coerentes?

**O que está bom.** O método é o certo para uma banca: vendas, menos custo do produto e taxas, dá a margem de contribuição; menos os custos, dá o resultado. O demonstrativo fecha centavo por centavo. O caixa é separado do resultado, o Fiado só entra no caixa quando é pago e as devoluções contam na data em que aconteceram.

**O que estava incoerente.** Cada item foi conferido com cenários fictícios direto nas fórmulas.

| # | Problema na 0.12.87 | Exemplo | No Claude |
| --- | --- | --- | --- |
| 1 | Custo 0 informado contava como "sem custo" no aviso do Estoque, na Conferência dos Números e na Orientação. Já o Resumo do Dia tratava certo. | Ovos com custo 0 confirmado geravam o aviso "lucro aparece maior" | Uma regra só (`costKnown`) em todos os lugares |
| 2 | A taxa do cartão entrava com o padrão 4,98% sem você ter informado | Uma venda de R$ 100 no crédito mostrava R$ 4,98 de taxa como se fosse sua | A linha mostra "taxa padrão · confirme" e os ajustes mostram "(padrão)" |
| 3 | Taxa digitada errado ou vazia | "1.5" virava 15%, e campo vazio virava 0% | "1.5" vira 1,5%; vazio volta ao padrão, marcado como estimativa |
| 4 | Retirada no ano: uma retirada lançada apagava toda a planejada | R$ 500 lançados em fevereiro substituíam R$ 15.000 planejados no ano, e o resultado aparecia R$ 14.500 melhor | A troca é feita mês a mês: os meses sem lançamento continuam com a planejada |
| 5 | "Sobra no caixa" descontava custos fixos rateados e retirada planejada como se tivessem sido pagos | Nos primeiros 10 dias de outubro saíam R$ 548 de "caixa" sem nenhum pagamento lançado | Duas linhas separadas: "Custos e retirada lançados" e "Fixos e retirada previstos", com explicação |
| 6 | Duas "margens" com o mesmo nome | A do topo desconta taxas; a da lista por produto não | A lista passou a se chamar "Margem bruta por produto", com explicação |
| 7 | Fiado a receber aparecia no meio das linhas de saída do caixa | Parecia dinheiro em caixa | Virou nota abaixo do total, junto com o Fiado recebido de vendas antigas |
| 8 | "Lucro por local" não explicava por que a soma dos locais é diferente do resultado | — | Nota: fixos, perdas e retirada ficam só no resultado geral |
| 9 | O mesmo demonstrativo era recalculado várias vezes a cada abertura | 12 vezes ao abrir a Gestão e 17 ao abrir Finanças | 4 e 4, guardando o cálculo só durante a montagem da tela |

**É útil para o produtor?** Sim. O topo mostra resultado, margem e quanto vender para empatar, o demonstrativo explica de onde vem o número e o caixa mostra o dinheiro real. Com as correções, nenhum número aparece como se fosse seu quando é só um padrão ou uma previsão.

## 3. Repetições: tarefas, abas e subabas

| Repetição na 0.12.87 | No Claude |
| --- | --- |
| "Resultados e Relatórios" listava 7 capítulos. Seis deles já estavam nos dois cartões da Gestão, e os números do topo repetiam os de Finanças. | Virou "Arquivos e Planilhas", que abre direto as exportações, os critérios e a conferência. Cada capítulo mantém o "Como Ler" e abre por um caminho só. |
| "Pagamentos" mostrava o recebido por forma de pagamento, igual ao Caixa de Finanças | Saiu da lista. A nota do Fiado recebido foi para o Caixa. |
| "Onde vendeu" mostrava as vendas por local, igual ao "Lucro por local" | Saiu da lista. "Lucro por local" agora aparece sempre que há venda. |
| "Margem por produto" em Finanças e "Produtos e Margens" mostravam quase a mesma lista | Finanças mantém as 8 principais e ganhou o botão "Ver todos os produtos e margens" |
| Compra registrada em Fornecedores não ia para o Estoque nem para Custos. Era preciso digitar de novo. | O histórico da compra ganhou "Dar Entrada no Estoque" e "Lançar em Custos", que já abre preenchido. Nada é gravado sem o seu toque. |

Pagamentos e "Onde vendeu" continuam abrindo por pedido de voz e pela Orientação, porque a chave continua existindo. A premissa canônica `managementReports` foi atualizada para registrar a regra "aberto uma só vez".

## 4. Fornecedores, validade e calculadora

**Fornecedores.** Está bom: a comparação de propostas é rigorosa, com validade, prazo, pedido mínimo e frete, sem dar como certo o que não foi confirmado. O histórico compara o preço com o mesmo fornecedor e com outros.

- **A melhorar:** a cotação pede cerca de 20 campos e quase nunca chega a "completa". Fica a sugestão de uma "comparação rápida" com preço, frete e quantidade.
- **Já feito:** o prazo de pagamento não pesava na comparação. A calculadora ganhou a conta "à vista ou a prazo".

**Validade.** Está bom: a validade é por lote, a venda usa primeiro o que vence antes, há aviso 5 dias antes e no dia, e o app não inventa data.

- **Corrigido:** o aviso "Completar a Validade" mostrava uma lista corrida de mais de 40 produtos, com os três cafés iguais e "10 Pacote". Agora mostra 5 produtos e "e mais 36", com a sigla da torra e a unidade no plural.
- **Recomendado, não feito:** lote vencido virar "Perda" com um toque, para entrar em "Perdas de estoque". Hoje é preciso registrar a perda à parte.
- **Recomendado, não feito:** aviso com antecedência por produto, porque 5 dias serve para café, mas não para alface.

**Calculadora.** A 0.12.87 tinha só Básica e Científica. O AGRO Gestão Claude ganhou o modo **Contas**, como no último desenho que o Codex registrou: um botão **$** ao lado do científico transforma a mesma janela, e tocar de novo volta para a conta que estava na tela. Há quatro assuntos prontos:

- Preço pelo markup.
- Vendas: ponto de equilíbrio e indicadores do mês.
- Descontos e Taxas.
- Fornecedores: à vista ou a prazo.

Os cuidados apontados pelo Codex foram aplicados:

- A taxa padrão não ganha a marca "seus dados".
- Custo 0 não gera preço pelo markup.
- O mês atual é comparado com o mês passado até o mesmo dia.
- "Perdida ou estragada" é separado do que voltou e ainda pode ser vendido.
- O empate exato diz que a sobra começa na unidade seguinte.
- Número digitado errado, como "1.23.4", é recusado.
- O desconto avisa que a conta não prevê a procura.

**Defeito encontrado:** no AGRO Gestão 3, digitar num campo das Contas com teclado físico disparava as teclas da calculadora. Aqui foi corrigido; no AGRO Gestão 3 (0.12.64) continua.

## 5. Responsividade, aparência e leveza

**Aparência.** Uma varredura automática abriu 200 telas e janelas e mediu títulos, avisos e botões.

| Medida | 0.12.87 | Claude 0.12.88 |
| --- | --- | --- |
| Tamanhos de título de janela | 3 (22, 25 e 26 px) | 1 (25 px) |
| Tamanhos de texto de apoio (notas, avisos, instruções) | 6 (de 12 a 17 px; mais o 11 px da calculadora) | 3 (14 px nota, 15 px vazio, 17 px abertura) |
| Títulos de seção nas janelas | de 13 a 20 px | 17 px, Inter Tight (o rótulo em caixa alta da Orientação fica) |
| Ação principal nas janelas | azul em 34 botões | verde-oliva, como no resto do app (DESIGN.md: "nunca o azul do iOS") |
| Janela de datas | fundo, título e "Voltar" diferentes, com setas azuis | mesmo padrão das outras janelas |
| Textos cortados (`overflow-audit`) em 320 / 360 / 393 / 412 px | 8 / 4 / — / 3 | 0 / 0 / 0 / 0, nos dois temas e com texto ampliado |

Com o texto ampliado ligado, cada tela mantém as próprias medidas maiores.

**Leveza.** Medida com o processador seis vezes mais lento, tela de 360 × 780 e dados de exemplo:

| Medida | 0.12.87 | Claude 0.12.88 |
| --- | --- | --- |
| Abrir o app até a tela pronta | 0,80 s | 0,79 s |
| Trocar para a aba Gestão | 0,60 s | 0,56 s |
| Abrir Finanças | 0,23 s | 0,22 s |
| Recálculos do demonstrativo ao abrir a Gestão / Finanças | 12 / 17 | 4 / 4 |
| Memória usada | 5,0 MB | 4,9 MB |

Os dados de exemplo não têm vendas, então o ganho de tempo fica pequeno. Cada recálculo percorre todas as vendas, por isso a diferença cresce conforme as vendas são registradas. Isso **não foi medido com dados reais nem num celular básico físico**.

- **Recomendado, não feito:** na abertura, o app carrega cerca de 1,6 MB de código (990 KB + 634 KB). PDF, catálogo, voz e fornecedores poderiam carregar só quando forem usados. É a mudança que mais ajudaria celular fraco, mas mexe na ordem de partida do app e pede teste no aparelho.

## 6. O que foi alterado (arquivos)

- **Identidade:** `android/app/build.gradle`, `strings.xml` e `capacitor.config.json`, com o nome AGRO Gestão Claude e o pacote `br.com.territorio.gestaoclaude`, na versão 0.12.88.
- **Finanças:**
  - `src/features/finance/finance.js` ganhou `costKnown`, `feesConfirmed`, `feesDefault`, a retirada mês a mês, `cashForecast` e `drawLogged`.
  - `audit.js` passou a usar `costKnown`.
- **Contas:** `src/features/finance/producer-calcs.js`, com `cashOrTerm`, `parseBR` mais rigoroso e empate exato, e `src/features/producer-calcs.css`.
- **Tela:** `src/legacy/erp-ui.js` recebeu:
  - Finanças e ajustes de taxas.
  - Gestão sem repetições.
  - Cálculo guardado durante a montagem da tela.
  - Modo Contas.
  - Ponte Fornecedores → Custos.
  - Rodapés "‹ Voltar".
- **Fornecedores:** `src/features/suppliers/index.js`, com "Levar Para o Negócio".
- **Validade:** `src/features/advisor/validity-rules.js`, com a lista curta, o plural e a sigla da torra.
- **Nomes:** `src/features/proper-name.js`, com os conectivos pelo, pela, ou e se.
- **Aparência:** `src/features/visual-cohesion.css`, que é novo e carregado por último.
- **Premissa:** `src/data/interface-guidelines.js`, item `managementReports`.
- **Testes:** `tests/finance.test.mjs`, com 2 testes novos, e `tests/producer-calcs.test.mjs`, com 9 testes. Ao todo, 755 testes passam.

## 7. Limitações

- O app não foi testado em celular. O APK foi gerado com a chave de depuração deste PC e ainda não foi instalado.
- Os testes visuais foram feitos no Chrome em tamanho de celular, nos dois temas, em 320, 360, 393 e 412 px e com texto ampliado. Faltam o teclado real do Android e o TalkBack.
- Nas Contas, ainda estão "em breve": Estoque e Caixa, Produção Rural e Crédito e Investimento.
- As mudanças estão só no AGRO Gestão Claude. O AGRO Gestão 2 (Codex) e o AGRO Gestão 3 não recebem nada automaticamente; a diretriz das Contas continua valendo para o Codex.

## 8. Versão 0.12.89: as cinco recomendações concluídas

Instalada em 26/10/2026 no Reno14 e no Find X8 Ultra por cima da 0.12.88, com os dados preservados.

| Recomendação | O que foi feito |
| --- | --- |
| Lote vencido virar perda | Na tela "Lotes e Validade", cada lote vencido tem o botão "Registrar Como Perda". Ele mostra quantidade e valor ao custo, pede confirmação e baixa **só aquele lote**. O valor entra em "Perdas de Estoque" de Finanças e o registro fica no histórico. |
| Antecedência do aviso por produto | Na mesma tela, o campo "Aviso Antes do Vencimento" aceita de 1 a 90 dias, com padrão de 5. Ele muda o "vence em breve", a Orientação e o dia do lembrete no celular. |
| Comparação rápida de fornecedores | Em Contas › Fornecedores e no botão "Comparação Rápida" da aba Comparar: até 3 fornecedores com preço, unidades e frete, mostrando o custo por unidade e quanto o mais barato economiza. |
| Os três assuntos "em breve" das Contas | **Estoque e Caixa:** quando pedir e quanto comprar, e o ciclo de caixa com o dinheiro preso no giro. **Produção Rural:** custo da safra por unidade e conversão de saca, arroba, tonelada, hectare e alqueire mineiro e paulista. **Crédito e Investimento:** parcela pela tabela Price e em quantos meses o investimento volta. |
| Leveza para celular fraco | Veja a correção abaixo. |

**Correção do que eu tinha recomendado:**

- PDF e catálogo de produtos **já carregavam só quando usados** na 0.12.87, e o módulo de voz nem entra no pacote. Por isso não havia o que adiar ali.
- Medi a abertura com perfil de processador. O maior desperdício estava nas funções de data da validade, que recriavam o formatador de datas do sistema a cada lote e a cada tela: eram 0,21 s na abertura. O mesmo acontecia no Fiado, em Fornecedores, no Calendário do Município e no Tempo.
- Os formatadores agora são criados uma vez. O fuso do aparelho é conferido a cada minuto, e o resultado das datas é o mesmo de antes.

| Celular fraco simulado (CPU 6×, 360 × 780, dados de exemplo) | 0.12.87 | Claude 0.12.89 |
| --- | --- | --- |
| Abrir o app até a tela pronta | 0,68 s | 0,54 s (−20%) |
| Trocar para a aba Gestão | 0,49 s | 0,40 s (−18%) |
| Abrir Finanças | 0,19 s | 0,19 s |
| Recálculos do demonstrativo (Gestão / Finanças) | 12 / 17 | 4 / 4 |

**Verificação:**

- 763 testes passam. Há testes novos para as contas, para a perda do lote certo e para a antecedência com o dia do lembrete.
- A auditoria de texto cortado dá zero em 320, 360, 393 e 412 px, nos dois temas e com texto ampliado.
- O app abriu sem erro nos dois celulares.

**O que não foi medido:** a velocidade num celular básico físico e o uso real com muitas vendas registradas.
