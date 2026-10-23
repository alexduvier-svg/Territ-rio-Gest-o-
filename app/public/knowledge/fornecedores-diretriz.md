# Diretriz de fornecedores e inteligência de compras do AGRO Gestão

Versão 1.0 • 23 de outubro de 2026  
Destinatários: Codex e Claude Code  
Finalidade: avaliar e implementar gradualmente a comparação de fornecedores no APK, com funcionamento local e proteção do desempenho em celulares modestos.

## 1 Decisão solicitada ao Codex

Avaliar se o projeto atual comporta um módulo leve de Compras e fornecedores, integrado a estoque, produção, custos e contas a pagar. Antes de implementar, inspecionar o repositório real e devolver um parecer: implementar agora, implementar parcialmente ou adiar, com razões, dependências e estimativa de esforço. Não concluir viabilidade somente pela leitura deste documento.

O módulo deve responder: de quem comprar, quanto comprar, quando pedir, qual proposta cabe no caixa e quais riscos acompanham a escolha. A recomendação é comparar custo total, entrega, qualidade e pagamento, sem escolher automaticamente o menor preço anunciado.

Este documento é uma especificação proposta, baseada nas fontes da seção 18. Fórmulas, pesos, limites e metas aqui definidos são decisões de projeto a validar; não são um método certificado pelo Sebrae. Nenhum APK foi modificado ou testado na preparação desta diretriz. Um arquivo de orientação não se transforma sozinho em função: são necessários código, persistência, migrações, interface, testes e compilação.

## 2 Fundamentos da pesquisa

O Sebrae PR apresenta qualidade, preços, pagamentos, localização, confiança e alinhamento de expectativas como fatores de seleção. Também relaciona as condições de compra à capacidade financeira do negócio [1].

O Sebrae RS recomenda critérios explícitos de avaliação, consulta de referências e negociação. Para manter a relação, destaca comunicação, compromisso com pagamentos e confidencialidade [2].

Aplicação proposta: registrar tanto a proposta comercial quanto o cumprimento real do acordo. O fornecedor não deve ser julgado apenas pelo preço, nem responsabilizado por atrasos provocados pelo comprador. Avaliações devem identificar período, categoria e quantidade de observações.

A documentação Android descreve arquitetura com fonte local de dados para funcionamento sem conexão [3] e ferramentas de análise do consumo de memória [4]. A proposta é usar essas bases conforme a tecnologia já adotada no aplicativo, sem impor uma migração de framework.

## 3 Escopo por atividade

| Atividade | O que comprar e comparar | Cuidados específicos |
|---|---|---|
| Alimentos e agroindústria | Leite, farinha, café, frutas, mel, ingredientes | Lote, validade, conservação, rendimento e qualidade mínima |
| Embalagens | Potes, sacos, tampas, caixas e rótulos | Capacidade, dimensões, material, compatibilidade e quantidade por pacote |
| Artesanato | Fios, tecidos, madeira, tintas, cera, argila e ferragens | Espessura, composição, metragem útil, acabamento, perdas e variação de lote |
| Revenda | Produtos prontos adquiridos de outros produtores | Especificação, custo de aquisição, prazo e condição comercial |
| Serviços de apoio | Impressão, transporte, corte e acabamento | Escopo entregue, retrabalho, capacidade, prazo e garantia combinada |

Não comparar como equivalentes materiais de especificações diferentes sem confirmação. Metro de tecido depende da largura; rolo de fio depende da metragem e espessura. Converter litros em quilos exige fator específico validado. Molho, maço, caixa e cacho não possuem tamanho universal.

## 4 Verificação obrigatória antes de alterar o projeto

Mapear entidades, telas, serviços e documentos já existentes para pessoas, fornecedores, catálogo, unidades, estoque, fichas técnicas, despesas, contas a pagar e inteligência. Identificar a fonte de verdade de cada dado.

Entregar uma matriz com: função desejada, implementação atual, conflito ou duplicidade, componente a reaproveitar, mudança necessária e risco. Reaproveitar cadastros com papéis de cliente, produtor e fornecedor quando o modelo permitir. Não criar um segundo cadastro para o Clube AGRO Gestão.

CPF ou CNPJ, quando informados, podem ajudar na identificação; nomes e telefones semelhantes devem gerar candidatos à revisão, nunca fusão automática. Preservar fornecedores pessoa física sem exigir CNPJ. Não apagar regras antigas para resolver conflitos: documentar precedência, migrar dados com segurança e manter rastreabilidade.

## 5 Modelo mínimo de dados

| Entidade | Campos essenciais |
|---|---|
| Pessoa e papel fornecedor | ID estável, nome, contato opcional, localização, categorias, ativo, observações |
| Item e variante | ID do catálogo existente, tipo de uso, especificação, unidade base, conversões confirmadas |
| Relação fornecedor e item | Código do fornecedor, apresentação comercial, fator de conversão, pedido mínimo, múltiplo de compra |
| Cotação | Fornecedor, data, validade da oferta, local de entrega, moeda, itens, quantidades, descontos, frete, encargos e pagamentos |
| Linha de cotação | Item, variante, preço por apresentação, quantidade, conversão, disponibilidade e rendimento informado |
| Pedido de compra | Cotação de origem, status, linhas, versão, prazo prometido, parcelas e custos aprovados |
| Recebimento | Pedido e linha, data, quantidade entregue, aceita, rejeitada, lote, validade e motivo |
| Ocorrência | Tipo, evidência opcional, responsável, solução combinada, prazo e resolução |
| Resultado de análise | Versão da regra, dados usados, cenários, alternativas, explicação e limitações |

Campos opcionais devem permanecer desconhecidos quando ausentes. Frete não informado não equivale a frete grátis. Guardar origem e data das informações: orçamento digitado, compra anterior, informação do fornecedor ou estimativa do produtor.

Registrar dinheiro em centavos e quantidades em decimal de precisão controlada. Preservar o valor original e a unidade original para auditoria. Separar data prometida, prazo de fabricação, transporte e prazo de pagamento. Dias úteis exigem calendário e destino; se ausentes, pedir data de entrega explícita em vez de converter silenciosamente.

## 6 Como cruzar os dados

1. Selecionar item e variante pelo ID, não apenas pela semelhança do nome.
2. Validar equivalência técnica e converter quantidades para a mesma unidade.
3. Vincular cotações válidas dos fornecedores à necessidade de compra.
4. Cruzar estoque utilizável, reservas, pedidos em trânsito e demanda prevista.
5. Quando houver produção, converter demanda de produtos finais em necessidade de insumos pela ficha técnica e pelo rendimento confirmado.
6. Cruzar previsão de entrega com feira, encomenda ou data de fabricação.
7. Cruzar vencimentos das parcelas com saldo e compromissos financeiros registrados.
8. Acrescentar histórico real de qualidade, entrega e solução de problemas.
9. Gerar alternativas explicáveis, com dados faltantes e hipóteses visíveis.

Vendas de bolos não equivalem diretamente a consumo de farinha. É necessária uma ficha técnica e o registro de produção, ou uma estimativa explicitamente identificada. Receita prevista não deve ser tratada como dinheiro garantido.

Um registro de compra deve alimentar uma única cadeia de eventos. Cotação não movimenta estoque; pedido não confirma recebimento; recebimento parcial movimenta apenas a quantidade aceita. Criar despesa e conta a pagar pelo mesmo evento não pode duplicar custo ou obrigação.

## 7 Comparação econômica reproduzível

### Custo de aquisição

Para uma compra definida:

`custo_total = mercadorias - descontos_confirmados + frete + encargos_adicionais_confirmados`

Encargos já embutidos no preço não devem ser somados novamente. Separar juros contratuais de simulações de custo de capital. Benefícios fiscais não devem ser presumidos.

`custo_por_unidade_base = custo_total / quantidade_convertida`

Em pedidos com vários itens, ratear frete por uma base declarada, como valor ou peso. Se não houver peso, não inventá-lo. A soma dos rateios deve ser igual ao frete total, com ajuste explícito de arredondamento.

### Rendimento e perda

`quantidade_util = quantidade_convertida × rendimento`

`custo_por_unidade_util = custo_total / quantidade_util`

Rendimento deve ficar entre zero e um, com origem e período. Rendimento zero inviabiliza a divisão e a proposta. Não descontar duas vezes uma perda já refletida na quantidade aceita. Sem evidência de perda, apresentar o custo por unidade comprada e deixar a análise de rendimento indisponível ou como cenário.

### Prazo e desembolso

Mostrar o calendário nominal de pagamentos e o menor saldo projetado, respeitando compromissos conhecidos. Se o caixa estiver incompleto, informar essa limitação, sem selo de compra segura.

Opcionalmente, com taxa mensal de oportunidade informada pelo usuário:

`valor_presente = soma de parcela / (1 + taxa_mensal)^(dias_ate_parcela / 30)`

Essa é uma simulação econômica; não altera o valor a pagar. Usar taxa e convenção iguais para todas as alternativas. Não somar novamente um custo de capital já incorporado nessa comparação. A versão inicial pode operar somente com valores nominais e calendário.

### Quantidade e validade

`necessidade_liquida = máximo(0, demanda_no_horizonte + reserva_planejada - estoque_util - entradas_confirmadas_no_horizonte)`

Aplicar pedido mínimo e múltiplos somente depois de mostrar o excedente gerado. A demanda de encomendas já incluída na previsão não pode ser contada novamente. Insumos de vários produtos devem ser consolidados antes do arredondamento de compra.

Para perecíveis, comparar consumo esperado antes do vencimento com o lote oferecido. Falta de validade ou armazenamento deve interromper a conclusão de adequação. Em artesanato, considerar excesso de cor, padrão ou coleção que pode ficar parado, mesmo sem vencimento físico.

## 8 Exemplos de decisão

Todos os valores desta seção são fictícios para validação.

### Embalagens de mesma especificação

| Critério | Fornecedor A | Fornecedor B |
|---|---:|---:|
| Quantidade | 100 | 100 |
| Mercadoria | R$ 80,00 | R$ 95,00 |
| Frete | R$ 25,00 | R$ 0,00 confirmado |
| Total | R$ 105,00 | R$ 95,00 |
| Custo por unidade | R$ 1,05 | R$ 0,95 |
| Entrega prometida | 2 dias | 7 dias |

Se a necessidade é em três dias, B tem menor custo, mas não atende ao prazo. A custa R$ 10,00 a mais e é a única alternativa compatível com a data prometida. Sem confirmação atual de entrega, não garantir que chegará.

### Fio para artesanato com rendimento diferente

A vende 1.000 metros por R$ 80,00, com aproveitamento observado de 90%. B vende 1.000 metros por R$ 90,00, com aproveitamento de 98%. Sem frete adicional, A custa aproximadamente R$ 0,0889 por metro útil e B R$ 0,0918. A ainda é mais barato pelo rendimento registrado; a qualidade percebida e o retrabalho devem ser avaliados separadamente. Comparação válida apenas para composição e espessura equivalentes.

### Perecível com pedido mínimo

A oferece 20 kg por R$ 10,00/kg; B oferece 10 kg por R$ 12,00/kg. O consumo previsto antes do vencimento é de 10 kg, sem alternativa registrada de aproveitamento. A exige R$ 200,00 e expõe 10 kg ao risco de sobra; B exige R$ 120,00. Recomendar a quantidade adequada, explicando que o menor preço por quilo não significa menor gasto para a necessidade.

## 9 Seleção e classificação das alternativas

Aplicar restrições antes de pontuar: equivalência, quantidade disponível, prazo, validade, qualidade mínima e condições necessárias. Restrição desconhecida resulta em pendência de confirmação. Não permitir que preço baixo compense uma restrição essencial descumprida.

Apresentar, quando possível, três conclusões: menor custo entre propostas comparáveis; melhor atendimento ao prazo; melhor equilíbrio para as prioridades escolhidas. Pode haver empate ou nenhuma proposta adequada.

Uma pontuação secundária é opcional. Perfil inicial proposto: custo 35%, entrega 25%, qualidade 25%, condições de pagamento 15%. Os pesos somam 100%, são editáveis e não vêm das fontes pesquisadas. Definir referências estáveis por análise e mostrar a regra.

Exemplo de nota de custo: `100 × menor_custo_elegivel / custo_da_proposta`, apenas para custos positivos e quantidades efetivamente comparáveis. Nota de entrega pode usar proporção de entregas no prazo; qualidade, proporção de quantidade aceita; pagamento, atendimento à data de vencimento desejada definida pelo usuário. Sem histórico ou parâmetro, não inventar nota.

Não publicar nota geral quando faltar um componente obrigatório do perfil. Comparações parciais devem indicar quais critérios foram usados e não competir como se fossem completas. Mostrar denominadores: 1 entrega em 1 não prova maior confiabilidade que 45 em 50. Se duas alternativas mudarem de posição com pequenos ajustes de peso, informar que a preferência é sensível, em vez de declarar um vencedor absoluto.

## 10 Indicadores do relacionamento

| Indicador | Regra e interpretação |
|---|---|
| Pontualidade | Entregas realizadas até a data acordada divididas pelas entregas vencidas avaliáveis |
| Pedido completo e no prazo | Pedidos completos até a data acordada divididos pelos pedidos vencidos avaliáveis |
| Qualidade aceita | Quantidade aceita dividida pela quantidade entregue, na mesma unidade e categoria |
| Prazo realizado | Dias entre confirmação do pedido e recebimento; separar fabricação e transporte quando conhecidos |
| Solução de ocorrências | Tempo até resolução, acompanhado de ocorrências ainda abertas |
| Variação de preço | Diferença percentual do custo normalizado para mesma especificação e condições comparáveis |
| Concentração | Compras no fornecedor divididas pelas compras da categoria, em valor e período definidos |
| Pontualidade do comprador | Pagamentos realizados no prazo divididos pelos pagamentos vencidos avaliáveis |

Pedidos vencidos não entregues contam como atraso; cancelamentos precisam de motivo e regra explícita. Excluir do indicador de responsabilidade do fornecedor os atrasos atribuídos de forma documentada ao comprador, preservando o registro original. Pedidos futuros não entram como pontuais.

Separar desempenho por categoria e janela, por exemplo últimos 90 dias, quando houver dados. Sem dados suficientes, mostrar contagem e aviso de histórico inicial. Notas subjetivas de atendimento devem ser identificadas e não misturadas silenciosamente com medidas objetivas.

Manter histórico de acordos, amostras, preferências e resolução de problemas. Sugerir negociação respeitosa e consolidar compras quando houver benefício demonstrável. Não incentivar troca constante por diferenças pequenas sem avaliar transição, qualidade e continuidade.

## 11 Regras do motor de decisão

| Regra | Cruzamento necessário | Sugestão possível |
|---|---|---|
| Reposição a tempo | Consumo, estoque, pedidos abertos e prazo real | Preparar compra antes de faltar material |
| Desconto que gera excesso | Faixa de desconto, mínimo, demanda e caixa | Comprar menos, mesmo com preço unitário maior |
| Fornecedor alternativo | Concentração e item crítico | Cadastrar e testar uma segunda opção |
| Entrega para feira | Data da feira, produção e entrega | Pedir antes ou avaliar retirada local |
| Qualidade em queda | Rejeições recentes e ocorrências por lote | Solicitar amostra ou negociar correção |
| Impacto no resultado | Custo novo, ficha técnica, rendimento e preço de venda | Simular a mudança na margem de contribuição |
| Compra consolidada | Necessidades do período e faixas de frete | Reunir itens sem aumentar sobra ou comprometer caixa |
| Compra dividida | Urgência parcial e custo de dois fretes | Comprar parcela urgente e restante depois |
| Material substituto | Especificação, teste e ficha técnica | Avaliar alternativa após validação do produtor |
| Encomenda de artesanato | Pedido do cliente, materiais e capacidade | Reservar insumos e calcular data limite da compra |
| Sazonalidade | Calendário existente, histórico e encomendas | Planejar embalagens e materiais antecipadamente |
| Renegociação | Reajuste comparável, volume e pagamentos | Preparar pedido de revisão de preço ou prazo |

Sem estimativa confiável de demanda, pedir quantidade desejada em vez de prever automaticamente. Sem histórico de falta, não estimar probabilidade precisa de ruptura. Eventos e clima são contexto, não garantias de venda ou entrega. Só usar previsão meteorológica se o módulo existente fornecer local, data e atualização adequados.

Não recomendar pesticidas, dosagens ou substituições técnicas de insumos agrícolas por semelhança de preço. Para materiais em contato com alimentos, registrar os requisitos aplicáveis e a confirmação necessária; o motor não certifica segurança do material.

## 12 Explicações e limites de ação

Cada conselho deve conter: conclusão curta, números principais, motivo, alternativa, dados ausentes, data de análise e ação disponível. Exemplo: “B custa R$ 10 a menos, mas a entrega informada ocorre após sua feira. A atende à data prometida. Confirme a entrega antes de fechar.”

Estrutura sugerida: `rule_id`, `rule_version`, `analysis_id`, `input_refs`, `calculated_at`, `data_gaps`, `assumptions`, `recommendation`, `alternatives`, `suggested_action`. Um mesmo evento não pode gerar alertas duplicados. Recalcular ou marcar como desatualizado quando preço, quantidade, prazo ou estoque mudar.

O motor sugere e prepara rascunhos. Comprar, enviar mensagem, aprovar substituição, alterar preço de venda ou assumir dívida requer ação explícita do produtor. O usuário pode recusar e registrar motivo. A orientação não deve esconder seu direito de escolher outro fornecedor.

## 13 Interface e captura dos dados

Acesso inicial sugerido: Estoque → Compras e fornecedores, reaproveitando a navegação real. Usar cadastro progressivo, evitando exigir todos os dados na primeira utilização.

Fluxo: selecionar item → informar necessidade e data → adicionar propostas → comparar → escolher → registrar pedido → conferir recebimento. Começar com duas ou três propostas visíveis; expandir outras sob demanda. Na tela pequena, usar cartões com os mesmos campos e comparação em pares, evitando tabelas largas.

Mostrar no resumo: fornecedor, quantidade, custo total, custo normalizado, entrega e pagamento. Detalhes de qualidade e histórico ficam expansíveis. Usar controles com área de toque adequada, fonte escalável e estados que não dependam somente de cor.

Entrada inicial: digitação e reaproveitamento de compras anteriores. Texto de orçamento colado pode virar proposta de preenchimento, com confirmação de unidade, valor e prazo. Importação por CSV pode ser posterior. OCR, leitura de PDF e IA externa são opcionais, fora do núcleo inicial, com revisão humana e avaliação de custo e desempenho.

Preparar cotação padronizada para compartilhar pelo WhatsApp, incluindo especificação, quantidade, destino e data desejada. O aplicativo não lê automaticamente conversas. Dados locais continuam acessíveis sem conexão; enviar mensagens exige conectividade. Preços históricos devem ser identificados e não apresentados como oferta atual confirmada.

## 14 Arquitetura para celulares de menor desempenho

Implementar inicialmente com regras determinísticas, operações decimais e consultas indexadas. Não é necessário modelo de linguagem local, banco vetorial ou serviço de IA pago para calcular custos e comparar propostas. Se houver Gerente inteligente, ele consome a mesma função de cálculo e não cria uma segunda regra financeira.

Reutilizar banco e camada de dados existentes. Em Android nativo, Room sobre SQLite pode ser adequado; em Flutter, React Native ou aplicação híbrida, usar o mecanismo persistente já validado no projeto. Não assumir que o aplicativo é Kotlin.

Calcular sob demanda e após eventos relevantes, fora da thread de interface. Atualizar somente itens afetados. Paginar histórico e fornecedores; criar índices para item, fornecedor, status e datas, conforme consultas medidas. Evitar carregar anexos, todas as compras ou todo o catálogo na memória.

Guardar arquivos como anexos limitados e carregar miniaturas sob demanda. Não embutir fotos de fornecedores no APK. Evitar serviços permanentes, varreduras contínuas e recálculo ao digitar cada caractere. Usar tarefas agendadas apenas quando necessárias, com suporte da plataforma e restrições de bateria.

Perfis de execução devem se apoiar em sinais de memória e comportamento real, não em marcas como Samsung, Motorola ou famílias Exynos, Snapdragon e MediaTek. Um processador conhecido não garante memória livre nem bom desempenho. Permitir modo econômico manual, preservando comparações, registros e integridade dos dados; reduzir gráficos, animações e processamento opcional.

O modo econômico não pode alterar fórmulas, excluir fornecedores ou reduzir a precisão financeira. Em pouco espaço, avisar antes de gravar anexos e impedir gravação parcial. Persistir rascunhos para recuperação após encerramento do processo.

## 15 Segurança e integração financeira

Dados comerciais são privados por padrão. Compartilhar somente campos selecionados e mostrar a prévia. Não publicar preços negociados, documentos pessoais ou avaliações no Clube sem autorização específica. Excluir logs com conteúdo pessoal desnecessário e seguir o controle de acesso já existente.

Preservar cadastro único do produtor e adesão voluntária ao Clube. Na versão local, contatos de outros produtores são adicionados ou compartilhados manualmente. Disponibilidade atualizada entre aparelhos depende de troca de dados ou serviço compartilhado e não deve ser prometida nesta fase.

Recebimentos precisam de transação e idempotência: repetir confirmação não pode duplicar entrada de estoque nem conta a pagar. Tratar devolução por evento reversível e rastreável. Em produção, entrada de matéria-prima não aumenta estoque do produto final.

Custos novos devem alimentar o método de custeio já adotado. Não recalcular silenciosamente vendas passadas pelo preço da compra mais recente. Simulações futuras ficam separadas do resultado contábil ou gerencial já registrado. Margem de contribuição não equivale a lucro líquido.

## 16 Fases recomendadas e metas de avaliação

Fase 0: diagnóstico do projeto, matriz de reaproveitamento, avaliação de telas, migrações e medição de referência do APK.

Fase 1: cadastro, vínculo com itens, cotações, custo normalizado, frete, prazo, pagamento e comparação manual. Sem pontuação geral ou previsões automáticas.

Fase 2: pedidos, recebimento parcial, integração idempotente, histórico e ocorrências.

Fase 3: reposição, ficha técnica, caixa e regras explicáveis. Habilitar somente recomendações cujos dados existam.

Fase 4: comparação de cestas e divisão de compras. Limitar inicialmente a poucas alternativas selecionadas; não enumerar todas as combinações de fornecedores e itens. Uma heurística deve ser apresentada como estimativa, não como ótimo garantido.

Metas iniciais propostas para validação, não garantias: em aparelho Android de entrada suportado, comparar 20 propostas de um item com p95 até 500 ms, após dados disponíveis; abrir lista local paginada com p95 até 1 s; investigar aumento de memória de pico acima de 15 MB ou crescimento do APK acima de 2 MB atribuível ao núcleo. Ajustar limites pelo diagnóstico e justificar desvios.

Medir em build de release, com cenário e aparelho identificados, pelo menos 30 repetições para latência. Usar conjunto sintético inicial de 500 fornecedores, 5.000 itens e 20.000 linhas de histórico. Registrar comparação antes e depois para inicialização, PDV e estoque. Validar em aparelho de 2 GB se essa configuração fizer parte do suporte; emulador não substitui toda a validação física.

## 17 Testes e entrega exigida ao Codex

| Caso | Resultado esperado |
|---|---|
| Pacote de 100 contra pacote de 50 | Normalizar antes de comparar; respeitar múltiplos |
| Caixa ou maço sem quantidade conhecida | Pedir conversão; não declarar vencedor por unidade |
| Frete ausente | Mostrar pendência e custo incompleto |
| Cotação vencida | Excluir da recomendação atual ou exigir reconfirmação |
| Oferta barata chega após encomenda | Sinalizar incompatibilidade com o prazo |
| Pedido mínimo supera consumo | Mostrar excedente, gasto total e risco de sobra |
| Taxa zero e parcelas | Valor presente igual à soma nominal |
| Rendimento zero ou quantidade zero | Bloquear divisão e explicar o dado inválido |
| Histórico com uma entrega | Mostrar base pequena; não afirmar confiabilidade comprovada |
| Pedido atrasado e ainda aberto | Não contar como pontual |
| Recebimento parcial confirmado duas vezes | Uma única movimentação por evento |
| Devolução e cancelamento | Ajustes rastreáveis sem apagar histórico |
| Frete rateado e centavos | Soma exata do total com arredondamento controlado |
| Compra de farinha | Entrada em insumos; nenhuma criação automática de bolos |
| Sem internet e processo encerrado | Comparação local e rascunho recuperável |
| Migração e modo demonstração | Dados preservados e isolamento de dados fictícios |

Testar também aumento de fonte, tela de 320 dp de largura, teclado aberto e leitura com tecnologia assistiva. Todas as operações principais devem continuar acessíveis sem corte de botões.

O parecer técnico deve informar: interesse para o produto, cobertura atual, dados faltantes, decisão por fase, arquivos a modificar, dependências, migrações, riscos e plano de validação. Depois da implementação, entregar versão compilada identificada, resultados de testes e medições efetivas. Não declarar preservação de desempenho sem evidência. Se não houver acesso ao projeto ou ambiente de compilação, apresentar essa dependência claramente.

## 18 Fontes consultadas

Consulta realizada em 23 de outubro de 2026. As fontes sustentam princípios de gestão e arquitetura; as regras específicas do AGRO Gestão são propostas deste documento.

[1] Sebrae PR. Gestão de negócios Como escolher fornecedores para a minha empresa. Publicado em 8 de junho de 2022. https://sebraepr.com.br/comunidade/artigo/gestao-de-negocios-como-escolher-fornecedores-para-a-minha-empresa

[2] Sebrae RS. Onde encontrar fornecedores. Atualizado em 2023. https://digital.sebraers.com.br/blog/estrategia/onde-encontrar-fornecedores/

[3] Android Developers. Build an offline first app. https://developer.android.com/topic/architecture/data-layer/offline-first

[4] Android Developers. Android memory. https://developer.android.com/topic/performance/memory

[5] Android Developers. Memory allocation among processes. https://developer.android.com/topic/performance/memory-management

## 19 Organização dos campos dentro do APK

Proposta de navegação: Estoque → Compras e fornecedores. Dentro dessa área, usar três opções: Fornecedores, Comparar e Histórico. O histórico geral e o histórico dentro de um fornecedor consultam os mesmos registros, com filtros diferentes.

### Tela de fornecedores

Topo com busca e botão Adicionar fornecedor. Cada cartão mostra nome, categoria e um resumo curto como “Última compra em 15 out • R$ 180,00”. Não ocupar a listagem com todos os indicadores. Ao abrir um fornecedor, mostrar contato e três seções expansíveis: Produtos fornecidos, Compras e entregas, Acordos e ocorrências.

Cadastro inicial: nome, contato opcional e categoria. Em Mais informações, cidade, condições de pagamento, observações e documento opcional. Pedido mínimo e prazo podem variar por item e proposta; não copiá-los indiscriminadamente para todo o fornecedor.

### Tela de histórico

Filtros recolhíveis: período, fornecedor, item e status. Cada linha mostra data, fornecedor, item ou número de itens, total e situação, como A receber, Parcial ou Recebido. Pagamento deve ter estado separado da entrega. Ao tocar, expandir quantidades, preço unitário, frete, entrega prometida e realizada, parcelas e ocorrências.

No histórico de um item, mostrar uma sequência como “2 out • A • R$ 0,95/un” e “15 out • A • R$ 1,05/un”, sempre acompanhada da apresentação, quantidade e condição de frete. A variação só pode ser resumida como reajuste quando a base for comparável. Compras confirmadas e cotações devem ter identificação distinta. O botão Repetir compra prepara um rascunho e solicita atualização dos preços.

### Tela de comparação

Primeiro selecionar o que comprar, quantidade e data necessária. Depois adicionar propostas. Campos por proposta: fornecedor, apresentação, quantidade, preço, frete, data de entrega e pagamento. Qualidade, validade e observações ficam em detalhes. Campos não informados aparecem como pendentes.

Exemplo fictício para 100 embalagens equivalentes, com necessidade em três dias:

| Campo | Fornecedor A | Fornecedor B |
|---|---|---|
| Mercadoria | R$ 80,00 | R$ 95,00 |
| Frete | R$ 25,00 | Grátis confirmado |
| Total | R$ 105,00 | R$ 95,00 |
| Por unidade | R$ 1,05 | R$ 0,95 |
| Entrega | 2 dias | 7 dias |
| Pagamento | À vista | À vista |
| Conclusão | Atende à data prometida | Menor custo, chega após a data |

No celular, apresentar esses dados em cartões verticais com rótulos iguais, permitindo escolher duas propostas para comparação. Mostrar a recomendação curta e Por que esta sugestão como área expansível. Ações: Escolher proposta, Editar dados e Guardar comparação. Escolher ainda não envia pedido nem movimenta estoque.

### Dados informados e calculados

| Origem | Campos |
|---|---|
| Produtor ou orçamento confirmado | Preço, apresentação, quantidade, frete, datas e condições |
| Recebimento registrado | Quantidade aceita, data real, lote e ocorrência |
| Cálculo do aplicativo | Total, custo normalizado, diferença, prazo observado e indicadores |

Após a primeira compra, reaproveitar fornecedor e item. O usuário informa somente o que mudou e confirma as condições atuais. Histórico e comparativos precisam ser úteis também sem foto, anexo ou gráfico. Em telas pequenas, limitar indicadores ao contexto da tarefa; relatórios detalhados abrem sob demanda.

## 20 Instrução pronta para encaminhar

Codex e Claude Code, avaliem esta diretriz diante do código real do AGRO Gestão. Primeiro mapeiem funções e documentos existentes e proponham o reaproveitamento, evitando duplicação de cadastro, estoque, custos e inteligência. Emitam parecer sobre utilidade, viabilidade e esforço. Priorizem comparação local de preços normalizados, custo total, prazos, qualidade e pagamentos. Preservem o PDV e a operação em aparelhos modestos. Implementem por fases conforme a autorização do responsável pelo projeto, com migrações seguras, testes de integridade e medições em release. Não adicionem IA pesada ou serviço externo ao núcleo, nem prometam preços atuais, sincronização ou desempenho sem suporte e verificação.
