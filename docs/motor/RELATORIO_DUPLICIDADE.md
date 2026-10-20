# Relatório de duplicidade — Motor de decisões do AGRO Gestão 3

Data: 20/10/2026 · Ramo: `claude/agro-gestao3` · Versão do app: 0.12.36
Documentos auditados: `MOTOR_INTELIGENCIA_AGRO_GESTAOclaude.pdf` (v1.0, seção 0) e
`Agro_Gestao_Diretrizes_Matematicas_Probabilisticas_Codex.docx` (v1.0, seção 2), ambos nesta pasta.

**Escopo inspecionado:** `app/src/**` (features, legacy, data, native), `app/android/app/src/main/java/**`,
`app/public/knowledge/**`, `app/tests/**`, `AGENTS.md`, `app/package.json`, `app/android/app/build.gradle`.
Busca com os termos-gatilho das duas diretrizes (clima, estoque, finanças, CRM, KPIs, conselho), em
português e inglês. Itens não encontrados aparecem como "não localizado no escopo inspecionado".

## Conclusão principal

O app **já tem um motor de decisões**: a Orientação (`src/features/advisor/engine.js`, `buildGuidance`).
Ela lê os registros reais, monta até 3 ações por nível e impacto, com o porquê e as fórmulas, e já se
recusa a concluir com origem de dados não confirmada. Criar um segundo motor violaria a regra nº 1 das
duas diretrizes. **Decisão: estender a Orientação** (classe D4) — regras novas entram na lista `RULES`,
e todo item passa a carregar o contrato de conselho (`decision`).

## Achados

| Área | Onde já existe | Classe | Decisão |
|---|---|---|---|
| Motor de conselhos (até 3 por tela, prioridade por nível/impacto) | `advisor/engine.js` `buildGuidance`, `RULES` | D4 | Estendido: regras de tempo + contrato `decision` em todos os itens (`stampDecisions`). |
| Qualidade da evidência (dado ruim → silêncio) | `advisor/quality.js` `evidenceQuality` | D4 | Reutilizado para a confiança (`nula` com erros; `media` com custos completos e ≥ 8 vendas; senão `baixa`). |
| Hipótese ≠ diagnóstico | `advisor/method.js` `explainMethod` | D1 | Reutilizado como está. |
| Margem de contribuição, ponto de equilíbrio, resultado, taxas | `finance/finance.js` `statement`, `productMargins`; `advisor/finance-rules.js` | D1 | Fórmula canônica é a existente. **Não** recriada em `decision/math.js`. |
| Auditoria dos números (pagamentos, estoque, custos, datas) | `finance/audit.js` `runAudit` | D1 | Reutilizado. |
| Previsão de venda por referência histórica (últimas 4 feiras, pesos 0,4/0,3/0,2/0,1) | `advisor/forecast.js` `forecastNextEvent`, `runOut`, `dailyRates` | D2/D4 | Mantida como referência canônica (é o "comece pela referência simples" da diretriz Codex §8). Croston, Holt-Winters e binomial negativa ficam para quando houver validação temporal. |
| KPIs (ticket, giro, cobertura, valor observado do cliente) | `advisor/engine.js`, `legacy/erp-ui.js` (gestão), `advisor/knowledge.js` | D1/D4 | Dicionário existente mantido; nenhum KPI recriado. |
| Agente offline (pedidos, propostas, auditoria) | `agent/core.js`, `agent/index.js` | D1 | Fora do escopo do motor de decisões; não duplicado. |
| Tempo (fonte, cache, validade, unidades) | `weather/index.js`, `weather/ui.js`, `AgroWeatherWorker.java` | D1 | Adaptador canônico do clima; as regras do motor leem só o retrato guardado (`snapshot`), sem rede. |
| Chuva para feiras (Open-Meteo, % de chuva) | `legacy/erp-ui.js` `weatherJSON` (cérebro, relatórios) | D2 | Segunda fonte de clima, só no cérebro. Não removida (tem consumidores); **pendência P4**: migrar para o adaptador canônico ou manter como fonte comparada. |
| Física do ar (es, Δ, Td, bulbo úmido, VPD), radiação, ET0 PM/Hargreaves, graus-dia, geada (folha) | não localizado no escopo inspecionado | N | Criado em `decision/math.js`, com testes-ouro. |
| Conversão ICE → R$/saca, EOQ, ponto de pedido, custo-perda, valor esperado | não localizado no escopo inspecionado | N | Criado em `decision/math.js`, com testes-ouro. |
| Wilson, Beta-Binomial, Kahan, Welford, divisão protegida, arredondamento de probabilidade | não localizado no escopo inspecionado | N | Criado em `decision/math.js`, com testes-ouro. |
| Regras de tempo (geada, trovoada, chuva, calor, previsão antiga) | não localizado no escopo inspecionado | N | Criado em `advisor/weather-rules.js`, dentro da Orientação. |
| Pulverização, irrigação, balanço hídrico, doenças, SPI/ENSO, mercado, CRM probabilístico | não localizado no escopo inspecionado | N (não habilitado) | Fórmulas base disponíveis; conselhos **não** habilitados sem dados de cultura/solo, fonte de cotação autorizada e validação (diretriz Codex §7, §10, §15). |

## Conflitos de regra (D3) — decididos pelo produtor em 20/10/2026: regra conservadora

1. **Probabilidade em todo conselho.** A diretriz Claude (§1.1) pede que cada conselho carregue
   probabilidade; a diretriz Codex (§5, §14) proíbe inventar porcentagem quando ela não é defensável.
   A fonte de tempo (MET Norway) não dá chance de chuva para o Brasil. **Decidido:**
   a regra mais conservadora (Codex) — conselho com confiança declarada e quantidades (mm, °C),
   sem porcentagem inventada.
2. **Valor do cliente (LTV).** A diretriz Claude (§5.2) traz `LTV = margem × r / (1 + d − r)`; a
   diretriz Codex (§11) pede horizonte declarado e proíbe extrapolar valor perpétuo com poucas vendas.
   **Decidido:** o app continua mostrando o valor **observado** do cliente; a fórmula
   de LTV projetado não foi implementada.

## Pendências

- **P1 — teste-ouro do documento.** T-EST-03 espera 0,25, mas a fórmula do próprio documento,
  (k + α)/(n + α + β) com k = 1, n = 1, α = 2, β = 8, dá 3/11 ≈ 0,273. Mantida a fórmula; corrigir o
  documento.
- **P2 — limites agronômicos** (janela de pulverização, irrigação, doenças) exigem cultura, estágio,
  solo e validação local. Também é conflito potencial D3 com bulas/receituário.
- **P3 — mercado:** CEPEA, PTAX e ICE exigem fonte autorizada e atualizada; nenhuma cotação embutida.
- **P4 — duas fontes de clima** (MET Norway canônica; Open-Meteo no cérebro).
- **P5 — calibração:** registrar previsão × ocorrido por feira (Brier, MAE) para habilitar confiança
  "alta" e, depois, probabilidades calibradas.

## Testes executados

- `tests/decision-math.test.mjs` — 14 testes: T-CLI-01 a 06, T-MER-01, T-EST-01 a 03 (T-EST-03 com o
  valor correto da fórmula), T-DEC-01, domínios protegidos, Kahan/Welford, Stull/ET0, arredondamento.
- `tests/weather-rules.test.mjs` — 6 cenários: chuva em mm sem %, trovoada e geada urgentes, calor,
  nada além de 3 dias, previsão antiga suspende, silêncio sem dados.
- Suíte completa do app: 334 testes, 0 falhas.
