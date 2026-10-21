# Entrega — AGRO Gestão 2 0.12.29/code69

Um toque no produto agora abre Venda para informar a quantidade. Um item novo começa em zero; o produtor usa o teclado e então toca em Carrinho para abrir Finalizar Venda. O gesto não preenche1unidade nem pula a etapa de quantidade.

Dois toques abrem somente o estoque exato. O reconhecimento acontece antes da navegação, em uma janela curta de280ms, com a resposta visual existente do card ao pressionar. Não se abre e depois desfaz uma prévia de venda. Uma segunda pressão dentro desse intervalo suspende a abertura pendente até resolver o gesto; segurar para seleção, rolar, cancelar o ponteiro, ocultar, navegar ou abrir outra janela descartam a pendência. Não existe trabalho ocioso contínuo.

Pressionar600ms mantém seleção de até três produtos. Na seleção, dois toques consultam saldo preservando a lista anterior. Rascunhos e pagamentos já editados não sofrem reversão; teclado abre quantidade sem aguardar duplo toque. Organizar produtos mantém o tratamento separado. Nenhum gesto conclui venda.

Premissasv16 no modelo/backup e documento offline substituem explicitamente a regra antiga de prévia automática com1unidade. Layout, motor de movimento, superfícies, cores, estoque, servidor e clima27 preservados.

## Validação

26 testes unitários de gestos/ordem/memória passaram.112 verificações UI e40superfícies em oito configurações: claro/escuro,320pxcomtextoampliado,360modo leve,393normal e412movimento reduzido. Zero erros JavaScript.

O teste executa a escolha de3unidades e só então abre Carrinho/Finalizar Venda, preservando essa quantidade. No duplo com toque físico e mouse, amostra o estado em requestAnimationFrame e rejeita qualquer quadro de Venda/checkout ou rascunho temporário. Também verifica segunda pressão que atravessa o prazo do primeiro toque sem abrir uma tela; estoque esgotado; pressão600ms/soltar; seleção até3/Continuar; scroll/pointercancel; atalhos de teclado; rascunhos/quantidades/pagamentos anteriores. Registros fictícios isolados permanecem idênticos.

Não houve transações de teste no aparelho real. Matriz histórica completa e testes instrumentados Android não foram repetidos. Não foram medidos FPS/GPU nativos,bateria ou desempenho de aparelho básico. Testes dos gestos no navegador isolado; instalação/abertura no Android confirmadas.

## Artefato

AGRO-Gestao-2-0.12.29.apk:5112012bytes. SHA256:012c63f67d92e73e2d87ab3a88bd42db829099fea42950d0cb6111931d302937. Pacote br.com.territorio.gestao2 e certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68; assinaturas v2/v3,38assets idênticos ao dist testado e alinhamento16KB. Não depurável; sem GPS/voz/microfone.

Cópia conferida em C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.29.apk. Instalado com adb install-r em2026-10-21 09:20:28,Android69/0.12.29/aberturaStatusok. firstInstallTime2026-10-14 18:17:06preservado. Sem desinstalar ou limpar o app principal.

Fontes/QA publicadas somente no ramo codex/atualizacao-agro-gestao2. Main956fddceec2b994e32c154c5197424a4f56df7f2 independente preservado. Nenhuma alteração/republicação do servidor ou submissão Play.
