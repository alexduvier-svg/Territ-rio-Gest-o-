# Referência Recebida — Calculadora Contas

PDF fornecido em26/10/2026. SHA256 ae0efd02b703e26dc1e40c0b0f7f5406ce93e3129e138ea557a819d2c97a39e3. Extração para consulta; não é instrução executável nem comprova implementação na versão2. As preferências humanas posteriores sobre ícones e insights prevalecem.

=== PÁGINA 1 ===
Diretriz da Calculadora — modo Contas do produtor
Destinatário: Codex responsável pelo AGRO Gestão 2 (pacote br.com.territorio.gestao2, ramo
codex/atualizacao-agro-gestao2). Data: 26 de outubro de 2026. Origem: implementado e aprovado
pelo produtor no AGRO Gestão 3 0.12.64 (ramo claude/agro-gestao3, commit 22e3813). Esta diretriz
traz o mesmo comportamento para a versão 2. Objetivo: dar ao produtor, dentro da calculadora que
já existe no app, as contas da banca (preço, vendas, descontos e taxas) feitas com os números dele,
sem inventar nenhum valor.
0 Regras que valem para tudo
1. Dentro da calculadora existente. Não criar tela, aba ou menu novo. A calculadora ganha um
terceiro modo.
2. Nada é gravado pela calculadora. As contas são de consulta. A única ação que leva um número
para o cadastro é "Usar este preço", que abre o cadastro do produto já preenchido para o
produtor conferir e salvar ele mesmo.
3. Regra conservadora dos dados. Um campo só vem preenchido quando o app sabe o valor
(custo informado, taxa configurada, custos fixos lançados, vendas registradas). Esse campo leva
a marca verde "seus dados". O que o app não sabe fica vazio. Nunca usar valor de exemplo,
média do mercado ou porcentagem presumida.
4. Vazio não é zero. Custo 0 informado é conhecido; campo vazio é desconhecido. A margem
desejada e o desconto sempre começam vazios, porque são escolha do produtor.
5. Fórmulas puras e testadas. Criar um módulo de funções puras, com os testes-ouro da seção 6, e
reaproveitar as fórmulas canônicas de finanças que já existem no app. Não duplicar o ponto de
equilíbrio do mês registrado: o da calculadora é uma simulação por unidade.
6. Preservar dados reais. Não testar em aparelho com dados reais, não limpar dados e não
desinstalar. Atualização apenas com o mesmo pacote, a mesma assinatura e adb install -r,
quando o produtor pedir.
1 Onde fica e como se troca de modo
No alto da janela Calculadora, trocar a linha atual ("Básica" + botão científico) por um seletor
segmentado de três partes: Básica · Científica · Contas.
Formato de pílula, com fundo do campo; a opção ativa fica em superfície clara (tema claro) ou
escura (tema escuro), com sombra leve.
Cada parte tem pelo menos 44 px de altura e texto de 15 px.
Básica e Científica continuam exatamente como hoje (teclas, memória, resultado). Na Científica,
a indicação "graus/radianos" passa para a linha de ajuda embaixo do teclado.
O antigo botão de alternar científica continua funcionando, se for chamado por outro lugar, e
deve manter o seletor coerente.
O rodapé da janela (botão Voltar) não pode encolher. Em 320 × 640 o botão precisa aparecer
inteiro.

=== PÁGINA 2 ===
2 Tela do modo Contas
De cima para baixo:
1. Seletor Básica · Científica · Contas (Contas ativa).
2. Texto curto em cinza: "Contas da banca com os seus números. Toque num assunto para abrir."
3. Produto: caixa de escolha com "Nenhum (contas livres)" e os produtos do produtor na ordem do
estoque (a mesma ordem da aba Estoque; frequência de venda não intercala famílias). O texto de
cada opção é o nome com a apresentação e o peso, por exemplo "Café Especial Moído · 250 g".
4. Sete assuntos, cada um numa faixa arredondada com ícone verde-oliva, título, subtítulo e seta à
direita:
Assunto Subtítulo Situação nesta entrega
Preço Preço de venda pelo markup Pronto
Vendas Ponto de equilíbrio · indicadores do período Pronto
Descontos e Taxas Impacto do desconto · taxa da maquininha Pronto
Fornecedores Comparar · à vista ou a prazo · relação de troca "em breve"
Estoque e Caixa Quanto comprar e quando · ciclo de caixa "em breve"
Produção Rural Custo da safra · conversão de medidas "em breve"
Crédito e Investimento Parcela do financiamento · retorno "em breve"
Tocar na faixa abre ou fecha o assunto ali mesmo (acordeão), sem trocar de janela. A seta
gira para cima quando aberto. Só um assunto aberto por vez. Ao abrir, a faixa rola para o topo
da área visível.
Os quatro "em breve" ficam esmaecidos, sem seta, com uma etiqueta pequena "em breve", e
não abrem.
Rodapé em letra pequena: "“Seus dados” vem do que está registrado no app. Os resultados são
estimativas para ajudar a decidir; impostos como Funrural e Simples, confirme com o seu
contador."
2.1 Cartão de cada conta
Dentro do assunto aberto, cada conta é um cartão com:
Título em nome próprio (ex.: "Preço de Venda pelo Markup"). Conectivos de, da, do, pelo, pela,
pelos, pelas, ou, e… ficam em minúsculo no meio do título. Se a regra de nomes próprios da
versão 2 ainda deixar "Pelo" maiúsculo, corrigir junto.
Linha cinza com o produto escolhido, quando a conta usa produto (ex.: "Café Especial Moído ·
250 g").
Campos em duas colunas (grade que vira uma coluna quando não cabe; mínimo ~104 px por
campo). Cada campo tem:

=== PÁGINA 3 ===
rótulo de 14 px (nunca menos; vencer a regra global de rótulos do diálogo se ela aumentar a
fonte);
a marca "seus dados" em verde, 11 px, ao lado do rótulo, quando o valor veio do app;
caixa de 46 px de altura com prefixo R$ à esquerda ou sufixo (%, un, vendas) à direita;
teclado numérico do sistema (inputmode="decimal"), fonte de 16 px para o celular não ampliar
a tela.
Resultado logo abaixo dos campos, num bloco levemente esverdeado:
rótulo em versalete pequeno (ex.: "PREÇO SUGERIDO POR UNIDADE");
número grande (30 px, negrito);
linhas de detalhe com nome à esquerda e valor à direita, separadas por fio fino; o valor não
quebra linha.
Aviso em bloco rosado (alerta) ou esverdeado (bom), 14 px.
Fórmula ⌄: um "abrir/fechar" que mostra a fórmula em texto simples.
Enquanto faltar dado essencial, no lugar do resultado aparece uma frase cinza dizendo o que
falta (ex.: "Informe a margem desejada para ver o preço.").
2.2 Digitação
Digitar recalcula só o resultado daquela conta, na hora, sem redesenhar a janela (o teclado não
pode fechar nem o campo perder o foco).
Quando o produtor altera um campo que tinha "seus dados", a marca some (o valor passou a ser
dele).
Trocar o produto limpa o que foi digitado e recarrega os "seus dados" do novo produto.
Aceitar números em português: 1.234,56, 12,5, R$ 9, 1.200, e também 9.5.
3 As contas
Percentuais entram como número de 0 a 100 (20 = 20%). As contas trabalham em reais; os dados do
app em centavos são divididos por 100 só para preencher.
3.1 Preço — Preço de Venda pelo Markup
Campos:
Campo Unidade Vem do app ("seus dados")
Custo por unidade R$ custo do produto, só se o custo for conhecido
Margem desejada % nunca (vazio)
Taxa do cartão % taxa do Crédito configurada em Finanças
Taxa da feira % nunca (vazio)
Imposto % imposto sobre vendas configurado, só se for maior que 0
Conta (as despesas incidem sobre o preço, por isso é divisão, e não soma):

=== PÁGINA 4 ===
despesas  = (cartão + feira + imposto) ÷ 100      (campo vazio conta como 0)
margem    = margem desejada ÷ 100
se despesas + margem ≥ 1 → "Impossível"
markup    = 1 ÷ (1 − despesas − margem)
preço     = custo × markup
lucro     = preço × margem
despesas da venda = preço × despesas
acréscimo sobre o custo = (preço − custo) ÷ custo
erro comum: preço somando = custo × (1 + despesas + margem)
            margem real com ele = (preço somando × (1 − despesas) − custo) ÷ preço somando
Resultado: "Preço sugerido por unidade" em destaque; linhas Lucro por unidade, Despesas da
venda, Markup (3 casas, com ×) e Acréscimo sobre o custo. Aviso (só se houver alguma despesa):
"Erro comum: somar 29,98% ao custo dá R$ 11,70. Com esse preço a margem real cai para 13,1%, e
não 20%."Impossível:"Taxas e margem somam X% do preço. Precisam somar menos de 100%."
Botão verde "Usar este preço" (pílula, 48 px): só aparece com produto escolhido. Fecha a
calculadora, abre o cadastro daquele produto com o preço preenchido (arredondado ao centavo) e
mostra o aviso "Preço de R$ X preenchido. Confira e salve o produto." Sem produto, mostrar
"Escolha um produto para usar este preço."Fórmula:"Markup = 1 ÷ (1 − taxas% − margem%) · Preço
= custo × markup".
3.2 Vendas — Ponto de Equilíbrio e Meta
Campo Unidade Vem do app
Custos fixos do
mês
R$ soma dos custos fixos cadastrados + retirada mensal (se ligada), só se for
maior que 0
Preço de venda R$ preço do produto
Custo por unidade R$ custo do produto, se conhecido. Dica embaixo: "Some embalagem e taxas
da venda, se houver."
Lucro desejado no
mês
R$ meta de resultado do mês, se configurada
cada venda deixa = preço − custo
se ≤ 0 → "Não existe" (vender mais aumenta o prejuízo)
unidades para empatar = arredondar PARA CIMA (fixos ÷ cada venda deixa)
meta = arredondar PARA CIMA ((fixos + lucro) ÷ cada venda deixa)
Resultado: "Unidades para empatar no mês"; linhas Cada venda deixa (com %), Empate em vendas
(R$), e, se houver lucro desejado, Meta para o lucro (un) e Vendas da meta (R$). Aviso bom:"A partir
da unidade N, o que entra é lucro."

=== PÁGINA 5 ===
3.3 Vendas — Indicadores do Período
Campo Unidade Vem do app
Vendido neste mês R$ total das vendas concluídas no mês atual
Número de vendas vendas quantidade de vendas concluídas no mês atual
Vendido no mês passado R$ total das vendas concluídas no mês anterior
Quantidade levada un nunca
Perdida ou que voltou un nunca
ticket médio = vendido ÷ número de vendas
variação = (atual − anterior) ÷ anterior     (só se anterior > 0)
perdas e sobras = perdida ÷ levada            (só com os dois; perdida ≤ levada)
aproveitamento = 1 − perdas
Aviso: acima de 10% de perdas →  alerta "Perdas e sobras passaram de 10% do que foi levado. Vale
ajustar a quantidade para a próxima vez."; até 10% →  bom.
3.4 Descontos e Taxas — Impacto do Desconto
Campo Unidade Vem do app
Preço normal R$ preço do produto
Custo por unidade R$ custo do produto, se conhecido
Desconto % nunca (vazio)
Vendidos em 30
dias
un soma das quantidades daquele produto vendidas nos últimos 30 dias, se
maior que 0
antes = preço − custo                 (≤ 0 → "Nenhum": qualquer desconto dá prejuízo)
desconto máximo = antes ÷ preço
preço com desconto = preço × (1 − desconto ÷ 100)
depois = preço com desconto − custo   (≤ 0 → "Sem limite": cada venda dá prejuízo)
vender a mais = antes ÷ depois − 1
nova quantidade = arredondar PARA CIMA (vendidos × (1 + vender a mais))
corte na margem = 1 − depois ÷ antes
Resultado: "Precisa vender a mais" (em %); linhas Preço com desconto, Cada venda deixa antes,
Cada venda deixa depois, Nova quantidade (se houver vendidos), Desconto máximo sem prejuízo.
Aviso:"O desconto corta X% do que cada venda deixa. Só compensa se as vendas crescerem Y%
ou mais."

=== PÁGINA 6 ===
3.5 Descontos e Taxas — Taxa do Cartão e da Maquininha
Campo Unidade Vem do app
Valor da venda R$ preço do produto
Taxa cobrada % taxa do Crédito configurada
Quero receber R$ nunca
recebe = valor × (1 − taxa ÷ 100)
valor da taxa = valor × taxa ÷ 100
cobrar para receber = quero receber ÷ (1 − taxa ÷ 100)
acréscimo no preço = 1 ÷ (1 − taxa ÷ 100) − 1
Resultado: "Você recebe" (ou "Cobre", se só "Quero receber" foi preenchido); linhas Valor da taxa,
Cobre para receber R$ X, Acréscimo no preço (2 casas). Aviso bom:"Somar só 4,98% ao preço não
basta: a taxa incide também sobre o acréscimo." (taxa com 2 casas decimais).
4 Exibição dos números
Dinheiro: R$ 12,85 (2 casas, vírgula).
Percentual: 1 casa (13,1%), exceto quando indicado 2 casas.
Quantidades: inteiro com separador de milhar.
Número indisponível: —.
Arredondar só na exibição; as contas usam o valor completo.
5 Aparência e tamanhos de tela
Seguir o estilo do app: Inter, verde-oliva #7FA653 só nos detalhes (ícones, marca "seus dados",
botão "Usar este preço"), superfícies do sistema e contraste claro e escuro.
Usar os tokens de cor do app (campo, painel, texto, cinza, linha, verde de ação, vermelho). Nada
de cor fixa que quebre um dos temas.
A janela fica centralizada, com altura limitada e rolagem interna; o rodapé não encolhe.
Conferir em 320, 360, 393 e 412 px de largura, com pouca altura (320 × 640), com texto
ampliado e com o teclado aberto. Nenhum rótulo, valor, peso ou botão pode ficar cortado;
quebrar linha em vez de diminuir letra.
No modo leve (celular fraco), nada muda nas contas; só os efeitos decorativos podem sair.

=== PÁGINA 7 ===
6 Testes-ouro (obrigatórios)
Conta Entrada Resultado esperado
Preço custo 9, margem 20, cartão
4,98, feira 5, imposto 0
markup 1,42816 · preço R$ 12,8535 · lucro R$ 2,5707 ·
despesas R$ 1,2828 · preço − despesas − lucro = 9 · erro
comum R$ 11,6982 com margem real 13,085%
Preço margem vazia sem resultado (não vira 0)
Preço custo 9, margem 80, cartão 20 "Impossível"
Preço custo 9, margem 20, sem
taxas
válido (taxas vazias = sem taxa)
Equilíbrio fixos 1200, preço 15, custo 9,
lucro 600
200 un · meta 300 un · cada venda deixa 40%
Equilíbrio fixos 1000, preço 15, custo 9 167 un (arredonda para cima)
Equilíbrio preço 9, custo 9 "Não existe"
Indicadores vendido 3600, 180 vendas,
anterior 3200, levado 260,
perdido 20
ticket R$ 20 · variação +12,5% · perdas 7,69%
Indicadores sem levado/perdido perdas "—"
Indicadores 0 vendas sem resultado
Desconto preço 15, custo 9, desconto 10,
vendidos 300
preço R$ 13,50 · vender a mais 33,3% · nova quantidade
400 · desconto máximo 40% · corte 25%
Desconto preço 15, custo 9, desconto 40 "Sem limite"
Taxa valor 100, taxa 3,5, quero 100 recebe R$ 96,50 · taxa R$ 3,50 · cobrar R$ 103,63
Taxa só a taxa sem resultado
Números 1.234,56 · R$ 9 · 4,98 ·
1.200 · vazio · 0
1234,56 · 9 · 4,98 · 1200 · desconhecido · 0
Nomes "preço de venda pelo markup" "Preço de Venda pelo Markup"
7 Critérios de aceite
[ ] Seletor Básica · Científica · Contas funciona e Básica/Científica continuam iguais.
[ ] Sete assuntos, três prontos e quatro "em breve" que não abrem.
[ ] Setas abrem e fecham o assunto na própria janela.
[ ] "Seus dados" aparece só em valores que o app sabe; margem, desconto, taxa da feira,
levado/perdido e "quero receber" começam vazios.
[ ] Digitar atualiza o resultado sem fechar o teclado.
[ ] "Usar este preço" abre o cadastro preenchido e não salva sozinho.

=== PÁGINA 8 ===
[ ] Todos os testes-ouro passam, junto com o restante da suíte da versão 2.
[ ] Conferido nos temas claro e escuro, em 320/360/393/412 px, com pouca altura, texto
ampliado e teclado.
[ ] Rótulos de formulário com pelo menos 14 px; "Voltar" inteiro em 320 × 640.
[ ] Nenhuma venda, produto ou configuração alterada só por abrir ou usar a calculadora.
8 O que não fazer
Não preencher campo com valor de exemplo ou "valor típico".
Não somar porcentagens ao custo para achar preço.
Não gravar preço, custo ou taxa a partir da calculadora sem o produtor salvar no cadastro.
Não criar tela nova fora da calculadora.
Não usar fontes externas (Google Fonts); o app funciona offline.
Não prometer acurácia: os resultados são estimativas e impostos devem ser confirmados com o
contador.
9 Referência da implementação (AGRO Gestão 3)
Para consulta, no ramo claude/agro-gestao3 (commit 22e3813):
app/src/features/finance/producer-calcs.js: funções markupPrice, breakEvenUnits,
periodIndicators, discountImpact, cardNet e parseBR.
app/tests/producer-calcs.test.mjs: testes-ouro.
app/src/legacy/erp-ui.js: bloco "Calculadora: modo Contas" no fim do arquivo (calcModes,
CONTAS_SUBJECTS, CONTAS_CALCS, paintContas, ações calculator-mode, contas-open e contas-use-
price), além da troca da linha de modo em paintCalculator.
app/src/features/producer-calcs.css: aparência.
app/src/features/proper-name.js: conectivos pelo/pela/pelos/pelas/ou.
docs/motor/registry.json e app/public/knowledge/motor-decisoes.md: registro das fórmulas e
conhecimento offline.
A versão 2 pode ter nomes de arquivo e de funções diferentes: adaptar ao código dela, mantendo o
comportamento, os textos e os testes desta diretriz.