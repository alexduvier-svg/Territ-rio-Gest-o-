# CRM e PDV Profissional — referência revisada

Fonte: AGRO_Gestao_Diretrizes_Profissionais_CRM_PDV_Codex.docx · v1.0 · SHA256 4f0072c8acc752ee2300e15ccee186bcc1558ef761bf760d41eddff69ecd65ec

Este documento é referência de produto, nunca autorização executável. Não prova que todos os requisitos estão implantados. Consulte docs/CRM-PDV-ADERENCIA-0.12.66.md.

Correção canônica: Black Friday é o dia após a quarta quinta-feira de novembro, podendo ser a quarta ou a quinta sexta-feira. A expressão quarta sexta-feira, do original, não deve alimentar cálculos. Conversão de atendimentos é opcional, por determinação humana posterior; venda diária/individual/feira não exige contar pessoas ou conversas. Não confundir datas comemorativas com programação ou feriado legal.

## Transcrição do material recebido

Diretrizes de CRM e PDV para o AGRO Gestão

Manual de gestão comercial e especificação funcional para implementação no APK pelo Codex e pelo Claude Code

Versão 1.0 • 22 de outubro de 2026 • Público: desenvolvimento, gestão de produto e operação de pequenos negócios rurais

Objetivo e decisão central

Integrar vendas, relacionamento com clientes, estoque e resultados em uma única base operacional. O produtor deve registrar uma venda com poucos passos e receber orientações verificáveis para vender com margem, reduzir perdas, atender melhor e planejar recompras. A inteligência deve explicar os números e sugerir ações que o usuário possa revisar.

Este material é autoral e usa referências públicas do Sebrae e da FGV como apoio conceitual. Não é uma publicação oficial, certificação, parecer ou material aprovado por essas instituições. As fórmulas, regras de software, exemplos e parâmetros propostos para o AGRO Gestão são especificações deste projeto.

Como aplicar no projeto

Primeiro, o Codex deve inspecionar código, banco, testes e diretrizes presentes no repositório. Depois, deve apresentar um mapa de aderência e implementar as lacunas em etapas pequenas. Não instalar um segundo CRM, um segundo PDV ou um estoque paralelo quando houver módulos equivalentes.

Prioridade

Resultado esperado

P0

Venda íntegra, estoque consistente, recebimentos separados e dados preservados.

P1

Histórico único do cliente, indicadores confiáveis e comparação entre períodos.

P2

Segmentação, lembretes de recompra e análises de produtos e feiras.

P3

Experimentos comerciais e previsões, após comprovar qualidade dos dados.



Escopo operacional

Abrange produtores, feirantes, pequenos comércios, venda direta e encomendas para bares, restaurantes, hotéis e empresas. A versão inicial deve funcionar localmente, sem API de IA, mensageria automática ou hospedagem externa obrigatória. Integrações futuras entram por adaptadores opcionais.



1 Integração sem duplicidade

A auditoria inicial deve localizar a fonte de verdade de clientes, produtos, variações, unidades, vendas, pagamentos, pedidos e eventos. Documentos de intenção não comprovam que uma função está implementada; o código e os testes devem confirmar seu funcionamento.

Elemento existente

Decisão exigida

Cadastro de produtor e clientes

Reutilizar identificadores. Papéis de produtor e comprador podem coexistir sem copiar a pessoa.

Motor de memória e ação

Reutilizar memória autorizada, contratos de ação, explicações e auditoria já disponíveis.

Estoque e financeiro

Integrar por serviços e eventos existentes. Não recalcular saldos por uma segunda rotina concorrente.

Diretrizes sobrepostas

Comparar regra, origem e implementação. Consolidar em documento canônico e registrar conflitos.

CRM ou indicadores parciais

Completar o módulo existente. Migrar com validação, cópia de segurança e possibilidade de reversão.



Entregável obrigatório antes de alterar

Criar uma matriz com requisito, arquivo ou serviço atual, status, lacuna, risco, decisão e teste de aceitação. Classificar cada item como existente, parcial, ausente ou conflitante. Não afirmar aderência sem evidência. Este manual não resulta de acesso ao repositório atual do APK.

Compatibilidade com o desenho do AGRO Gestão

Manter o estoque geral único e a indicação visível do contexto de venda. Preservar os modos Pessoa Física, Empresa e Evento quando já adotados. Durante evento ativo, a interface pode bloquear a troca de modo conforme a regra vigente, mas o registro deve continuar distinguindo o tipo do comprador, o canal e a feira.

Evento é contexto comercial; pessoa física ou jurídica é natureza do comprador. Não reunir esses conceitos em um único campo que impeça identificar uma empresa comprando em uma feira. Uma venda pode ter contexto Evento, comprador PJ e canal Presencial ao mesmo tempo.

Preservação e migração

Não excluir histórico para adequar o modelo. Criar migrações versionadas, reconciliação de totais antes e depois, relatório de registros ambíguos e cópia recuperável. Nunca unir clientes automaticamente apenas por nome. Telefone compartilhado também exige revisão humana.



2 Modelo de dados e qualidade

Todo registro comercial precisa pertencer ao negócio correto. Em instalação com vários produtores, o identificador do negócio deve participar das consultas, exportações e controles de acesso. Identificadores estáveis permitem funcionar sem conexão e evitar duplicação em futuras sincronizações.

Entidade

Campos e invariantes mínimos

Cliente

ID, nome, tipo PF ou PJ ou não informado, contatos opcionais, cidade e bairro opcionais, preferências declaradas, permissões de contato.

Produto e variação

ID da família e SKU, descrição, condição, peso, unidade de venda, conversão explícita, preço, custo, situação e validade quando aplicável.

Venda e itens

ID, instante, dia comercial, contexto, cliente opcional, SKU, quantidade decimal, preço e custo históricos, descontos e status.

Pagamento e parcela

ID próprio, venda, meio, valor devido, valor recebido, vencimento, confirmação, estornos e origem da confirmação.

Movimento de estoque

SKU, lote quando houver, quantidade, unidade, tipo, motivo, venda ou pedido de origem e chave de unicidade.

Interação e ação

Cliente, finalidade, data, canal, responsável, autorização, estado da ação, resultado observado e evidência.

Evento e oportunidade

Contexto, início e fim, duração aberta, despesas próprias, etapas da negociação, prazo e motivo de perda.



Preços e custos históricos

Guardar no item o preço, o custo e a regra de desconto vigentes na venda. Alterar o cadastro amanhã não deve reescrever a margem de ontem. Se houver correção de custo, gerar revisão identificável e permitir distinguir o valor originalmente informado do valor corrigido.

Dados ausentes e unidades

Custo ausente é desconhecido, nunca zero. Cliente não identificado participa das vendas, mas não de retenção nominal. Conversão entre caixa, cacho, dúzia, quilo e unidade exige fator cadastrado e válido para o SKU; não inferir equivalência física de uma lista de produtos.

Representar dinheiro em centavos inteiros ou decimal exato. Usar decimal para pesos e quantidades fracionadas. Definir arredondamento monetário comercial consistente e distribuir resíduos de desconto de modo determinístico. Registrar UTC e fuso; agrupar por dia comercial local.



3 Operação segura do ponto de venda

O PDV deve permitir escolher produtos, ajustar quantidade, revisar preço e desconto, identificar o comprador opcionalmente e concluir a venda. Dados adicionais do CRM não podem interromper uma venda rápida no balcão ou na feira.

Estados e efeitos

Estado ou ação

Regra de negócio

Rascunho

Carrinho editável. Não gera receita, recebimento ou baixa definitiva.

Pedido confirmado

Pode reservar estoque disponível por regra explícita. Reserva não é baixa nem receita de venda.

Venda concluída

Grava cabeçalho, itens, movimento e obrigações financeiras de forma atômica. Liquidação é estado separado.

Pagamento pendente

Venda a prazo aprovada pode ser concluída; não apresentar o valor como recebido.

Cancelamento

Não apagar venda. Criar reversões e motivo. Não duplicar reposição ou estorno.

Devolução parcial

Referenciar item e quantidade original. Repor somente mercadoria fisicamente aproveitável; descarte tem movimento próprio.

Pagamento estornado

Registrar reversão financeira sem presumir retorno de mercadoria. Conciliar cada dimensão separadamente.



Conclusão atômica e recuperação

Gerar uma chave única para cada intenção de finalização. Dois toques ou uma repetição após reinício devem retornar a mesma venda, sem nova baixa. Se o processo falhar, todas as alterações locais devem ser revertidas; se já tiver confirmado, recuperar o comprovante existente. Não deixar uma venda gravada sem seus movimentos correspondentes.

Permitir múltiplos meios de pagamento e parcelas. A soma recebida, mais o saldo a receber, deve fechar o total devido. Exibir troco somente em dinheiro quando aplicável. A leitura de um QR Code não comprova liquidação de Pix; sem conciliação, a confirmação é manual e deve ter esse rótulo.

Fechamento de caixa e limites

Caixa esperado em dinheiro = abertura + recebimentos em dinheiro − devoluções em dinheiro + suprimentos − sangrias. Comparar com a contagem física e registrar diferença e justificativa. Cartão e Pix aparecem em conciliação própria, sem entrar no numerário contado.

Comprovante gerencial não é documento fiscal. Não presumir emissão de NF-e ou NFC-e por gerar um PDF. Integração fiscal exige escopo, regras aplicáveis e implementação próprios.



4 Dicionário de indicadores do PDV

Convenção gerencial deste manual: receita líquida comercial, abreviada RLC, é venda de mercadorias após descontos e devoluções, antes da dedução dos tributos tratados como despesa variável. Não usar esse nome como equivalência automática à receita líquida contábil de uma DRE.

Indicador

Fórmula e interpretação

Venda bruta

Σ quantidade × preço de tabela histórico, somente nas vendas concluídas.

RLC

Venda bruta − descontos − valor comercial devolvido. Cancelamentos não compõem venda efetiva.

Recebimentos

Valores efetivamente confirmados no período, líquidos de estornos. Podem corresponder a vendas de outras datas.

Ticket médio

RLC das vendas elegíveis ÷ número dessas vendas. Excluir canceladas e integralmente devolvidas de numerador e denominador.

Itens por venda

Quantidade líquida ÷ vendas elegíveis, apenas dentro de unidades comparáveis. Usar linhas por venda para cestas heterogêneas.

Margem de contribuição

MC = RLC − custo dos itens líquidos vendidos − despesas variáveis atribuíveis, sem dupla dedução de tributos ou taxas.

MC percentual

MC ÷ RLC × 100. Agregado usa soma das margens e soma das receitas; nunca média simples de percentuais.

Resultado operacional gerencial

MC − custos e despesas fixos do mesmo escopo e período. Informar se há depreciação e remuneração do trabalho incluídas.

Ponto de equilíbrio em reais

Gastos fixos ÷ (MC ÷ RLC), com composição de vendas comparável e margem positiva.

Produtividade comercial

RLC ou MC ÷ horas efetivamente abertas. Comparar escopos e critérios de custo iguais.



Cobertura e reconciliação

Exibir cobertura de custo = RLC dos itens com custo conhecido ÷ RLC total positiva. Sem custo completo, rotular a margem como parcial e informar a cobertura. Não extrapolar a margem dos itens conhecidos para os desconhecidos sem mostrar que é uma estimativa.

Receita não é caixa e margem de contribuição não é lucro líquido. Custos de produção devem ter método explícito; trabalho próprio não registrado pode superestimar o resultado. Uma despesa pertence uma única vez ao cálculo. Todo cartão de KPI deve abrir período, filtros, fórmula e registros de origem.



5 Preço desconto e rentabilidade

O preço precisa cobrir custos, despesas variáveis e a contribuição desejada, respeitando mercado, qualidade percebida e capacidade de entrega. O app deve simular alternativas, sem presumir que preço baixo aumenta demanda ou que aumento de preço preserva volume.

Exemplo auditável de café de 250 gramas

Variável

Sem desconto

Com desconto de 10 por cento

Preço cobrado

R$ 25,00

R$ 22,50

Custo variável por pacote

R$ 14,00

R$ 14,00

Taxa variável de 4%

R$ 1,00

R$ 0,90

MC por pacote

R$ 10,00

R$ 7,60

MC percentual

40,00%

33,78%

Volume para manter MC de 100 pacotes

100 pacotes

132 pacotes inteiros



A contribuição cai 24% por pacote. Para preservar R$ 1.000,00 de MC, seriam necessários 1.000 ÷ 7,60 = 131,58 pacotes, arredondados para 132. O crescimento necessário é aproximadamente 31,58%, antes de novos custos de produção ou capacidade. Esse volume não é uma previsão de vendas.

Fórmulas de decisão

Se c é o custo variável unitário em reais, v a taxa variável sobre o preço cobrado e m a margem de contribuição alvo em fração, então preço alvo = c ÷ (1 − v − m). Exigir 1 − v − m > 0. Com c = 14, v = 0,04 e m = 0,30, o preço mínimo para a meta é R$ 21,22, arredondado para cima ao centavo para não violar o piso.

Desconto máximo indicativo = 1 − preço alvo ÷ preço de tabela. Para R$ 25,00 e piso de R$ 21,22, o limite é 15,12%. Tarifas fixas por transação, frete subsidiado e perdas esperadas exigem adaptação do modelo, sem omitir custos para produzir um preço atraente.

Aplicação no PDV

Desconto no total deve ser rateado proporcionalmente aos valores dos itens elegíveis, com soma exata em centavos. Guardar motivo e responsável por exceções. Ao ultrapassar a margem mínima configurada, mostrar contribuição antes e depois e solicitar confirmação. Venda abaixo do custo exige permissão específica e justificativa, sem impedir exceções legítimas de perecibilidade.



6 CRM orientado ao relacionamento

O CRM deve transformar histórico em atendimento útil. Na ficha do cliente, reunir compras, produtos preferidos, pedidos abertos, datas prometidas, contatos autorizados e pendências. Priorizar informações declaradas e fatos observados, evitando perfis presumidos ou rótulos depreciativos.

Jornada e etapas comerciais

Usar as etapas Contato recebido, Necessidade entendida, Proposta enviada, Pedido confirmado e Entregue. Encerrar como Perdido quando houver desistência, com motivo opcional. Uma compra direta pode ir imediatamente ao PDV sem criar uma oportunidade artificial em todas as etapas.

A cada oportunidade, manter data de entrada, próxima ação, prazo, responsável e resultado. Registrar objeções como preço, prazo, indisponibilidade ou entrega. Não classificar silêncio como falta de interesse definitiva nem afirmar leitura de mensagem sem evidência.

Segmento operacional

Critério inicial proposto

Ação sugerida

Novo comprador

Primeira compra identificada

Orientação de uso e convite opcional a novo contato.

Comprador recorrente

Duas ou mais compras em datas distintas

Observar intervalo de recompra e disponibilidade.

Possível atraso de recompra

Prazo individual excedido com histórico suficiente

Lembrete contextual para o produtor revisar.

Comprador empresarial

PJ ou estabelecimento identificado

Acompanhar volume, especificação, prazo e entrega.

Reclamação em aberto

Ocorrência ainda não resolvida

Resolver atendimento antes de oferecer novos itens.



Recompra sem regra universal

Estimar intervalo típico pela mediana dos intervalos entre compras da mesma família. Exigir, como parâmetro inicial do projeto, pelo menos quatro compras em datas distintas, gerando três intervalos. Sugerir atenção após 1,5 vez a mediana; permitir calibrar por categoria e sazonalidade. Abaixo disso, mostrar histórico insuficiente e permitir lembrete manual.

Contato e experiência simples

Abrir WhatsApp por iniciativa do usuário com texto revisável; registrar abertura como intenção de contato. Enviado, respondido e convertido exigem confirmação manual ou evidência de integração. Sem serviço externo, não prometer notificações remotas automáticas. Lembretes locais e atualização manual podem operar no aparelho.



7 Indicadores de clientes e funil

Todas as análises nominais devem informar quantas vendas têm cliente identificado. Uma carteira pequena, sazonal ou majoritariamente anônima não sustenta inferências fortes sobre fidelização.

Indicador

Definição operacional

Identificação de vendas

Vendas elegíveis com cliente identificado ÷ todas as vendas elegíveis. Mostrar também cobertura por RLC.

Frequência

Compras elegíveis identificadas ÷ clientes compradores identificados no período. Não confundir vários itens com várias compras.

Recompra de coorte

Clientes que fizeram nova compra em H dias após a primeira ÷ clientes da coorte com H dias completos de observação.

Retenção entre janelas

Clientes compradores na janela A que também compraram na B ÷ compradores de A. Usar janelas comparáveis e completas.

Conversão de propostas

Propostas ganhas ÷ propostas decididas da mesma coorte. Informar as abertas separadamente e o horizonte de observação.

Concentração de carteira

RLC dos maiores k clientes ÷ RLC identificada. Apresentar percentual de vendas sem identificação ao lado.

CAC observado

Despesas de aquisição atribuídas ÷ novos clientes identificados atribuídos. Expor método de atribuição e custos não incluídos.

Contribuição histórica do cliente

Soma da MC das compras, menos custos específicos adicionais de atendimento, sem duplicar despesas já deduzidas.

LTV projetado por horizonte

Σ contribuição esperada no período t ÷ (1 + r)^t, até H. Explicitar hipóteses, horizonte e taxa compatível com t.



RFM como triagem opcional

Recência é dias desde a última compra; frequência é número de compras em uma janela; valor monetário é RLC acumulada ou MC, com o nome do critério visível. Menor recência é melhor; maior frequência e valor são melhores. Usar grupos apenas dentro do mesmo negócio e de janelas iguais.

Como regra de partida do projeto, liberar quintis somente com pelo menos 50 compradores identificados e diversidade suficiente. Com muitos empates, manter empates juntos e aceitar menos grupos. Em bases pequenas, usar segmentos simples da página anterior. Não tratar a classificação como medida de crédito ou valor pessoal.

Limites do valor futuro

Começar pela contribuição histórica observada. Não calcular LTV com uma taxa de abandono arbitrária, nem dividir por churn zero. Sem horizonte completo, custos confiáveis e premissas verificáveis, mostrar apenas cenários. Comparar LTV e CAC somente quando ambos tiverem a mesma base econômica e temporal.



8 Regras para comparações justas

Uma comparação só é útil quando informa o que mudou no negócio e o que mudou nas condições de observação. O padrão deve ser comparar o produtor com seu próprio histórico; não inventar médias do Sebrae, da FGV ou do mercado.

Comparação

Ajuste obrigatório

Semana e mês

Mesmo número de dias abertos e mesmo estágio do período. Não comparar mês parcial com mês completo como se fossem equivalentes.

Feiras

Informar horas abertas, tipo de evento, deslocamento, taxas, composição dos produtos e disponibilidade de estoque.

Canais e compradores

Separar presencial e encomenda de PF e PJ. Medir entrega, prazos e taxas próprios de cada recorte.

Produtos e embalagens

Comparar SKU com SKU. Por quilo ou litro apenas quando conversão, qualidade e conteúdo forem comparáveis.

Taxas percentuais

Exibir mudança em pontos percentuais e bases. De 20% para 25% são +5 p.p. e +25% relativos.

Base nula ou negativa

De zero para valor positivo, mostrar novo movimento e diferença absoluta. Base negativa requer descrição, sem taxa enganosa.

Clima e sazonalidade

Informar contexto conhecido. Chuva associada à queda não comprova causa; não atribuir causalidade sem desenho adequado.



Decomposição do resultado

Variação relativa = (valor atual − referência) ÷ referência × 100, apenas quando a referência positiva torna a medida interpretável. Mostrar também a diferença absoluta. Agregados devem usar pesos reais: a margem total é soma das MC dividida pela soma das RLC.

Para um mesmo SKU: receita atual − receita anterior = (preço atual − preço anterior) × quantidade anterior + preço atual × (quantidade atual − quantidade anterior). É uma decomposição exata em efeito preço e efeito quantidade nessa ordem; não prova causalidade. Para vários SKUs, somar por item e identificar produtos novos ou retirados.

Qualidade da evidência

Sempre mostrar tamanho da base, cobertura e janela. Como política inicial de produto, sinalizar menos de 30 vendas em um recorte como base pequena, sem dizer que 30 torna uma análise estatisticamente confiável. Histórico curto permite descrição, mas não previsão robusta. Não exibir probabilidades de sucesso inventadas.



9 Estoque mix e demanda observada

Vender muito não garante boa margem; vender pouco não significa que um produto deva ser retirado. A análise precisa combinar contribuição, disponibilidade, validade, papel na cesta e esforço operacional.

Análise

Regra e uso

Curva ABC de receita

Ordenar SKUs por RLC positiva e calcular participação acumulada. A até 80%, B até 95%, C restante como parâmetros iniciais; atribuir o item que cruza o limite à classe anterior.

Curva ABC de contribuição

Ordenar por MC positiva. Itens com MC negativa ou custo desconhecido ficam em listas próprias; não distorcer a acumulação.

Giro no período

Custo líquido dos itens vendidos ÷ estoque médio ao custo. Usar média de saldos diários; média inicial e final apenas como aproximação rotulada.

Cobertura em dias

Estoque disponível ÷ média diária de saída em dias comparáveis. Com saída zero, mostrar sem consumo observado; não infinito útil.

Ruptura observada

Horas sem disponibilidade ÷ horas abertas previstas, se esses registros existirem. Sem eles, informar apenas ocorrências de falta.

Perdas físicas

Quantidade descartada ÷ quantidade disponível para comercialização no período, por SKU e unidade, com entradas e ajustes conciliados.

Ponto de reposição

Demanda média diária × prazo de reposição + estoque de segurança. Todos os termos na mesma unidade e calendário.

Afinidade de cesta

Suporte A e B = cestas com ambos ÷ cestas totais; confiança A→B = cestas com ambos ÷ cestas com A; lift = confiança ÷ frequência de B.



Demanda não observada e perecibilidade

Venda registrada mede demanda atendida. Se houve ruptura, a média pode subestimar a procura. Registrar solicitações não atendidas separadamente, sem convertê-las em vendas. Em perecíveis, limitar sugestão de reposição à validade, capacidade, prazo de entrega e cenário conservador de consumo.

Estoque de segurança deve começar com configuração manual explícita quando faltam dados. Modelos estatísticos só entram após validar variabilidade da demanda e do prazo. Não recomendar compra apenas porque o indicador de quantidade está vermelho.

Combos e recomendações

Afinidade não comprova efeito de um combo. Como filtro inicial, exigir 30 cestas e pelo menos 5 coocorrências, ainda com rótulo exploratório. Calcular contribuição do conjunto após desconto e embalagem. Priorizar disponibilidade real e adequação ao cliente; não empurrar item perecível sem transparência.



10 Motor de análise e próximas ações

As regras abaixo são propostas iniciais do AGRO Gestão, não padrões oficiais do Sebrae ou da FGV. Limites precisam ser configuráveis e versionados. O motor deve preferir poucas recomendações relevantes, explicadas com dados locais.

Regra

Condição verificável

Ação recomendada

R01 Receita sem margem

RLC cresce e MC total cai em janelas equivalentes, com custo completo

Abrir análise de descontos, taxas, custo e mix.

R02 Margem insuficiente

MC percentual abaixo da meta cadastrada

Simular preço, custo e volume; não alterar preço sozinho.

R03 Recompra atrasada

Histórico individual suficiente e intervalo excedido

Sugerir contato permitido; verificar estoque antes.

R04 Risco de falta

Cobertura abaixo do prazo de reposição e estoque de segurança

Sugerir reposição condicionada à validade e ao caixa.

R05 Perda recorrente

Descartes crescem em duas janelas comparáveis

Revisar quantidade produzida, conservação e tamanho dos lotes.

R06 Concentração

Maior cliente supera limite configurado de RLC identificada

Mostrar dependência e sugerir diversificação.

R07 Pedido em risco

Prazo de entrega próximo e reserva insuficiente

Revisar produção, estoque e promessa feita.

R08 Recebível vencido

Saldo não liquidado após vencimento

Conferir pagamento e preparar lembrete revisável.

R09 Dados insuficientes

Custos, duração ou identificação incompletos

Pedir o dado que desbloqueia a análise; não fabricar diagnóstico.



Contrato de uma recomendação

Cada saída deve conter ID da regra e versão, negócio, período, filtros, fatos, fórmula aplicada, referências aos registros, limitações, prioridade, ação sugerida e validade. Separar observação, hipótese e ação. Confiança qualitativa deve se referir à qualidade da evidência, sem percentual artificial.

Exemplo de linguagem: “Você vendeu R$ 500 a mais, mas a contribuição caiu R$ 80. Os descontos aumentaram no período. Confira os cinco itens que mais explicam essa diferença.” Se custos estiverem incompletos, substituir o diagnóstico de margem por aviso de cobertura.

Controle de execução

O motor pode calcular e montar rascunhos. Enviar mensagem, mudar preço, comprar insumo, registrar baixa ou conceder desconto depende de ação explícita do usuário e das permissões existentes. Registrar sugerida, revisada, executada, descartada e resultado; ocultar alertas repetidos sem perder a trilha.



11 Estudo comparativo de duas feiras

Exemplo hipotético para testes e explicação ao produtor. Todos os custos variáveis estão incluídos na MC; os gastos específicos abaixo não foram deduzidos antes. O mix e as condições diferem, portanto a comparação descreve resultados e não identifica a causa da diferença.

Medida

Feira A

Feira B

Horas abertas

6

8

Vendas elegíveis

40

60

RLC

R$ 1.200,00

R$ 1.500,00

Custo dos itens vendidos

R$ 660,00

R$ 975,00

Outras despesas variáveis

R$ 60,00

R$ 75,00

MC total

R$ 480,00

R$ 450,00

MC percentual

40,00%

30,00%

Ticket médio

R$ 30,00

R$ 25,00

RLC por hora

R$ 200,00

R$ 187,50

MC por hora

R$ 80,00

R$ 56,25

Gastos específicos do evento

R$ 180,00

R$ 250,00

Resultado direto do evento

R$ 300,00

R$ 200,00



Leitura correta

A Feira B faturou 25% a mais e teve 50% mais vendas, mas a MC total caiu 6,25%. O ticket diminuiu 16,67%, a MC perdeu 10 pontos percentuais e a contribuição por hora caiu aproximadamente 29,69%. O resultado direto foi R$ 100,00 menor, uma queda de 33,33%.

O resultado direto desconta somente os gastos específicos informados. Não é lucro líquido do negócio e não inclui automaticamente rateio de estrutura, tributos não cadastrados ou remuneração do produtor. Comparar as feiras exige verificar esses custos antes de recomendar abandono de um evento.

Próximas verificações

Abrir o mix por SKU, descontos concedidos, perdas, taxas, horas de pico e pedidos não atendidos. Verificar se a segunda feira conquistou novos clientes que recompraram depois. Esse possível benefício deve aparecer como contribuição futura observada, quando acontecer, sem aumentar retroativamente o resultado direto do dia.



12 Privacidade desempenho e interface

Proteção proporcional aos dados

Separar registro operacional de compra e autorização de marketing. Não exigir CPF, aniversário ou endereço completo em uma venda comum sem necessidade definida. Registrar finalidade, base legal aplicável e preferências por canal; consentimento não deve ser presumido por ter ocorrido uma compra. Validar o enquadramento com responsável adequado ao contexto.

Prever correção, exportação e tratamento de pedidos de exclusão, respeitando retenções necessárias. Restringir acesso por perfil, proteger cópias de segurança, usar armazenamento seguro de credenciais e evitar telefones ou documentos em logs. Não enviar a uma IA externa o cadastro completo como contexto padrão. As recomendações de segurança dialogam com o guia da ANPD [3].

Se houver Clube AGRO Gestão, reaproveitar o cadastro do produtor e manter adesão voluntária, confirmação dos dados visíveis e desativação. A participação não autoriza expor sua carteira de clientes, histórico de compras ou documentos a outros produtores.

Cálculo local e aparelhos modestos

Executar indicadores e regras determinísticas no aparelho, com consultas indexadas por negócio, data, cliente e SKU. Atualizar agregados por mudanças reais; deixar tarefas pesadas para segundo plano. Não tornar modelos de linguagem necessários para concluir venda ou abrir estoque. Reaproveitar a política adaptativa existente se o projeto já a tiver.

Como metas iniciais de engenharia, validar resposta visual ao toque em até 100 ms, busca comum em até 300 ms e confirmação local em até 1 segundo no aparelho de referência. São metas propostas, não garantias; medir em dispositivos reais e com base representativa, sem travar a interface ao recalcular histórico.

Hierarquia da experiência

Na página de venda, priorizar produto, condição, peso e valor. Exemplo: Café especial • Moído • 250 g • R$ 25,00. Agrupar a mesma família e ordenar pesos crescentes. Na ficha do cliente, mostrar próxima ação, última compra e pedidos; deixar métricas avançadas em seção expansível.

Na Gestão, destacar vendas, contribuição e recebimentos com nomes distintos, janela visível e explicação ao toque. Não depender só de cores. Testar largura de 320 a 430 pixels lógicos, fonte ampliada, áreas de toque próximas de 48 pixels lógicos e teclado sem encobrir a confirmação. Manter temas claro e escuro legíveis.



13 Implantação e testes de aceitação

Etapa

Entrega verificável

1 Diagnóstico

Mapa de módulos, conflitos, indicadores atuais e dados históricos. Plano de integração aprovado no fluxo do projeto.

2 Integridade do PDV

Transações, pagamentos, cancelamentos, devoluções, custo histórico e reconciliação.

3 Gestão básica

RLC, MC, caixa, ticket, cobertura de dados e filtros. Fórmulas compartilhadas entre tela e relatório.

4 CRM essencial

Ficha única, histórico, etapas, contatos permitidos, lembretes locais e recompra.

5 Inteligência progressiva

Comparações, ABC, recomendações explicadas e aferição de resultados. Avançados somente com dados adequados.



Casos obrigatórios de teste

T01 Finalizar duas vezes a mesma intenção cria uma venda e uma baixa. T02 Encerrar o app durante a gravação recupera transação consistente. T03 Reabrir após sucesso anterior devolve o comprovante existente. T04 Duas conclusões concorrentes não vendem o mesmo saldo se estoque negativo estiver bloqueado.

T05 Devolver parcialmente reverte valor e custo corretos e só repõe item aproveitável. T06 Estornar pagamento não repõe estoque por si só. T07 Venda a prazo altera receita e recebível, sem elevar caixa recebido. T08 Dinheiro e Pix divididos fecham o total e o troco correto.

T09 Desconto de um centavo distribuído entre vários itens preserva soma exata. T10 Alterar o custo atual não modifica a venda histórica. T11 Custo ausente não vira margem de 100%. T12 Base zero não gera divisão inválida nem crescimento infinito.

T13 Cliente não identificado fica fora de retenção nominal. T14 Coorte incompleta não entra no denominador de recompra em H dias. T15 Venda perto da meia-noite usa o dia comercial correto. T16 Nova exportação reconcilia totais com PDV, estoque e recebíveis.

T17 Revogar contato impede novas sugestões de marketing para aquele canal. T18 Usuário de um negócio não acessa carteira de outro. T19 Restaurar a cópia de segurança preserva vínculos e saldos. T20 Os dois exemplos numéricos deste manual reproduzem valores, arredondamentos e rótulos.

Critério de conclusão

Entregar versão funcional com dados preservados, testes relevantes aprovados, telas verificadas e lista explícita de limitações. Registrar arquivos alterados, migrações, evidências dos testes e como reverter a mudança. Não considerar concluído um indicador que apenas mostra um número sem reconciliar sua origem.



14 Rotina gerencial e avaliação de ações

A profundidade analítica deve aparecer na decisão, sem obrigar o produtor a estudar todos os indicadores. Organizar uma rotina curta, com perguntas claras e uma ação concreta por vez.

Frequência

Perguntas e decisões

Ao concluir a venda

O total está certo? O pagamento foi confirmado? O estoque e o comprovante estão consistentes?

Fim do dia ou feira

Quanto vendi, quanto recebi e qual contribuição gerei? Onde houve diferenças, faltas, perdas ou pedidos pendentes?

Toda semana

Quem precisa de retorno? Quais produtos faltaram ou sobraram? Descontos trouxeram contribuição adicional?

Todo mês

A MC cobriu a estrutura? Quais clientes, canais e eventos sustentam o resultado? Os dados permitem confiar na análise?

A cada ciclo produtivo

Quanto produzir ou comprar? O prazo, a validade, a capacidade e o caixa suportam o plano?



Ficha de uma ação comercial

Registrar hipótese, público elegível, produto, oferta, período, custo, capacidade, meta e critério de encerramento. Exemplo: oferecer recompra do café de 250 g a clientes que autorizaram contato e já compraram essa família, sem reclamação aberta e com estoque suficiente.

Medir contatos efetivamente confirmados, respostas, pedidos, RLC, MC e custo da ação. Uma venda após o contato é conversão atribuída por uma regra, não prova de incremento. Se viável, dividir aleatoriamente elegíveis em grupo contatado e controle; usar grupos no mesmo período e evitar contaminação.

Contribuição incremental estimada = MC média por elegível no grupo tratado − MC média por elegível no controle, multiplicada pelo número de tratados, menos o custo adicional da campanha ainda não contabilizado. Em amostras pequenas, relatar resultado exploratório e diferença observada, sem afirmar eficácia causal.

Metas e benchmarking

Definir metas a partir da base real, capacidade e margem mínima do produtor. Usar cenário conservador, base e favorável com hipóteses visíveis, sem chamar esses cenários de probabilidades. Meta de faturamento isolada pode estimular descontos ruins e excesso de produção.

Benchmark externo só pode aparecer com fonte, data, segmento, porte, região, método e composição comparáveis. Não usar percentuais genéricos de retenção, conversão ou lucro como padrão universal. No início, é mais útil comparar quatro feiras semelhantes do próprio produtor do que uma média nacional sem contexto.



15 Motor de decisão sobre promoções

Objetivo: responder se vale promover, por que agora, por que não agora e qual alternativa preserva melhor o resultado. O calendário é um sinal de contexto; a recomendação depende de produto, público, estoque, custos, validade, capacidade e prazo. Uma data festiva nunca basta para justificar desconto.

Ordem obrigatória da decisão

1 Verificar elegibilidade e qualidade dos dados. 2 Definir o objetivo comercial. 3 Comparar manter preço, desconto, combo, brinde, pré-venda e não agir. 4 Simular contribuição e caixa. 5 Conferir capacidade, reservas e validade. 6 Explicar a escolha e suas condições. 7 Pedir revisão antes de executar. 8 Medir o resultado depois.

Saída do motor

Quando apresentar

Vale testar agora

Há público compatível, tempo útil, capacidade e cenário conservador economicamente favorável. Explicar o alcance limitado do teste.

Prepare agora e venda depois

A oportunidade existe, mas o melhor passo atual é encomenda, compra de embalagem, reserva ou contato antecipado.

Não promover agora

A ação reduz contribuição provável, agrava ruptura, compromete entregas ou incentiva compra que ocorreria sem desconto.

Trocar o mecanismo

Desconto amplo perde margem, mas kit, brinde de custo conhecido, pedido mínimo ou pré-venda pode atender ao objetivo.

Não há dados para decidir

Faltam custo, validade, prazo, estoque livre ou demanda de referência. Solicitar o mínimo necessário.



Comparação econômica por cenário

Definir Q0 como volume estimado sem ação, P0 como preço normal, P1 como preço promocional, c como custo variável unitário e v como taxa variável proporcional. MC0 = Q0 × [P0 × (1 − v) − c]. MC1 = Q1 × [P1 × (1 − v) − c] − K, onde K é o custo adicional da ação não incluído antes. Ganho incremental = MC1 − MC0. Explicitar a origem de Q0 e Q1 e não tratá-los como demanda garantida.

Volume mínimo para igualar a contribuição original = (MC0 + K) ÷ [P1 × (1 − v) − c], se o denominador for positivo. Arredondar para cima quando a unidade for indivisível. Nos exemplos anteriores, K = R$ 50 e MC unitária promocional = R$ 7,60 exigem 139 pacotes para superar MC0 de R$ 1.000. Limitar os cenários ao estoque livre, produção e capacidade efetiva de entrega.

Efeitos que não podem desaparecer da conta

Considerar canibalização de vendas a preço normal, antecipação de compras futuras, substituição entre SKUs, custo de contato, entrega e embalagem. Desconto em todas as unidades exige vender mais também para compensar a margem cedida a clientes que comprariam sem incentivo. Projetar caixa por data quando produzir ou comprar antes de receber.



16 Dicas explicadas e alternativas comerciais

Situação observada

Por que agir ou evitar

Alternativa e mensagem ao produtor

Evento próximo e procura já forte

Pouco estoque livre e boa venda no preço normal tornam desconto amplo desfavorável.

“Você já tem pedidos para boa parte do estoque. Mantenha o preço e organize reservas antes de divulgar mais.”

Evento próximo e clientes compatíveis

Estoque disponível, margem conhecida e prazo permitem experimentar uma oferta delimitada.

“Há tempo para montar kits. Confira a contribuição por kit e teste com um grupo pequeno antes de ampliar.”

Produto parado com validade suficiente

Pode haver falha de exposição, público ou apresentação, sem necessidade de baixar preço.

“Antes do desconto, mostre o produto a quem já compra essa categoria e compare as respostas.”

Perecível próximo da validade

Pode ser melhor recuperar valor do lote do que perder tudo, se estiver seguro para venda.

“Compare oferta limitada, venda normal provável e descarte. Confira validade e conservação antes.”

Black Friday com margem apertada

A data não compensa contribuição negativa, custos omitidos ou compra desnecessária de estoque.

“Este desconto exige um volume que você não consegue atender. Teste encomenda ou kit sem reduzir o item principal.”

Festa cancelada ou sem confirmação

Não há base para prometer público ou aumentar produção como se o evento estivesse garantido.

“A programação ainda não está confirmada. Mantenha o plano flexível e evite produzir perecíveis antecipadamente.”



Recuperação de lote e custos já incorridos

Para um lote já produzido, distinguir resultado contábil completo de decisão incremental de recuperação. O custo histórico permanece registrado mesmo sendo irrecuperável. Comparar receitas adicionais menos custos evitáveis de cada alternativa, incluindo descarte, sem usar esse cálculo para justificar produção futura sistematicamente abaixo do custo. Mercadoria vencida ou imprópria fica fora de qualquer promoção.

Formato obrigatório da dica na interface

Mostrar título curto, recomendação, por que agora, por que a alternativa é pior, valores comparados, dado faltante, limite de validade e ação revisável. Usar no máximo três dicas prioritárias por abertura como configuração inicial. A seção “Entenda a conta” expande fórmula, cenário e registros, sem poluir a tela principal.

Registrar escolha do produtor e resultado observado. Uma rejeição não significa erro: pode revelar restrição de tempo, transporte ou produção ainda não cadastrada. Permitir “não tenho capacidade”, “prefiro manter o preço” e “lembrar depois”, atualizando apenas preferências autorizadas. Não insistir em promoção descartada sem fato novo.



17 Calendário anual de janeiro a junho

Calendário comercial recorrente para planejamento; não é lista oficial de feriados nem programação confirmada de shows. Datas móveis devem ser calculadas para o ano selecionado. As oportunidades abaixo são hipóteses para avaliar com o histórico do produtor, nunca previsão automática de aumento de vendas.

Mês e marco

Oportunidade a avaliar

Preparação e cuidado

Janeiro1 de janeiro e 7 de janeiro

Réveillon, férias e aniversário de Carangola. Produtos locais, café, lembranças, kits e abastecimento de estabelecimentos.

Planejar em dezembro. Aniversário de Carangola em 7 de janeiro [4]; confirmar separadamente dias e locais das festas. Não presumir comércio aberto.

FevereiroCarnaval quando ocorrer no mês

Encomendas para bares e hospedagens, produtos prontos e atendimento ao visitante.

Carnaval pode cair em fevereiro ou março. Confirmar programação, restrições de acesso, capacidade e horários dos parceiros.

Março15 de março e datas móveis

Dia do Consumidor como ação comercial opcional; Carnaval, Semana Santa ou Páscoa conforme o ano.

Não criar liquidação por obrigação. Verificar margem e público antes de oferecer desconto. Planejar Páscoa com antecedência.

AbrilPáscoa quando ocorrer no mês e 21 de abril

Alimentos, presentes, encomendas e possíveis deslocamentos no período de Tiradentes.

Avaliar categoria e hábitos declarados. Não presumir demanda igual para todos os alimentos nem que toda família observa a mesma tradição.

Maio1 de maio e segundo domingo

Dia do Trabalho e Dia das Mães. Cestas, café e encomendas para encontros familiares.

Reservar embalagens e abrir pré-venda. Produzir perecíveis perto da retirada. Calcular custo real do presente e da entrega.

Junho12, 13, 24 e 29 de junho

Dia dos Namorados e ciclos de Santo Antônio, São João e São Pedro. Café, quitandas, doces e itens para festas juninas.

Confirmar cada festa local. Agregar pedidos por data de entrega. Corpus Christi é móvel e pode ocorrer em maio ou junho.



Regras de recorrência

Páscoa usa cálculo do calendário gregoriano; terça-feira de Carnaval = Páscoa menos 47 dias; Sexta-feira da Paixão = Páscoa menos 2 dias; Corpus Christi = Páscoa mais 60 dias. Essas relações calculam datas, mas não determinam status jurídico, funcionamento do comércio ou realização de uma festa.

O app deve permitir ver qualquer ano, abrir o próximo marco relevante e cadastrar eventos do bairro, comunidade ou estabelecimento. Selecionar oportunidades por categoria vendida, área atendida e prazo de preparo, sem supor preferências religiosas individuais.



18 Calendário anual de julho a dezembro

Mês e marco

Oportunidade a avaliar

Preparação e cuidado

JulhoFérias e 28 de julho

Dia do Agricultor, férias e eventos rurais com data confirmada. Valorizar origem, produção e relacionamento.

Consultar programação da Exposição de Carangola para cada edição; não fixar mês ou datas sem confirmação. Avaliar logística de visitantes.

AgostoSegundo domingo

Dia dos Pais. Kits, cafés, produtos artesanais e encomendas compatíveis com a clientela.

Abrir reservas antes e conferir volume por SKU. Preferir kit com contribuição preservada a desconto geral automático.

Setembro7 e 15 de setembro

Independência e Dia do Cliente como ocasião comercial. Recompra, agradecimento e relacionamento.

Comparar com semanas equivalentes. Evitar disparos em massa e cupons para quem não autorizou contato.

Outubro12 de outubro

Dia das Crianças e Nossa Senhora Aparecida. Encontros familiares, visitantes e eventos confirmados do território.

Festa do Café de Conceição e Concurso Municipal de Qualidade do Café entram por edição e data confirmada; não repetir automaticamente a data anterior.

Novembro2, 15 e 20 de novembro e Black Friday

Finados, Proclamação da República e Consciência Negra como contextos do calendário; Black Friday como campanha comercial opcional.

Respeitar o caráter de cada ocasião. Usar a quarta sexta-feira de novembro para Black Friday e registrar preços reais. Não inventar desconto de referência.

Dezembro13, 25 e 31 de dezembro

Santa Luzia, padroeira de Carangola; Natal e Réveillon. Kits, ceias, café, presentes e encomendas de estabelecimentos.

Santa Luzia em 13 de dezembro [5]. Confirmar novena, celebrações, barracas e horários da edição. Planejar retiradas e prazos sem exceder capacidade.



Carangola como contexto obrigatório

Cadastrar duas recorrências locais distintas: Aniversário de Carangola em 7 de janeiro e Santa Luzia em 13 de dezembro. A data comemorativa pode ser recorrente, mas shows, feiras, missas, procissões e pontos de venda são ocorrências por edição. Não copiar a programação de um ano para outro como se estivesse confirmada.

Eventos do território com data a confirmar

Permitir cadastrar Exposição Agropecuária de Carangola, Festa do Café de Conceição, Feira do Inventário Rural e Cultural, Concurso Municipal de Qualidade do Café, Pedal Ernestina, festas comunitárias e eventos privados. Essa lista serve como fila de planejamento do projeto; não afirma realização, periodicidade ou programação futura. Solicitar mês, dia e organizador quando não houver fonte atual.

Ações sugeridas para o território: levantar encomendas de bares e restaurantes, oferecer produtos locais a hospedagens, planejar retirada na feira e organizar kits de origem. Qualquer contato continua manual e autorizado. Fluxo de turistas, consumo e vendas dependem de evidências locais, não apenas de haver uma festa no calendário.



19 Calendário integrado ao motor de decisão

Reutilizar o módulo de agenda se existir. O calendário comercial acrescenta metadados e regras de preparação, sem criar uma segunda agenda concorrente. Recorrências e edições devem ter IDs diferentes e vínculo explícito para preservar histórico e evitar duplicação.

Campo ou estado

Regra de implementação

Cadastro do marco

Nome, categoria, município, bairro ou localidade, fuso, regra fixa ou móvel, área de influência, categorias relevantes e fonte.

Ocorrência por ano

Data e intervalo, local, organizador, fonte, data da verificação, edição, status e alteração ou cancelamento.

Status

Data comemorativa recorrente; programação a confirmar; programação confirmada; alterada; cancelada. Separar esses estados na interface.

Prazo comercial

Antecedência de contato, produção, compra e entrega configurável por produto e evento. Não recomendar tarefa com prazo já inviável.

Atualização

Entrada manual e funcionamento local. Fonte externa futura é opcional. Mostrar última verificação e não dizer atualizado sem consulta.

Deduplicação

Chave por marco, ano, edição e localidade; alterações atualizam a ocorrência. Eventos homônimos em comunidades diferentes não são necessariamente duplicados.



Janelas iniciais de preparação

D−60 a D−30: confirmar programação, avaliar capacidade, fornecedores e parceiros. D−30 a D−15: simular preços, montar catálogo e abrir encomendas. D−14 a D−7: revisar pedidos, reservas, produção e transporte. D−3 a D−1: confirmar disponibilidade, retirada e pagamento. D+1 a D+7: conciliar resultado, perdas e atendimento. Antecedências são sugestões configuráveis, não notificações já agendadas.

Regras especiais de calendário

R10 Preparar oportunidade: marco compatível dentro da antecedência, com programa confirmado quando a ação depender de público presencial. R11 Evitar desconto por demanda forte: reservas e vendas normais já ocupam a capacidade. R12 Trocar por pré-venda: prazo permite produzir sob pedido e caixa ou perecibilidade desaconselham estoque antecipado. R13 Suspender plano: ocorrência cancelada, alterada ou prazo esgotado.

Testes adicionais para o Codex

T21 Janeiro do próximo ano mantém aniversário em 7 de janeiro. T22 Santa Luzia ocorre em 13 de dezembro sem confirmar automaticamente a festa. T23 Datas móveis mudam corretamente entre anos. T24 Evento cancelado retira dicas dependentes dele. T25 Alteração de data recalcula lembretes sem duplicá-los. T26 Falta de custo impede recomendação de desconto baseada em margem. T27 Venda provável no preço normal pode tornar a promoção desfavorável. T28 Nenhuma dica altera preço ou envia mensagem sem ação do usuário.



20 Instrução para o Codex e referências

Comando de implementação

Analise este documento como diretriz funcional do AGRO Gestão. Inspecione primeiro o repositório, as instruções locais e os módulos de PDV, estoque, CRM, financeiro, memória e ação. Identifique duplicidades de regras e cadastros, indique as fontes de verdade e produza matriz de aderência com evidências no código. Não crie serviços paralelos quando houver funções equivalentes.

Reutilize identificadores, contratos, componentes e política adaptativa existentes. Separe natureza do comprador, contexto de evento e canal. Implemente primeiro integridade transacional e dicionário único de indicadores; em seguida, CRM essencial e regras explicáveis. Implemente o motor de dicas sobre promoção e o calendário anual com aniversário de Carangola e Santa Luzia. Preserve histórico e custos de cada venda, diferencie receita de recebimento e não apresente margem como lucro líquido.

Trate fórmulas e limites deste manual como especificações propostas. Quando conflitarem com código ou diretrizes anteriores, exponha o conflito, avalie compatibilidade e registre a decisão canônica. Não faça migração destrutiva silenciosa. Execute testes de aceitação pertinentes e mostre resultados e limitações. Não habilite APIs pagas, mensagens automáticas ou publicação de cadastros por efeito colateral.

Referências e aplicação conceitual

Consulta às fontes públicas em 22 de outubro de 2026. As referências fundamentam conceitos gerais; não endossam a arquitetura, os limites numéricos ou as regras específicas deste manual.

[1] FGV EAESP. Serson, Fernando M., e Notarnicola, Onófrio. Desenvolvendo a Estratégia para a Adoção do CRM. 1 jun. 2020. Apoio: integração entre estratégia, processos, informação, pessoas e avaliação do relacionamento.https://eaesp.fgv.br/noticias/desenvolvendo-estrategia-para-adocao-crm

[2] Sebrae PR. Você sabe calcular o valor de venda de seus produtos ou serviços. Apoio: custeio direto, margem de contribuição e ponto de equilíbrio. As fórmulas deste manual têm convenções explícitas próprias para implementação.https://www.sebraepr.com.br/comunidade/artigo/voce-sabe-calcular-o-valor-de-venda-de-seus-produtos-ou-servicos-2

[3] Autoridade Nacional de Proteção de Dados. Guia orientativo sobre segurança da informação para agentes de tratamento de pequeno porte. Página atualizada em 23 jan. 2025. Apoio: medidas proporcionais de segurança e registro do tratamento.https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte

[4] Portal Minas Gerais. Aniversário de Carangola 141 anos. Registro da comemoração de 7 de janeiro de 2023, usado para fundamentar a data recorrente, sem confirmar programação futura.https://www.minasgerais.com.br/pt/eventos/carangola/aniversario-de-carangola-141-anos

[5] Diocese de Caratinga. Paróquia Santa Luzia em Carangola. Informa a festa da padroeira em 13 de dezembro. A programação de cada edição precisa ser confirmada.https://diocesecaratinga.org.br/paroquia/paroquia-santa-luzia/

Controle de manutenção

Versionar este manual junto às regras efetivamente implementadas. Toda alteração de fórmula, limiar, período ou elegibilidade deve ter data, justificativa, teste e efeito sobre comparações históricas. Manter uma fonte canônica por conceito para que Codex e Claude Code evoluam o mesmo produto.