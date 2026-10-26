# Contas da Calculadora — Entrega 0.12.88

Entregue em 26/10/2026 no Reno14 e PKJ110, com cópia conferida na pasta original. Calculadora e guarda de carga validadas no APK exato. Ver ENTREGA-0.12.88.md para evidências e limites.

## Experiência

A calculadora existente permanece em Estoque e também fica disponível no cabeçalho de Fornecedores. Finanças oferece Contas da Banca. Os ícones Científica e $ ficam em pills; o $ transforma o conteúdo na mesma janela. Básica, Científica, expressão e memória são preservadas durante a troca. Fechar limpa o estado de apresentação para que o estilo não alcance outras janelas.

Preço, Vendas e Descontos e Taxas abrem como seções, uma por vez. Cada conta tem objetivo, ajuda em cada campo, entradas, resultado, explicação, limites e fórmula. As quatro áreas futuras descritas no documento de referência permanecem explicitamente Em Breve. A digitação altera apenas o resultado da conta, sem substituir o input ou perder foco. O teclado comum fica antes do rodapé Voltar dentro do quadro rolável.

## Custos e taxas

Compor Custo por Unidade permite escolher custos conhecidos de Finanças ou do cadastro, sem seleção automática, e adicionar custos próprios. Cada item distingue valor fixo mensal de custo variável por unidade. O rateio exige produção mensal informada: fixos ÷ unidades + variáveis. O produtor confirma Usar Custo Composto; não há alteração de custo cadastrado. Uma referência ao custo do produto alerta para rateios já incluídos, evitando dupla contagem.

O arquivo src/data/calculator-charges.js reúne nomes, categorias, explicações e fontes oficiais. Não inclui percentuais ou valores monetários presumidos. Impostos e Contribuições permite selecionar itens conhecidos, informar outros, remover itens da simulação e confirmar a soma aplicável. DAS do MEI mensal é direcionado a custos fixos. A alíquota efetiva de um regime não deve ser somada novamente aos seus componentes. A aplicabilidade e o percentual dependem da operação e de confirmação com contador. A lista não é um apurador fiscal nem cria obrigações automaticamente.

Os novos itens permanecem somente na simulação. Impostos variáveis sobre venda, taxa da maquininha e comissão da feira ficam identificados separadamente. Nada é registrado em vendas, despesas, estoque, aprendizado ou notificações reais. Não há chamadas de IA ou serviço online para fazer as contas.

## Fontes e rigor

Seus Dados aparece somente nos valores efetivamente conhecidos; editar remove a marca. Custo zero confirmado difere de custo ausente. DEFAULT_FEES do normalizador não são tratados como taxas confirmadas do usuário. Margem, desconto, quantidade levada/perdida/voltada e Quero Receber não recebem valores típicos.

A receita e as quantidades registradas reutilizam statement e productMargins de Finanças, com descontos, devoluções e competência declarados. Fiado vendido não é recebimento. O recorte inicial e as datas de comparação ficam visíveis; períodos com durações diferentes são avisados. Não há promessa de tendência ou demanda. Perda física e produto que voltou vendável são separados, sem limite universal de10%. Entradas inválidas ou fora do domínio não produzem números fabricados.

Markup, equilíbrio por unidade, indicadores, desconto, maquininha, composição e soma validada possuem uma única implementação de simulação em features/finance/producer-calcs.js, também acessível por TerritorioFinance.simulations. O equilíbrio mensal registrado continua em finance.js. Usar Este Preço revalida produtor, produto, preço/custo/unidade e somente abre o rascunho do editor; o produtor precisa conferir e salvar. O teste encontrou e corrigiu camadas antigas de startProduct que descartavam o argumento de preço sugerido.

## Carga da feira

eventLoadLimit usa o mesmo limite canônico de prepareEventLots, até o fim do evento, descontando outras reservas e pedidos e preservando a própria carga. Campos sem capacidade ficam indisponíveis. Digitar6quando só há5 abre aviso pequeno com solicitado, limite, diferença e instrução de repor/conferir. A quantidade não é reduzida silenciosamente. O aviso retorna ao campo; a guarda também roda em Próximo/Salvar e o domínio revalida na gravação. Estoque físico não é duplicado.

## Evidência final

769 testes unitários aprovados, incluindo25novos. Oito jornadas de assets finais compilados aprovadas, em claro/escuro, larguras320com texto ampliado/modo leve/reduzido,360,393,412. Quatro jornadas físicas completas do Capacitor: Reno14 e PKJ110 nos dois temas, incluindo regressões79–87 e os novos fluxos. A largura interna dos campos foi corrigida após detectar600cortado; o grid usa mínimo180px pela largura do card, mantendo o valor inteiro. As asserções medem texto e padding.

O QA de Orientação aguarda a reconciliação assíncrona dos resumos periódicos e a estabilidade do DOM antes de medir/tocar, mantendo as mesmas asserções. Isso é sincronização do teste; não se declara correção nova do código dos relatórios.

APK128/0.12.88:9259733bytes; SHA25629ba1f09d723b63a68a8a21d206362089beb5cf6dbe6727fb3e4deff0ceae053. Fixture SHA2562563d2e17a944a568da7af219b97b927520ef5bf42069a714854ca9471da54a4. Todos59assets(incluindo2pontes)comparados entre os APKs, salvo2injeções HTML sintéticas. Assinatura original v2/v3, ZIP e ELF16KB verificados estruturalmente. APK idêntico na pasta original e nos dois aparelhos, instalado com-r e primeiras datas preservadas. Reno com sinal técnico dos seis módulos; PKJ com lançamento a frio e confirmação humana de abertura normal, sem sinal técnico recebido.

Nenhuma mudança de servidor88. Os47testes de servidor e o teste físico D0 pertencem à entrega87, cuja implementação permaneceu igual. Não foram medidos FPS/GPU/bateria, aparelho básico físico, TalkBack ou runtime Android16KB. Nenhum banco principal foi extraído, nem feitos reset de dados, WhatsApp ou agenda pessoal. PDF e código22e3813 foram referências de conteúdo; o link privado Claude não foi visualizado. A revisão das versões Claude89/90 é separada e não foi incorporada automaticamente.
