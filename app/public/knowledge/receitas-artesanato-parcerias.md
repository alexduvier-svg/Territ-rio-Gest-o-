# Referência Receitas Artesanato e Parcerias

Documento recebido do produtor em 22/10/2026. SHA256 97dea7147d2cc58815d1e968744c0f7aa36be0632e6f6a54c60fcd8c9f287d6b

Referência editorial do usuário; não representa validação sanitária, ficha de produção ou oferta. Integração inicial: consulta local sob pedido, até três ideias, sem movimentar estoque. O JSON complementar foi recebido e validado contra os IDs do catálogo instalado; SHA256 4d646a0ba4e6e356cc4370d24a57f001a4ed805386fe2bdf92ce66913cef150c. As relações são candidatas de vocabulário, não apresentação escolhida, disponibilidade ou ficha validada. Os IDs desta referência são próprios; nenhuma apresentação agro_ foi escolhida automaticamente. Simulação produtiva e diretório de parceiros não são liberados sem seus dados e validações.

Diretrizes de receitas típicas artesanato e parcerias no AGRO Gestão
Especificação funcional e base inicial para Codex e Claude Code. Versão 1.1 de 22 de outubro de 2026.
Implementar uma camada local de conhecimento que relacione produtos cadastrados, receitas, projetos artesanais, datas comemorativas e ofertas autorizadas de outros produtores. Cada sugestão deve explicar o motivo, os requisitos, o que falta confirmar e a próxima ação possível.
Resultado esperado
Ao encontrar milho disponível e uma festa junina próxima, o app pode sugerir testar curau, calcular o custo do lote e procurar um fornecedor autorizado de leite. Para um café de presente, pode sugerir caneca ou cesta de um artesão. A sugestão não cria estoque, pedido ou parceria.
Entregas desta base
12 receitas base com ingredientes e preparo para lote piloto; 24 ideias adicionais sem ficha técnica; 20 projetos artesanais conceituais; 12 referências mensais de calendário; 14 orientações de embalagem com motivos e limitações; relações candidatas com o catálogo original e regras de implantação. O arquivo JSON permite consulta estruturada e o Markdown reúne a diretriz completa.
Prioridade de implementação
Primeiro mapear o projeto real e integrar o vocabulário existente. Depois implantar a consulta por produto e data, os cálculos explicáveis e o diretório autorizado de produtores. Publicação e comunicação externas dependem da ação do usuário.
Critério central
Conhecimento culinário não é estoque. Item no catálogo não é oferta. Data comemorativa não é previsão de demanda. Contato público não significa consentimento para receber campanhas ou participar de um clube.

Integração com o catálogo e a memória existentes
O pacote de referência contém 2.479 apresentações em 22 categorias e 1.270 combinações de produto base sabor e variedade. Inclui 70 sugestões de artesanato e utilidades. Reutilizar seus IDs agro_ e adaptar os novos campos ao modelo real do app.
Auditoria antes de alterar o código
Localizar catálogo, dicionário regional, conversões de unidade, estoque, receitas ou fichas de produção, calendário, CRM, Gerente, Finanças, Estoque, Clube e mecanismos de recomendação. Registrar arquivo ou tabela responsável, função existente e decisão de reaproveitar, estender ou substituir. Não criar outro motor paralelo para a mesma regra.
Regras de identidade
Produto base, ingrediente, receita, preparação comercial e oferta são entidades distintas. Café especial moído 250 g e café em grãos 500 g pertencem à família café, mas não são intercambiáveis em estoque. Uma receita consulta família e requisitos; a seleção final exige a apresentação correta.
Os IDs candidatos do JSON apontam para nomes base iguais no catálogo original. São relações de vocabulário, não validação de equivalência técnica ou disponibilidade. Escolher a apresentação pelo conteúdo, forma, composição e unidade. Nunca escolher a primeira da lista automaticamente.
Normalizar acentos e caixa só na comparação. Resolver aliases aprovados como mandioca de mesa, aipim e macaxeira no contexto correto. Não confundir fubá com farinha de milho nem polvilho doce com azedo. Mucia permanece denominação a confirmar, sem receita presumida.
Importação segura
Usar namespace e versão próprios para receitas e projetos. Importação repetida deve ser idempotente; um ID com conteúdo divergente gera conflito registrado. Não sobrescrever receitas locais, autoria, preços, saldos ou nomes personalizados. Revisões criam versão e preservam a anterior. Desfazer a importação deve remover apenas o conhecimento incluído, sem apagar transações.
Lacunas como óleo vegetal, fermento químico, água e sal aparecem explicitamente para mapeamento. Não cadastrar automaticamente esses insumos como produtos à venda nem inventar referências para completar o vínculo.

Funcionamento do motor de sugestões
Entrada real
Consulta
Resposta esperada
Produto e saldo utilizável
Receitas por ingrediente e unidade
Opções compatíveis e ingredientes faltantes
Data e localização
Calendário anual e eventos confirmados
Oportunidade e antecedência de preparação
Preferências declaradas
Restrições e histórico autorizado
Filtro explicado sem inferir condição de saúde
Necessidade de complemento
Ofertas autorizadas e atualizadas
Produtores candidatos com situação do dado

Sequência obrigatória
1. Identificar intenção e contexto. 2. Buscar entidades canônicas. 3. Aplicar bloqueios de segurança, privacidade, capacidade e prazo. 4. Consultar saldo real e ficha técnica. 5. Separar viabilidade confirmada de estimativas. 6. Ordenar no máximo três sugestões. 7. Explicar requisitos e permitir dispensar.
Ordenação inicial proposta
Usar escore heurístico de 0 a 100: 25% adequação de ingredientes, 20% pertinência da data, 20% margem de contribuição, 15% capacidade e prazo, 10% preferências explícitas e 10% confiabilidade dos dados. Cada componente varia de 0 a 100. São pesos de projeto a avaliar, não modelo científico ou probabilidade de venda.
Dados ausentes recebem estado desconhecido e reduzem a completude exibida. Na ordenação parcial, renormalizar somente componentes conhecidos e mostrar a proporção de dados disponíveis. Não comparar o escore parcial com o completo sem destacar a diferença. Margem ou prazo desconhecido impede selo de oportunidade comercial confirmada.
Gatilhos sem poluição da interface
Oferecer sugestões sob pedido e, opcionalmente, por aproximação de data, estoque excedente utilizável ou demanda registrada. Verificar gatilhos ao abrir o app e após movimentações relevantes. Guardar identificador, motivo e prazo de supressão para não repetir o mesmo conselho. Permitir desativar e marcar Não tenho interesse.
A memória duradoura guarda preferências confirmadas e relações de conhecimento. Estoque, preço e disponibilidade são consultados no momento da decisão, com data de atualização; não ficam gravados como fatos permanentes no texto do agente.

Viabilidade econômica e decisão comercial
Cálculos antes de recomendar produção
Cobertura = ingredientes obrigatórios atendidos ÷ total de ingredientes obrigatórios. Para afirmar que um ingrediente é atendido, confirmar unidade, quantidade necessária, saldo utilizável e adequação. Sem gramagem e rendimento, informar apenas compatibilidade de ingredientes.
Lotes possíveis = mínimo da parte inteira de saldo utilizável dividido pelo consumo por lote entre todos os insumos obrigatórios. Aplicar também limites de embalagens, tempo, equipamentos e encomendas já assumidas. Não converter maço, espiga, dúzia de fruta, caixa ou peça em massa sem fator configurado; dúzia só representa doze unidades do item definido.
Custo variável do lote = ingredientes consumidos + embalagem + energia variável estimada + trabalho variável remunerado + logística variável + perdas esperadas justificadas. Taxas percentuais de venda entram no cálculo sobre a receita, sem dupla contagem. Trabalho não pode ser tratado como gratuito por ser familiar.
Margem de contribuição = receita líquida das taxas e tributos variáveis menos os demais custos variáveis. Não chamar essa margem de lucro líquido. Resultado operacional exige considerar custos fixos no período. Artesanato usa custo de material consumido, horas de execução, perdas e acabamento.
Exemplo exclusivamente hipotético
Um lote de 10 porções tem preço de R$ 8,00 cada, custos variáveis de R$ 45,00 e taxa de venda de 5%. Receita de R$ 80,00; taxa de R$ 4,00; contribuição de R$ 31,00 ou R$ 3,10 por porção. Com desconto de 10%, a receita cai para R$ 72,00, a taxa para R$ 3,60 e a contribuição para R$ 23,40. Para manter R$ 31,00, seriam necessárias 14 porções ao novo preço, com custos por unidade iguais. Não prever que esse aumento de demanda ocorrerá.
Quando sugerir e quando interromper
É momento de testar quando há demanda registrada, prazo, capacidade, matéria prima própria para uso e contribuição aceitável. Preferir pré-encomenda ou lote pequeno quando o histórico é escasso. Não promover desconto se ele destrói margem, se a demanda já supera a capacidade ou se depende de parceiro ainda não confirmado. Produto vencido, deteriorado ou sem condição sanitária bloqueia reaproveitamento, mesmo que exista receita compatível.

Conexões reais entre produtores sem dependência de API
Diretório autorizado
Reaproveitar o cadastro único do produtor. No Clube AGRO Gestão, a adesão é voluntária e o produtor confirma nome público, produtos, área de atendimento, contato e condições que deseja exibir. Desativar o Clube retira suas ofertas das recomendações futuras. Não exigir novo cadastro pessoal.
Relacionar produtor e oferta por ID estável. Guardar produto canônico, apresentação, quantidade quando declarada, unidade, preço quando público, pedido mínimo, prazo, área atendida, modo de entrega, atualização, origem e autorização. Valores ausentes ficam nulos e aparecem como A confirmar.
Três formas viáveis de abastecer o diretório
1. Importar arquivo JSON ou CSV autorizado e atualizado manualmente. 2. Importar contatos e ofertas por QR Code ou arquivo compartilhado pelo produtor. 3. Abrir página pública cadastrada do produtor no site Visite Carangola. A ligação com o site depende de URLs e identificadores reais; este documento não supõe integração pronta.
Sem servidor ou sincronização, celulares diferentes não conhecem automaticamente mudanças de estoque. Exibir a data da última informação e exigir confirmação direta para compromissos comerciais. Atualização manual do diretório ocorre pela troca de novo arquivo; nenhum dado deve aparecer como tempo real.
Regras de seleção
Filtrar primeiro autorização, produto adequado, atendimento ao destino e prazo. Oferta com quantidade confirmada tem status distinto de produtor que apenas costuma vender o item. Ordenar por adequação, informação recente, logística e escolha do usuário, permitindo ver alternativas e rotação justa entre empates. Não inferir localização exata sem dado autorizado.
Links e ações
Usar ações Ver perfil, Confirmar disponibilidade e Preparar contato. Aceitar URL pública https validada. Para WhatsApp, construir link somente com número de negócio autorizado, em formato internacional validado, e texto codificado. O usuário revisa e envia. Não enviar mensagens, criar encomendas, publicar ofertas ou notificar terceiros automaticamente.
Não há produtores reais incluídos neste pacote. Na ausência de diretório, responder: Encontrei uma combinação possível, mas ainda não há fornecedor confirmado. Permitir registrar necessidade e buscar contato manualmente.

Calendário de oportunidades de janeiro a junho
As associações abaixo são propostas editoriais de planejamento, não promessa de procura. A data comemorativa e a programação local são registros diferentes. Antecedência não significa produzir perecíveis para guardar até o evento.
Mês e ocasião
Aplicações e cuidados
Janeiro07/01 Aniversário de Carangola; verão e férias
Café, broa, pão de queijo; lembranças do municípioAlimentos 7 a 21 dias; artesanato 30 a 60 dias
FevereiroCarnaval em data móvel; volta às aulas conforme calendário
Porções práticas; bolsas e cadernos artesanaisConferir evento local e regras de venda
Março08/03 Dia da Mulher; 19/03 Dia do Artesão; Páscoa quando ocorrer
Cestas de café e peças com autoria; início de encomendas pascaisNão presumir compra ou preferência por gênero
AbrilPáscoa em data móvel; 21/04 Tiradentes
Cestas, tecidos, doces; opções sem chocolate quando pertinentesAlimentos e decoração separados
MaioDia das Mães no segundo domingo; 24/05 Dia Nacional do Café
Café, bolo e caneca; cestas com bordadoEncomendas artesanais com 30 a 60 dias
Junho12/06 Dia dos Namorados; 13/06 Santo Antônio; 24/06 São João; 29/06 São Pedro
Canjica, curau, broa, paçoca; peças de mesaCapacidade, refrigeração e alergênicos

Planejamento de trás para frente
Registrar data de entrega, prazo do parceiro, tempo de execução e folga. Para artesanato ou kits, planejar em geral com 30 a 60 dias; para alimentos, organizar compras e encomendas com 7 a 21 dias. A produção efetiva respeita validade validada e conservação. Esses intervalos são padrões iniciais configuráveis, não garantias.
Datas móveis devem ser calculadas para o ano consultado. Páscoa usa calendário gregoriano; terça-feira de Carnaval corresponde a 47 dias antes da Páscoa. Dia das Mães é o segundo domingo de maio. Exibir o ano e confirmar a programação municipal por fonte atual.

Calendário de oportunidades de julho a dezembro
Mês e ocasião
Aplicações e cuidados
JulhoFérias escolares conforme rede; festas rurais se confirmadas
Caldos, broas e café; bandejas e lembrançasNão cadastrar feira ou exposição como confirmada sem agenda
AgostoDia dos Pais no segundo domingo; 22/08 Folclore
Café e utensílios; pratos e narrativas culturais com fontePrazos e história de origem confirmados
Setembro07/09 Independência; primavera astronômica variável
Cestas leves, frutas disponíveis; vasos e peças de fibrasSafra e disponibilidade dependem do território
Outubro12/10 Dia das Crianças; 15/10 Dia dos Professores; 16/10 Dia Mundial da Alimentação
Bolos, marcadores e cadernos; kits para professoresNão classificar artesanato como brinquedo sem requisitos próprios
Novembro02/11 Finados; 20/11 Consciência Negra; Black Friday comercial
Memória alimentar com fontes; pré-encomendas de NatalFinados exige sensibilidade; Black Friday só com margem
Dezembro13/12 Santa Luzia padroeira de Carangola; 25/12 Natal; 31/12 Réveillon
Café, doces e farofa; presépios, cestas e bordadosConfirmar programação religiosa e comercial separadamente

Eventos do território
Feira do Inventário Rural e Cultural, Festa do Café de Conceição, concurso de café, festivais, exposições e eventos de turismo devem entrar como eventos locais editáveis. Só ativar uma edição quando organizador, local, data e situação forem confirmados. Não perpetuar uma data de edição anterior.
Dia dos Pais é o segundo domingo de agosto. Para Black Friday, adotar a sexta-feira posterior à quarta quinta-feira de novembro, distinguindo da convenção incorreta de sempre usar a última sexta-feira. Datas locais podem ter celebrações em outros dias; a data de Santa Luzia não prova que haverá feira ou espaço de venda.
Aniversário de cliente pode gerar lembrete somente se o dado já estiver autorizado no CRM. Não deduzir religião, saúde, renda ou interesse por inferência do cadastro. Mensagens comemorativas permanecem rascunhos até envio pelo usuário.

Fichas culinárias e limites de uso
Doze receitas para lote piloto
As páginas seguintes trazem formulações editoriais em pequena escala para teste. Não foram executadas em cozinha nem validadas para produção comercial. Tempos e temperaturas de forno são referências de preparo e variam por equipamento e tamanho da forma. Confirmar cozimento, rendimento, sabor, conservação, embalagem e custo no processo real.
Estados que a memória deve distinguir
Estado
Comportamento
Ideia sem ficha técnica
Sugerir possibilidade; não calcular lote completo ou compra automática
Rascunho para teste culinário
Mostrar ingredientes e preparo; pedir medição e validação
Ficha validada pelo responsável
Permitir simulação com versão e processo documentados
Suspensa ou substituída
Não recomendar produção; manter histórico

Campos obrigatórios da ficha validada
Nome, versão, autor ou responsável, origem e permissão de uso; ingredientes e forma necessária; quantidades e unidades; modo de preparo; rendimento vendável real; perdas; equipamento; tamanho do lote; alergênicos e risco de contato cruzado; conservação, transporte e validade com fundamento; embalagem e data da validação.
Cuidados de segurança
Não fornecer prazo de validade por palpite. Calorias, alegações terapêuticas, sem glúten, sem lactose, diet e adequação a alergias precisam de avaliação própria; ausência de ingrediente na lista não garante ausência de contato cruzado. Alergênicos potenciais neste pacote não substituem rotulagem ou análise da formulação final.
Conservas, fermentados, laticínios, carnes e plantas de identificação incerta exigem validação específica. Não ensinar conserva caseira estável em prateleira sem processo tecnicamente validado. Não recomendar taioba, cogumelos ou plantas desconhecidas por fotografia ou nome popular. Culinária regional deve ter procedência e identificação alimentar segura.
Não inferir que uma receita é tradicional de Carangola apenas por usar produtos locais. Registrar relato de produtor e fonte cultural como tal. Receitas familiares só são compartilhadas com autorização; autoria de texto, foto e apresentação deve ser preservada.

Receitas base para teste culinário 1 a 4
rec_001 Bolo de fubá
Ingredientes do lote piloto: 200 g de Fubá mimoso; 100 g de Farinha de trigo; 180 g de Açúcar cristal; 3 un de Ovo; 240 ml de Leite integral pasteurizado; 100 ml de Óleo vegetal; 12 g de Fermento químico.
Preparo: Misturar ovos, leite, óleo e açúcar. Incorporar fubá e farinha; juntar o fermento por último. Transferir para forma untada compatível com o volume. Assar em forno preaquecido a 180 °C por cerca de 35 a 45 minutos, verificando o cozimento do centro. Esfriar protegido e pesar o rendimento antes de definir fatias e preço.
Ocasião: Festas juninas, Café da tarde. Complementos: Café, Pano de prato bordado. Alergênicos potenciais: trigo, ovo, leite.
rec_002 Broa de fubá
Ingredientes do lote piloto: 200 g de Fubá mimoso; 150 g de Farinha de trigo; 100 g de Açúcar cristal; 80 g de Manteiga sem sal; 1 un de Ovo; 80 ml de Leite integral pasteurizado; 10 g de Fermento químico.
Preparo: Misturar secos e manteiga; adicionar ovo e leite aos poucos até obter massa modelável. Modelar porções iguais e distribuir em assadeira. Assar a 180 °C, aproximadamente 20 a 30 minutos, até a massa estar cozida. Registrar peso por unidade, perdas e quantidade final no lote piloto.
Ocasião: Festas juninas, Cestas de café. Complementos: Café, Cesto de bambu. Alergênicos potenciais: trigo, leite, ovo.
rec_003 Pão de queijo
Ingredientes do lote piloto: 250 g de Polvilho azedo; 120 ml de Leite integral pasteurizado; 60 ml de Óleo vegetal; 1 un de Ovo; 150 g de Queijo meia cura; 3 g de Sal.
Preparo: Aquecer leite e óleo; escaldar o polvilho com cuidado e deixar amornar. Acrescentar ovo, sal e queijo ralado. Ajustar a modelagem conforme a umidade real da massa, registrando qualquer ajuste. Modelar unidades iguais e assar a 200 °C até expansão, superfície dourada e centro cozido, em geral 25 a 35 minutos.
Ocasião: Aniversário de Carangola, Cestas de café. Complementos: Café, Bandeja de madeira. Alergênicos potenciais: leite, ovo.
rec_004 Bolo de mandioca
Ingredientes do lote piloto: 500 g de Mandioca de mesa; 180 g de Açúcar cristal; 3 un de Ovo; 200 ml de Leite integral pasteurizado; 60 g de Manteiga sem sal; 50 g de Coco ralado seco.
Preparo: Usar mandioca de mesa de procedência conhecida, descascada e ralada. Não usar mandioca de variedade desconhecida. Misturar todos os ingredientes e colocar em forma untada. Assar a 180 °C por aproximadamente 45 a 60 minutos, até o centro estar cozido. Pesar somente após o resfriamento. Não presumir ausência de glúten por lista de ingredientes.
Ocasião: Festas juninas, Feira rural. Complementos: Café, Toalha de mesa bordada. Alergênicos potenciais: leite, ovo.

Receitas base para teste culinário 5 a 8
rec_005 Canjica doce
Ingredientes do lote piloto: 250 g de Milho de canjica branco; 1500 ml de Água; 800 ml de Leite integral pasteurizado; 150 g de Açúcar cristal; 40 g de Coco ralado seco; 1 un de Canela em pau.
Preparo: Hidratar o milho conforme orientação da embalagem, sob condições higiênicas e refrigeração; descartar a água de hidratação. Cozinhar em água limpa até ficar macio. Na panela de pressão, seguir capacidade e instruções do fabricante. Adicionar leite, açúcar, coco e canela; cozinhar mexendo até a consistência desejada. Definir serviço quente ou resfriamento controlado antes da venda.
Ocasião: Festas juninas. Complementos: Milho de canjica branco, Pote de cerâmica. Alergênicos potenciais: leite.
rec_006 Arroz doce
Ingredientes do lote piloto: 150 g de Arroz branco; 450 ml de Água; 700 ml de Leite integral pasteurizado; 120 g de Açúcar cristal; 1 un de Canela em pau.
Preparo: Cozinhar o arroz na água até amaciar. Juntar leite, açúcar e canela; cozinhar em fogo baixo mexendo até ficar cremoso. Porcionar com utensílios higienizados e registrar o peso final. Serviço e conservação dependem de controle sanitário próprio.
Ocasião: Festas juninas, Festas comunitárias. Complementos: Pano de prato bordado. Alergênicos potenciais: leite.
rec_007 Curau de milho
Ingredientes do lote piloto: 500 g de Milho verde em grãos; 500 ml de Leite integral pasteurizado; 100 g de Açúcar cristal; 2 g de Canela em pó.
Preparo: Bater milho e leite e passar por peneira limpa. Adicionar açúcar e cozinhar a mistura, mexendo continuamente, até engrossar e completar o cozimento do milho. Dividir em recipientes próprios para alimentos; finalizar com canela. Validar rendimento e conservação no processo real.
Ocasião: Festas juninas. Complementos: Milho verde em espiga, Travessa de cerâmica. Alergênicos potenciais: leite.
rec_008 Doce de abóbora de colher
Ingredientes do lote piloto: 600 g de Abóbora de pescoço; 240 g de Açúcar cristal; 100 ml de Água; 2 un de Cravo-da-índia.
Preparo: Usar 600 g de polpa limpa, sem casca e sementes. Cozinhar com água, açúcar e cravo. Mexer até amaciar, desmanchar e atingir consistência de colher. Tratar como alimento preparado. A receita não valida conserva estável nem autoriza armazenamento fora de refrigeração.
Ocasião: Festas juninas, Natal. Complementos: Queijo minas frescal, Pote de cerâmica. Alergênicos potenciais: nenhum dos principais indicado na formulação; verificar composição e contato cruzado.

Receitas base para teste culinário 9 a 12
rec_009 Compota rápida de banana para consumo próximo
Ingredientes do lote piloto: 500 g de Banana prata; 100 g de Açúcar cristal; 80 ml de Água; 1 un de Canela em pau.
Preparo: Usar 500 g de banana descascada, madura e íntegra; fruta mofada ou deteriorada deve ser descartada. Cozinhar com os demais ingredientes até amaciar e engrossar a calda. O nome compota descreve o preparo; não implica estabilidade de prateleira. Validar resfriamento e conservação.
Ocasião: Feira rural, Cestas de café. Complementos: Queijo minas frescal, Cesto de palha. Alergênicos potenciais: nenhum dos principais indicado na formulação; verificar composição e contato cruzado.
rec_010 Angu de fubá
Ingredientes do lote piloto: 150 g de Fubá mimoso; 750 ml de Água; 3 g de Sal.
Preparo: Dissolver o fubá em parte da água fria. Adicionar à água restante aquecida e cozinhar em fogo baixo, mexendo até ficar uniforme e completamente cozido; ajustar água ao ponto desejado. Servir como acompanhamento. Calcular porções pelo rendimento real.
Ocasião: Festas comunitárias, Almoço rural. Complementos: Couve manteiga, Quiabo. Alergênicos potenciais: nenhum dos principais indicado na formulação; verificar composição e contato cruzado.
rec_011 Bolo de banana
Ingredientes do lote piloto: 300 g de Banana prata; 200 g de Farinha de trigo; 120 g de Açúcar cristal; 2 un de Ovo; 80 ml de Óleo vegetal; 100 ml de Leite integral pasteurizado; 10 g de Fermento químico.
Preparo: Usar peso de banana sem casca. Amassar e misturar com ovos, óleo, leite e açúcar. Incorporar farinha e fermento. Assar em forma untada a 180 °C por aproximadamente 35 a 45 minutos até o centro estar cozido. Testar textura, tamanho da forma e rendimento antes de cadastrar a produção comercial.
Ocasião: Dia das Mães, Café da tarde. Complementos: Café, Pano de prato bordado. Alergênicos potenciais: trigo, ovo, leite.
rec_012 Farofa de banana
Ingredientes do lote piloto: 250 g de Banana da terra; 180 g de Farinha de mandioca torrada; 80 g de Cebola branca; 40 g de Manteiga com sal; 10 g de Cebolinha; 2 g de Sal.
Preparo: Picar a banana descascada e a cebola. Dourar em manteiga com utensílios limpos. Adicionar farinha e mexer até aquecer e uniformizar. Ajustar sal, considerando a manteiga. Finalizar com cebolinha higienizada. Avaliar o serviço quente e a conservação do preparo.
Ocasião: Natal, Almoço rural. Complementos: Frango caipira inteiro, Travessa de cerâmica. Alergênicos potenciais: leite.

Ideias culinárias para ampliar o repertório 1 a 12
As ideias abaixo não têm gramagem, processo ou validade definidos. Servem à busca e à criação de fichas revisadas pelo responsável. Ingredientes listados são indicativos e não uma formulação completa.
Ideia
Ingredientes de referência
Ocasião e complemento
Feijão tropeiro
Feijão carioca, Farinha de mandioca torrada, Ovo, Couve manteiga
Almoço rural; Tábua de madeira
Frango com quiabo
Frango caipira inteiro, Quiabo, Alho comum
Almoço rural; Angu de fubá
Tutu de feijão
Feijão carioca, Farinha de mandioca fina, Alho comum
Festas comunitárias; Couve manteiga
Caldo de mandioca
Mandioca de mesa, Cebola branca, Cheiro-verde
Inverno; Pão
Caldo de abóbora
Abóbora cabotiá, Alho comum, Cebola branca
Inverno; Pote de cerâmica
Sopa de legumes
Cenoura, Chuchu, Batata inglesa
Inverno; Pão
Caldo de feijão
Feijão preto, Alho comum, Cebolinha
Inverno; Torrada
Couve refogada
Couve manteiga, Alho comum
Almoço rural; Feijão tropeiro
Ora-pro-nóbis refogado
Ora-pro-nóbis, Alho comum, Cebola branca
Feira rural; Arroz branco
Bolinho de mandioca
Mandioca de mesa, Ovo, Queijo meia cura
Festas comunitárias; Molho de pimenta biquinho
Biscoito de polvilho
Polvilho azedo, Ovo, Leite integral pasteurizado
Café da tarde; Café
Biscoito de nata
Nata, Farinha de trigo, Açúcar cristal
Dia das Mães; Cesto de palha

Produzir um derivado exige ordem de produção: reservar ou consumir insumos uma única vez e registrar saída, perdas e rendimento real. A receita sugerida não movimenta estoque. Vender uma cesta também não cria saldo adicional dos itens já contados individualmente.

Ideias culinárias para ampliar o repertório 13 a 24
As ideias abaixo não têm gramagem, processo ou validade definidos. Servem à busca e à criação de fichas revisadas pelo responsável. Ingredientes listados são indicativos e não uma formulação completa.
Ideia
Ingredientes de referência
Ocasião e complemento
Rosquinha de fubá
Fubá mimoso, Farinha de trigo, Ovo
Cestas de café; Café
Cuscuz de milho
Farinha de milho, Água, Sal
Café da manhã; Manteiga com sal
Pamonha
Milho verde em grãos, Leite integral pasteurizado, Açúcar cristal
Festas juninas; Pano de prato bordado
Paçoca de amendoim
Amendoim torrado, Açúcar cristal, Sal
Festas juninas; Embalagem alimentar
Pé de moleque
Amendoim torrado, Rapadura ralada
Festas juninas; Embalagem alimentar
Cocada
Coco ralado seco, Açúcar cristal
Festas comunitárias; Cesto de bambu
Goiabada de colher
Goiaba vermelha, Açúcar cristal
Feira rural; Queijo minas frescal
Geleia de jabuticaba
Jabuticaba, Açúcar cristal
Safra local confirmada; Pote de cerâmica
Doce de leite
Leite integral pasteurizado, Açúcar cristal
Cestas de café; Queijo meia cura
Bolo de cenoura
Cenoura, Farinha de trigo, Ovo
Dia das Crianças; Embalagem alimentar
Café coado
Café, Água
Aniversário de Carangola; Caneca de cerâmica
Bebida gelada de café
Café, Leite integral pasteurizado
Verão; Caneca de cerâmica

Produzir um derivado exige ordem de produção: reservar ou consumir insumos uma única vez e registrar saída, perdas e rendimento real. A receita sugerida não movimenta estoque. Vender uma cesta também não cria saldo adicional dos itens já contados individualmente.

Artesanato como produto e complemento de venda
Projetos conceituais para combinar autoria, utilidade e contexto territorial. Materiais são referências iniciais, sem quantidade, dimensão ou custo presumidos. Conectar ao artesão autorizado e confirmar disponibilidade ou prazo de encomenda.
Peça
Ocasião
Verificação principal
Cesto de palha
Cestas de café
Alimento sempre em embalagem própria
Cesto de bambu
Páscoa
Confirmar procedência e ausência de farpas
Bandeja de madeira
Dia das Mães
Não presumir aptidão para contato alimentar
Caneca de cerâmica
Dia dos Pais
Aptidão alimentar exige evidência
Pano de prato bordado
Dia das Mães
Prazo inclui bordado e revisão
Pano de prato pintado
Natal
Cura e lavagem conforme material
Sousplat de crochê
Natal
Dimensão e consumo medidos
Porta-copo de crochê
Dia dos Namorados
Validar estabilidade e acabamento
Caminho de mesa de crochê
Natal
Não estimar horas sem amostra
Toalha de mesa bordada
Festas comunitárias
Encomenda com tamanho definido
Avental de tecido
Dia das Mães
Confirmar medidas e personalização
Necessaire de tecido
Dia dos Professores
Registrar material e tamanho
Bolsa de tecido
Feira rural
Testar resistência de costuras
Caderno artesanal
Volta às aulas
Custear folhas e tempo
Marcador de página artesanal
Dia dos Professores
Direitos de imagens e textos
Chaveiro artesanal
Aniversário de Carangola
Imagem de patrimônio depende de referência
Imã artesanal
Aniversário de Carangola
Peças pequenas não são brinquedos
Enfeite natalino artesanal
Natal
Separar de alimento aberto
Presépio artesanal
Natal
Respeitar autoria e tradição local
Vaso de cerâmica
Dia das Mães
Não confundir decorativo com utensílio alimentar

Não recomendar sabonetes, cosméticos, velas ou produtos de risco como fabricação improvisada por constarem no catálogo. Esses itens exigem avaliação de requisitos e técnicas próprias. Peças decorativas não devem tocar alimento sem comprovação de aptidão.

Projetos de combinação e experiência na tela
Cesta de café do território
Combinação conceitual: café escolhido pelo cliente, uma broa ou bolo com ficha validada e cesta de artesão. Registrar unidades reais, embalagem alimentar interna, alergênicos, prazo de montagem, preços e responsáveis. A broa e a cesta podem ter fornecedores diferentes. Montar somente após confirmação de todos.
Mesa de festa junina
Combinação conceitual: curau ou canjica em recipiente alimentar adequado, pano bordado e bandeja decorativa separada. Não oferecer conjunto se faltar refrigeração, embalagem ou capacidade de serviço. Reservar a produção para o período compatível com conservação validada.
Lembrança de Carangola
Combinação conceitual: café e marcador, chaveiro ou peça cerâmica com referência cultural autorizada. Confirmar representação do patrimônio, autoria do desenho e permissão de reprodução. Não usar marca oficial ou atribuir autenticidade institucional sem autorização.
Kit de presente com caneca
Combinação conceitual: café, caneca e porta-copo. Para caneca utilitária, confirmar aptidão alimentar. Personalização exige desenho aprovado, prazo de execução e política de alteração da encomenda. Se um fornecedor desistir, recalcular preço e prazo antes de oferecer substituto.
Card de sugestão
Título curto, motivo em duas linhas e até três ações: Ver receita, Simular custo e Buscar complemento. A seção expansível mostra fontes, data, ingredientes faltantes, risco, dados desconhecidos e regra aplicada. A inteligência fica acessível a partir do Gerente e das telas já existentes; evitar criar uma aba para cada agente.
Exemplo de texto: Você tem milho registrado e São João se aproxima. Curau pode ser uma opção de teste. Ainda precisamos confirmar quantidade de leite, rendimento, conservação e custo. Exibir como possibilidade, sem afirmar aumento de vendas.
Estados do contato
Sem cadastro: cadastrar necessidade. Cadastro antigo: confirmar disponibilidade. Oferta recente declarada: consultar condições. Pedido aceito: usar o fluxo de pedidos existente. Abrir um perfil não significa fechar parceria. O app só confirma reserva ou compra com ação explícita e registro correspondente.

Modelo de dados implantação e critérios de aceite
Modelo lógico mínimo
Produto canônico e variação comercial já existentes; receita e versão; ingrediente e requisito; projeto artesanal e material; ocasião e evento local; produtor e oferta autorizada; vínculo de complemento; recomendação e evidências. Relações muitos para muitos permitem um produto em várias receitas e vários produtores para o mesmo complemento.
Cada sugestão registra tipo, IDs consultados, versão da regra e da ficha, situação dos dados, horário da consulta, motivos, impedimentos e ação do usuário. Atualizações de estoque invalidam recomendações dependentes. Não copiar saldos para a base de receitas.
Implantação em etapas
Etapa 1: relatório de módulos existentes e adaptador do catálogo. Etapa 2: importação versionada da base e busca local indexada. Etapa 3: calendário por ano e simulação de custos. Etapa 4: diretório autorizado importado manualmente e links reais. Etapa 5: medir uso, correções e resultado de lotes sem inferir vendas a partir de cliques.
Funcionar sem API paga para consulta, regras, calendário e simulação. Abrir site ou WhatsApp requer os recursos e a conexão do dispositivo. Não prometer notificação remota nem sincronização automática. Usar o armazenamento já adotado pelo app, índices por ingrediente e ocasião, consultas limitadas e carregamento sob demanda; não carregar o catálogo inteiro em cada resposta.
Aceite obrigatório antes de liberar
Importar duas vezes sem duplicatas; preservar nomes, IDs e saldos existentes; mostrar conflitos em vez de mesclar receitas parecidas; validar todos os IDs candidatos; tratar ingrediente ausente como lacuna; não converter maço em kg; não criar estoque ao sugerir receita ou cesta; recalcular após alteração de saldo.
Testar datas móveis em anos diferentes e virada de dezembro para janeiro; eventos sem edição confirmada; oferta vencida ou sem quantidade; retirada de consentimento; produtor inexistente; número de contato inválido; modo offline; falta de custo ou rendimento; planta de identificação incerta; prazo artesanal incompatível e desconto que reduz contribuição.
Confirmar que só o produtor autorizado vê custos e saldos privados; que nenhuma mensagem é enviada sem ação; que receitas de família permanecem no escopo escolhido; e que importar este pacote não ativa novos módulos de venda automaticamente.

Embalagens por produto e motivo da escolha 1 a 7
A escolha depende do produto, processo, conservação e trajeto. Estas opções são candidatas para avaliação, não aprovação universal de material. Confirmar a especificação do fornecedor para o uso efetivo.
Produto e tipo candidato
Por que considerar
Limitações
Café torradoSaco multicamada com barreira e selagem
Ajuda a limitar contato com oxigênio, vapor de água e luz conforme a estrutura.
Kraft externo e zíper não provam barreira. Válvula pode integrar sistema validado para liberação de gases da torra; não é obrigatória em toda oferta.
Broa e biscoito secoSaco alimentar selável com barreira à umidade
Busca preservar textura e proteger o alimento na exposição.
Papel simples pode ter barreira insuficiente. Não embalar quente em sistema que acumule condensação; validar processo.
Bolo inteiroBase alimentar e caixa firme ou tampa rígida
Reduz contato e deformação; permite transportar e apresentar.
Confirmar resistência a gordura e dimensões. Caixa decorativa sozinha pode não ser superfície alimentar.
Fatia de boloRecipiente individual alimentar com fechamento
Facilita porcionamento e reduz manuseio na venda.
O custo por porção pode ser elevado. Coberturas frágeis precisam de espaço e estabilidade.
Curau canjica e arroz docePote alimentar com tampa e condição térmica declarada
Contém produto úmido, facilita porção e transporte.
Exigir compatibilidade com alimento, temperatura de envase e conservação. PP ou PET no nome não basta para aprovar uso quente, freezer ou micro-ondas.
Doce de colher e melPote ou frasco alimentar com fechamento compatível
Ajuda a evitar vazamento e permite visualizar o produto.
Vidro pesa e quebra; tampa e vedante importam. Envase quente e reutilização exigem processo próprio. Embalagem não torna conserva estável.
QueijoFilme saco ou sistema de vácuo definido para o queijo
Pode conter umidade e proteger durante distribuição em sistema validado.
Nem todo queijo aceita o mesmo sistema. Vácuo não esteriliza nem elimina refrigeração quando necessária; não presumir aumento de validade.

Distinguir embalagem primária em contato com alimento, secundária de apresentação e terciária de transporte. Mesmo material pode ter estruturas e usos diferentes. Tinta, adesivo, tampa, vedante e superfície interna fazem parte da avaliação.

Embalagens por produto e motivo da escolha 8 a 14
A escolha depende do produto, processo, conservação e trajeto. Estas opções são candidatas para avaliação, não aprovação universal de material. Confirmar a especificação do fornecedor para o uso efetivo.
Produto e tipo candidato
Por que considerar
Limitações
Folhas e hortaliças frescasCaixa ventilada ou saco perfurado conforme produto
Busca reduzir esmagamento e equilibrar ventilação e perda de água.
Respiração e umidade variam. Não recomendar saco hermético universal nem perfuração arbitrária sem teste.
Frutas delicadasBandeja ou caixa com berço e ventilação adequada
Reduz compressão e movimentação durante o transporte.
Não superlotar. Medir perdas e avaliar necessidade de cada camada; transparência não significa proteção contra calor.
Alimento congeladoSaco ou pote próprio para congelamento e fechamento
Busca resistir ao processo e reduzir desidratação quando a barreira é adequada.
Validar material, temperatura, vedação e espaço quando houver expansão. Congelar não corrige deterioração.
Cesta de presenteEmbalagens alimentares individuais e cesta externa
Separa proteção sanitária de composição visual e facilita montar parcerias.
Palha, tecido e enchimento decorativo ficam separados do alimento aberto. Não esconder rótulos ou misturar itens aromáticos que transfiram odores.
Cerâmica e artesanato frágilCaixa rígida divisórias e amortecimento
Reduz choque entre peças e movimentação no trajeto.
Papel decorativo fino não substitui proteção. Fazer teste de transporte representativo e revisar peso final.
Bordados e crochêEnvelope caixa ou saco protetor dimensionado
Protege de sujeira, atrito e umidade conforme a solução.
Acondicionar peça seca. Embalagem excessiva aumenta custo e volume; incluir instruções de cuidado confirmadas pelo artesão.
Entrega de perecíveisEmbalagem primária adequada e caixa térmica higienizável
Ajuda a manter a condição térmica durante percurso validado.
Caixa térmica não cria frio. Tempo, temperatura inicial, carga e elementos refrigerantes devem ser definidos e verificados; separar alimento de água de degelo.

Distinguir embalagem primária em contato com alimento, secundária de apresentação e terciária de transporte. Mesmo material pode ter estruturas e usos diferentes. Tinta, adesivo, tampa, vedante e superfície interna fazem parte da avaliação.

Motor de decisão de embalagens custo e apresentação
O que perguntar antes de sugerir
Identificar alimento ou artesanato, estado físico, gordura ou acidez relevantes, temperatura de envase e armazenamento, peso ou volume, fragilidade, conservação, distância e modo de entrega, equipamento de selagem e orçamento. Perguntar se a compra é para consumo cotidiano, presente, feira ou encomenda. Não supor que embalagem premium aumenta vendas.
Como comparar as alternativas
Filtrar primeiro aptidão para contato e compatibilidade com o processo. Depois comparar proteção, fechamento, praticidade, custo total, espaço de armazenamento, quantidade mínima de compra, prazo do fornecedor e descarte local. Uma opção mais barata que causa perdas pode custar mais no total. Uma opção bonita sem compatibilidade deve ser descartada.
Custo total de embalagem por unidade vendável = material primário + tampa + lacre + rótulo + parcela de caixa ou cesta + proteção de transporte + trabalho de montagem + frete de compra rateado + perdas de montagem. Não somar novamente parcelas já incluídas em outros custos. Quantidade de compra e consumo por produto são campos diferentes.
Quando o acabamento mais caro compensa
Exemplo hipotético: trocar embalagem de R$ 1,00 por R$ 4,00 adiciona R$ 3,00 ao custo. Sem taxa percentual, um acréscimo de R$ 3,00 no preço apenas mantém a contribuição, sem remunerar tempo extra. Com taxa variável de 5%, precisa acrescentar ao menos R$ 3,16, se os demais custos não mudarem. Testar aceitação e perdas com lote pequeno; não presumir disposição a pagar.
Dicas que o app deve produzir
Exemplo: Para esta cesta de presente, use cada alimento em sua embalagem própria e a cesta como apresentação. Motivo: combinar produtores preservando identificação e proteção. Falta confirmar medidas, preço e prazo do artesão. Alternativa: caixa simples dimensionada quando a cesta não couber na margem.
Memória e cadastro
Guardar especificação e versão do item, fornecedor autorizado, composição declarada, capacidade útil, dimensões, usos permitidos, fechamento, equipamento necessário, documentação, custo, estoque e prazo. Datas de preço e evidências técnicas são independentes. Não inferir uso térmico pelo código de resina ou aparência. Incluir quantidade de embalagens no limite de lotes possíveis.
Descarte e comunicação
Não chamar kraft, vidro, tecido ou plástico de sustentável por aparência. Avaliar material, massa, proteção, possibilidade real de reúso seguro e coleta no destino. Reciclável não significa efetivamente reciclado. Evitar alegações biodegradável ou compostável sem fundamento e condição de destinação. Rótulo legível tem prioridade sobre decoração; QR Code complementa e não substitui informações obrigatórias aplicáveis.

Natal presentes embalagens e parcerias entre produtores
A campanha natalina deve relacionar o que o produtor realmente vende com complementos disponíveis e uma embalagem proporcional à ocasião e ao orçamento do cliente. Definir versão básica, intermediária e especial por composição e custo reais, sem atribuir preços padronizados ou presumir que toda pessoa celebra o Natal.
Proposta de kit
Embalagem e motivo
Parceria e cuidado
Café para presentear
Pacote alimentar adequado dentro de caixa dimensionada; faixa ou cartão externo agrega identificação sem trocar a proteção do café.
Artesão de marcador ou cartão; informar produtor, composição e preço de cada opção.
Café e broa
Itens alimentares embalados individualmente e caixa firme; evita contato direto e esmagamento.
Produtor de café e responsável pela broa; alinhar preparo, retirada e conservação.
Café e caneca
Caixa com berço ou divisória; limita choque e movimentação.
Ceramista com aptidão alimentar documentada; testar transporte e confirmar capacidade da caneca.
Doces e queijo
Embalagens primárias adequadas, separadas, e transporte compatível com refrigeração quando exigida.
Doceiro e produtor de queijo; a apresentação não substitui cadeia de frio nem define validade conjunta.
Cesta do território
Cesta externa e produtos identificados; cria conjunto com autoria e origem verificáveis.
Cesteiro, bordadeira e produtores autorizados; escolher substitutos somente com aprovação.

Prazo sugerido para a campanha
D menos 60 a 45 dias: verificar interesse, amostras, materiais e parceiros. D menos 30 a 21: abrir pré-encomendas com composição, preço, entrega e limite de produção. D menos 14 a 7: reconfirmar fornecedores e quantidades e encerrar pedidos quando atingir capacidade. Perto da entrega: produzir e montar no intervalo compatível com conservação validada. D é a data prometida ao cliente, não necessariamente 25 de dezembro. Estes prazos são parâmetros de planejamento a ajustar.
Dicas para decidir
Se o orçamento é curto, sugerir embalagem simples bem dimensionada e cartão, preservando a proteção. Se o cliente procura presente e aceita pagar o adicional, simular cesta, caneca ou bordado. Se o artesão não consegue entregar a tempo, oferecer alternativa disponível ou retirar a opção. Não estocar embalagem com ano impresso sem necessidade; avaliar uso após a campanha e evitar pedido mínimo incompatível com encomendas.
Para produto próprio para uso com validade próxima, sugerir somente opções compatíveis com a janela real; não montar kit para entrega posterior ao prazo. Não recomendar presente perecível sem condição de conservação no trajeto. Não colocar velas ou sabonetes aromáticos junto ao alimento de forma que haja transferência de odor.
Exemplo de conselho do motor
Natal se aproxima e há interesse registrado em presentes. Você pode testar um kit com café e caneca, mas ainda precisa confirmar prazo do ceramista e custo da proteção. Compare com a caixa simples antes de abrir encomendas. Mostre o preço adicional necessário e a quantidade máxima possível, considerando produto, caneca, embalagem e tempo de montagem.

Instrução para Codex e Claude Code
Pedido pronto para implementação
Leia esta diretriz e base_receitas_artesanato.json. Antes de alterar o projeto, mapeie catálogo, estoque, CRM, Clube, calendário, memória e agentes existentes. Reutilize as fontes atuais e não crie serviços concorrentes. Integre o conhecimento como referência local consultável, preservando IDs agro_, dados reais e escopo do produtor. IDs candidatos exigem seleção de apresentação. Mantenha ideias e rascunhos separados de fichas validadas. Não invente estoque, preço, validade, contato, demanda ou origem cultural. Implemente simulações explicáveis, calendário por ano e links apenas para ofertas reais autorizadas. Não introduza API paga ou dependência de serviço online para o núcleo local. Mostre alterações propostas, migrações, conflitos, limitações e resultados dos testes de aceite. Entregue em etapas, mantendo o app utilizável.
Instrução permanente do Gerente
Consulte produtos reais e o trecho relevante da base antes de sugerir receitas ou artesanato. Explique por que a opção se aplica agora, o que falta e quando não convém. Não confunda oportunidade com demanda confirmada. Consulte ofertas autorizadas para complementos; se não houver, declare ausência de fornecedor confirmado. Não execute compra, produção, publicação ou envio por conta própria. Registre correções autorizadas sem compartilhar receitas ou dados privados.
Implemente também as orientações de embalagem: comparar tipos por produto e processo, explicar motivo e limitação, exigir especificação de uso, incorporar custo completo e saldo de embalagens, distinguir proteção alimentar de decoração e consultar fornecedores autorizados. Embalagem não define validade por si só.

Referências e alcance das orientações
Critérios de uso
Consulta em 22 de outubro de 2026. As fontes apoiam datas, segurança e princípios técnicos gerais. Receitas base, combinações, comparações de embalagem e regras de software são propostas editoriais sujeitas a teste e especificação real. Nenhuma instituição citada validou este pacote.
Catálogo AGRO Gestão versão 1 de 15 de outubro de 2026. Pacote existente com 2.479 apresentações e 1.270 combinações de produto base sabor e variedade em 22 categorias. Referência interna de vocabulário e IDs. Catalogo_AGRO_Gestao_2479_produtos.zip
Portal oficial de Turismo de Minas Gerais. Registro do aniversário de Carangola em 7 de janeiro. Programação de 2023 não deve ser reutilizada como programação atual. https://www.minasgerais.com.br/pt/eventos/carangola/aniversario-de-carangola-141-anos
Diocese de Caratinga Paróquia Santa Luzia. Referência de Santa Luzia em 13 de dezembro. Consultar a paróquia para a programação anual. https://diocesecaratinga.org.br/paroquia/paroquia-santa-luzia/
Sebrae Minas Calendário de Vendas 2026. Apoio ao planejamento de datas comerciais. Janelas e regras de decisão deste documento são propostas para o AGRO Gestão. https://mg.agenciasebrae.com.br/cultura-empreendedora/calendario-de-vendas-2026-confira-mais-de-100-datas-comemorativas/
Anvisa Cartilha de Boas Práticas para Serviços de Alimentação. Referência geral de higiene e manipulação. Não valida os lotes piloto ou prazos de validade apresentados neste pacote. https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/manuais-guias-e-orientacoes/cartilha-boas-praticas-para-servicos-de-alimentacao.pdf
Emater MG Minas Rural. Acervo para pesquisa futura de receitas e histórias. As receitas base deste pacote são formulações editoriais e não transcrições ou receitas certificadas pela Emater. https://www.emater.mg.gov.br/portal.do?flagweb=site_pgn_lista_videos_minas_rural&npag=58
Anvisa Materiais em contato com alimentos. Base de segurança e compatibilidade de materiais para contato alimentar; verificar requisitos atuais e especificação do fabricante. https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/embalagens-materiais-em-contato-com-alimentos.pdf
ITAL CETEA Atividades. Referência de avaliação de permeabilidade, integridade e compatibilidade de sistemas de embalagem. Não valida as alternativas deste pacote. https://ital.agricultura.sp.gov.br/cetea/atividades
ITAL Qualidade da bebida de café e sistemas de embalagem. Referência de ensaios de barreira, fechamento, válvulas e vácuo em embalagens de café. https://www.ital.sp.gov.br/noticia/ital-abordara-qualidade-da-bebida-de-cafe-na-agrishow