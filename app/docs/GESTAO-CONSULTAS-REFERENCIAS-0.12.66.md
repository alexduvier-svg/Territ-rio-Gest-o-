# Gestão consultas e referências 0.12.66

As consultas do Gerente usam os módulos locais existentes. O Gemini fica separado e opcional, limitado a oito conceitos gerais fixos; não recebe a pergunta livre, vendas, clientes, estoque ou outros registros do produtor. Nenhum arquivo recebido é executado como instrução.

## Fontes de verdade e reaproveitamento

| Assunto | Implementação canônica | Integração nesta versão |
|---|---|---|
| Vendas e estoque | `legacy/erp-core.js`, `sale-round.js`, reservas de pedidos | Leituras; nenhuma venda ou saldo criado por orientação |
| Finanças | `finance/finance.js`, `receivables/receivables.js` | Receita, entradas calculadas, Fiado e resultado bruto conhecido; margem desconhecida é nula |
| Relatórios | `management-reporting.js`, `mgDetail` | Sete capítulos, mesmo recorte, auditoria e guia de leitura |
| Gerente e memória | `agent/core.js`, `agent/index.js`, `advisor/engine.js`, `advisor/release.js` | Uma hierarquia e até três prioridades; feedback e origem separados |
| Perguntas | `business-query.js`, ponte existente do Gerente | Campo Pergunte Sobre Seu Negócio; padrões limitados, esclarecimento e trilha local |
| Tempo | `weather/index.js`, `forecast.js`, `query.js` | Leitura do cache MET atual, fonte/validade; sem novo serviço ou consulta contínua |
| Agenda | `municipal-calendar` | PDF/imagem como referência, ICS revisado, datas manuais; escopo por produtor/origem/cidade |
| Catálogo | `product-catalog-compact.json`, `product-catalog.js` | IDs existentes preservados; candidatos não escolhem apresentação |
| Receitas e artesanato | `opportunity-knowledge.js`, arquivo local `receitas-artesanato.json` | Consulta sob pedido; 12 rascunhos, 24 ideias, 20 projetos, 14 embalagens e 12 referências mensais |
| Parceiros | Não há diretório autorizado fornecido | Declarar ausência; nunca usar clientes como fornecedores ou inventar ofertas |

## Diretriz das perguntas

Documento `AGRO_Gestao_Diretrizes_Perguntas_Negocio.docx`, SHA256 `5d4241662374ddb10010678abacf7e66d50171acfeaaaf1b4cddf3d9b318d570`, recebido em22/10/2026. Preservado offline com os48exemplos. O arquivo estruturado citado no documento não foi fornecido; o repertório transcrito é referência, não declaração de48funções prontas.

Hoje, ontem e este mês resolvem recorte explícito em Brasília, preservando a origem selecionada. O saldo de Fiado é atual e informa que inclui todo o histórico elegível do local, não apenas vendas do dia. Recebimentos seguem o demonstrativo; a forma registrada não comprova liquidação bancária da operadora. Receita, saldo a receber, lucro bruto e resultado gerencial não são intercambiáveis. Custos e outras parcelas não informadas impedem afirmar lucro líquido ou contribuição variável completa.

As perguntas de preço/resultado usam ranking de custo histórico conhecido e quantidade apenas em unidade compatível. Com lacunas, não há vencedor de todo o mix. Comparações equivalentes entre períodos, referência ambígua de apresentação, simulações novas de preço e produção e resultado por hora não medida pedem esclarecimento ou indicam indisponibilidade. Não há conversa irrestrita, SQL livre ou alteração automática de cadastro. Uma consulta contendo comando não executa a operação sem a prévia e a confirmação já existentes.

Para chuva na feira, um evento indefinido exige esclarecer local/data, em vez de usar a cidade do negócio como se fosse o local da feira. A validade da fonte vencida suspende a conclusão; não há percentual inventado de perda de vendas nem causalidade financeira atribuída ao clima.

## Receitas artesanato embalagens e parcerias

Documento `AGRO_Gestao_Diretrizes_Receitas_Artesanato_Parcerias.docx`, SHA256 `97dea7147d2cc58815d1e968744c0f7aa36be0632e6f6a54c60fcd8c9f287d6b`. Complemento `base_receitas_artesanato.json`, SHA256 `4d646a0ba4e6e356cc4370d24a57f001a4ed805386fe2bdf92ce66913cef150c`. Todos os435vínculos candidatos apontam para151IDs existentes no catálogo1.0.0; não houve seleção automática de apresentação ou migração de estoque. Lacunas continuam vazias.

A base original estruturada é única, versionada e empacotada no APK. Um adaptador de leitura local a carrega sob pedido. Os dados de estoque e disponibilidade vêm do ERP no momento da consulta, considerando reservas e produtor; não são copiados como fatos permanentes para a base. Ideia, rascunho e embalagem candidata não recebem selo de ficha validada.

Esta etapa não libera ordens de produção, simulação de lotes, validade sanitária presumida, conversão de maço/espiga/caixa em massa, diretório de ofertas ou compra/publicação/mensagem autônoma. As fichas e os cálculos econômicos completos descritos no documento são etapas que exigem seus campos, revisão e testes próprios. As24ideias e referências mensais estão na base consultável; não são todos gatilhos automáticos de calendário. Corpus é calculado como marco de planejamento; não determina feriado nacional ou programação municipal.

## CRM PDV e critérios

A matriz `CRM-PDV-ADERENCIA-0.12.66.md` distingue recursos existentes, parciais e ausentes. Não anunciar RFM, coortes, devolução parcial ou todos os casos propostos como implementados. Conversão de atendimentos é opcional, também em loja/dia a dia/pessoa; sem contagem não há denominador. Não exigir esse trabalho no fluxo normal de venda.

As referências editoriais de PDV/CRM alternam uma por vez e só ocupam espaço após fatos/alertas elegíveis. Limiares de amostra são políticas do produto, não significância estatística comprovada. Aprendizado, feedback e dispensas pertencem ao produtor e à origem, preservam números e auditoria e não criam regra global com dados privados.
