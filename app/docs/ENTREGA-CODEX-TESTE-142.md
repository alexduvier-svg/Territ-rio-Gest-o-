# Codex Teste 142 — APK independente entregue

APK `Codex_Teste_142.apk`, 35.547.434 bytes (35,5 MB), compilado e assinado. Entregue diretamente na conversa para download e instalação pelo Android, sem computador.

## Identificação e origem

- Nome no Android: **Codex Teste 142**.
- Versão: **0.12.142-teste.6**, código **183**.
- Pacote: `br.com.territorio.gestao2.codextesteia`.
- Variante compilada: `assembleCodexTesteIaDebug`.
- Repositório: `alexduvier-svg/Territ-rio-Gest-o-`.
- Branch: `codex/agro-gestao-teste-evolucao`.
- Commit exato do código compilado: `2c4bb0ae25cfe78573dbd054ddeb6ff6ed16eab6`.
- Compilação: 31/10/2026 às 22:56:48, horário de Brasília.
- SHA-256 do APK: `76bbd77a7aba0a0e02656b812fefabd2a2300097fa1d5957d77bb2bc99bf3695`.

O usuário solicitou posteriormente sair da139 e criar uma versão própria. A 142 mantém o código corrigido na branch independente e usa a identidade IA já existente. Não foi criada uma nova chave e nenhum APK histórico foi sobrescrito.

## Assinatura e instalações anteriores

Foi reutilizado o keystore privado `Codex_Teste_IA_assinatura.jks`, já salvo anteriormente, com certificado SHA-256 `b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86`. O Gradle recusa certificado diferente do esperado para a variante escolhida.

Esta instalação é **separada da139**, cujo pacote é `br.com.territorio.gestao2.codexteste`. Não atualiza, desinstala, limpa ou acessa os dados privados dessa instalação. Se a variante IA141 estiver instalada com a mesma chave, a142 usa o mesmo identificador e código maior. Não foi realizada instalação em nenhum aparelho durante esta sessão.

Dados da139 não são copiados automaticamente para a142. O produtor pode experimentar os dados de exemplo ou usar os controles existentes de backup/restauração. Não é necessário remover o aplicativo antigo.

Claude, Codex136, a branch experimental anterior e o commit original139 permanecem preservados. As mudanças desta entrega se restringem à branch de evolução. O arquivo APK e o keystore não estão no Git.

## Verificações concluídas

- Compilação Android concluída: **227 tarefas executadas**, `BUILD SUCCESSFUL`.
- Assinatura do APK verificada por `apksigner`, com certificado igual ao keystore IA preservado.
- Nome, pacote, versão e código conferidos por `aapt`.
- CRC de todos os arquivos do ZIP verificado.
- **59 arquivos de assets web** comparados byte a byte com a compilação web atual.
- Alinhamento ZIP de 16 KB verificado por `zipalign`.
- Segmentos de carga de todas as bibliotecas ELF nativas conferidos para alinhamento de 16 KB.
- ABI da variante: `arm64-v8a`. SDK mínimo declarado: 24. Essa declaração não substitui testes físicos de compatibilidade.
- Código web já validado com **860 testes de domínio e seis verificações de DOM** na etapa anterior; não houve mudança em sua lógica para esta compilação.

A inspeção estrutural não substitui um teste de instalação e uso em Android físico. Não houve ensaio físico de gestos, pagamentos, visual, desempenho ou inferência nesta sessão.

Evidência: `qa/android142-apk-verification.json`.

## Qwen e limites do teste

A integração do Qwen foi preservada no código, mas **este APK não inclui os pesos do modelo**. Por ser uma instalação separada, não pode ler o modelo privado da139. As consultas determinísticas locais funcionam sem ele. Não afirmar que a inferência Qwen foi testada ou que o modelo está ativo numa instalação nova.

Os limites funcionais e revisões ainda pendentes estão em `EVOLUCAO-TESTE-0.12.142.md`, especialmente revisão linguística integral, auditoria ampla de indicadores e cobertura de perguntas complexas de calendário/eventos. A entrega deste APK de teste não representa conclusão de todos esses itens nem aprovação para a Play Store.

## Instalação no celular

Baixe `Codex_Teste_142.apk` pelo arquivo disponibilizado na conversa e abra-o no Android para instalar. O aplicativo aparecerá como **Codex Teste 142**. A confirmação final de instalação pertence ao usuário. Não usar desinstalação ou limpeza da139 para instalar esta variante.

O GitHub Actions preparado na etapa anterior para a assinatura139 não foi usado. Esta compilação foi realizada no ambiente remoto da conversa, com SDK36, Build Tools35 instalado pelo Gradle, JDK21 e Gradle8.14.3.
