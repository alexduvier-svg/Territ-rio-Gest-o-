# Implementação do catálogo de produtos no AGRO Gestão

## Pedido de implementação

Importe `catalogo_produtos.json` como catálogo de sugestões. Ele contém 2.479 produtos e apresentações comerciais, em 22 categorias, representando 1.270 combinações de produto-base, sabor e variedade. O número total inclui apresentações distintas do mesmo produto e não afirma que existem 2.479 espécies ou receitas independentes. Não crie estoque, vendas, preços ou custos a partir dessas sugestões.

Use o APK apenas como referência da estrutura do aplicativo. Os dados demonstrativos do APK 0.12.4 são fictícios. Este catálogo é uma referência de cadastro reutilizável, não uma operação real nem um novo conjunto de vendas de demonstração.

Preserve os registros já existentes do produtor. Não sobrescreva os IDs, nomes personalizados, saldos, custos, preços, fotos, histórico ou configurações de produtos já cadastrados. O pacote não foi integrado ao APK; o Codex deverá adaptar a importação ao modelo de dados do projeto e executar as validações.

## Onde cada informação entra

- Cadastro de produto e Estoque: usar o catálogo para sugerir nome, categoria, sabor, variedade, formato, apresentação, embalagem e unidade. Solicitar ao produtor os valores reais.
- Produtos e Vendas: exibir somente os produtos ativados pelo produtor que atendam às regras atuais de disponibilidade. As 2.479 sugestões não devem aparecer como 2.479 cards de venda.
- Gestão e resumo rápido: considerar somente produtos reais e suas transações, nunca contar itens do catálogo de sugestões como estoque ou produtos vendidos.
- Inteligência: usar o catálogo como vocabulário para reconhecer produtos e explicar apresentações. Nunca concluir que o produtor possui, produz ou vende um item apenas porque está no catálogo.

## Botão obrigatório para produto não encontrado

Exibir exatamente: **+ Insira seu produto**.

Manter esse botão acessível abaixo dos resultados da busca e destacar quando não houver resultado. Aproveitar o texto digitado para preencher o formulário de novo produto. Não obrigar o produtor a escolher uma sugestão errada.

Fluxo:
1. Buscar por nome, plural, aliases e categoria, ignorando diferenças de caixa, espaços repetidos e acentuação apenas na comparação.
2. Apresentar sugestões e variações correspondentes. Preservar a grafia legível com acentos na tela.
3. Ao tocar no botão, abrir o cadastro com nome sugerido e campos editáveis de categoria, sabor, variedade, formato, embalagem, conteúdo e unidade.
4. Sugerir a unidade conforme o produto. Pedir confirmação antes de fixar a unidade comercial. Nome ou foto não determinam quantidade, preço, custo, origem, certificação ou composição.
5. Antes de salvar, conferir a identidade comercial no catálogo e nos produtos do próprio produtor. Se houver coincidência exata, reutilizar ou abrir o existente e informar “Este produto já está cadastrado”.
6. Se existir apenas algo parecido, mostrar os candidatos. Permitir criar a variação legítima. Não mesclar automaticamente por semelhança de texto.
7. Ao salvar, criar o novo produto no contexto do produtor e indexá-lo imediatamente para as próximas buscas. Uma sugestão criada por um produtor não deve ser publicada automaticamente no catálogo global de todos os usuários.

O limite de 3.000 refere-se a este pedido de catálogo inicial. Não impor esse limite ao número de produtos próprios que o produtor poderá cadastrar, salvo decisão explícita de produto.

## Produtos e variações

Agrupar visualmente por família e sabor e oferecer apresentações em pílulas, sem perder o identificador de cada variação comercial. Exemplos:

- Bolo de cenoura inteiro 500 g, 1 kg e 2 kg.
- Bolo de cenoura em pedaço de 100 g ou 150 g.
- Bolo de chocolate no pote de 150 g ou 250 g.
- Café especial moído 250 g e em grãos 500 g.
- Iogurte de morango 1 L.
- Taioba vendida por maço.
- Mamão papaia por unidade.

Peso e volume são sugestões iniciais editáveis. Se o produtor vender pedaço de bolo de 50 g, 200 g ou outro tamanho não previsto, permitir adicionar a apresentação. Não presumir peso de bolo vendido por unidade, de queijo por peça ou de fruta por caixa.

Não criar novas famílias para cada peso. Não unir variações que diferem em sabor, variedade, fórmula declarada, formato, conteúdo, embalagem ou unidade de venda. Marca, produtor, origem real ou especificação que diferencie o item também precisa entrar na identidade do cadastro comercial quando o modelo do app utilizar esses atributos.

Se bolo inteiro e pedaços derivarem fisicamente da mesma produção, a transformação de um bolo em fatias exige uma movimentação de fracionamento com rendimento informado. Não duplicar o estoque nem assumir que as apresentações têm saldos independentes sem a movimentação real.

## Singular e plural

O JSON contém `nome_singular`, `nome_plural`, `nome_busca_plural`, `aliases` e `unidade_rotulos`. Singular e plural são formas de busca e exibição do mesmo cadastro, não produtos novos.

A quantidade deve concordar com a unidade comercial, não pluralizar a frase inteira automaticamente:

| Exemplo | Exibição correta |
| --- | --- |
| Taioba por maço | 1 maço de taioba; 2 maços de taioba |
| Nome regional da unidade | 1 molho de taioba; 2 molhos de taioba |
| Alface por pé | 1 pé de alface; 3 pés de alface |
| Mamão por unidade | 1 mamão; 3 mamões |
| Bolo fracionado | 1 pedaço de bolo; 4 pedaços de bolo |
| Produto embalado | 1 pacote de café; 2 pacotes de café |
| Ovo em bandeja | 1 bandeja com 12 ovos; 2 bandejas com 12 ovos cada |
| Peso fracionado | 0,5 kg de queijo; 1,25 kg de linguiça |

Usar `unidades_e_plurais.json` para rótulos, abreviaturas e sinônimos das unidades. Preferir abreviaturas técnicas invariáveis na exibição de massa e volume: kg, g, L e ml.

Maço/maços e molho/molhos correspondem à unidade de venda de folhas e ervas neste contexto regional. O produtor pode escolher o rótulo “molho”. A palavra molho presente no nome de um alimento, como molho de tomate, não deve ser interpretada como maço.

Maço não tem peso fixo. Caixa, cacho, penca, saco e peça também não têm conteúdo fixo universal. Não converter automaticamente para kg ou unidades sem a quantidade configurada pelo produtor.

Uma dúzia contém 12 unidades. Bandeja com 12 ovos e dúzia podem compartilhar conteúdo, mas a embalagem pode diferenciar a oferta. Registrar a relação de conversão explicitamente; não criar nem retirar ovos por mera troca do texto da unidade. Para bandejas, o campo `conteudo_quantidade` informa ovos dentro de cada bandeja, não o número de bandejas no estoque.

Não aplicar regra genérica de pluralização apenas acrescentando s. Usar o dicionário, preservar nomes de variedades e permitir corrigir os rótulos de novos produtos.

## Duplicidade na importação

**Se o produto já existir com a mesma identidade comercial, ignore a nova inclusão e mantenha o cadastro existente.** Registrar no resultado da importação quantos itens foram inseridos, ignorados e encaminhados à revisão.

A comparação deve acontecer em duas camadas:

1. ID estável do catálogo, quando já conhecido. Mesmo ID com especificação diferente é conflito, não atualização silenciosa.
2. Chave de identidade comercial normalizada para detectar o mesmo item com outro ID ou outra grafia.

Chave de referência deste catálogo: produto-base canônico + sabor + variedade + forma + unidade de venda + conteúdo normalizado + embalagem. A categoria é classificação, não deve sozinha criar um produto novo. Na base do produtor, acrescentar o escopo do produtor e quaisquer atributos comerciais diferenciadores que não existam neste catálogo inicial.

Normalização segura:
- Ignorar caixa, espaços redundantes, pontuação comparável e acentos na chave, preservando o texto exibido.
- Resolver apenas aliases explicitamente conhecidos no contexto correto.
- Reconhecer singular/plural por dicionário, não por corte de letras no fim de qualquer palavra.
- Considerar 1 kg e 1.000 g como o mesmo conteúdo quando todos os demais atributos coincidirem. Considerar 1 L e 1.000 ml equivalentes. Não converter volume em massa sem densidade e regra verificadas.
- Não assumir que campos ausentes equivalem a qualquer valor. Se um registro antigo não tem informação suficiente para identificar a apresentação, encaminhar à revisão em vez de mesclar.
- Similaridade textual serve para sugerir revisão, nunca para descartar sozinha um produto.

Exemplos que devem apontar ao mesmo produto ou à mesma família de sugestões: aipim/macaxeira/mandioca de mesa; queijo muçarela/mussarela; taioba/taiobas; mamão/mamões; maço/molho no campo de unidade. Ao selecionar uma família com várias apresentações, pedir qual apresentação, em vez de escolher peso arbitrário.

Exemplos que não podem ser descartados como duplicados: café moído e café em grãos; bolo inteiro e pedaço; embalagem de 250 g e de 500 g; linguiça suína e linguiça de frango; taioba por kg e taioba por maço quando forem ofertas distintas.

O nome regional “Mucia”, também pesquisável como “múcia”, foi incluído por solicitação do usuário e está marcado para confirmação da denominação. Não assumir equivalência com morcela, chouriço ou qualquer receita específica. Chouriço e morcela permanecem separados.

## Modelo de dados

- `id`: identificador estável da sugestão. Não substituir IDs de produtos já cadastrados.
- `nome_base`, `sabor`, `variedade`, `forma`: identidade do produto e de sua apresentação.
- `nome_exibicao`: rótulo comercial sugerido.
- `categoria`, `subcategoria`: classificação de navegação e busca.
- `unidade_venda`: unidade canônica para contar uma venda.
- `conteudo_quantidade`, `conteudo_unidade`: conteúdo de cada unidade embalada quando informado. Não representam saldo.
- `embalagem`: apresentação do conteúdo; confirmar se peso líquido ou drenado no caso de conservas.
- `nome_singular`, `nome_plural`, `nome_busca_plural`, `aliases`: vocabulário para busca e exibição.
- `unidades_permitidas`: opções sugeridas a revisar, não conversões de estoque prontas.
- `unidade_rotulos`: rótulos de unidade e seus plurais.
- `status`: sempre `sugestao_catalogo`, sem ativação comercial automática.
- `confirmar_denominacao`, `observacao`: pendências e notas específicas.
- `preco_venda`, `custo_unitario`, `saldo_inicial`: nulos. Nunca substituí-los por zero na importação.

Não há validade, ingrediente, alergênico ou condição de armazenamento inventados. O produtor informa esses dados com base no produto real. “Especial”, “gourmet”, origem floral do mel e denominações de queijo são sugestões de classificação a confirmar, não certificações atribuídas pela IA.

## Desempenho e memória da inteligência

Manter o catálogo em JSON ou banco indexado. Carregar os resultados da busca por páginas e priorizar categorias relevantes ao produtor. A inteligência deve consultar o trecho pertinente, sem colocar todas as 2.479 linhas em cada pergunta. Não criar uma memória permanente de suposta disponibilidade.

Instrução permanente sugerida:

> Use o catálogo como referência de nomes, sabores, apresentações, unidades, plurais e aliases. Ele não informa estoque, preço, custo ou desempenho do produtor. Busque antes de sugerir novo cadastro. Ignore inclusões duplicadas somente quando a identidade comercial for a mesma. Preserve diferenças reais entre variações. Quando não encontrar o produto, ofereça “+ Insira seu produto”. Para taioba e outras folhas, reconheça maço/maços e o nome regional molho/molhos no campo de unidade, sem confundi-los com molho culinário. Não presuma peso fixo de maço, caixa, cacho ou peça. Aprenda novos nomes no contexto autorizado do produtor, sem compartilhar dados ou alterar cadastros automaticamente.

## Código de referência e validação

`deduplicacao.mjs` contém funções independentes de normalização, chave comercial, importação idempotente e rótulos de quantidade. São exemplos para adaptação; não constituem migração pronta do aplicativo.

`validar_catalogo.mjs` verifica integridade do catálogo, importação repetida, preservação de variações, sinônimos e unidades. Execute em Node com `node validar_catalogo.mjs` na pasta extraída.

Na integração, implementar também teste da busca “taiobas”, “mamões”, “bolos de cenoura” e “mussarela”; formulário com “+ Insira seu produto”; rótulo “2 molhos de taioba”; preservação de produtos existentes; banco isolado por produtor; ausência de alteração de estoque e preço; e revisão dos registros antigos com identificação incompleta.
