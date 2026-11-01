# Codex Teste 143 — APKs entregues

Compilação e verificações concluídas em 01/11/2026 (UTC). O usuário confirmou a necessidade de testar Qwen e Gemini Nano dentro do APK. Nenhuma instalação em celular foi realizada nesta sessão.

## Download pelo celular

- [Codex Teste143 — modelos, Android8 ou superior](https://chatgpt.com/library?file_id=libfile_0b5bdf8c6bf0819192e70aeabef6ed41&account_id=personal): versão0.12.143-teste.2, código185, 36.108.640bytes.
- [Codex Teste143 — essencial, Android7 ou superior](https://chatgpt.com/library?file_id=libfile_363bf8143bc08191bff6c7b81e2c4664&account_id=personal): versão0.12.143-teste.1, código184, 35.556.070bytes. Foi preservada antes da inclusão do SDK Nano.

Ambas usam o pacote `br.com.territorio.gestao2.codextesteia` e o certificado IA SHA-256 `b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86`, iguais aos da142. Podem atualizar a142 correspondente sem desinstalação. A edição essencial tem código menor que a edição de modelos; não serve como downgrade. A139 é outro pacote e seus dados não são transferidos automaticamente.

## Origem preservada e Git

Repositório `alexduvier-svg/Territ-rio-Gest-o-`, branch nova `codex/agro-gestao-143-diretrizes-ia`, criada de `854b82be5fdb1ca7515d7e3f0c14015875a29692`. O APK142 veio de `2c4bb0ae25cfe78573dbd054ddeb6ff6ed16eab6`; sua branch e APK permanecem intactos.

Código da edição de modelos publicado no commit `7277649932d5829c3c395e90fa47ed936a4bffed`. A compilação local usou `ffbe8276579585c032e5c131110d638df16e88f6`; ambos têm árvore integral idêntica `3bd0f919fd39929849a9853e80c845331719617f`, conferida na publicação. Os SHAs diferem porque a publicação usa a conexão GitHub com metadados de autoria próprios.

Commits publicados desta evolução: `b4237fc` (diretrizes), `8b24ccb` (base zerada e auditoria), `5cbc881` (versão143), `a335abb` (monitoramento) e `7277649` (painel dos modelos).

Codex136 continua em `78edfb5e2a44fc0819e5cf904420d4cb5f85c535`; a experiência anterior em `5b37c4119650dcbfbc9e55a523a916a485603eff`; a referência139 em `4e7fb28e451f98cc0b73b0a52a05be6778098968`. Nenhuma branch Claude ou main foi alterada. Não houve exclusão, force push, troca de chave ou migração de dados reais.

## Entrega e testes

Diretrizes profissionais acessíveis no aplicativo e empacotadas como referência offline. Serialização dos modelos, validação de saída, preservação integral de fatos, cancelamento, pausa após falha e preferência pelos motores existentes. O reset agora limpa sessões e caches e retorna a uma base pendente vazia, sem inserir demonstração silenciosamente.

872 testes de domínio, oito verificações em DOM, seis cenários Java do instalador e onze cenários da política de destinos passaram. Os painéis do assistente e dos modelos passaram com provedores simulados. A simulação de Contas da banca foi conferida sem alterar os registros.

Compilação Android final: BUILD SUCCESSFUL, 228 tarefas, 55 executadas. Assinatura, identidade, CRC, alinhamento ZIP/ELF16KB e60assets web conferidos. Classes do diagnóstico e SDK Prompt presentes no DEX.

O arquivo Qwen0.6B completo foi baixado no ambiente remoto: 497.516.544bytes, SHA-256 `7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1`. Isso valida o arquivo, não a inferência Android.

APK de modelos: SHA-256 `4e0cf1fa5df25fc12ad9dcde50311f28816190b3851c1eeaf687762ecbe2e1d8`.
APK essencial: SHA-256 `c72af7b0dfed7be9e248d9560f1eb4442719fab6e8363e9e89509f6961447de7`.

## Testes no aparelho e limitações

Após instalar, abra Inteligência no aparelho → Testar Qwen e Gemini Nano. Prepare Qwen0.6B mediante download explícito de498MB ou prepare Nano somente quando o AICore permitir. Execute pergunta composta e base vazia, um teste por vez.

O Qwen1.7B existente foi preservado. Os candidatos do painel ainda não assumem automaticamente as consultas do negócio. Não há pesos embutidos, download silencioso ou alternativa automática em nuvem. A disponibilidade Nano depende do aparelho/configuração oficial.

Não houve inferência real em Android físico, medição de pico de memória, latência física ou validação de instalação nesta sessão. O painel mede PSS do processo do app antes/depois; não mede pico nem a memória do AICore. Resultados no telefone permanecem pendentes de execução pelo usuário.

Contas da banca e Gestão são complementares, com sobreposição de indicadores. A auditoria está em [AUDITORIA-CONTAS-BANCA-GESTAO-143.md](AUDITORIA-CONTAS-BANCA-GESTAO-143.md), incluindo limitações ainda pendentes do preenchimento automático. Instruções dos modelos: [TESTES-MODELOS-ANDROID-143.md](TESTES-MODELOS-ANDROID-143.md).
