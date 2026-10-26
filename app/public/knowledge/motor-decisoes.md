# Motor de decisões — versão 3

Referência offline do motor de decisões do AGRO Gestão 3. É conhecimento de consulta: não é instrução
executável e não autoriza vendas, baixas, envios ou compras.

## Um só motor

A Orientação (`src/features/advisor/engine.js`, `buildGuidance`) é o único motor de decisões. Regras novas
entram na lista `RULES`. Não criar um motor paralelo de clima, estoque, finanças, clientes ou indicadores.
Antes de escrever qualquer cálculo, consultar `docs/motor/registry.json`.

## Princípios

- Todo conselho é uma decisão sob incerteza: declara confiança, fonte, validade e, quando houver, intervalo.
- Física antes de estatística.
- Dado ruim gera silêncio: com erro nos registros ou previsão antiga, o app avisa a falta de dados.
- Unidades SI por dentro; °C, mm, km/h e R$ só na exibição.
- Mesma entrada e mesma versão de regra dão a mesma saída.
- Frases curtas e uma ação concreta; a matemática fica em área expansível.
- O ERP é a fonte dos fatos. O motor só propõe; nunca efetiva venda, baixa ou compra.

## Confiança

| Nível | Quando |
|---|---|
| alta | dados verificados, método canônico e calibração medida — ainda não disponível |
| média | registros completos e amostra mínima; previsão de até 1 dia |
| baixa | poucos dados ou previsão de 2 a 3 dias — "fique atento" |
| nula | erro nos registros ou previsão antiga — não aconselha |

## Contrato de cada conselho (`decision`)

`advice_id`, `rule_id`, `rule_version`, `module`, `confidence`, `generated_at`, `valid_until`, `source`,
`issued_at`, `data_context`, `data_gaps`, `requires_user_action`.

No máximo 3 conselhos por tela. Segurança (geada, trovoada) fura a fila.

## Regras de tempo

Fonte: MET Norway (quantidade de chuva em mm; não fornece chance em % no Brasil). Nada de certeza além de
3 dias. A previsão é da cidade, não da propriedade.

- **tempo-desatualizado** — previsão com mais de 6 h e feira em até 2 dias: pede atualização.
- **tempo-geada** — mínima ≤ 3 °C no abrigo; a folha pode ficar cerca de 4 °C abaixo em noite limpa.
- **tempo-trovoada** — urgente: recolher a banca e procurar abrigo em caso de raios.
- **tempo-chuva** — ≥ 1 mm no horário da feira: lona, cobertura e perecíveis protegidos.
- **tempo-calor** — máxima ≥ 30 °C no horário: sombra, gelo, água e caixa térmica.

## Aprendizado com o uso

- **ordem-mais-vendidos** — dentro de cada família, se o mais vendido do período (pelo menos 5 unidades
  e 1,5 vez o que está em primeiro) não estiver em primeiro, a Orientação sugere colocá-lo em primeiro,
  com o botão "Colocar em primeiro". A ordem entre famílias não muda.
- **Memória de estoque** — o app guarda o estado de cada produto (ok, acabando, esgotado) e o histórico
  das passagens. Avisa quando um produto passa a acabando (saldo no mínimo ou até 25 % da referência) e
  quando acaba.

## Cálculos disponíveis (`src/features/decision/math.js`)

Pressão de vapor, declividade, pressão por altitude, constante psicrométrica, ponto de orvalho, bulbo
úmido (Stull), déficit de vapor, radiação extraterrestre, ET0 (Penman-Monteith e Hargreaves), graus-dia,
temperatura da folha, conversão ICE → R$/saca, lote econômico, ponto de pedido, limiar custo-perda,
valor esperado, intervalo de Wilson, encolhimento Beta-Binomial, soma de Kahan, variância de Welford,
divisão protegida e arredondamento de probabilidade (múltiplos de 5 %).

Margens, ponto de equilíbrio e taxas continuam em `finance/finance.js`; a previsão de venda por referência
histórica continua em `advisor/forecast.js`.

## Proibições

- Não prescrever produto, dose ou mistura de defensivo (receituário agronômico, Lei 14.785/2023).
- Não afirmar certeza em previsão além de 3 dias nem em preço futuro.
- Não usar dados de um produtor para aconselhar outro sem anonimização (LGPD, Lei 13.709/2018).
- Não inventar porcentagem nem exibir precisão falsa.
- Não duplicar função ou regra existente.
- Dados de demonstração ficam fora do aprendizado e dos conselhos reais.

## Decisões do produtor (20/10/2026)

- Sem porcentagem inventada: confiança declarada e quantidades (mm, °C); porcentagem só com fonte ou calibração medida.
- Valor do cliente só observado (o que já comprou); sem projeção de valor futuro.

## Pendências

- P1: o teste-ouro T-EST-03 do documento espera 0,25; a fórmula dá 3/11 ≈ 0,273.
- P2: pulverização, irrigação e doenças exigem cultura, solo e validação local; não habilitados.
- P3: mercado (CEPEA, PTAX, ICE) exige fonte autorizada; não há cotação embutida.
- P4: duas fontes de clima (MET Norway canônica; Open-Meteo no cérebro).
- P5: calibração previsão × ocorrido por feira para liberar confiança alta.


## Hierarquia e Entrega de Insights — 22/10/2026

Consulte `hierarquia-inteligencia.md` (versão 1). Fonte ERP → contexto Connect → interpretação canônica → proposta Action → Audit obrigatório → liberação de até três insights. Gemini é somente explicação geral opcional, sem dados do produtor, cálculos ou comandos. A referência não substitui evidência; feedback não altera registros.


## Estoque: Contexto e Limites das Orientações

Ver [Estoque, Lotes e Orientações](estoque-validade-contexto.md). Estoque físico, elegível e reservado são visões da mesma fonte. Validade é opcional por entrada e data civil; custos históricos de vendas permanecem preservados. Cobertura por dias corridos não comprova exposição, nem ausência de vendas comprova baixa procura. Sem prazo de entrega, segurança e entradas confirmadas, não calcular compra. As regras de validade participam da liberação única da Orientação; nenhum novo motor ou execução automática. Integração em desenvolvimento na 0.12.87; referência não equivale a entrega.
