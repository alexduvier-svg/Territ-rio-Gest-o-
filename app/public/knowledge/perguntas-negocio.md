# Perguntas Sobre o Negócio

Fonte fornecida em22/10/2026, SHA256 5d4241662374ddb10010678abacf7e66d50171acfeaaaf1b4cddf3d9b318d570.

A referência propõe48perguntas. Esta versão integra a consulta ao Gerente, perguntas de receita/recebimentos, resultado bruto conhecido, estoque, previsão salva e material local. Não promete compreensão irrestrita, simulação automática de preço/produção, contribuição completa sem variáveis, comparações equivalentes ou cálculo por tempo não medido. O arquivo perguntas_negocio.json citado no documento não foi anexado; o repertório foi transcrito para consulta, sem tratar cada frase como funcionalidade liberada. Operações continuam sujeitas aos comandos e confirmações existentes.

Diretrizes para perguntas sobre o negócio no AGRO Gestão
Especificação para Codex e Claude Code. Versão 1 de 22 de outubro de 2026.
Criar um campo de consulta chamado Pergunte sobre seu negócio, integrado ao Gerente já existente. O produtor poderá escrever perguntas sobre vendas, recebimentos, contribuição dos produtos, estoque, clima e próximas ações. A resposta deve usar dados reais, cálculos verificáveis e regras explícitas.
Viabilidade e proposta inicial
É possível construir o núcleo com consulta local ao banco do app, reconhecimento de intenções, formulários curtos e respostas por modelos de texto. Essa versão responde ao conjunto previsto de perguntas e variantes conhecidas. Compreensão irrestrita de qualquer texto não deve ser prometida. Um modelo de linguagem local ou remoto é extensão opcional, sujeita à avaliação técnica e autorização, sem substituir o cálculo determinístico.
Experiência de uso
Campo com texto de apoio: Pergunte sobre vendas, produtos, estoque ou clima. Sugestões iniciais: Quanto vendi hoje?; Qual produto deixou mais resultado?; Vai chover na feira?; O que fazer agora? Usar digitação na primeira versão; reaproveitar voz somente se já estiver implementada, funcionando e habilitada pelo usuário.
A resposta ocupa um card com conclusão, dados principais, interpretação e próxima ação. Período, origem da venda e local ficam visíveis em filtros editáveis. Mostrar detalhes, contas e fontes em seção expansível. Não abrir automaticamente uma nova página para cada especialista.
Exemplo da experiência
Pergunta: O produto mais caro compensou? Resposta: No período selecionado, A vendeu 12 unidades e deixou R$ 300 de contribuição. B vendeu 60 e deixou R$ 240. A contribuiu mais, embora B tenha faturado mais. Próxima ação sugerida: testar reposição de A conforme demanda e capacidade, preservando B enquanto sua função no mix for avaliada. Valores deste exemplo são fictícios.
Este documento contém 48 perguntas iniciais, contratos de consulta, comparação calculada, regras de clima e ações e critérios de aceite. A integração requer acesso ao código e ao banco reais; enviar o documento não implementa a função por si só.

Dados e contexto que toda pergunta precisa respeitar
Dimensão
Regra obrigatória
Produtor e permissão
Consultar apenas o escopo autorizado e permissões atuais.
Período
Usar fuso do negócio e intervalo com início e fim explícitos.
Origem
Todas as vendas por padrão; permitir evento PF e empresa conforme cadastro.
Identidade do produto
Selecionar produto família e apresentação; confirmar ambiguidades.
Local e clima
Distinguir endereço do negócio local da feira e trajeto.
Base monetária
BRL com valores decimais; manter política de arredondamento do ERP.
Atualização
Informar última sincronização ou edição relevante; recalcular quando mudar.

Contratos de venda e recebimento
Venda finalizada válida é diferente de carrinho, orçamento e pedido pendente. Separar cancelamentos, devoluções, descontos, frete cobrado e taxas pelo contrato do módulo atual. Recebimento registra liquidação efetiva: venda a prazo entra na análise de vendas segundo a regra existente, mas não vira dinheiro recebido no mesmo instante. Aporte, empréstimo e transferência não são faturamento de produto.
Custos e integridade
Usar custo associado à transação ou apurado para o período pelo método já adotado. Não aplicar custo de reposição atual retroativamente sem apresentar isso como simulação separada. Custo ausente permanece desconhecido, nunca zero. Identificar perdas, embalagem, taxa de pagamento, tributo variável e trabalho variável quando aplicáveis, sem contagem dupla.
Desconto total do carrinho precisa de rateio determinístico nas linhas para comparar produtos. Registrar método, arredondamento e ajuste de centavos. Devolução parcial deve reverter receita e custo conforme a ocorrência e a política definida, sem presumir que todo item devolvido retornou ao estoque utilizável.
Períodos comparáveis
Este mês significa início do mês até o momento. Comparar com intervalo equivalente do período anterior por padrão, informando datas; oferecer mês fechado como alternativa. Hoje usa dia civil do negócio. Semana segue configuração local. Resolver ontem, amanhã, sábado e próxima feira com data explícita. Se não houver evento inequívoco, pedir local e data antes de consultar clima.

Métricas oficiais e cálculos explicáveis
Codex deve reutilizar as definições do ERP e documentar qualquer divergência antes de alterar. O campo de perguntas e o painel de gestão precisam produzir o mesmo valor para a mesma consulta. Não criar uma segunda definição escondida de faturamento.
Métrica
Definição de referência
Receita de produtos
Somatório das linhas válidas após descontos e devoluções reconhecidas. Exibir bruto e deduções quando necessário.
Recebido no período
Entradas liquidadas de clientes no intervalo, com estornos tratados pela regra financeira.
Contribuição total
Receita de produtos menos custos e despesas variáveis correspondentes.
Contribuição por unidade
Contribuição total dividida por quantidade vendida elegível, na mesma unidade.
Margem de contribuição percentual
Contribuição total dividida pela receita correspondente vezes 100, se denominador positivo.
Ticket médio
Receita elegível dividida por número de vendas elegíveis; não pelo número de itens.
Variação percentual
(Atual menos anterior) dividido pelo anterior vezes 100; base zero exige regra específica.
Resultado operacional gerencial
Contribuição do período menos custos e despesas fixas do período; explicitar ajustes e escopo.

Resultado não é sinônimo de caixa
Lucro líquido exige as demais receitas, despesas, tributos, resultados financeiros e critérios contábeis aplicáveis. Se a base só contém vendas e custos variáveis, responder com margem de contribuição e explicar que ainda não é lucro líquido. A pergunta coloquial deu lucro deve ser acolhida sem transformar uma métrica incompleta em certeza.
Casos de borda
Com custo incompleto, calcular apenas a parcela conhecida e indicar cobertura por linhas e por receita. Não ranquear todo o mix como se estivesse completo. Receita zero ou negativa não suporta percentual convencional de margem; explicar o caso. Base anterior zero permite informar diferença absoluta e início de vendas, sem crescimento infinito.
Faturamento de kits deve usar o modelo atual de composição e rateio. Não somar a venda do kit à venda dos seus componentes como duas receitas. Unidades de kg, maço, peça e pacote não entram num ranking único de quantidade sem separação explícita.

Comparação entre produto caro e produto que vende mais
Exemplo didático com dados fictícios completos. Mesmo período e canal, sem descontos, devoluções ou custos omitidos. O custo variável inclui todas as parcelas variáveis consideradas no exemplo; custos fixos não foram rateados. Quantidade é medida em unidades comerciais definidas.
Indicador
Produto A
Produto B
Produto C
Preço por unidade
R$ 60,00
R$ 15,00
R$ 8,00
Quantidade vendida
12
60
100
Receita
R$ 720,00
R$ 900,00
R$ 800,00
Custo variável por unidade
R$ 35,00
R$ 11,00
R$ 7,00
Contribuição por unidade
R$ 25,00
R$ 4,00
R$ 1,00
Contribuição total
R$ 300,00
R$ 240,00
R$ 100,00
Margem de contribuição
41,67%
26,67%
12,50%
Tempo por unidade medido
10 minutos
2 minutos
1 minuto
Contribuição por minuto
R$ 2,50
R$ 2,00
R$ 1,00

Resposta correta à pergunta
A é o mais caro e deixou a maior contribuição total neste exemplo: R$ 300,00. B trouxe a maior receita: R$ 900,00. C vendeu mais unidades: 100. A soma da receita é R$ 2.420,00 e a da contribuição R$ 640,00. Isso não prova qual deu maior lucro líquido, pois os custos fixos e outras parcelas não estão apurados aqui.
E agora o que fazer
A: verificar procura não atendida, saldo e capacidade antes de testar mais oferta. B: manter e avaliar se seu volume e recorrência ajudam o negócio; testar custos e preço sem presumir que reduzir quantidade melhora o resultado total. C: investigar custos, descontos e papel no mix; não retirar só pela margem menor, pois pode ter função complementar.
Se o tempo medido for o gargalo real, A também lidera contribuição por minuto neste cenário. Se o gargalo for capital, equipamento ou refrigeração, usar outro recurso e seus dados. Projeção de contribuição por hora não autoriza presumir demanda infinita nem ampliar produção sem compradores.
Comparação justa
Checar horas disponíveis para venda, ruptura de estoque, canal, peso, tamanho do lote, custo de exposição, encomendas e número de vendas. Um item que ficou esgotado não deve ser chamado de pouco procurado por ter vendido poucas unidades.

Chuva previsão e decisões para o negócio
Reutilizar a função de clima já instalada
Consultar o fornecedor existente, sem criar outro serviço por padrão. O adaptador deve fornecer local, coordenadas quando autorizadas, data de emissão, consulta, validade, janelas horárias, unidades, acumulados e alertas disponíveis. Exibir o horário da informação. Sem dados atuais, dizer que não é possível confirmar a previsão e oferecer atualizar ou abrir a fonte.
Não gerar previsão meteorológica dentro do modelo de linguagem. Não usar média histórica como previsão de amanhã. Probabilidade de chuva deve manter o significado do provedor para o local e intervalo; 70% de chance não significa chover 70% do dia, nem redução de 70% nas vendas. Não somar probabilidades horárias como se fossem independentes.
Perguntas antes de orientar
Qual feira ou atividade? Em que local e horário? O espaço é coberto? Há produto exposto, trajeto crítico ou necessidade de refrigeração? Usar dados já confirmados do evento e perguntar apenas o que faltar. Probabilidade, volume, vento e alerta têm papéis diferentes; não reduzir tudo a um ícone de chuva.
Situação
Ação de negócio candidata
Possibilidade de chuva em evento descoberto
Rever proteção adequada, embalagem, exposição e comunicação com organização.
Encomendas confirmadas e perecíveis
Planejar produção e retirada pelo compromisso e pela conservação validada.
Demanda incerta e chuva prevista
Comparar lote menor, pré-encomenda e reposição se houver logística viável.
Calor previsto e conservação sensível
Verificar capacidade térmica e processo; não inventar prazo seguro.
Alerta severo aplicável
Mostrar aviso oficial com validade e orientações; priorizar segurança e organização.

Cenários sem adivinhação
Comparar cenário de menor público, público usual e encomendas confirmadas com quantidades informadas ou justificadas pelo histórico. Apresentar custo, contribuição e sobra em cada cenário. Percentual de redução é hipótese declarada, não previsão calculada da chuva. Só ponderar cenários por probabilidades quando houver modelo calibrado, eventos definidos e validação; na primeira versão, manter cenários separados.
O app não deve recomendar aplicação de defensivos, travessia de trecho alagado, colheita técnica ou outras decisões agronômicas específicas a partir de regra comercial genérica. Para rota, alertas meteorológicos não comprovam condição de cada estrada. Não cancelar evento ou pedido automaticamente.

Arquitetura local de interpretação e consulta
Uma interface para os motores existentes
O Gerente recebe a pergunta e consulta módulos reais: vendas, finanças, estoque, clientes, agenda e clima. Os especialistas podem participar internamente sem exigir múltiplas conversas ou novos cadastros. A base de produtos receitas artesanato e embalagens serve como conhecimento complementar; dados operacionais vêm das respectivas fontes de verdade.
Fluxo de processamento
1. Validar sessão e permissão. 2. Normalizar texto para busca preservando o original. 3. Identificar uma ou mais intenções e entidades. 4. Resolver período produto canal e local. 5. Pedir esclarecimento se houver conflito. 6. Executar consulta permitida. 7. Calcular métricas determinísticas. 8. Aplicar regras de interpretação. 9. Gerar resposta com evidências. 10. Preparar a próxima ação sem executá-la por inferência.
Sem API paga na primeira versão
Implementar dicionário de expressões, aliases de produtos existentes, padrões de data, intenções registradas e respostas por modelos. Exemplos: vendi, vendas, faturamento; sobrou, deu lucro, compensou; chuva, chover, tempo. O contexto diferencia tempo de produção de tempo meteorológico. Frase fora do repertório abre opções curtas de esclarecimento, sem resposta inventada.
A comparação textual auxilia reconhecimento, mas não prova intenção. Para café caro, mostrar candidatos e perguntar qual produto quando houver mais de um. Se a frase contiver comparação e ação, responder primeiro ao diagnóstico e depois à simulação. Não transformar uma pergunta sobre preço em comando para alterar o cadastro.
Contrato técnico de consulta
Usar catálogo de funções de leitura com argumentos tipados e validação: consultar_vendas, consultar_recebimentos, comparar_produtos, consultar_estoque, consultar_clima_evento, simular_preco e buscar_ofertas_autorizadas. Esses nomes são propostas de contrato, a adaptar ao código. Nunca executar SQL livre produzido pelo texto do usuário ou modelo. Usar consultas parametrizadas e escopo imposto pelo serviço, não pelo prompt.
Desempenho
Priorizar índices por produtor data evento e produto; usar agregações do ERP quando existirem. Paginar resultados e limitar histórico exibido. Reutilizar o mecanismo adaptativo do aparelho, com execução cancelável fora da interface. Cache guarda chave da consulta, versão e dependências; mudança de venda custo estoque ou previsão invalida o resultado pertinente. Não carregar todo o catálogo em cada pergunta.

Formato da resposta conversa e rastreabilidade
Resposta em cinco partes
Parte
Conteúdo
Conclusão
Responder à pergunta em até duas frases com a métrica correta.
Evidências
Período, produtos, quantidades, valores e origem consultada.
Interpretação
Explicar por que um resultado difere de volume ou faturamento.
Próxima ação
Uma a três opções proporcionais aos dados; preferir simulação ou teste.
Limites
Dados ausentes, atualização e incerteza material em linguagem clara.

Estados de resposta
Resultado calculado: dados suficientes e contrato conhecido. Resultado parcial: falta dado que limita a comparação. Simulação: alteração hipotética com premissas visíveis. Necessita esclarecer: intenção ou entidade ambígua. Indisponível: dado ausente, sem permissão ou previsão fora da validade. A confiança do classificador mede interpretação da pergunta, não probabilidade de sucesso comercial.
Continuidade de conversa
Após comparar A e B, a pergunta e se eu subir R$ 2? herda os candidatos da conversa, mas confirma qual deles se a referência estiver ambígua. Mostrar o contexto ativo e permitir Limpar conversa. Alteração de período ou produto deve atualizar os cálculos, sem reaproveitar números do contexto anterior. Reconsultar os dados se tiverem mudado.
Explicação acessível
Usar frases como: Esse produto deixou R$ 25 por unidade para ajudar a pagar os gastos fixos e formar o resultado. Disponibilizar o termo técnico margem de contribuição em detalhes. Não afirmar que o dinheiro está no caixa quando a venda ainda não foi recebida. Usar tabela curta para comparar produtos e gráfico somente se acrescentar compreensão.
Trilha verificável
Guardar ID da consulta, intenções, argumentos resolvidos, regra e versão, IDs ou agregados de origem, data da leitura, métricas e pendências. O número exibido deve poder ser reproduzido no módulo de origem. Exportação de resultado usa permissão e escopo do usuário; não inclui automaticamente dados de clientes ou de outros produtores.
Formato JSON proposto: status, intencoes, contexto, conclusao, metricas, evidencias, premissas, dados_ausentes, alternativas, acoes_propostas e atualizacao. Toda ação traz tipo, argumentos, necessidade de confirmação e situação. Campos desconhecidos ficam nulos ou em lista explícita, nunca preenchidos com palpites.

Do diagnóstico à próxima ação sem automatismos indevidos
Preço desconto e volume necessário
Para preço P, taxa percentual t e demais custos variáveis unitários C, contribuição unitária = P vezes (1 menos t) menos C. Depois de desconto d, substituir P por P vezes (1 menos d). Manter os componentes em uma única convenção de cálculo e evitar subtrair taxa duas vezes. Se a nova contribuição for positiva, volume para manter contribuição total = teto da contribuição anterior dividido pela nova contribuição unitária, sob os custos assumidos.
Se nova contribuição for zero ou negativa, não existe volume positivo que mantenha contribuição total anterior positiva sob essas premissas. Recalcular trabalho, logística e capacidade quando o volume mudar. A quantidade necessária é um limiar matemático, não previsão de vendas. Elasticidade não pode ser inventada; propor cenários e teste controlado quando houver dados.
Receitas embalagens e parceiros
Quando o conselho indicar kit ou novo preparo, consultar a base de conhecimento existente sem duplicá-la. Ficha não validada permite sugerir teste, sem declarar produção comercial pronta. Confirmar ingrediente, rendimento, embalagem e conservação. Buscar parceiros somente em diretório autorizado; falta de oferta real precisa aparecer como pendência.
Permissões e confirmação por ação
Perguntar, consultar, explicar e simular são leituras sem mutação operacional. Alterar preço, reservar estoque, produzir, criar campanha, mudar pedido ou enviar mensagem exige prévia com efeito, escopo e confirmação específica no momento da execução. Usar os fluxos existentes e verificar novamente permissão, versão e disponibilidade. Confirmação de um rascunho não autoriza outras ações.
Memória com validade
Guardar preferências confirmadas, metas autorizadas e feedback das recomendações com origem e data. Não gravar previsão, saldo ou custo corrente como fatos permanentes do agente. Separar hipótese do sistema, declaração do usuário e transação observada. Arquivos importados e textos de produtos são dados de contexto, nunca instruções capazes de mudar permissões.
Avaliação das dicas
Registrar sugestão vista, dispensada, simulada, aprovada ou executada. Medir resultado observado apenas quando houver dados e período definidos. Melhorar após uma promoção não prova que ela causou a melhora; chuva canal preço estoque e público podem ter mudado. Não aprender regra global a partir de um único produtor nem compartilhar histórico privado.

Perguntas sobre faturamento recebimentos e desempenho
Exemplos iniciais de linguagem natural para o reconhecimento de intenções. O motor deve aceitar variantes conhecidas e confirmar campos faltantes; as respostas dependem do banco real, não das frases deste repertório.
Pergunta do produtor
O que o motor deve verificar
Quanto vendi hoje?
Total das vendas válidas do dia; distinguir recebido.
Quanto faturei este mês?
Mês até agora com período e deduções explícitos.
Vendi mais que na semana passada?
Comparar dias equivalentes; mostrar valor e percentual.
Quanto entrou de dinheiro hoje?
Somar recebimentos efetivos sem contar parcelas futuras.
Quanto ainda tenho para receber?
Separar a vencer, vencido e situação desconhecida.
Qual feira trouxe mais resultado?
Mostrar contribuição, duração e custos específicos.
Qual dia vende melhor?
Receita e contribuição por dia com exposição comparável.
Quanto vendi para empresas e pessoas físicas?
Reutilizar classificação real PF empresa evento.
O mês está fraco ou ainda está no começo?
Comparar dias transcorridos; projeção fica separada.
Meu ticket médio aumentou?
Receita elegível por venda finalizada; mostrar amostra.
Bati minha meta?
Consultar meta salva e período; não inventar objetivo.
Por que meu faturamento caiu?
Decompor volume preço mix descontos e dias; causa só com evidência.

Cada pergunta possui ID e intenção no arquivo estruturado. Não usar coincidência de palavra isolada como confirmação suficiente de entendimento. Antes de responder, resolver período e escopo e aplicar os contratos de dados e de métricas desta diretriz.

Perguntas sobre produtos preço margem e promoção
Exemplos iniciais de linguagem natural para o reconhecimento de intenções. O motor deve aceitar variantes conhecidas e confirmar campos faltantes; as respostas dependem do banco real, não das frases deste repertório.
Pergunta do produtor
O que o motor deve verificar
O mais caro deu mais lucro?
Comparar contribuição total unitária e percentual.
Vendi muito e sobrou pouco dinheiro por quê?
Conciliar vendas recebimentos custos e retiradas.
Qual produto realmente compensa vender?
Considerar contribuição demanda capacidade e risco.
Qual vendeu mais unidades?
Comparar unidades compatíveis; separar apresentações.
Qual deixou mais resultado no total?
Usar custos históricos completos e retorno de vendas.
O café de 500 g foi melhor que o de 250 g?
Mostrar por embalagem por kg e contribuição; não somar estoques.
Posso dar 10% de desconto?
Recalcular contribuição e volume de equilíbrio sem prever demanda.
Se aumentar R$ 2 vou ganhar mais?
Simular quantidade constante e cenário de queda; demanda incerta.
Vale fazer um combo?
Comparar contribuição e custo de montagem com venda separada.
Embalagem de presente compensa?
Comparar custo adicional preço necessário e aceitação não comprovada.
Devo parar de vender esse produto?
Examinar período disponibilidade e complementaridade antes de sugerir retirada.
Qual dá mais resultado pelo meu tempo?
Dividir contribuição pelo gargalo medido; não inventar horas.

Cada pergunta possui ID e intenção no arquivo estruturado. Não usar coincidência de palavra isolada como confirmação suficiente de entendimento. Antes de responder, resolver período e escopo e aplicar os contratos de dados e de métricas desta diretriz.

Perguntas sobre clima estoque produção e feira
Exemplos iniciais de linguagem natural para o reconhecimento de intenções. O motor deve aceitar variantes conhecidas e confirmar campos faltantes; as respostas dependem do banco real, não das frases deste repertório.
Pergunta do produtor
O que o motor deve verificar
Vai chover na feira amanhã?
Consultar local horário e emissão da previsão existente.
Se chover o que eu faço?
Sugerir proteção e cenários conforme exposição e produto.
Levo menos produto por causa da chuva?
Usar encomendas capacidade e cenários sem corte percentual arbitrário.
Qual horário é melhor para entregar?
Comparar janelas previstas e compromissos; não garantir segurança.
O que pode estragar com esse calor?
Consultar conservação validada; não inventar limite térmico.
O que preciso repor primeiro?
Cruzar saldo utilizável reservas e demanda registrada.
Quanto consigo produzir com o estoque?
Ficha validada unidades rendimento embalagens e tempo.
O que faço com a banana madura?
Somente alimento íntegro e próprio para uso; receita e custo.
Estou perdendo venda por falta de produto?
Buscar períodos sem saldo e pedidos não atendidos; perda potencial separada.
Quanto devo levar no sábado?
Histórico comparável encomendas e cenários com limites.
A chuva fez minhas vendas caírem?
Explorar associação com fatores concorrentes sem declarar causalidade.
Vale ir à feira com esse tempo?
Priorizar alertas e organização; depois custos e alternativas.

Cada pergunta possui ID e intenção no arquivo estruturado. Não usar coincidência de palavra isolada como confirmação suficiente de entendimento. Antes de responder, resolver período e escopo e aplicar os contratos de dados e de métricas desta diretriz.

Perguntas sobre clientes datas comemorativas e próximas ações
Exemplos iniciais de linguagem natural para o reconhecimento de intenções. O motor deve aceitar variantes conhecidas e confirmar campos faltantes; as respostas dependem do banco real, não das frases deste repertório.
Pergunta do produtor
O que o motor deve verificar
Quem comprava e parou?
Usar janela configurável e histórico autorizado.
Quem compra café e pode gostar de uma cesta?
Identificar compra observada; interesse em cesta é hipótese.
O que posso vender no Natal?
Cruzar catálogo real receitas embalagens prazo e margem.
Com quem posso montar um kit?
Consultar ofertas autorizadas atualizadas; não inventar produtor.
Vale anunciar promoção para meus clientes?
Calcular custo elegibilidade consentimento e capacidade.
Qual cliente compra mais?
Separar receita contribuição e frequência; respeitar permissões.
Qual produto devo destacar esta semana?
Avaliar disponibilidade contribuição sazonalidade e dados.
Dá para oferecer entrega se chover?
Validar logística custo conservação e situação local.
O que preciso fazer hoje?
Até três ações justificadas por urgência impacto e dados.
O que faltou cadastrar para saber meu lucro?
Listar custos despesas e regras faltantes em ordem útil.
Essa dica anterior funcionou?
Ligar ação registrada a resultado observado sem atribuir causa automática.
Explique isso de um jeito mais simples
Reformular sem mudar números períodos ou limitações.

Cada pergunta possui ID e intenção no arquivo estruturado. Não usar coincidência de palavra isolada como confirmação suficiente de entendimento. Antes de responder, resolver período e escopo e aplicar os contratos de dados e de métricas desta diretriz.

Implantação e testes de aceite
Auditoria inicial e integração
Mapear telas de busca Gerente e Gestão, funções financeiras, cálculo de KPIs, motor de memória, clima, agenda, recomendações e documentos instalados. Registrar onde cada função já vive e a decisão de reaproveitar ou estender. Não instalar outro cálculo de margem ou cache meteorológico concorrente. Preservar banco, IDs, preferências e comportamento de venda e estoque.
Entrega por etapas
Etapa 1: tela de pergunta e consultas de faturamento, recebimento e comparação de produtos. Etapa 2: simulações de preço e desconto, lacunas de custos e resposta explicável. Etapa 3: clima por evento com atualização e cenários. Etapa 4: receitas, embalagens, datas e parceiros como consulta complementar. Etapa 5: feedback e ações com prévia e confirmação.
Caso de teste
Resultado obrigatório
Exemplo A B C
Receita total 2.420; contribuição total 640; A lidera contribuição B receita C quantidade.
Custo faltante em B
Não declarar vencedor de todo o mix por lucro; indicar análise parcial.
Recebimento parcelado
Não contar parcela futura como entrada de caixa atual.
Carrinho e pedido pendente
Não somar como venda finalizada.
Devolução e desconto no carrinho
Totais conciliam com ERP e rateio não perde centavos.
Base anterior zero
Exibir diferença absoluta sem percentual infinito.
Produto sem saldo parte do período
Não concluir baixa demanda só por baixa venda.
Chuva com previsão vencida
Declarar desatualização; sem previsão nova inventada.
Probabilidade de chuva de 70%
Não converter em redução automática de 70% de vendas.
Pergunta que contém comando
Nenhuma mutação sem fluxo de prévia e confirmação.
Dois produtores e perfil restrito
Dados privados não cruzam escopo; permissões impostas na consulta.
Conversa ambígua ou dado alterado
Esclarecer referência ou recalcular antes de responder.

Testar também fuso e virada de mês, produto com várias apresentações, períodos com poucas vendas, taxa variável, estoque reservado, cancelamento de consulta, uso offline e regressão de desempenho no aparelho simples. Não exigir conexão para consultar vendas locais. O clima atualizado continua dependendo da fonte já instalada.

Pedido para Codex e Claude Code e referências
Instrução de implementação
Implemente o campo Pergunte sobre seu negócio integrado ao Gerente do AGRO Gestão. Leia esta diretriz e o arquivo perguntas_negocio.json. Antes de alterar, mapeie módulos, métricas, permissões, clima e memória existentes e elimine duplicidade por reaproveitamento, sem apagar dados. Comece por intenções locais previstas e esclarecimento de ambiguidades. Reutilize funções oficiais de vendas, caixa, custo e estoque. Faça cálculos determinísticos, mostre período e evidências e distinga receita, recebido, contribuição e lucro líquido. Compare produtos por quantidade, contribuição total, unitária, percentual e recurso limitante quando conhecido. Reutilize o clima instalado, respeitando local, emissão e validade; não produza previsão nem impacto nas vendas por palpite. Apresente até três próximas ações, priorizando simulações e testes. Operações reais devem usar os fluxos e permissões atuais com prévia e confirmação específica. Não acrescente API paga por padrão. Preserve o desempenho em aparelhos simples, implemente em etapas e entregue relatório de alterações, limitações e testes de aceite. Não publique recursos como prontos antes de validar no projeto real.
Instrução permanente de interpretação
Responda com base nos dados autorizados e atualizados. Use o nome exato da métrica apurada. Se faltar custo, prazo, local ou entendimento, explique a lacuna e peça somente o esclarecimento necessário. Não transforme simulação em previsão nem correlação em causa. Não prometa que vender mais ou cobrar mais aumenta lucro. Mostre o que os números permitem concluir e qual teste ou ação pode reduzir a incerteza.
Fontes e alcance
Consulta em 22 de outubro de 2026. As referências sustentam a distinção de contribuição e a existência de previsões e avisos meteorológicos. A arquitetura, exemplos fictícios, repertório de perguntas e critérios de implantação são propostas deste documento; não constituem software já integrado nem validação institucional.
Sebrae Minas. Margem de Contribuição. Conceito de receita menos custos e despesas variáveis, com contribuição para gastos fixos e resultado. https://www.sebraeplay.com.br/content/margem-de-contribuicao
INMET. Sobre o Instituto. Atribuições de monitoramento, previsão e avisos de tempo severo. https://portal.inmet.gov.br/sobre
INMET. Avisos meteorológicos. Referência para avisos oficiais quando disponíveis no local e período. O app deve consultar a fonte existente e a validade do aviso. https://avisos.inmet.gov.br/
AGRO Gestão. Diretrizes de receitas artesanato embalagens e parcerias, versão 1.1. Integração complementar deve consultar a versão instalada no projeto e suas fontes de verdade. Não copiar ofertas ou saldos para o repertório de perguntas.