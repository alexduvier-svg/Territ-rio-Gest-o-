# Codex Teste147 — auditoria dos20 pedidos e retorno do cérebro

Data:2/11/2026, horário de Brasília. A orientação mais recente do usuário manda restaurar o cérebro e seu conteúdo; ela substitui a retirada do botão descrita na146. A pergunta única permanece abaixo de Receita por dia, seguida da Inteligência do Negócio. O cérebro volta como acesso às análises existentes, sem criar outro campo de perguntas.

## Origem e proteção

Repositório `alexduvier-svg/Territ-rio-Gest-o-`. Base confirmada antes de editar: entrega146, commit `8b8332a45b986466c657929ff31eb1a29c3b382d`, branch `codex/agro-gestao-146-gemini-gerente`. Snapshot adicional `codex/preservado-apk-146-8b8332a` aponta para essa mesma base. Nova branch exclusiva `codex/agro-gestao-147-auditoria`.

Commits de implementação publicados:

- `a8ff119db328d5754a69208b1c844a20468653f6`: gestos Android, catálogo e Saca.
- `23f62a74b3d756fdc95d45c2aa9c822dc41ba2d9`: fonte147, restauração do cérebro, validação e organização das áreas.

O build usa o commit local correspondente `5ba54f406e5fe250616c9d7ed751991167a77250`, árvore `7b3245b8d3b9c94d5411f2deed3d3e5096302ebe`, conferida idêntica à árvore do commit remoto23f62a. A diferença entre IDs locais/remotos decorre dos metadados de commits do conector; o conteúdo é o mesmo.

Claude permaneceu separado, na referência consultada `22e38139aa091364b5bc0048e639bdad68caea4e`; Codex136 permanece `78edfb5e2a44fc0819e5cf904420d4cb5f85c535`. Nenhuma escrita foi feita nesses ramos ou nas entregas anteriores. Não houve force push, exclusão, reset destrutivo, migração destrutiva, instalação no celular ou limpeza de dados reais. A mesma chave externa de assinatura IA foi recuperada; não foi criada outra chave nem publicada credencial no Git.

## Matriz requisito → evidência → limite

| Item | Tratamento nesta rodada | Evidência e limite |
|---|---|---|
|R01 Compras/recebimentos | Reutilizado pedido, recebimento parcial e movimento canônico; pendência não entra no saldo físico | Regressão de fornecedores e formulário real em DOM:100 comprados,60 recebidos,40 pendentes; idempotência nos testes de domínio |
|R02 Duplo toque | Corrigida identificação de toque físico quando Android emite contador de click zero; arbitragem/pressão longa existentes preservadas | Teste dirigido de duplo toque sem venda, toque simples único e cancelamento/hold; eventos simulados, Android físico pendente |
|R03 Entradas | Preservada pesquisa pelo histórico no Estoque e no Gerente | Controle e consultas em regressão; data efetiva confirmada separada do lançamento; apresentação histórica ausente continua explicitada |
|R04 Carrinho | Campo de quantidade agora arma a mesma revisão automática que o teclado; botão atualizado independentemente da existência do elemento de erro | DOM:3→1 produto, edição/retomada, continuar habilitado; testes canônicos de venda única e estoque; relato físico precisa reteste |
|R05 Gestão/cérebro | Cérebro restaurado por adendo; painel legado deixou de ser duplicado dentro da Gestão | DOM comprova botão, comparativos e ações; pergunta única continua na posição aprovada. Indicadores reutilizam os motores existentes |
|R06 Atualização integrada | Mantidos revisão de dados, invalidação e proteção de origem/contexto | Fluxos de recebimento, consulta, alteração e zerar fixture; não afirma cobertura física de todas as combinações possíveis |
|R07 Perguntas/contexto | Mantidos catálogo de planos, consultas locais e interpretação Gemini autorizada; fatos e cálculos nos motores | Regressão inclui CNPJ, produto esgotado, compras pendentes, referência, base vazia, erros e plano composto; fronteiraGoogle simulada. Compreensão irrestrita não comprovada |
|R08 Modelos | Integrações Qwen e Gemini preservadas; nenhum peso/modelo instalado automaticamente | Qwen0.6B continua laboratório porque avaliação anterior não o qualificou; presença de chave não prova inferência. Não houve nova comparação real de modelos |
|R09 Português | Revisados textos alterados: orientações, categorias, validação e lote/validade, preservando dados do produtor | Alterações contextuais no código; não se declara revisão humana exaustiva de cada texto de todo o aplicativo |
|R10 Campos | Unidade, nome, preço/custo obrigatórios e configurações de café ausentes/invalidas recebem marcação e texto acessível ao tentar salvar | DOM verifica aria-invalid e erros; campos opcionais de lote/validade não são marcados por estarem vazios |
|R11 Café verde | Catálogo e seleção de formato sugerem Saca em cadastro novo; escolha manual e produto existente preservados | Testes de catálogo sem saldo/peso presumidos; confirmação da unidade continua exigida |
|R12 60kg | Opção60000g, exibida60kg, disponível em café | DOM confere opção e rótulo;1saca continua1unidade de venda, sem conversão automática do saldo histórico |
|R13 Categorias | Faixa horizontal substituída por seta e janela de seleção no cadastro/entrada | DOM abre Cafés e retorna preservando formulário; categorias existentes continuam disponíveis |
|R14 Plantas | Adicionados Assa-peixe, Capuchinha, Vinagreira e Jambu após pesquisa do catálogo | Assa-peixe antes aparecia apenas em mel. Quatro referências únicas, identificação a confirmar; sem estoque ativo e sem orientação medicinal/alimentar |
|R15 Embalagem livre | Campo personalizado existente preservado em Mais opções, com sugestões e medidas separadas | DOM confirma acesso à entrada livre; sem criação de menu fechado ou alteração de embalagens antigas |
|R16 Lote/validade | Motor existente preservado; rótulo explícito Sem validade para Não se aplica; ausência de informação continua distinta | Regressões de datas, FEFO, saldo físico, vencidos, avisos, calendário e backup; Android notificações físicas pendente |
|R17 Formulário | Lidos apenas25 cabeçalhos preenchidos da planilha de respostas; comparação individual versionada | Sem leitura/importação das respostas. Perguntas analíticas parcialmente cobertas; opiniões são dados novos, não inferências. Não foi criada seção redundante |
|R18 Custos | Espaçamento próprio no botão Lançar custo | CSS aplicado no controle; não equivale a medição de geometria física em todos os aparelhos |
|R19 Orientações | Seções de acesso em Produtos e Clientes; distribuição por destino, com estado/evidência no mesmo ledger | Regra de destino testada; integridade permanece na Gestão. Cérebro pode consultar o conjunto completo, conforme adendo |
|R20 Red team | Revisão adversarial e regressão de integridade/contexto/duplicação/autorização | Encontrada e corrigida colisão de IDs entre painel da Gestão e cérebro; testes de planos inválidos, origem, unidades, cancelamento e registros únicos integram suíte. Não é pentest independente nem teste de hardware |

## Formulário e redundância

Fonte: planilha `FEIRA INVENTÁRIO RURAL CULTURAL 14/03/26 (respostas)`, aba `Respostas ao formulário 1`, somente intervalo `A1:AE1`. Das31 colunas disponíveis,25 cabeçalhos vieram preenchidos. O editor do Forms retornou403; a avaliação das perguntas usa os cabeçalhos da planilha fornecida posteriormente pelo usuário.

Mapeamento completo em `qa/forms147-mapping.json`. Tipos/quantidades levados, vendidos e restantes exigem distinguir estoque do produtor de carga da feira. Rankings e pagamentos se sobrepõem às análises existentes. Reposição é perguntada mais de uma vez no Forms. Tempo até esgotar exige histórico suficiente da carga; última venda não prova esse horário. Comparação caro/médio/barato exige critério e preço histórico, com dimensões comparáveis. Lucro depende de custo histórico e não é sinônimo de faturamento.

Gostar da feira, intenção de voltar e observações livres precisam ser declarados; não podem ser gerados pela inteligência a partir das vendas. Recomenda-se usar consultas/relatórios existentes para a parte analítica, sem reproduzir o questionário inteiro em outra seção. Coleta nova de opiniões fica para uma decisão específica de produto. Nenhuma resposta da planilha foi copiada para o app, fixtures ou Git.

## Testes e limitações

917 testes de código aprovados, zero falhas.25 verificações DOM aprovadas, com interface/controladores reais e fronteiraGoogle simulada. Os6 testes dirigidos novos verificam plantas únicas, verde/Saca sem peso presumido, destino de orientações e arbitragem de toques. A suíte geral inclui motores de compras, estoque/lotes, finanças, CNPJ, histórico, contexto, autorização e idempotência.

A primeira regressão acusou quatro expectativas desatualizadas de contagem/texto após as inclusões e revisão de português. Atualizados os contratos de catálogo para2523 referências (2479 originais+44 adições), mantendo22 categorias de origem; as quatro plantas usam Hortifruti, mapeado para Hortifruti-Granjeiro. A revisão do texto Não informada foi incorporada ao teste de escape do formulário. A rodada final ficou sem falhas.

Não houve execução real do Gemini com a chave do usuário, inferência Qwen/Nano física, instalação Android, teste de gestos no aparelho, notificações físicas ou medição de picoRAM/bateria. Esses limites permanecem abertos, mesmo com testes de código aprovados. O app deve pedir esclarecimento específico quando não houver consulta segura; não há promessa de responder corretamente qualquer pergunta.

O APK147 deve ser instalado como atualização do Codex Teste IA146, sem desinstalar ou limpar dados. A chaveGemini permanece no aparelho; sua autorização e o diagnóstico Verificar conexão do Gerente são independentes do Nano. Dados fictícios/base vazia seguem o mesmo caminho canônico; somente fixtures foram zeradas nos testes. O documento de entrega do APK registra hash, certificado, versão, compilação, link e verificação final.

A bateriaDOM foi ampliada para reproduzir um rascunho retomado de dois itens: a última quantidade digitada no campo libera o Carrinho após a revisão automática e preserva ambas as quantidades. A inclusão altera apenas o roteiroQA, sem mudança adicional no código compilado.
