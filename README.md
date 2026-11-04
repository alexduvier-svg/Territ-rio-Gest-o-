# AGRO Gestão Codex

Fonte atual preparada: **0.12.140/code181**. [Vendas, custos e indicadores integrados](app/docs/VENDAS-CUSTOS-INDICADORES-0.12.140.md): histórico e arquivo mensal, custo após a venda com auditoria, alertas de custo ausente, parcelas no Crédito e teclado de reposição compacto. Indicadores/CRM/ROI reutilizam registros e demonstrativo; áreas expansíveis e atualização por eventos. 1.159 testes unitários e oito cenários de navegador aprovados; validação física e instalação140 aguardam conexão dos aparelhos. A139 abaixo é a última versão instalada.

Última versão instalada: **0.12.139**, pacote `br.com.territorio.gestao2`, instalada no Reno e no PKJ. A [correção de reposição e esgotados](app/docs/REPOSICAO-ESGOTADOS-0.12.139.md) permite repor um produto e seguir ao próximo, ou deixá-lo para depois; usa bolinha antes da primeira palavra, conta esgotados no Estoque e restaura a ordem após qualquer reposição positiva. Após vender, o botão é Voltar ao Início. Mantém a [integração Claude148–157](app/docs/INTEGRACAO-CLAUDE157-CODEX-0.12.138.md) e as proteções próprias do Codex. Validação139: 1.133 testes unitários, oito jornadas de navegador e quatro físicas nos dois temas, com dados e GPS fictícios. Zerar/restaurar foi exercitado somente no auxiliar isolado.

[Seu lugar135](app/docs/LOCALIZACAO-SEU-LUGAR-0.12.135.md) continua disponível, com código completo, confirmação, Maps/Waze e Street View opcional.

A [correção de fluidez134](app/docs/FLUIDEZ-ABAS-0.12.134.md) foi preservada, assim como identidade, assinatura e dados do Codex.

A [cópia autorizada do Claude133](app/docs/CLONE-CLAUDE-CODEX-0.12.133.md) e a [integração132](app/docs/INTEGRACAO-CLAUDE-CODEX-0.12.132.md) permanecem como histórico. A correção134 não repete a transferência de dados.

Código do app em [app](app/), servidor em [portfolio-server](portfolio-server/). As referências, o mockup original e os materiais anteriores foram preservados. A fonte atual do aplicativo é app/src; não gerar novamente a partir do mockup.

A revisão 0.12.14 integra a abertura/fechamento aprovados no APK fornecido: janelas e páginas nascem do card tocado e voltam inteiras à origem, incluindo subjanelas. Preserva transparência discreta, degradê, claro/escuro e modo leve. Mantém os recursos da base0.12.11. Veja [alterações](app/ALTERACOES-0.12.14.md), [origem, comparação e validação](app/docs/INTEGRACAO-MOVIMENTOS-0.12.14.md) e [instruções de desenvolvimento](app/README.md).

Este ramo contém o AGRO Gestão **2**, pacote br.com.territorio.gestao2. O main contém a evolução independente do AGRO Gestão sem 2.

Validação de domínio em app/tests e testes de interface isolados em qa/. Os scripts de navegador registram o ambiente de desenvolvimento original e podem exigir ajuste dos caminhos do runtime. Nenhuma base real do produtor está nos testes. A publicação do código não implanta o servidor nem instala automaticamente o aplicativo.

Assinaturas privadas, senhas, SDK, dependências, caches, dados do aparelho e binários gerados ficam fora do Git. Atualizações instaladas sobre registros reais precisam manter o pacote e o certificado originais. O material adicional de engajamento foi recebido e considerado, com avaliação documentada.
