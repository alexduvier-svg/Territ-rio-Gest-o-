# Entrega — AGRO Gestão 2 0.12.28/code68

Cards de Produtos seguem o pedido de21/10: um toque abre Finalizar Venda com uma unidade padrão, dois toques abrem o estoque exato daquele produto e pressionar/segurar por600ms inicia seleção de até três produtos. O primeiro toque permanece imediato, sem temporizador atrasando o carrinho. O segundo reverte somente a prévia intocada e usa o mesmo motor/material da consulta existente; nenhum gesto registra uma venda.

Na seleção, um toque marca/desmarca e o duplo toque consulta o estoque preservando a lista anterior. O clique de soltar após segurar é descartado; rolagem e pointercancel interrompem o toque longo. Ativação por teclado não é confundida com gesto físico. Rascunhos anteriores, quantidades e pagamentos editados permanecem protegidos. O modo explícito de organização conserva seu tratamento separado. Não existe nova ação especial de três toques. Estoque esgotado permanece consultável.

Premissasv15 instaladas no modelo/backup e documento offline; as regras históricas de dois/três toques foram substituídas. Layout, três colunas, preços, temas, animações e motor climático27 preservados. Servidor não alterado ou republicado. Sem transações reais de teste, desinstalação ou limpeza de dados.

## Validação e artefato

22 testes unitários (gestos, ordem e memória) PASS.104 verificações UI/32 superfícies em8configurações PASS: claro/escuro,320pxcomtextoampliado,360modo leve,393normal e412movimento reduzido. Toque físico CDP/touchscreen e mouse: um toque/carrinho, duplo/estoque,inclusive esgotado; pressão600ms/soltar; limite3/Continuar; saldo durante seleção; scroll/pointercancel; teclado; rascunho/quantidade/pagamento protegidos. Dados fictícios isolados inalterados e zero errosJS. A organização explícita é protegida por teste unitário; o antigo botão Organizar não foi restaurado. Matriz visual histórica completa e testes instrumentados nativos não foram repetidos. Não se mediram FPS/GPU nativos,bateria ou aparelho básico.

APK AGRO-Gestao-2-0.12.28.apk:5107916bytes; SHA256:ef0f97dcd70d5ad70384fe4b98c08895ee93133d24784621b60f90ff0b3915df. Pacote br.com.territorio.gestao2 e certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68; v2/v3,38assets idênticos ao dist testado,alinhamento16KB,não depurável. Sem GPS/voz/microfone.

Cópia conferida em C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.28.apk. Instalado via adb install-r em2026-10-21 08:57:18; Android68/0.12.28/aberturaStatusok. firstInstallTime2026-10-14 18:17:06preservado. Não se criaram transações de teste no celular real; nenhuma limpeza/desinstalação. A instalação e a abertura Android foram confirmadas; os gestos foram testados no navegador isolado.

Publicação somente no ramo codex/atualizacao-agro-gestao2. Main956fddceec2b994e32c154c5197424a4f56df7f2 independente preservado. Servidor não alterado ou republicado; nenhuma submissão Play.
