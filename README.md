# AGRO Gestão 2

Código do app em [app](app/), servidor em [portfolio-server](portfolio-server/). As referências, o mockup original e os materiais anteriores foram preservados. A fonte atual do aplicativo é app/src; não gerar novamente a partir do mockup.

A revisão 0.12.9 reúne preparação de carga da feira, rascunhos, cadastro de estoque, catálogo offline, privacidade, resumo por família, seleção centralizada de clientes/Estado e melhorias de movimento. Inclui resumos semanais/mensais de quantidade, valor vendido e lucro bruto com custo histórico conhecido, explicando a contribuição de cada medida. Veja [alterações](app/ALTERACOES-0.12.9.md) e [instruções de desenvolvimento](app/README.md).

Validação de domínio em app/tests e testes de interface isolados em qa/. Os scripts de navegador registram o ambiente de desenvolvimento original e podem exigir ajuste dos caminhos do runtime. Nenhuma base real do produtor está nos testes. A publicação do código não implanta o servidor nem instala automaticamente o aplicativo.

Assinaturas privadas, senhas, SDK, dependências, caches, dados do aparelho e binários gerados ficam fora do Git. Atualizações instaladas sobre registros reais precisam manter o pacote e o certificado originais. O material adicional de engajamento foi recebido e considerado, com avaliação documentada.
