# Codex Teste 0.12.140 — ranking com os registros do sistema

## Correção

A pergunta “Quais são meus 3 produtos que vendem mais e os 3 que vendem menos?” é reconhecida antes do interpretador de vendas. O Gerente consulta as vendas e devoluções do mesmo demonstrativo/recorte da Gestão e usa o agregador e o classificador de product-period-reports. Não depende do Qwen ou do Worker para responder e não precisa esperar fechar 7/30 dias. Funciona com dados reais e demonstração identificada.

A resposta inclui nome, apresentação, quantidade líquida, valor vendido e lucro bruto quando o custo histórico está disponível. Quantidade fica separada por unidade; valor vendido e lucro são critérios próprios. Produtos ativos sem vendas entram com zero; cadastro futuro e itens arquivados sem atividade ficam fora. Histórico de produto removido/arquivado permanece quando registrado. Descontos e devoluções usam fatos históricos, inclusive devolução de venda anterior no recorte da devolução. Custo ausente não é zero.

Cadastros pequenos não repetem o mesmo produto nos dois grupos. Empates seguem o motor existente. Origem desconhecida, duplicação, datas futuras, itens inválidos e valores que não fecham com o demonstrativo bloqueiam a classificação. Nova consulta lê o estado atual, com produtor, local e período.

## Dicionário e matemática

features/portuguese.js é compartilhado pelas perguntas, catálogo, interpretação de fala, pedidos locais e fornecedores. O léxico regional continua no interpretador e as unidades/aliases no catálogo; nomes de exibição e dados gravados não são reescritos. A hierarquia v4 liga as referências dos setores, e as diretrizes matemáticas v7 apontam para os motores existentes. A consulta está registrada em docs/motor/registry.json como adaptador, sem fórmula financeira paralela.

O Qwen recebe idioma, versões das referências e regras comuns, além da resposta calculada. Seleciona trechos conferidos; títulos dos grupos, valores e limitações são preservados. Isso não é treinamento dos pesos nem importação do repositório inteiro como memória. Não existe dependência do Git em execução.

## Validação e entrega pendente

861 testes de domínio passaram na sessão recuperada. A compilação web passou. O teste DOM executou installAgent, agent-ask/Consultar, a ponte real de gerenciamento e o motor de produtos: exibiu os dois grupos, refletiu alteração de venda e troca de local e funcionou sem Qwen/Worker. O ambiente é simulado; não houve leitura de dados reais, instalação ou inferência no celular.

A sessão anterior chegou a compilar o Android, mas a conferência final do pacote não foi concluída e nenhum APK140 foi salvo como entrega. Depois da renovação do ambiente, o código foi recuperado a partir da139 e as correções foram reaplicadas e revalidadas. O SDK temporário e a chave de assinatura do teste não estão disponíveis nesta sessão.

A configuração está preparada para versão0.12.140-teste.4/código181/pacote br.com.territorio.gestao2.codexteste, mas **não há atualização APK140 compatível entregue**. Para substituir a139 sem apagar o app/dados é necessária a mesma chave privada de assinatura, cujo certificado público SHA256 é 2fb95cc1aa0aaf55ae607941e666099b81be35196f4dbbda6d99d45fd1346ef0. Não gerar outra chave e apresentar o resultado como atualização compatível. Não desinstalar ou limpar os apps do produtor.

O modelo privado já instalado continua no aplicativo do usuário. Pesos para instalação nova e publicação completa na Play Store permanecem uma etapa separada. A última entrega instalável permanece a139.

Prova de código: qa/codex-teste-ia4-validation.json. Fontes no ramo codex/gerente-local-preview. Não publicar chaves, APK, pesos ou dados de negócio no Git.
