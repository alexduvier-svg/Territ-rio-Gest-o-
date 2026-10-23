# Premissas permanentes de interface — AGRO Gestão

Versão 19, atualizada em 21/10/2026. Aplica-se a todos os títulos, subtítulos, rótulos, controles e superfícies, inclusive em novas telas.

- **Volume:** hierarquia coerente por tamanho, peso e espaçamento. Não simular volume com excesso de negrito ou relevo nas letras.
- **Nitidez:** leitura clara e contraste nos temas claro e escuro. Sem blur ou brilho nas letras. Rótulos de formulário com pelo menos 14 px, respeitando texto ampliado.
- **Estilo:** manter Inter e Inter Tight nos papéis e tokens já usados pelo sistema. Não inventar tipografias isoladas por seção.
- **Textura:** acabamento pertence às superfícies; letras preservam preenchimento limpo, sem gradientes ou sombras decorativas.
- **Profundidade:** bordas, luz e sombras discretas nos painéis e controles. Preservar desempenho em celulares mais simples.

Abertura e fechamento usam expansão curta e física contínua, com leve acomodação de mola, sem trocar material durante a animação. Respeitar modo leve, Reduzir efeitos e movimento reduzido do sistema.

Janelas de informação e edição abrem centralizadas, com margens reais nas laterais, no alto e embaixo. O conteúdo longo rola dentro de uma altura limitada; a janela não ocupa a tela inteira. Títulos, textos e botões não podem ficar cortados. Ações do rodapé precisam caber ou quebrar linha, inclusive Enviar no WhatsApp. O cérebro e os relatórios acompanham o tema claro/escuro escolhido. O fundo externo é atenuado e o material tem acabamento liquid glass discreto, sem blur nas letras nem custo alto de desfoque durante a animação. Verificar pouca altura e teclado aberto, além das larguras e fontes habituais.

O padrão deve funcionar em celulares de 6,3, 6,5 e 6,8 polegadas. A diagonal não substitui a área útil: considerar resolução, escala, barras do Android e tamanho de fonte. Conferir larguras lógicas de 320, 360, 393 e 412 px e adaptar a altura disponível, preservando margens, rolagem e acesso às ações.

Antes de entregar, conferir claro/escuro, largura de 320 px, texto ampliado, contraste, quebras de linha e fluidez. Cor de destaque não substitui hierarquia tipográfica. Em Valores e estoque, os quatro rótulos de preço, custo, estoque inicial e estoque mínimo usam vermelho com contraste adequado; valores digitados mantêm a cor de texto do sistema.

Esta premissa também está instalada na memória local `interfaceGuidelines` e acompanha o modelo salvo e seu backup. É orientação de interface, separada de produtos, saldos, vendas e conhecimento financeiro.

Referência de desempenho recebida: `Regras_Janelas_Desempenho_Agro_Gestao.docx` (SHA256 da54797e48782e57a281d24515c232c6eb1dc23a75007cd26cfbedba980844e0). Suas metas são propostas de engenharia, não resultados medidos. A matriz completa, o histórico ampliado e um aparelho físico básico continuam sem validação nesta revisão visual.

Revisão 3: páginas usam uma única simulação e pivô comum para manter os cards coesos. Janelas conservam as alturas das seções e a posição rolada durante a saída. Não animar fontes, sombras ou desfoque por frame. Finalizar a animação quando o app fica inativo; respeitar modos leve e reduzido.

Revisão 4: incorporar o comportamento aprovado no APK de referência0.12.14: a janela nasce do card/ícone e retorna inteira à origem. Em uma subjanela, a origem é a linha da janela anterior. A tela anterior recua; a superfície em movimento mantém texto, material e posição rolada. Navegação entre abas sem abertura de card mantém uma mola curta e comum. Respeitar o movimento reduzido e simplificar acabamento no modo leve.

Todas as áreas, seções, janelas e subjanelas usam material comum de vidro, volume e resposta ao toque. Reflexo curto na superfície; nenhuma animação ociosa. Temas claro e escuro são critérios obrigatórios. Cards de venda identificam cada variação com nome, condição, peso/unidade e preço reais; sequência por família/apresentação/medida crescente em grade contínua, sem reservar linhas incompletas para cada tipo. Manter três colunas de cards compactos na venda, inclusive em tela estreita. Com texto ampliado, permitir altura natural, sem cortar informações. No Estoque, mostrar três apresentações da mesma família e uma seta para expandir as restantes. Adicionar produto pelo + no topo do Estoque (ao lado do relógio) ou pelo + de cada família. Em Vender: 1 toque abre a venda, 2 toques consultam o estoque do produto, segurar marca o cartão na hora e abre a seleção de até três (arrastar desfaz e muda de lugar); na venda, os escolhidos entram no primeiro cartão um por vez, com nome, quantidade e preço: digita-se a quantidade (quantos dígitos quiser) e a pill Próximo (lilás em degradê, abaixo do 8, com o Disponível centrado embaixo; só na venda múltipla) abre o próximo; no último ela diz Concluir: o teclado fecha e o Carrinho é liberado; nada avança sozinho; segurar e arrastar muda a ordem dentro da família, e essa ordem vale em Vender, no Estoque e nas demais listas. A venda abre só o produto tocado (em 1, 2 ou 3 produtos), sem oferecer outras apresentações da família; cada cartão já tem nome, peso, preço e categoria. Cartão sem estoque mantém a anatomia, Sem estoque e símbolo pequeno vermelho de reposição e, na seleção, responde com aviso. Estoque: o app avisa quando um produto passa a acabando ou esgotado; com algum esgotado durante um evento (nunca na venda do dia a dia da Loja), uma caixinha vermelha fica no canto da linha Área de vendas e, enquanto não for vista, abre as abas e solta uma bolinha; tocar nela abre a lista para repor (pill vermelha) ou Agora não, que a esconde e a traz de volta a cada 1 hora por 5 minutos enquanto houver esgotado. O cartão esgotado desce para o fim da grade e volta ao seu lugar quando reposto. Na seleção, a pill lilás Mova os cards faz os cartões tremerem e mudarem de lugar ao primeiro toque; Pronto encerra. Voz retirada por escolha do produtor.

**Nomes próprios (regra permanente):** todo nome de produto, família, variedade, sabor, cliente, cidade, bairro, evento, local e negócio tem cada palavra iniciando em maiúscula (Queijo Meia Cura), não importa como foi digitado. Conectivos no meio ficam minúsculos (Doce de Leite), siglas digitadas em maiúsculas são mantidas (Leite UHT) e medidas depois de um número seguem a grafia de unidade (250 g, 1 kg, 1 L). O sistema corrige ao gravar, em toda exibição e nos nomes já salvos, sem alterar quantidades, preços ou registros.

**Tempo (regra permanente):** a pílula da barra da Loja mostra o tempo de agora na cidade dos Ajustes de cada usuário, sem cidade padrão e sem GPS (sem cidade, ela pede a cidade). Ao tocar, abre as próximas horas e os próximos dias; cada feira dos próximos 9 dias mostra o tempo no horário dela. Fonte MET Norway com crédito visível e coordenadas do município pelo IBGE. A última previsão fica no aparelho e aparece sem internet com o horário; não entra no backup. Motor de atualização: com o app na tela, um único agendamento para quando a previsão vence (cerca de 30 min); com o app fechado, uma tarefa do Android só com internet e bateria não baixa, em degraus (carregando ou acima de 50%: a cada 30 min; de 20% a 50%: a cada 2 h; abaixo de 20% ou com economia de bateria: não busca). Chuva em mm e em palavras, sem prometer chance em porcentagem.

**Anatomia do card de venda (regra permanente):** nome em até duas linhas no alto; detalhes (condição, medida) em partes inteiras, juntas com " · " quando cabem e uma por linha quando não cabem (se um card da grade empilha, todos os cards com partes empilham), sem quebrar no meio de uma parte nem deixar o ponto pendurado; preço na base, alinhado entre todos os cards, com o R$ menor e mais leve, separado do valor em algarismos de largura igual. Vale para novos cards e telas, nos dois temas, de 320 a 412 px e com texto ampliado.


## Integração AGRO Gestão 2 — versão 21
Referência visual e de gestos: AGRO Gestão 3 0.12.50, commit 376a8fe, de 21/10/2026. Venda múltipla avança somente por Próximo/Concluir, substituindo a proposta automática anterior. Pacote, assinatura, registros, fila de relatórios e motor econômico de clima do AGRO Gestão 2 preservados. Reflexo de toque permanece isolado, sem alterar a grade.

Perfil e negócio atualizado conforme 597ce8c (AGRO Gestão3 0.12.52): foto no topo, grupos Você/Negócio, nomes que quebram linha, Município/UF responsivos e Salvar fixo acessível.

Correção de toque/teclado do perfil:286ca13/AGRO3 0.12.55. Bloqueio do seletor limitado ao próprio select; durante digitação em janela o fundo fica oculto e retorna ao sair do campo/fechar, sem alterar os registros.

Integração6452871/AGRO3 0.12.59: títulos em nome próprio, nomes em partes nos cards e fundo de janela em camada comum. O classificador de quadros separado foi consolidado em src/features/resources, com histerese e capacidade exposta; números de benchmark declarados pelo ramo de referência não são resultados medidos nesta entrega.


Premissas23: notificações de estoque separadas em Estoque (prioridade normal) e Estoque — Feira (alta prioridade no esgotamento). OrigemClaude0.12.62/cffe32b. Apresentação de notificação/tela depende dos ajustes e restrições do Android; não mantém a tela acordada.


## Regra permanente — qualquer ajuste, em qualquer dia ou mês

Usar sempre o padrão único existente do app, em toda área, janela e subjanela: componentes, calendários, tipografia, materiais, volume, textura, profundidade e movimentos. Não criar aparência paralela. Reutilizar o calendário e os controles do sistema. Preservar a superfície inteira na abertura e no recolhimento; verificar claro e escuro, telas menores, texto ampliado e modos leve/reduzido. A regra é contínua e não depende de ser repetida pelo usuário. Não afirmar desempenho medido em aparelho básico sem execução e evidência.

## Pagamentos e recebimentos — versão24

Finalizar Venda: resumo compacto de até três produtos e grade Pix/Dinheiro, Crédito/Débito, Outro, título central. + Produtos é uma ação separada. Mais produtos e texto ampliado podem rolar sem cortar controles. Outro oferece Fiado com cliente e vencimento, e pagamento dividido. Fiado reduz estoque e entra na receita da venda; só entra no caixa quando o produtor confirma o recebimento em Clientes a receber. Baixa não cria nova venda nem baixa estoque novamente. Usar os dois temas e tamanhos de tela na verificação.

Pedido posterior21/10: última linha de pagamentos com Continuar comprando à esquerda e Outro à direita. Respiro entre total e ações finais. Nuvem e grau junto da frase Área de vendas, na mesma linha, sem intercalar outros controles. Prioridade permanente: qualidade de abertura e recolhimento em aparelhos de menor capacidade; preservar modos leve/reduzido e verificar os dois temas.


## Organização do estoque, preservando o layout

Famílias usam títulos que abrangem suas variedades: Bananas, Cafés, Fubás e Mandiocas. O nome e a apresentação de cada produto permanecem nos seus cards. O + de cada seção busca a família normalizada; o título plural não deve impedir a busca. A conferência de perdas inicia recolhida, com a quantidade de feiras pendentes visível. Abrir ou recolher não dispensa revisão nem altera estoque. Aplicar os componentes, materiais, movimentos e timer comuns de 60 segundos. Ajustes mantém um único Voltar no rodapé. O ícone de resumo do dia deve ter nome acessível. Preservar três colunas de vendas, quantidade escolhida, Cliente, origem, Desconto e pagamentos.


**Disponibilidade — regra geral permanente (22/10/2026):** vale para todos os mais de 2.000 produtos do catálogo e qualquer produto aprendido/cadastrado depois, sem exceções por nome ou categoria. Estoque disponível zero bloqueia seleção em Vender, seleção múltipla, Carrinho, + Produtos e Continuar Vendendo. Descontar reservas e unidades já no pedido pendente antes de acrescentar mais. Quantidade e finalização revalidam disponibilidade. Consulta ao estoque e reposição permanecem acessíveis. Esgotados vão ao fim com Sem estoque e símbolo vetorial adaptável ao espaço vazio; sem sobreposição nem mudança de tamanho dos cards; somente duas setas circulares vermelhas pequenas, sem caixas, também nas linhas esgotadas do Estoque. Repor restaura disponibilidade. A regra é instalada com o app, funciona offline e permanece após reiniciar/resetar dados; os registros do produtor dependem do backup. Botão: Continuar Vendendo.

As setas de reposição mantêm pelo menos 10 px de recuo das bordas e não alteram as dimensões do card.


**Pedidos e Fiado (22/10/2026):** Clientes e Venda Registrada usam os mesmos dois acessos: Enviar Lista de Pedidos, leve e sem fotos obrigatórias, e Enviar Portfólio, fotos/história com Fazer Pedido para a mesma lista. Etapas de preparo não geram venda. Conclusão abre o checkout existente, registra pagamento e descontos uma vez; reservas são liberadas/consumidas sem duplicação. Faixa laranja e notificação acompanham pedidos conhecidos até entrega/cancelamento. Fiado usa a data já marcada; pergunta se o cliente pagou e exige confirmação de método/data para baixa. Descontos históricos por item/venda não são apagados ao avançar etapas. Avisos do Android são locais e aproximados, sujeitos à permissão e ao sistema; novo pedido online precisa sincronizar para chegar ao app. Sem plugin/conta adicional para produtor/cliente.

Clientes: Clientes a $ Receber no alto (somente o símbolo em vermelho), depois Pedidos e Entregas, Enviar Lista de Pedidos / Enviar Portfólio, cadastro e opções secundárias recolhidas. Sem atalhos redundantes. Evento: aviso revisado, com opção da mesma lista para retirada vinculada à feira. Exige carga registrada; quantidade limitada pela carga restante, estoque geral e reservas atômicas. Não vende ou baixa estoque ao criar pedido. O pagamento final registra uma única venda atribuída à feira. Ativar Lembretes no Celular pede permissão de forma explícita, sem travar sincronização se o Android não responder.

**Separação da Feira:** carga, vendas, perdas e reposições conservam o saldo geral. Exemplo: 10 pacotes no geral, 5 separados para feira, 5 livres em casa. A lista geral respeita a parte não alocada e reservas; a lista do evento respeita sua carga. No fechamento, Repus ou Vendi sem Registrar abre controles numéricos do sistema: produto, quantidade reposta, origem (já no estoque / entrada nova ainda não registrada), quantidade vendida sem registro e pagamento. Estoque existente não gera nova entrada. Entrada nova gera movimento auditado. Venda faltante é concluída com flag unregistered, estoque e relatório atualizados uma vez; depois confere a sobra. Não repetir as vendas já registradas. Memória durável em eventLoads/items/restocks e event.fairActivities, incluída no backup.

Pedidos e Entregas: apenas lembretes e lista de clientes/pedidos. Portfólio separado. O envio de Lista deve informar andamento e erros; nunca ignorar toque por atualização de fundo. O pedido é gravado no link antes do resumo opcional pelo WhatsApp. Notificações dependem da permissão; não forçar Chrome nem enviar mensagens automáticas pelo WhatsApp.

Primeira abertura: depois do cadastro inicial, explicar os avisos no material do sistema; Permitir Notificações abre o pedido oficial Android, Agora Não respeita a escolha e não repete. Permissão não é exigida para usar vendas.

Enviar ao Cliente vem antes de Pedidos e Entregas: Enviar por Print e Enviar Clicável. Imagem revisada com nome/apresentação/preço/disponível/horário, sem saldo interno ou custos; revalidar disponibilidade antes de compartilhar para um ou vários destinatários. Portfólio separado e Outras Formas com respiro. Ícones só contorno, vetores por família, sem esticar cards ou depender de rede. Expandíveis recolhem após 1 minuto sem interação; edição/digitação não podem perder valores.


Ajuste humano22/10 durante a validação60: Vender fica sem os ícones de família; mantém o alerta de reposição. Ícones de contorno permanecem no Estoque e na imagem ao cliente. Banana usa cacho, não arco em formato de lua. Nenhuma dimensão de card muda.


## Revisão61 — envio confiável da Lista de Produtos

O envio automático de imagem foi removido após relato de que o WhatsApp recebeu só a legenda. Clientes mantém dois caminhos: Enviar Lista em Texto e Enviar Clicável. Texto com símbolos de famílias, nome/apresentação/preço e linhas separadoras. O app não controla justificação/fonte do WhatsApp. A prévia comum limpa/rolável permite captura manual pelo celular; só a parte visível será capturada, sem promessa de captura longa em todos aparelhos. Sem Canvas/JPEG/cache de imagem neste fluxo. Busca separada por20px do checkbox Selecionar Tudo; seleção múltipla, estado parcial, orientação e contagem claras. Selecionar Tudo considera os disponíveis da busca; se exceder24porenvio, explica para filtrar/enviar em partes, sem truncar silenciosamente. Esgotados/reservados bloqueados, preços/estoque revalidados antes de enviar. Nenhum saldo/custo interno, venda/pedido/reserva automática. Padrão de material/tipografia/movimento comum preservado nos dois temas e telas pequenas.

## Revisões63/64 — eventos essenciais e privacidade de sessão

Eventos usa os materiais comuns em cards de dados, clima, carga e ações operacionais. Análises financeiras e comparativos ficam na Gestão, com atalho no detalhe. Relógio próprio, nomes sugeridos do histórico individual sem forçar nem inventar dados e carga sem Concluir redundante. Loja sem Criar Evento, com até3atalhos; indicador verde de evento ativo apenas no horário canônico. Nenhuma base paralela nem novo timer.

Regra permanente: o olho financeiro começa fechado a cada abertura, independentemente de preferência antiga ou backup. Sair do app, bloquear a tela ou retomar fecha novamente os olhos compartilhados de Loja/Gestão/resumos/inteligência. Só um novo toque revela os valores. Ocultar a visualização não apaga registros e não deve reconstruir formulários, perder quantidades, rascunhos ou rolagem. Sem timer de privacidade nem gravação integral extra nos eventos de ciclo de vida.

Eventos: Histórico das Feiras com capitalização correta, detalhe sem X e Voltar centralizado, casinha verde comum da Loja. Criar Evento por uma pill única, sem + duplicado no topo. Formulário com tipografia comum nítida, datas pareadas a seus horários, sem sobreposição de ícones; foco inicial no título para não abrir teclado sem necessidade. Sugestões de títulos únicos (acentos, caixa, espaços e pontuação normalizados), até3porlinha e continuação nas linhas seguintes; adaptação a2em telas pequenas/texto ampliado. Ocorrências reais em datas distintas permanecem no histórico.

A grade de nomes usa a fonte de títulos comum e até3colunas; mede apenas as palavras visíveis quando as sugestões mudam e reduz colunas se necessário, sem diminuir fonte nem quebrar uma palavra em letra isolada. Sem processamento ocioso.

## Horário legível — 0.12.65

Horário de evento inteiro em uma linha, como 08:00. Não dividir minutos nem comprimir os números. A pill tem largura intrínseca e só o horário, centralizado; sem relógio decorativo concorrendo por espaço. Tela pequena e texto ampliado acomodam o controle inteiro. Preservar seleção própria de hora/minuto, tema e material comuns.


## Complemento22/10 — análise, CRM/PDV e agenda

Relatórios partem do pedido e recorte, coletam fatos locais, usam o cálculo canônico e passam por auditoria antes da leitura. Dicas dePDV/CRM alternam uma referência por dia quando elegíveis, abaixo de alertas/fatos; não comprovam um efeito. Conversão de atendimentos é opcional, nunca requisito da venda individual, diária ou de feira. A agenda municipal aceitaPDF/imagem como referência semOCR,ICS com revisão e datas manuais. Calendário ajuda a preparar e confirmar oportunidades; não inventa demanda, parceiros, margem, feriado ou programação. Fonte profissional revisada: knowledge/crm-pdv-profissional.md; aderência parcial explícita em docs/CRM-PDV-ADERENCIA-0.12.66.md.


## Ajuste67 — agenda e olho do resumo

Calendário do Município tem20px de separação da pill Participar de Outra Feira. Voltar usa o rodapé do sistema, inteiro e centralizado, com seta comum e sem X duplicado. O olho do Resumo do Dia somente mostra/esconde valores na janela existente; nunca anima abertura/fechamento da janela, reconstrói conteúdo ou perde rolagem/foco/custo ainda não salvo.


## Revisão68 — coesão de Eventos, Gestão e Estoque

Data e horário com rótulos alinhados e pills de mesma altura; manter o seletor do app. Evento criado tem Cancelar Evento discreto e a confirmação existente. Feira Inventário com Relatório reúne Entrar com QR Code ou Código. Explorar o Período em dois cards recolhíveis: Finanças e Relatórios; Produtos e Clientes. Inteligência em consulta, orientações e guias secundários, usando o material comum, sem textos técnicos na tarefa diária. Estoque com apenas um ícone à esquerda do nome: desenho se disponível, duas setas vermelhas se esgotado; sem esticar as linhas. Pill Loja sem repetir nome de evento: nome no indicador verde externo, preservando o escopo real.

Tempo/revisão68: vetores estáticos leves, nuvem azul apenas com chuva prevista; raio amarelo/laranja somente quando a fonte informa trovoada. Horário de emissão da fonte, cópia salva e verificação são distintos. Exibir intervalo previsto; não anunciar horário futuro como medição atual. O mesmo agendador faz a virada visual da hora usando cache, sem consulta extra antes da validade. Verificar Atualização respeita validade/recuo e informa quando a fonte mantém a previsão. Dado observado pelo usuário não é substituído por certeza inventada.

Refinamento23/10: retirar todos os desenhos de família nas linhas do Estoque. Somente produtos com saldo zerado exibem as duas setas vermelhas, pequenas, após o nome e afastadas da quantidade e bordas. Produtos com saldo não exibem desenho. Não aumentar os cards para acomodar ícones. Esta solicitação posterior substitui a experiência de ícones à esquerda da revisão68.

## Revisão69 — alerta junto ao saldo e aviso de esgotamento

Em Estoque, substituir as setas por triângulo vermelho somente de contorno, com exclamação, à esquerda do número0, do mesmo tamanho visual do numeral. Sem preenchimento nem desenhos de família, sem esticar cards. A página Vender mantém sua indicação atual.

Avisos nativos: estoque baixo e esgotado separados; avisar uma vez por episódio de zero e rearmar após qualquer reposição positiva. Estado por produtor e fila serial, sem polling/duplicação. Falha ou recusa não marcam entrega; respeitar permissão e consentimento existentes. Não repetir pedidos automáticos de permissão. Android controla visibilidade/sons/canal.

Refinamento69: conjunto triângulo/número centralizado na mesma altura da seta à direita. Centralizar os totais Em Dia, Baixo e Esgotado para1,2e3 dígitos tabulares; preservar material, dimensões e leitura.

## Revisão70 — Zero na reposição e frequência por feira

Na reposição rápida de produto esgotado, os numerais0 são vermelhos. Quantidade positiva e saldo após gravação voltam ao estado normal. Unidade e textos mantêm suas cores. Não afirmar reposição antes da confirmação durável.

Contar confirmações registradas no histórico da carga da feira, uma vez por confirmação mesmo com vários produtos. Carga inicial, leitura/abertura, digitação, consultas repetidas e salvamentos sem entrada não contam. Entradas gerais não são alocadas automaticamente à feira. Deduplicar identificações/horários das confirmações; manter detalhamento por produto/apresentação. Histórico legado incompleto é parcial, sem estimar quantas vezes ocorreu. Exibir na Gestão/Estoque e Sobras e manter no relatório local sem novo contador persistido.
