# Diretriz da página de vendas do AGRO Gestão

**Destinatário:** Codex responsável pelo aplicativo.
**Data:** 20 de outubro de 2026.
**Objetivo:** corrigir a identificação e a legibilidade dos produtos e manter suas variações agrupadas, com ordenação crescente de peso ou volume.

Implemente esta diretriz na página **Produtos**, usada para registrar vendas. Cada card deve permitir que o produtor reconheça imediatamente **nome, condição ou apresentação, peso ou unidade de venda e preço**. No mockup, alguns nomes ficaram apagados. Isso é um defeito a corrigir na implementação.

## 1 Conteúdo obrigatório de cada card

Exibir os dados em três linhas visuais, permitindo que o nome ocupe mais de uma linha quando necessário:

| Posição | Conteúdo | Exemplo |
| --- | --- | --- |
| Primeira | Nome comercial completo | Café especial |
| Segunda | Condição ou apresentação junto do peso | Moído · 250 g |
| Terceira | Preço da apresentação exibida | R$ 25,00 |

**Leitura completa do exemplo:** Café especial, moído, 250 g, R$ 25,00.

- Nome, condição, peso e preço devem aparecer no próprio card, sem depender de toque, expansão ou janela adicional.
- O peso deve ficar ao lado da condição, formando uma identificação única: **Moído · 250 g**, **Moído · 500 g**, **Moído · 1 kg**.
- Condição significa a característica comercial relevante: moído, em grãos, inteiro, em pedaços, fatiado, fresco, congelado ou outra cadastrada. Não confundir com disponibilidade do estoque.
- Usar os dados reais do cadastro. Se uma condição não se aplicar ao produto, omitir esse atributo sem inventar informação.
- Nunca mostrar apenas “Café especial” e o preço quando houver variações de peso ou apresentação.
- Não confundir peso da embalagem com quantidade vendida: **3 pacotes de 250 g** continuam sendo uma venda de três unidades dessa apresentação.

## 2 Legibilidade em todos os estados

Os nomes não podem ficar apagados, transparentes ou da mesma cor do fundo.

- Tema claro: nome em preto ou cinza muito escuro; condição e peso em cinza escuro legível; preço com destaque tipográfico.
- Tema escuro: texto claro sobre superfície escura, com contraste equivalente ao tema claro.
- Adotar como meta interna contraste mínimo de **4,5 para 1** para os textos essenciais e seu fundo efetivo.
- Preferir nome e preço a partir de **16 unidades lógicas de tela** e condição e peso a partir de **14**, respeitando a escala de fonte do sistema.
- Não aplicar opacidade reduzida ao card inteiro nem ao contêiner que contém seus textos. Ajustar o fundo e as sombras separadamente.
- Efeito de vidro, sombra, seleção, desfoque do fundo e animações não podem reduzir a leitura do produto na janela ativa.
- Ao selecionar um produto, usar uma marca de seleção e mudança discreta de superfície ou borda, mantendo o texto legível. Não depender apenas de cor.
- Produto sem estoque: manter nome, condição, peso e preço legíveis; exibir **Sem estoque** e bloquear a seleção. Suavizar a superfície, sem apagar as informações.
- Não cortar informações essenciais com reticências nem diminuir excessivamente as letras para manter três colunas. Permitir quebra de linha ou ajustar a grade.

## 3 Agrupamento por família e apresentação

Produtos da mesma família devem permanecer juntos e suas variações devem aparecer lado a lado, sem produtos de outra família entre elas.

Para esta organização:

- **Categoria:** grupo amplo, como Cafés, Laticínios ou Panificação.
- **Família:** produto comercial base, como Café especial, Café gourmet ou Queijo meia cura.
- **Condição ou apresentação:** subdivisão da família, como moído ou em grãos; inteiro ou em pedaços.
- **Variação:** item vendável específico, como Café especial, moído, 250 g.

Organizar os blocos por **categoria → família → condição ou apresentação → peso crescente**. A ordem dos blocos de categorias e famílias pode seguir a configuração existente; dentro de cada bloco, a ordenação por medida é obrigatória.

Exemplo de organização dos cards:

| Família e condição | Primeiro card | Segundo card | Terceiro card |
| --- | --- | --- | --- |
| Café especial moído | 250 g | 500 g | 1 kg |
| Café especial em grãos | 250 g | 500 g | 1 kg |
| Café gourmet moído | 250 g | 500 g | 1 kg |
| Queijo meia cura em peça | 250 g | 500 g | 1 kg |
| Mel em pote | 250 g | 500 g | 1 kg |
| Iogurte natural | 170 ml | 500 ml | 1 L |

Os pesos e volumes da tabela são exemplos de organização. Exibir somente apresentações realmente cadastradas.

**Não intercalar:** Café especial 250 g → Banana prata → Café especial 500 g → Queijo → Café especial 1 kg.

**Exibir junto:** Café especial moído 250 g → Café especial moído 500 g → Café especial moído 1 kg. Depois, iniciar a próxima apresentação ou família.

## 4 Ordenação numérica das medidas

Ordenar pelo valor físico da medida, e não pelo texto, pelo preço ou pela ordem de cadastro.

| Dimensão | Normalização interna | Sequência esperada |
| --- | --- | --- |
| Massa | Converter kg para g | 50 g → 100 g → 250 g → 500 g → 1 kg → 2 kg → 5 kg |
| Volume | Converter L para ml | 170 ml → 250 ml → 500 ml → 1 L → 2 L |
| Contagem de uma mesma apresentação | Usar a quantidade cadastrada | 1 unidade → 6 unidades → 12 unidades → 30 unidades |

- Considerar **1 kg = 1.000 g** e **1 L = 1.000 ml** apenas na comparação interna. Manter a unidade apropriada na exibição.
- Aceitar vírgula decimal nos cadastros legados, por exemplo 0,5 kg = 500 g e 1,5 L = 1.500 ml.
- Não comparar diretamente massa, volume e contagem. Separar dimensões diferentes em subgrupos da mesma família.
- Não presumir o peso de uma caixa, cacho, maço, molho, dúzia ou unidade. Usar a unidade real de comercialização.
- Kits e embalagens múltiplas exigem identificação própria. “Kit com 3 pacotes de 250 g” não pode ser apresentado como se fosse um pacote de 750 g.
- Em empates, usar apresentação, embalagem e identificador estável como desempate, sem deslocar o item para outra família.

## 5 Organização da grade em telas diferentes

- Manter o visual limpo, os cards e as seções com efeito de vidro adotados no projeto.
- Quando houver espaço para três cards legíveis, exibir as variações em sequência horizontal: **250 g | 500 g | 1 kg**.
- Ao terminar uma família ou subgrupo de apresentação, iniciar o próximo em uma nova linha ou seção. Não preencher a sobra da linha com uma família diferente.
- Se houver mais variações que colunas, continuar na linha seguinte dentro do mesmo bloco, seguindo a leitura da esquerda para a direita e de cima para baixo.
- Em tela estreita ou com fonte ampliada, reduzir o número de colunas antes de comprometer a legibilidade. As variações devem continuar consecutivas e agrupadas.
- Busca e filtros devem preservar o agrupamento e a ordem relativa dos resultados encontrados.
- Produto sem estoque permanece na posição correspondente ao seu peso. Não movê-lo para o fim da lista, rompendo a sequência.
- Não criar cards vazios para pesos inexistentes nem duplicar produtos para completar a linha.

## 6 Produtos sem peso fixo

| Situação | Identificação adequada |
| --- | --- |
| Venda por peso variável | Queijo meia cura / Em peça · Venda por kg / R$ 35,00 por kg |
| Venda por dúzia | Banana prata / Dúzia / R$ 10,00 por dúzia |
| Venda por maço | Taioba / Maço / preço por maço cadastrado |
| Peso fixo ainda não cadastrado | Nome e condição reais / Peso não informado / preço cadastrado |

Valores monetários desta diretriz são ilustrativos. A interface deve sempre apresentar o preço real da variação e a base de cobrança correta.

Peso ausente não deve ser estimado a partir do preço, nome ou produtos vizinhos. Dentro de um bloco com pesos fixos, posicionar os itens sem medida após os itens com medida conhecida e sinalizar a informação pendente. Um produto vendido por kg não é automaticamente um pacote de 1 kg.

## 7 Aplicação na sequência de venda

A identificação completa deve acompanhar a variação durante todo o fluxo:

1. **Produtos:** um toque abre a venda individual; pressionar e segurar ativa a seleção de até três produtos; dois toques consultam o estoque. Cada card mostra nome, condição, peso ou unidade e preço.
2. **Quantidade:** mostrar a identificação completa do produto ativo e sua unidade de venda. Os seletores dos produtos escolhidos também devem distinguir condição e peso, evitando três opções indistinguíveis chamadas apenas “Café especial”.
3. **Cliente e cidade:** manter a área recolhida e expansível, sem tirar o foco da quantidade.
4. **Resumo:** cada linha apresenta produto, condição, peso ou unidade, quantidade vendida, preço unitário e subtotal.
5. **Destinatário e pagamento:** manter as opções Pessoa física e Empresa CNPJ, além das formas de pagamento existentes.
6. **Finalização:** preservar a identificação das variações e os totais no registro da venda.

Exemplo de linha de resumo: **Café especial · Moído · 250 g | 3 pacotes × R$ 25,00 | R$ 75,00**.

Esta diretriz trata da identificação e organização dos produtos. A implementação deve reutilizar o carrinho, o estoque, os cadastros e o fluxo de compra existentes.

## 8 Gestos dos cards e prevenção de conflitos

| Gesto no modo normal | Comportamento obrigatório |
| --- | --- |
| Um toque | Abrir a janela de venda da variação tocada, com quantidade e teclado numérico. |
| Pressionar e segurar | Ativar o modo de seleção múltipla e selecionar o primeiro produto. Permitir escolher até três produtos distintos para a mesma compra. |
| Dois toques rápidos no mesmo card | Abrir uma consulta compacta do estoque daquela variação, sem iniciar venda nem adicionar ao carrinho. |

### Venda com um toque

Abrir a etapa de quantidade do produto selecionado. Manter cliente e cidade recolhidos, expansíveis. Depois de informar a quantidade, permitir seguir ao resumo, escolher Pessoa física ou Empresa CNPJ, selecionar o pagamento e finalizar a venda. O toque inicial não conclui a venda nem baixa o estoque.

### Venda com até três produtos

- Pressionar e segurar um card entra no modo de seleção e marca esse produto como o primeiro.
- Nesse modo, um toque em outro card adiciona ou remove sua seleção. Não abre a venda individual.
- Marcar os cards selecionados e mostrar uma indicação discreta como **2 de 3 selecionados**. Não reorganizar os cards nem romper o agrupamento por família.
- Permitir continuar com um, dois ou três produtos. Três é o limite dessa seleção, não uma quantidade mínima nem o limite de unidades vendidas.
- Ao tentar selecionar um quarto produto, manter os três já escolhidos e informar o limite. Não remover nem substituir produtos automaticamente.
- Um novo toque no card selecionado o desmarca. Não contar toques repetidos no mesmo card como produtos diferentes.
- Exibir **Continuar** e **Cancelar seleção** enquanto esse modo estiver ativo. Cancelar volta ao modo normal sem registrar venda ou alterar estoque.
- Após continuar, informar a quantidade de cada variação com o mesmo teclado numérico, preservando os valores ao alternar os produtos.
- No resumo, reunir os itens em uma única compra, com quantidades, preços, subtotais e total. Cliente, cidade, destinatário e pagamento pertencem a essa compra.
- Não abrir o resumo automaticamente ao selecionar o terceiro produto. O produtor deve poder revisar a seleção e tocar em Continuar.
- Ao voltar para editar, preservar os produtos, as quantidades e os dados já preenchidos.

### Consulta com dois toques

Mostrar uma janela curta com **nome, condição, peso ou unidade e estoque disponível**, por exemplo: **Café especial · Moído · 250 g — 24 pacotes disponíveis**.

Consultar o estoque do identificador exato da variação tocada. Dois toques no café de 250 g não podem mostrar a soma dos cafés de 250 g, 500 g e 1 kg. Reutilizar o saldo disponível calculado pelo módulo de estoque existente, inclusive suas regras de reservas, se houver.

Fechar a consulta deve retornar à mesma posição da lista, sem alterar quantidades, seleção, carrinho ou estoque. Produto sem estoque pode receber dois toques para consultar saldo zero, mas não pode entrar na venda. Portanto, bloquear a ação de venda sem tornar o card incapaz de reconhecer o gesto de consulta.

### Reconhecimento dos gestos

- Reconhecer um único resultado por interação: venda individual, seleção múltipla ou consulta de estoque.
- Usar preferencialmente o reconhecedor de gestos da plataforma já adotada no APK, respeitando seus tempos e ajustes de acessibilidade.
- Aguardar a confirmação de toque simples antes de abrir a venda, para que o primeiro toque de um toque duplo não abra outra janela. Não empilhar ações concorrentes de clique e toque duplo.
- Ao reconhecer o pressionamento longo, cancelar qualquer toque simples ou duplo pendente. Soltar o dedo não deve abrir a venda nem desmarcar o card recém-selecionado.
- Se o dedo se deslocar para rolar a tela, cancelar a candidatura a pressionamento longo e preservar a rolagem normal.
- No modo de seleção múltipla, a regra prioritária é selecionar ou desmarcar com um toque. Suspender as ações de venda individual e consulta por toque duplo até sair desse modo. Um toque duplo acidental não deve disparar duas alternâncias de seleção.
- Dois toques em cards diferentes não constituem consulta de estoque. Vincular o gesto ao mesmo identificador de variação.
- Não exigir multitoque com três dedos. O produtor escolhe os três cards um após o outro após ativar o modo de seleção.
- Oferecer ações equivalentes pelos recursos de acessibilidade e pela interação de teclado quando aplicável, sem acrescentar botões duplicados em todos os cards.

## 9 Orientação técnica ao Codex

Antes de alterar, localizar o componente dos cards, a consulta de produtos, o modelo de variações e a regra de ordenação já existentes. Adaptar os nomes abaixo ao modelo real do projeto; não criar um cadastro paralelo.

Dados conceituais necessários:

- Identificadores estáveis de produto, família e variação.
- Nome comercial, categoria, condição, apresentação e embalagem.
- Tipo de medida, valor numérico e unidade original.
- Valor normalizado usado apenas para ordenação.
- Unidade de venda, preço da variação e disponibilidade.

Usar o identificador real da família quando disponível. Não agrupar produtos apenas pela primeira palavra do nome. Preservar acentos e grafia comercial na interface; normalizar texto somente na comparação interna, quando necessário.

Cada peso ou apresentação vendável deve apontar para sua própria variação no carrinho e no estoque. Não fundir café de 250 g e 500 g por compartilharem o mesmo nome. Não criar, excluir ou duplicar produtos automaticamente para corrigir a organização visual.

## 10 Critérios de aceite

- [ ] Café especial moído 250 g aparece com nome, condição, peso e preço legíveis no card.
- [ ] Três variações da mesma família aparecem juntas: 250 g, 500 g e 1 kg.
- [ ] A sequência permanece correta quando os itens foram cadastrados fora de ordem.
- [ ] 1 kg aparece depois de 500 g, e 1 L depois de 500 ml.
- [ ] Moído e em grãos permanecem identificados e organizados em seus subgrupos.
- [ ] A última linha de uma família não recebe cards de outra família.
- [ ] Um produto sem estoque mantém a posição por peso, permanece legível e não pode ser selecionado para venda, mas permite consultar saldo zero com dois toques.
- [ ] Busca, filtros, tema claro, tema escuro, seleção e fonte ampliada não apagam o texto nem misturam as famílias.
- [ ] Na compra de três pesos da mesma família, quantidade, resumo e finalização distinguem corretamente cada variação.
- [ ] O preço e a baixa de estoque correspondem ao peso ou à apresentação efetivamente vendidos.
- [ ] Produtos sem peso fixo exibem sua unidade real de venda, sem peso inventado.
- [ ] Um toque abre somente a venda individual; dois toques abrem somente o estoque; pressionar e segurar abre somente a seleção múltipla.
- [ ] Soltar o dedo depois do pressionamento longo mantém o primeiro produto selecionado sem abrir outra janela.
- [ ] O modo de seleção aceita até três produtos, permite desmarcar, cancelar ou continuar com menos de três e recusa o quarto sem substituir os anteriores.
- [ ] Um toque duplo acidental durante a seleção não causa duas alternâncias nem abre estoque ou venda individual.
- [ ] A rolagem não ativa seleção acidental; a consulta de estoque não altera o carrinho.
- [ ] A compra de três produtos preserva os dados ao voltar para editar e reúne os itens na mesma finalização.

Ao concluir, informar quais componentes foram alterados e demonstrar o fluxo com Café especial moído de 250 g, 500 g e 1 kg, usando dados de teste e preservando os registros reais.
