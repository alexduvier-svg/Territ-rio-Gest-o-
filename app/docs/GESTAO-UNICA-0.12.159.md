# Gestão única (0.12.159)

Referência de organização: APK de teste do Codex 0.12.144 e diretriz de 05/11/2026. Implementação própria desta versão: nenhum arquivo do Codex foi copiado.

## O que mudou

- A entrada da Gestão só navega: período, local, olho e três cards (Operação, Análise, Decisão) com 13 funções.
- Cada função abre na janela do sistema, com o período numa linha e setas. O motor de movimento é o mesmo das outras janelas.
- `features/management-hub/domain.js` só apresenta projeções, sem gravar. O demonstrativo continua em `features/finance/finance.js`.

## Correções em relação ao APK de referência

| Problema na referência | Nesta versão |
|---|---|
| Olho fechado deixava valores em Custos, Estoque e Orientações | Todos passam pela mesma ocultação; o sinal negativo também some |
| Barras e estorno vermelho revelavam valores ocultos | Sem barras e sem vermelho enquanto oculto |
| Mês aberto contra mês inteiro | Os dois lados usam o mesmo número de dias |
| Evento cortado pelo mês, sem aviso | Mostra o evento inteiro; compara com o evento anterior, não com um mês |
| Onde Vendeu, lucro por local, Conferência e planilhas por feira sem acesso | Dentro de Resultado e Arquivos |
| Cabeçalho ocupava a tela | Uma linha com setas dentro da função |

## Defeitos desta versão, corrigidos na fonte

- Ticket médio dividia a receita após devoluções pelas compras. Agora usa só compras concluídas e não devolvidas.
- A retirada lançada entrava no resultado de um local. Agora fica só em Todos os locais.
- A retirada prevista valia em meses anteriores ao início dos registros. Agora usa `drawSince`, ou o primeiro mês com registros.
- A resposta financeira do motor não usava o mesmo demonstrativo das telas. Agora usa.
- Perguntas sobre fiado, caixa, resultado, margem, ticket, equilíbrio e custos caíam em respostas erradas. Agora seguem `financeIntent`, com base zerada, fictícia ou real.

## Comparação com ferramentas de mercado

Fontes lidas em 05/11/2026, quase todas de fornecedores: Senior, Omie, Conta Azul, Bling, Aegro, NetSuite e Bom Saldo.

| Informação | Situação |
|---|---|
| DRE gerencial, regime de caixa, custos, metas, indicadores, painéis e perguntas em linguagem natural | Já existiam; reorganizados |
| Contas a receber e vencidos | Acrescentado em Caixa, a partir do Fiado |
| Previsão de caixa | Acrescentada para 30 dias; é variação, não saldo |
| Contas a pagar com vencimento | Acrescentado na 0.12.160: situação na compra (a pagar ou paga), A Pagar Agora em Caixa e Fornecedores, previsão de 30 dias e perguntas ao motor |
| Saldo inicial e conciliação bancária | Não há dado nem integração com banco |
| Lucro por safra ou talhão, centro de custo | Decisão do produtor; não há esse registro |
| Boleto, nota fiscal, LCDPR | Fora do escopo atual do app |

## Contas a pagar (0.12.160)

- A situação é opcional. Compra antiga ou sem situação não vira dívida e não mexe no Caixa; a tela diz quantas ficaram de fora.
- Compra paga sai do Caixa na data do pagamento, só em Todos os locais, porque compra não tem local. Não entra no Resultado: o custo entra quando o produto é vendido.
- Compra levada a Custos fica ligada ao custo (`purchaseId`) e não sai duas vezes do Caixa. Vale para o que for lançado a partir da 0.12.160; custo lançado antes não tem ligação.
- Registrar pagamento não mexe em estoque nem em custos.
- Não há aviso de vencimento no celular.

## Limites

- As funções foram conferidas no navegador. No celular, conferir toque e movimento.
- Desempenho em aparelho básico não foi medido.
- "O que mais vendeu" e outras perguntas por produto seguem o mês atual ou o período citado na pergunta, e dizem isso na resposta.

## Janelas no modelo de Resultado (0.12.161)

- Pedido do produtor em 05/11/2026, com print e vídeo. Regra permanente em `DESIGN.md` e `windowQuality`.
- Vendas sem seletor: cards que expandem (Vendas em Ordem de Horário, Receita por Dia, Compras por Horário, Devoluções). O dia mais recente já abre.
- Indicadores sem seletor: todos à vista, um toque abre a explicação.
- Estoque: saldo por seções, com linhas dentro de cards.
- Olho no cabeçalho de cada janela; saiu da entrada da Gestão, que não tem valores. Saiu a caixa Mostrar Valores e a faixa verde de situação.
- Olho fecha com a janela ou após 1 minuto sem uso; substitui os 30 segundos de 03/11/2026.
- Janelas sem rodapé e a maioria das com rodapé ganharam Voltar. Mantêm controle próprio: carrinho, finalização da venda, história, boas-vindas, movimento, reposição, feira concluída, calculadora e voz.

## Venda como relatório e aberturas (0.12.162)

- Venda Concluída em cards, com olho e Voltar. Saiu "Conheça Nossa História"; o card Portfólio e História diz o que foi registrado: leitura do QR code e PDF compartilhado a partir da venda. O app só sabe do envio quando ele parte da venda; o que foi enviado por fora não aparece.
- "Devolver venda" virou Registrar Devolução: explica o efeito e pede confirmação. A venda continua no histórico.
- Vendas: Receita por Dia em primeiro. "Zerado" virou "Esgotado".
- Peixes sempre em grade: 2 fileiras de 3 e o resto pela setinha.
- O conteúdo das janelas da Gestão é preparado em tempo ocioso; Orientações fica de fora porque entregar orientação tem memória.

Medição no Chrome em 05/11/2026, com CPU 4x e 6x mais lenta (maior quadro, em ms; a meta é 34):

| Caso | 4x, 1ª | 4x, 2ª | 6x, 1ª | 6x, 2ª |
|---|---|---|---|---|
| Janelas (exceto Orientações) | 33 a 83 | 17 a 50 | 50 a 117 | 50 a 67 |
| Orientações | 134 | 83 | 217 | 150 |
| Aba Vender | 183 | 83 | 233 | 150 |
| Aba Estoque | 100 | 67 | 233 | 133 |
| Seção Peixes, abrir | 33 | 33 | 67 | 83 |
| Seção Peixes, fechar | 67 | 50 | 117 | 117 |

A meta ainda não é cumprida em tudo. Sem medição nos celulares nesta versão.

## Aberturas mais leves (0.12.163)

- Entre abas, o app não copia mais a página antiga: a cópia era descartada no mesmo quadro e media a tela inteira.
- Orientações abre no toque; a orientação entra quando a janela parou.
- Seções de Vender fora da tela só são calculadas quando chegam perto, com altura estimada para a rolagem não saltar. Não vale para a primeira seção, para a aberta nem durante o arraste.
- Abas aquecidas em tempo ocioso depois de abrir o app, sem tocar na tela nem nos dados.
- Respostas repetidas de dia e nome próprio ficam guardadas.

Maior quadro no Chrome, CPU 4x, em ms (meta 34; a medição varia entre execuções):

| Caso | 0.12.162, 1ª | 0.12.163, 1ª | 0.12.162, 2ª | 0.12.163, 2ª |
|---|---|---|---|---|
| Aba Vender | 183 | 100 | 83 | 83 |
| Aba Estoque | 100 | 83 | 67 | 67 |
| Aba Gestão | 84 | 67 | 33 | 17 |
| Janelas, exceto Orientações | 33 a 83 | 17 a 67 | 17 a 50 | 17 a 33 |
| Orientações | 134 | 33 | 83 | 34 |

A meta ainda não é cumprida na primeira abertura das abas e de algumas janelas, nem na segunda de Vender e Estoque. Sem medição nos celulares.

## Orientações para decidir (0.12.164)

- Orientações tem Visão Geral, 4 itens de Operação e 6 de Análise, cada um com O que Significa e O que Decidir, em card que expande.
- `features/management-hub/decision-engine.js`: seis agentes locais, sem internet nem IA online. Apuração, Ação e Auditoria nos dados; Redação, Revisão e Liberação no texto.
- Liberação: tirando os fatos conferidos, não pode sobrar número no texto. Se sobrar, a leitura do item é retida. Se uma conta não fechar, a leitura inteira é retida e diz o motivo.
- Coerência conferida no navegador: todo valor em R$ e % do texto apareceu na janela de origem, em base zerada, cenário da diretriz (outubro e novembro) e dados de exemplo, em 393 e 320 px. A conferência achou valores que só existiam no texto; Vendas e Custos passaram a mostrá-los.
- Limite honesto: a certeza vale para o que os registros mostram. Causa e resultado futuro não são afirmados; decisão é sugestão. Dado que nunca foi registrado o app não tem como conhecer.
- Em 320 px, Vendas chega a 11 linhas com muitos dados. Em 393 px, todos os itens ficaram em até 9.

## Conselho de Gestão (0.12.165)

- Diretriz em `src/data/management-council-guidelines.js` e `public/knowledge/conselho-gestao.md`, com exemplos corrigidos: leite R$ 940,00 × R$ 1.004,00 (diferença R$ 64,00); ciclo R$ 2.750,00 pela fórmula do app e R$ 3.333,33 pela soma das alavancas, com a base dita; compras com leite nos outros 35%; número de registro igual ao da tela. O PDF da diretriz continua com os valores antigos.
- Os seis especialistas interpretam, sem motor novo de cálculo: Resultado (Visão Geral), Rotina (Vendas, Resultado, Indicadores, Comparação), Caixa (Caixa, Custos), Ganho (Produtos, Estoque), Clientes e Compras (Fornecedores). Os seis agentes de Orientações conferem e liberam o texto.
- Cálculos novos: `basicsScore`, `powerOfOne`, `purchaseMatrix`, `clientConcentration`, `rfmSegments`, `throughputPerConstraint`. Regras novas na lista do motor único: `caixa:fiado`, `ganho:dinheiro-parado`, `cliente:concentracao`, `compra:fornecedor-unico`. Regras antigas só ganharam a etiqueta da lente.
- Conferência primeiro: origem não confirmada ou erro na Auditoria bloqueia Orientações e respostas com valores.
- Janelas novas: Alavancas em Caixa, Peso e Risco das Compras em Fornecedores, Quem Sustenta o Negócio em Clientes, Dinheiro Parado em Estoque.

Ainda não entregue: as regras antigas de Orientações em `decision-engine.js` não migraram para a lista RULES; campo do recurso que limita (só o cálculo existe); PDCA e fechamento mensal; decisão da semana salva; padrão da banca; cotação parada; risco por entrega atrasada, porque o app não registra recebimento; cópia da diretriz para a memória do produtor.

## Ranking (0.12.166)

Primeira entrada da Gestão, antes de Operação. Janela no padrão das demais: período e local do topo, olho próprio, Voltar e cards expansíveis.

- Produtos: os 10 mais vendidos por apresentação. Quantidade só ordena quando a unidade é a mesma; com unidades diferentes, ordena pelo valor. Valores após devoluções.
- Horários, Dias da Semana, Valores das Compras, Formas de Pagamento e Clientes: só compras concluídas. Cliente só identificado, pelo identificador.
- Padrões: últimos 90 dias, com eventos e fora de eventos separados. Exige 5 vendas em 3 dias; horário entra acima de metade em 2 horas; dia, acima de 30% em ao menos 2 datas, sem empate. Frase passa pela liberação de números e não afirma futuro.
- Observação diz quantas vendas vieram de eventos e como vê-las sem eles.
- Sem duplicidade: Compras por Horário saiu de Vendas; Resumos Semanal e Mensal saíram de Produtos; Formas de Pagamento mostra a escolha na venda e Caixa continua com o que entrou.

Limites: horário é o do registro; poucas vendas trocam a ordem e o cartão avisa; aberturas não medidas nos celulares.
