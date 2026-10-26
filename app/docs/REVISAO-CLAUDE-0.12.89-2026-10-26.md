# Revisão do AGRO Gestão Claude 0.12.89 — 26/10/2026

Solicitação: conferir Git e pasta local. Revisão de leitura e testes sintéticos; nenhuma alteração no código do Claude ou do AGRO2, nenhuma instalação e nenhum dado de produtor acessado nesta revisão.

## Origem confirmada

- Repositório novo: https://github.com/alexduvier-svg/agro-gestao-claude
- Commit da versão 89: `d051181d5b6472dc22b240a013ba64ff209f62fc`, confirmado no Git local e remoto durante a revisão.
- Base: AGRO Gestão 2 0.12.87, `a4dab1f`.
- Checkout: `C:/Users/alexd/PROJETOS/AGRO-Gestao-Claude`.
- APK: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Claude-0.12.89.apk`.
- Pacote separado: `br.com.territorio.gestaoclaude`, código 129, 11.737.997 bytes.
- SHA256: `a0d258e58e6d27500a27508e9382ef35af28b0ec1802ba93758e07492540c50b`.
- ZIP íntegro e manifesto conferidos. O ramo antigo `claude/agro-gestao3` permanece em `22e3813`/0.12.64.

## Mudanças verificadas no código

1. Finanças: custo zero explicitamente conhecido; marcação de taxa padrão; retirada planejada substituída mês a mês; explicações de margem e caixa.
2. Gestão: caminhos repetidos de relatórios reorganizados e memoização somente durante a montagem da tela, invalidada ao persistir.
3. Fornecedores: abrir rascunho de entrada em estoque e de custo a partir da compra, confirmação manual; comparação rápida e à vista versus a prazo.
4. Lotes: ação de perda para o lote vencido selecionado e antecedência de 1 a 90 dias por produto.
5. Contas: estoque e ciclo de caixa; produção e conversões; financiamento e retorno do investimento, além dos assuntos iniciais.
6. Datas: reutilização de Intl.DateTimeFormat; coerência visual em CSS carregado por último.

Os números de velocidade e as auditorias visuais relatados pelo Claude não foram reproduzidos nesta revisão. Não afirmar fluidez, FPS ou equivalência visual em aparelhos físicos apenas com testes unitários.

## Pontos que precisam de correção antes de portar

### Perda com falha de gravação mantém estado alterado

`app/src/features/stock-lots/ui.js:106–109`: a ação faz `model.move` antes de `bridge.persist`. Se persistir falha, apenas avisa e libera busy; não restaura estoque/movimentos. Reprodução isolada do commit89: antes 10 unidades e 3 movimentos; após persist=false, 6 unidades e 4 movimentos continuam em memória. A antecedência também permanece alterada após falhar. Exige transação/rollback e teste de falha, mantendo a proteção contra duplo toque e contexto do produtor.

### “Sobra no Caixa” ainda mistura pagamentos e previsões

`app/src/features/finance/finance.js:152–158`, apresentação em `erp-ui.js:1885`: há linha separada para a previsão, mas o total `cash` continua descontando fixos e retirada planejada. Reprodução sintética: sem entradas/saídas registradas, R$300 de custo fixo configurado gera `cash=-30000`, `cashForecast=30000`. Separar caixa realizado e projeção, com rótulos e total próprios. Esta regra já existia na base; a versão89 explica melhor, mas não resolve o total.

### Comparação rápida com frete desconhecido ainda aponta vencedor

`producer-calcs.js:86–94`: frete vazio assume zero na simulação e pode tornar a oferta vencedora; a interface mostra a ressalva, mas dá destaque verde a “Mais barato”. Exemplo: R$100/10 com frete desconhecido vence R$110/10 com frete0. Mostrar comparação parcial, sem concluir menor custo final até confirmar o frete, e manter unidade/especificação comparáveis.

## Verificação independente

- 763 testes passaram com zero falhas, executados na cópia isolada do commit `d051181` (fontes/testes/recursos versionados; dependências de teste locais).
- Casos extras de persistência e caixa acima executados no mesmo commit, sem dados reais.
- Evidências locais: `claude089-unit-committed.txt`, `claude089-isolated-review.json` e `claude089-apk-review.json` no diretório VIZ da sessão.

## Alteração posterior encontrada durante a revisão

O Claude publicou a 0.12.90, commit `cde94a1fb9e9b911e00b378f3c9a9df75f6e0881`, às18:01 de26/10. Essa alteração transforma os exemplos da primeira abertura em dados persistentes e permite vender com eles. Ela não está no APK89 (strings/loader ausentes no binário89) e conflita com a regra atual do AGRO2 de manter exemplos isolados e impedir concluir vendas de teste. Não importar esse comportamento para o AGRO2 por consequência de um merge.

## Encaminhamento

Aproveitar seletivamente as correções de custo conhecido, marcação de estimativas, cache de formatadores, avisos configuráveis e novas simulações, após correção e QA próprio. Preservar a calculadora Contas do AGRO2 (ajuda em todos os campos, composição de custos/taxas e teclado comum) e sua identidade, certificado, dados e modo teste. Nenhum merge integral ou mudança de versão do AGRO2 foi executado por esta inspeção.

## Pedido posterior: cards no AGRO Gestão Claude

O usuário esclareceu que os cards esticados eram do AGRO Gestão Claude. A correção já estava em andamento nesse checkout e foi preservada; o Claude publicou a0.12.91, commit f3c6fca69bf1ce980895df31e7321f3486de9fcd. A regra `grid-auto-rows:auto` evita que um nome longo aumente a altura de todas as fileiras. Nossa verificação independente do APK final passou nos oito cenários320/360/393/412, claro/escuro, com três colunas, conteúdo e preços preservados e sem overflow. Cards de linhas com nomes mais extensos podem crescer o necessário para não cortar texto.

APK `AGRO-Gestao-Claude-0.12.91.apk`,11.738.285bytes, SHA256 `1612dc9c5ec5fd516935c14d8e1f83aacd4f9d7c211e4fbb0f044c60caf42250`, confirmado idêntico na pasta original e nos dois aparelhos. Primeiras instalações do pacote Claude preservadas. Não foi criado outro APK ou commit no checkout do Claude por esta revisão. A correção dos cards não altera os defeitos de negócio listados acima.
