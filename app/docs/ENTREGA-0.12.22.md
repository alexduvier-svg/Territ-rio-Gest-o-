# AGRO Gestão 2 — 0.12.22/code62

O Estoque ganhou um + geral imediatamente à direita do relógio. A ordem do cabeçalho é Relógio, Adicionar, Calculadora e Lupa. O atalho abre a entrada rápida com todos os produtos, sem filtro de família ou categoria, mesmo depois de usar um acesso contextual. Os + de cada família continuam disponíveis para adicionar outra variedade.

Em telas estreitas, o cabeçalho permite duas linhas, mantendo o título inteiro e os botões com o tamanho habitual. A lupa permanece à direita. Com estoque vazio, há um único + geral no cabeçalho; foi retirado o antigo botão avulso de fallback. Cadastro novo continua sem categoria marcada automaticamente. Permanecem três apresentações por família e a seta para as demais. Premissas v8 incorporadas ao modelo e à orientação offline, separadas dos registros do produtor.

Conferido nos temas claro e escuro, 320 px com texto ampliado e 393 px normal: ordem e largura dos quatro controles, ausência de rolagem horizontal, + por família preservado, contexto de Bananas, limpeza de filtro no + geral e acesso com estoque vazio. Nenhum erro JavaScript observado; produtos e vendas sintéticos permaneceram inalterados. Evidência em qa/shortcut022-review.json. Os 16 testes existentes de memória e reset passaram. Não foram criados testes unitários para o botão nem repetida a matriz completa da 0.12.20. Não houve transação fictícia na base real do aparelho.

APK release de 5.095.628 bytes, pacote br.com.territorio.gestao2, versão 0.12.22/code62, certificado original v2/v3, alinhamento 16 KB e 38 assets idênticos ao build final. SHA256: 8f5de62bdd6e4bc58ca47a04e5060c193c1af5e217bf841d86fb5e89938c6790.

Cópia idêntica na pasta original como AGRO-Gestao-2-0.12.22.apk. Instalado com adb install -r em 2026-10-20 14:18:06, Android confirmou 62/0.12.22 e abertura Status ok; firstInstallTime 2026-10-14 18:17:06 preservado. Publicação apenas no ramo codex/atualizacao-agro-gestao2, mantendo main independente. Lista em ARQUIVOS-0.12.22.md.
