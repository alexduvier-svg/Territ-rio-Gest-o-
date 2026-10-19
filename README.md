# AGRO Gestão 2

Código do app em [app](app/), servidor em [portfolio-server](portfolio-server/). As referências, o mockup original e os materiais anteriores foram preservados. A fonte atual do aplicativo é app/src; não gerar novamente a partir do mockup.

A revisão 0.12.11 unifica a física dos painéis de cada página, preserva conteúdo rolado no fechamento e evita prolongar movimentos por quadros atrasados. Mantém estoque, feiras, catálogo e privacidade anteriores. Veja [alterações](app/ALTERACOES-0.12.11.md), [verificação e limites](app/docs/QA-FLUIDEZ-2026-10-19.md) e [instruções de desenvolvimento](app/README.md).

Este ramo contém o AGRO Gestão **2**, pacote br.com.territorio.gestao2. O main contém a evolução independente do AGRO Gestão sem 2.

Validação de domínio em app/tests e testes de interface isolados em qa/. Os scripts de navegador registram o ambiente de desenvolvimento original e podem exigir ajuste dos caminhos do runtime. Nenhuma base real do produtor está nos testes. A publicação do código não implanta o servidor nem instala automaticamente o aplicativo.

Assinaturas privadas, senhas, SDK, dependências, caches, dados do aparelho e binários gerados ficam fora do Git. Atualizações instaladas sobre registros reais precisam manter o pacote e o certificado originais. O material adicional de engajamento foi recebido e considerado, com avaliação documentada.
