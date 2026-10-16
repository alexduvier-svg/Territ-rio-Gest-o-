# AGRO Gestão 2 0.12.10

Correções de entrada de estoque, cadastro e janelas solicitadas após a versão0.12.9. Versão0.12.10/code50 instalada e confirmada pelo Android em16/10/2026 às20:20:12, preservando a primeira instalação e sem limpar os dados.

## Estoque e cadastro

“Você já tem cadastrado” passa a seguir a mesma ordem do estoque disponível. A frequência e a data da reposição não intercalam categorias/famílias/apresentações. Cafés e seus formatos/pesos ficam em sequência, inclusive depois de Mostrar mais. Os cards recebem acabamento com bordas, luz e sombras discretas, mantendo o texto nítido nos dois temas.

“Cadastrar novo produto” começa sem categoria presumida; Cafés não fica selecionado automaticamente. Formatos incluem Barras onde pertinentes, 50 g vira opção de peso e a confirmação de peso recolhe a seção. Queijo Ralado recebe sugestão suplementar em pacote50g: 2.479 referências originais preservadas, uma adição identificada separadamente, total2.480. Nenhum produto, saldo, preço ou custo é criado por carregar essas sugestões.

O cadastro captura os valores visíveis antes de validar. Custo0 explicitamente informado é válido e conhecido; custo vazio continua pendente. O caso preço3/custo0/estoque3/mínimo0 deve salvar uma vez e manter o estoque correto após reload. Detalhe de estoque recebe espaçamento para Editar produto e Histórico.

O modelo já aceitava custo zero; a causa exata do caso fotografado não foi reproduzida. Foram corrigidas a sincronização por change/captura final, a exibição de zeros e as mensagens ambíguas quando outra opção de venda está incompleta. Preço/custo são validados por opção sem descartar variantes. Estoque/mínimo vazios mantêm o padrão anterior de zero.

## Janelas e memória

Janelas de informação/edição compartilham frame centralizado, margens laterais e verticais, altura limitada e conteúdo rolável. O tema acompanha o sistema, inclusive cérebro/relatórios no claro. Rodapés permitem quebra de texto e rolagem quando a altura é curta; Enviar no WhatsApp do Resumo do dia fica no rodapé junto de Voltar, sem corte.

No carrinho, opções de pagamento, divisão e validação ficam no conteúdo rolável. Total, Cancelar e Finalizar permanecem inteiros no rodapé. Os mesmos IDs, eventos e regras de cálculo foram mantidos; trocar pagamento preserva a rolagem, inclusive quando há só um produto.

O material usa brilho de superfície estático e bordas/sombras discretas, sem blur vivo nas janelas densas. Abertura/fechamento usam expansão curta e física contínua, preservando foco, fechamento síncrono, movimento reduzido e modo leve. A área visível é atualizada em resize/abertura do teclado, sem recálculo por frame da mola. Não se afirma FPS em aparelho básico sem medição.

O padrão considera telas de 6,3, 6,5 e 6,8 polegadas pela área lógica disponível. O aparelho do produtor informou 1440×3168, densidade640 e fonte1,0, correspondendo aproximadamente a360×792 antes das áreas reservadas; não foi acessada sua base para esse diagnóstico. Resolução/escala são leituras, sem mudança de configuração.

Premissas interfaceGuidelines e stockCatalogGuidelines versão2 acompanham o modelo/backup e os documentos offline. A migração atualiza referências anteriores sem alterar registros de negócio; uma revisão futura superior permanece preservada. Catálogo de referência na memória passa a1.0.2 com contagem original e suplementar separadas.

## Verificação e entrega

195 testes de domínio passaram. QA isolada: oito grupos, 85 superfícies em claro/escuro e fontes normal/ampliada; áreas úteis320/360,360×480,360×792,393×852 e412×915. Doze sequências de abertura/fechamento do cérebro e Resumo em normal/leve/reduzido passaram, sem troca de material ou flash após a saída. São medidas no Chrome do computador, não FPS/P95 Android. Preparação de feira repetida por regressão: oito grupos, quatro layouts e oito quantidades/carrinho, incluindo falha/retry de gravação, offline, reload e estoque vazio. Zero erros locais/JavaScript.

Build Vite/Capacitor e Gradle concluídos. APK release com assinatura original v2/v3, pacote br.com.territorio.gestao2, nome AGRO Gestão2, sem depuração; os 30 arquivos de produção são byte a byte iguais aos assets do APK. Tamanho4.250.391bytes, SHA256 `236cb4a279e1eab4ab2902184754bf792de1f3711c8caaf6bb5c2fdbdacf8fa9`.

`adb install -r` retornou Success. Android confirmou0.12.10/code50, lastUpdateTime16/10/2026 20:20:12 e firstInstallTime14/10/2026 18:17:06 preservado. O app atualizado foi trazido à frente. Nenhuma transação de teste foi criada no celular nem houve exportação de sua base. Não foi medido desempenho em aparelho básico, teclado físico Android ou pontualidade real de alarmes.

Evidências: qa/stock-dialog-fixes-qa.json, qa/event-preparation-qa.json, qa/unit-stock-dialog.txt e docs/QA-ESTOQUE-JANELAS-2026-10-16.md. Premissas, código e testes acompanham o GitHub; dados reais, chaves e senhas ficam fora dele.

## Arquivos principais

- src/legacy/erp-ui.js e src/features/interface.js
- src/features/product-stock.css, product-catalog.js e stock-order.js
- src/data/product-catalog-additions.js e testes de cadastro/ordenação
- src/dialog-system.css, src/glass.css e src/legacy/app.css
- src/features/motion/index.js e src/main.js
- src/data/interface-guidelines.js, stock-catalog-guidelines.js e catalog-knowledge.js
- public/knowledge/premissas-interface.md, premissas-estoque.md e catalogo-agro/ADICOES-DO-APP.md
- tests/product-memory.test.mjs, testes de catálogo/estoque e qa/stock-dialog-fixes-qa.cjs
- package.json, package-lock.json e android/app/build.gradle
