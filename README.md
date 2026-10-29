# AGRO Gestão Codex

Versão atual: **0.12.135**, pacote `br.com.territorio.gestao2`, instalada no Reno e no PKJ. [Seu lugar](app/docs/LOCALIZACAO-SEU-LUGAR-0.12.135.md) permite confirmar uma posição, usar um Plus Code completo ou ERD informado e compartilhar referências, Maps, Waze e Street View opcional. Inclui validação de GPS, gravação com recuperação de falhas e orientação correta para baixar mapas offline. Validação: 813 testes unitários, oito jornadas de navegador e quatro jornadas físicas com dados e GPS fictícios, nos dois temas.

A [correção de fluidez134](app/docs/FLUIDEZ-ABAS-0.12.134.md) foi preservada, assim como identidade, assinatura e dados do Codex.

A [cópia autorizada do Claude133](app/docs/CLONE-CLAUDE-CODEX-0.12.133.md) e a [integração132](app/docs/INTEGRACAO-CLAUDE-CODEX-0.12.132.md) permanecem como histórico. A correção134 não repete a transferência de dados.

Código do app em [app](app/), servidor em [portfolio-server](portfolio-server/). As referências, o mockup original e os materiais anteriores foram preservados. A fonte atual do aplicativo é app/src; não gerar novamente a partir do mockup.

A revisão 0.12.14 integra a abertura/fechamento aprovados no APK fornecido: janelas e páginas nascem do card tocado e voltam inteiras à origem, incluindo subjanelas. Preserva transparência discreta, degradê, claro/escuro e modo leve. Mantém os recursos da base0.12.11. Veja [alterações](app/ALTERACOES-0.12.14.md), [origem, comparação e validação](app/docs/INTEGRACAO-MOVIMENTOS-0.12.14.md) e [instruções de desenvolvimento](app/README.md).

Este ramo contém o AGRO Gestão **2**, pacote br.com.territorio.gestao2. O main contém a evolução independente do AGRO Gestão sem 2.

Validação de domínio em app/tests e testes de interface isolados em qa/. Os scripts de navegador registram o ambiente de desenvolvimento original e podem exigir ajuste dos caminhos do runtime. Nenhuma base real do produtor está nos testes. A publicação do código não implanta o servidor nem instala automaticamente o aplicativo.

Assinaturas privadas, senhas, SDK, dependências, caches, dados do aparelho e binários gerados ficam fora do Git. Atualizações instaladas sobre registros reais precisam manter o pacote e o certificado originais. O material adicional de engajamento foi recebido e considerado, com avaliação documentada.
