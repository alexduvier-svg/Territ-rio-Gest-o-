# AGRO Gestão 2 0.12.9

Preparação de feira com + no alto de “O que vou levar”, cadastro/reposição vinculados ao mesmo evento e Adicionar depois. O rascunho persiste por ID, separado da carga confirmada, e retorna pelo evento. Cadastro e reposição não duplicam estoque em retentativas. O número grande da quantidade na venda e na edição do carrinho fica vermelho, conservando unidade, preço e subtotal.

Estoque distingue “Você já tem cadastrado” em verde de “Sugestões para cadastrar” em laranja. O botão é “+ Cadastrar novo produto”. Café Tradicional Torra Escura já existia: a primeira página passa a mostrar pelo menos 12 famílias, incluindo essa opção. Catálogo e premissas continuam embarcados após reinicializações; dados pessoais apagados dependem de backup.

Inteligência e Resumo do dia têm olho de privacidade. Resumo mostra vendas por família após Total vendido; sobras e valor de estoque pertencem à Gestão. Custos do dia têm Cancelar, sem gravar a edição. Clientes, cadastro, seleção na venda e Estado ganham superfícies centralizadas, margens e profundidade discreta; Cliente na venda contém somente nome/seleção, e endereço fica em Estado. Ícone dos dois clientes mais encorpado.

Aviso de venda pendente lilás no claro e verde no escuro, com aura, carrinho, seta e valor animados, sem alterar a venda. Modos leve/reduzido deixam o aviso estático; animação pausa em segundo plano. O app permite o desligamento da tela pelo tempo do aparelho, incluindo 30 segundos. Lembrete local programado uma hora antes de cada dia do evento, com ID estável e reconciliação de edição/exclusão. Android e economia de energia podem ajustar o disparo; não foram criados eventos reais para testar o alarme.

Gestão oferece “Estoque e sobras”, com saldo atual e avaliação de custo/venda, indicando custos incompletos. Na feira, levou inclui reposições, descontando vendas e perdas daquele evento. O saldo atual é identificado como atual, sem apresentá-lo como fotografia histórica do fechamento.

Resumos semanais e mensais ficam disponíveis após 7 e 30 dias completos desde a primeira venda real. Mostram até três produtos em cada extremo por quantidade, valor vendido e lucro bruto. Quantidades de unidades diferentes ficam separadas; pequenas amostras não repetem o mesmo produto nos dois grupos. Descontos e devoluções usam os registros históricos; custo desconhecido não vira zero, e custo zero explicitamente conhecido continua válido. O app explica giro, faturamento e contribuição bruta antes das despesas. Demonstração e catálogo de sugestões não entram na análise.

Os resumos funcionam localmente, com privacidade e estado no modelo/backup. Convites Android não exibem nomes ou valores e revalidam o período ao abrir. O horizonte agendado é de oito semanas e três meses, renovado ao usar o app; não se promete agendamento indefinido sem reabrir. A permissão do Android é necessária para avisos fora do app. O recurso não acrescenta toques à venda.

O material Engajamento_Design_Agro_Gestao foi considerado e suas premissas de clareza, integridade e explicação foram incorporadas à memória canônica e ao guia da inteligência. A avaliação em docs/ENGAJAMENTO-REVISAO-2026-10-16.md distingue o que foi aplicado das propostas ainda não implementadas.

## Verificação

192 testes de domínio passaram, incluindo persistência, preparação de feira, finanças e resumos periódicos. QA isolada de preparação: oito verificações, quatro layouts e oito cenários de quantidade; usabilidade: seis grupos e 16 superfícies; estoque em Gestão: quatro verificações nos dois temas a 320 px. Resumos periódicos: sete grupos, quatro layouts claro/escuro a 320/360 px e texto ampliado; privacidade também na Gestão ao fundo, persistência/retry, contexto real e notificações simuladas aprovados. Zero erros locais/JavaScript. Relatórios em ../qa/.

APK release assinado com o certificado original, v2/v3, depuração desativada, pacote br.com.territorio.gestao2, versão 0.12.9/code49. Os 29 arquivos de produção são idênticos aos assets do APK. Tamanho: 4.246.194 bytes. SHA256: `8a02bf5f55dfdbd28ccfdf9c379a054a0dbdbc7740ce961c94fe50292d4b4989`.

Instalado no AGRO Gestão 2 por `adb install -r`, com Success e confirmação do Android em 16/10/2026 às 19:01:59. Primeira instalação de 14/10/2026 às 18:17:06 preservada. O app atualizado foi trazido à frente. O aparelho informou desligamento de tela configurado em 30.000 ms; o app permite dormir, sem alterar essa configuração.

Não houve transação de teste no celular real nem exportação de sua base. Não foram medidas fluidez/P95 em aparelho básico, TalkBack ou pontualidade real dos alarmes. O backend da conferência de sobra está preparado no código; publicação no GitHub não implica implantação do servidor.

## Arquivos principais

- src/legacy/erp-ui.js, src/legacy/erp-core.js e src/main.js
- src/features/event-preparation.js e event-preparation.css
- src/features/client-surfaces.css e day-summary.css
- src/features/day-summary.js e privacy.css
- src/features/product-period-reports.js e product-period-reports.css
- src/features/product-catalog.js, product-stock.css
- src/data/stock-catalog-guidelines.js, engagement-guidelines.js e catalog-knowledge.js
- src/features/motion/index.js, nav-icons.js e src/motion.css
- src/native/shell.js e src/interface-refinements.css
- public/knowledge/premissas-estoque.md e premissas-engajamento.md
- tests/event-preparation.test.mjs, day-summary.test.mjs, stock-catalog-reset.test.mjs e product-period-reports.test.mjs
- tests/product-memory.test.mjs, src/features/finance/finance.js e tests/finance.test.mjs
- docs/ENGAJAMENTO-REVISAO-2026-10-16.md e referências
- package.json, package-lock.json e android/app/build.gradle

GitHub: atualização preparada sobre o histórico existente, mantendo fontes e documentação em app/. Chaves de assinatura, senhas, SDK, dependências, bases reais e binários gerados ficam fora do Git. Commits finais e envio são registrados no checkpoint após confirmação.
