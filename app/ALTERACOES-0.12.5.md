# AGRO Gestão 2 — versão 0.12.5

## Entrega

APK release assinado com a mesma identidade do AGRO Gestão 2. Nome visível 0.12.5 solicitado; versionCode 45 mantém compatibilidade de atualização sobre a 0.13.1/code44 instalada. Pacote br.com.territorio.gestao2. Atualização por adb install -r, sem desinstalar ou limpar dados.

## Conferência da sobra

No diálogo Finalizar feira, exibe somente produtos com sobra positiva e carga registrada. A carga qty já contém as reposições: o histórico restocks não é somado novamente. Perdas anteriormente registradas no evento são descontadas para não serem baixadas duas vezes.

Confere confirma e finaliza em um toque. Corrigir usa o teclado numérico existente; quantidades que não mudaram não exigem edição. Cada diferença menor pede uma classificação: venda não registrada ou perda/brinde. Nenhuma correção é aplicada antes de Salvar e enviar relatório. Uma sobra maior corrige a carga inicial e mantém o estoque geral, pois a mercadoria já estava no saldo. A ação original Finalizar e enviar relatório continua disponível sem conferência, gravando conferido=false.

Todas as correções são validadas numa cópia do modelo, e o conjunto é gravado uma vez. Cliques duplicados, saldo insuficiente, unidade/preço alterados e dados modificados durante a conferência são tratados. Vendas corrigidas recebem completed, unregistered=true e late=true, preço atual e hora real do fechamento. A forma de pagamento mais usada é medida por frequência entre as vendas do evento, desempate pelo valor e depois ordem estável do app. Sem vendas, o padrão é Pix. Perdas usam model.move(kind=loss), com eventId e custo histórico no movimento.

check conserva os campos solicitados: conferido, corrigido, vendasNaoRegistradas (qtd e valor em centavos), perdas (qtd), itens (produto, unidade, calculado, real, motivo). O evento guarda surplusCheckAt e surplusCheckMetrics (tempoConferenciaMs, confereDireto, diferencaTotal, diferencaLiquida e detalhamento porUnidade). Quantidades em unidades diferentes devem ser avaliadas pelo detalhamento, não interpretadas como um volume único.

Offline, os registros e a pendência ficam locais. O envio nativo espera a confirmação de gravação. Novas vendas atualizam os totais e o payload; check continua sendo o registro histórico daquela conferência. O fluxo de venda não recebeu passos adicionais.

## Interface, movimento e desempenho

Venda registrada sem X; geração de PDF ocorre quando solicitada, e QR tem cache limitado. Fechamentos em WebViews recentes retêm o próprio diálogo; guardam posição/velocidade e não duplicam telas grandes. O piscar na restauração da opacidade foi corrigido e testado quadro a quadro. WebViews antigos recebem fallback limitado. Calendário do rodapé vira uma folha; rodapé sem pill e somente ícones recebem cor ativa. Repor estoque tem teclado e Finalizar em regiões separadas, com linhas compactas. Aparência e telas de Gestão/Clientes usam o layout atual e Voltar inferior. Finanças/Custos ficam primeiro; atalhos redundantes foram removidos. Vender mantém três colunas.

Modo leve automático usa sinais disponíveis de CPU/memória/economia de dados; reduz movimento e remove blur. As fontes incluem somente o subconjunto latino usado em português. Formatadores de datas, horas, moeda e quantidade são reutilizados; nomes são indexados em uma passagem e a animação lê o layout antes de escrever transformações. Não há promessa de 120 Hz em todo aparelho.

## Inteligência e diretrizes

Cérebro abre insights do período e local selecionados: até três prioridades, dados/evidência, hipótese, ação e forma de avaliar. Custos históricos ausentes não recebem custo zero conhecido; resultado parcial é identificado. Erros de conciliação suspendem recomendações de preço e crescimento. Demonstração/simulação/origem não confirmada são identificadas; não se classifica uma base por nome dos produtos ou número de versão. As regras não prometem 99% ou 100% de acerto.

Preços são cenários explícitos, não comandos automáticos. Projeções não acrescentam demanda fictícia por esgotamento, não multiplicam vendas diárias por um fator arbitrário e não chamam uma faixa histórica de intervalo de confiança. A amostra e suas limitações acompanham a projeção. Pix não é tratado como sempre gratuito; CAC e LTV não são afirmados sem base adequada. Arredondamento de taxas foi conciliado entre demonstrativo e locais; ponto de equilíbrio exclui contas que começam depois do mês selecionado.

Planejar próximo teste grava hipótese, ação, medida, período, critério e baseline; permite registrar avaliação posterior. A intenção não altera preços, estoque ou vendas. Os 32 exemplos do documento são um catálogo de possibilidades condicionado aos dados: o app não inventa validade, prazo de entrega, visitantes, pedidos não atendidos ou recebíveis que ainda não são registrados pelo modelo. Não foram criados módulos de lotes, liquidação bancária ou cobrança por causa desses exemplos.

Referências fornecidas pelo usuário foram lidas como documentos de referência: diretrizes financeiras, política de demonstração/operação real, diretrizes de inteligência e material de Branding/PDV/KPI. Os exemplos desses documentos não foram inseridos como vendas reais.

## Validação

- 113 testes do app passaram.
- 5 testes do backend passaram (POST para armazenamento).
- 9 cenários completos da conferência passaram no dist de produção, claro e escuro: confirmação, venda/perda pelo teclado, ajuste, clique duplo, sem carga, esgotado, finalização sem conferir, offline/reload e nova venda; contagem desatualizada é recusada.
- Planner: intenção, campos obrigatórios, avaliação, reload e integridade de vendas/estoque passaram.
- 12 combinações de layout/tema/tamanho, 26 verificações de detalhes/teclado e 117 telas varridas: zero erro JavaScript ou corte de conteúdo.
- Fechamento: após desaparecer, nenhum quadro voltou a ficar visível; close continua síncrono, mantém returnValue/foco e não deixa clones.
- Simulação de CPU 6x, 2 GB e 4 núcleos ativou modo leve, blur none e nenhuma animação contínua ociosa. É simulação de navegador, não ensaio em um celular barato físico.
- APK conferido contra os arquivos de produção, assinatura v2/v3 e release não depurável. Instalação confirmada por ADB; primeiro horário de instalação mantido. O aparelho estava bloqueado na última captura, portanto não se afirma teste de transações reais nele.

## Servidor da organização — pendência de publicação

O servidor existente descartava campos não listados em cleanReport. A cópia de fonte corrigida e testada preserva check e unregistered. O APK envia os novos campos e os mantém localmente, mas o servidor publicado precisa receber o patch para armazená-los. Não foi feito deploy externo. Patch: ../qa/surplus-server.patch.

## Arquivos de aplicativo alterados ou adicionados nesta revisão

- `src/main.js`
- `src/fonts.css`
- `src/interface-refinements.css`
- `src/motion.css`
- `src/legacy/erp-core.js`
- `src/legacy/erp-ui.js`
- `src/features/motion/index.js`
- `src/features/motion/geometry.js`
- `src/features/motion/nav-icons.js`
- `src/features/advisor/engine.js`
- `src/features/advisor/quality.js`
- `src/features/advisor/method.js`
- `src/features/advisor/index.js`
- `src/features/advisor/agent.js`
- `src/features/advisor/knowledge.js`
- `src/features/advisor/forecast.js`
- `src/features/advisor/finance-rules.js`
- `src/features/advisor/advisor.css`
- `src/features/finance/finance.js`
- `src/features/fair-surplus.js`
- `src/features/fair-surplus-ui.js`
- `src/features/fair-surplus.css`
- `src/features/fair-report.js`
- `package.json`
- `package-lock.json`
- `android/app/build.gradle`

## Testes alterados ou adicionados

- `tests/advisor-evidence.test.mjs`
- `tests/advisor-quality.test.mjs`
- `tests/advisor.test.mjs`
- `tests/fair-surplus.test.mjs`
- `tests/fair-report.test.mjs`
- `tests/finance.test.mjs`
- `tests/forecast.test.mjs`
- `tests/migration.test.mjs`
- `tests/motion-geometry.test.mjs`

## Backend

- `../portfolio-server/src/fairs.js`
- `../portfolio-server/tests/surplus-check.test.mjs`
- `../qa/surplus-server.patch`

Arquivos gerados: dist/, android/app/src/main/assets/public/, capacitor.config.json nativo, APK e native-apk-validation-0.12.5.json. Ferramentas de validação/reprodução ficam em ../qa/ (build-final.ps1, revision.cjs, surplus-e2e.cjs, planner-smoke.cjs e capturas).
