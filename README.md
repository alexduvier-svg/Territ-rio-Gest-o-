# AGRO Gestão

Código do app em [app](app/), servidor em [portfolio-server](portfolio-server/). As referências, o mockup original e os materiais anteriores foram preservados. A fonte atual do aplicativo é app/src; não gerar novamente a partir do mockup.

A revisão 0.12.10 corrige ordenação por família na entrada de estoque, cadastro com custo zero, formatos/pesos e janelas centralizadas com rolagem e tema coerente. Mantém preparação de feira, catálogo offline, privacidade e resumos semanais/mensais de quantidade, valor e lucro bruto conhecido. Veja [alterações](app/ALTERACOES-0.12.10.md) e [instruções de desenvolvimento](app/README.md).

Validação de domínio em app/tests e testes de interface isolados em qa/. Os scripts de navegador registram o ambiente de desenvolvimento original e podem exigir ajuste dos caminhos do runtime. Nenhuma base real do produtor está nos testes. A publicação do código não implanta o servidor nem instala automaticamente o aplicativo.

Assinaturas privadas, senhas, SDK, dependências, caches, dados do aparelho e binários gerados ficam fora do Git. Atualizações instaladas sobre registros reais precisam manter o pacote e o certificado originais. O material adicional de engajamento foi recebido e considerado, com avaliação documentada.
