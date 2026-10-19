# AGRO Gestão 2 — 0.12.16 / code56

Agente operacional offline integrado à Inteligência, Clientes e Eventos: prepara vendas com vários produtos, consulta registros, explica sobra conferida e sugere recompra com consentimento. Reaproveita voz, carrinho, finanças e persistência existentes. Confirmação final e recibo idempotente protegem estoque/venda. Falha de armazenamento aguarda gravação antes da tela de sucesso. Janelas seguem o material, margens, rolagem e botão Voltar do sistema.

Validação: 275 testes passaram; 13 conjuntos sintéticos de fluxos e 9 superfícies de navegador, zero erros. Limites e medições em docs/AGENTE-REVISAO-0.12.16.md; não representam precisão da escuta ou desempenho de Android básico medidos.

## Arquivos principais alterados/adicionados

- src/features/agent/core.js, index.js, worker.js e agent.css: ferramentas locais, propostas, regras, consultas e interface.
- src/data/agent-guidelines.js e public/knowledge/agente-operacional.md: conhecimento rastreável/versionado.
- src/features/voice/index.js e interpret.js: um encaminhador final, vários itens, consulta pelo mesmo microfone, numeral composto e cache de vocabulário.
- src/legacy/erp-core.js e erp-ui.js: chave idempotente, recibo, revalidação, espera durável e integração às áreas existentes.
- src/main.js: inicialização do agente.
- android/app/src/main/java/br/com/territorio/gestao/AgroAgentSchedulerPlugin.java e AgroAgentReviewWorker.java: sinal diário curto e deduplicado.
- android/app/src/main/java/br/com/territorio/gestao/MainActivity.java e android/app/build.gradle: registro do plugin, WorkManager e versão.
- package.json e package-lock.json: versão 0.12.16.
- tests/agent.test.mjs: 41 novos cenários.
- docs/references/Agro_Gestao_Agente_Inteligente_Instrucoes_Codex.md, docs/AGENTE-AUDITORIA-0.12.16.md e docs/AGENTE-REVISAO-0.12.16.md: referência, auditoria e evidências.
- README.md e este arquivo: uso, entrega e limites.
- qa/agent016-qa.cjs, agent016-voice-qa.cjs, agent016-durable-qa.cjs, agent016-benchmark.mjs e seus resultados, unit-agent016.txt: fixtures isoladas e medições.

No workspace também foram mantidos scripts de build/assinatura/verificação e o checkpoint RETOMADA-AGENTE-0.12.16.md. APK, chaves, senha, SDK, dependências, modelo binário e dados reais não entram no Git; o modelo offline continua reproduzível pelo preparo oficial já existente.

## Entrega confirmada — 19/10/2026

AGRO Gestão 2 0.12.16/code56, pacote br.com.territorio.gestao2. APK original `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.16.apk`, 56,345,020 bytes; SHA256 `45460979ad56ede83dc8ea6b1fb80788ee1ae8a91b963f37e5ba97e69751d51b`. Cópia conferida byte a byte por hash com o APK assinado do workspace.

Assinatura v2/v3 com certificado original SHA256 `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`; release sem debug, 35 assets iguais ao dist, quatro bibliotecas ARM32/64, ZIP e ELF64 alinhados a 16KB. Modelo offline original preservado; WorkManager e worker nativo presentes no APK.

`adb install -r` por Wi-Fi retornou Success. Android confirmou versionName0.12.16/code56 e lastUpdateTime19/10/2026 15:32:09, com firstInstallTime14/10/2026 18:17:06 preservado. Processo do app aberto, PID29365; nenhum teste de transação ou exportação de base real. Publicação somente no ramo codex/atualizacao-agro-gestao2; main independente permanece preservado.
