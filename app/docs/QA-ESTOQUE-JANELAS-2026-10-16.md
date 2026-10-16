# QA — entrada de estoque e janelas

Validação isolada concluída em 16/10/2026. Evidências em `qa/stock-dialog-fixes-qa.cjs` e `qa/stock-dialog-fixes-qa.json` no workspace (o repositório publicado usa a pasta `qa/` na raiz).

## Cadastro e ordenação

- Produtos próprios inseridos em ordem misturada, inclusive categorias diferentes e Café Catuaí Especial. A lista “Você já tem cadastrado” coincide com o estoque disponível: Especial moído 250/500/1000 g, Especial em grão 250/500/1000 g, Catuaí e demais tipos agrupados. Inverter frequência e horário de reposição não modifica essa apresentação.
- “Cadastrar novo produto” começa sem categoria selecionada, mesmo após filtrar Cafés no seletor anterior.
- Formato “Em barras” preserva o valor canônico `Barra`. Laticínios, Doces e Outros oferecem esse formato e 50 g. Queijo ralado aparece na referência sem ativar produtos do produtor.
- Peso recolhe após escolha inline, seleção na lista e inclusão de uma medida personalizada.
- Teclado real da interface: preço 3, custo 0, estoque inicial 3 e mínimo 0 salvam um produto e uma entrada inicial. Custo zero fica conhecido. Repetir a ação não duplica; reload mantém o cadastro.
- Custo vazio continua rejeitado e conserva os demais campos. Uma segunda opção incompleta recebe erro indicando campo e opção 2; a primeira mantém custo zero. Nada é descartado ou salvo silenciosamente. Remover explicitamente a opção incompleta permite salvar a primeira.
- Premissas permanentes de interface e catálogo, versão 2, persistem após reload.

O cenário informado nas imagens foi verificado depois da correção. Não foi determinada uma causa única para o erro original do aparelho. Captura dos valores visíveis e mensagens por opção cobrem caminhos de teclado e múltiplas apresentações sem presumir que o usuário criou uma segunda opção.

## Janelas

**85 superfícies aprovadas**: cérebro, resumo diário, movimento de estoque, reposição, carrinho, cadastro/seleção de cliente, Estado, aparência, evento, preparação e informação.

| Área útil CSS | Casos |
| --- | ---: |
| 320 × 740, normal/ampliado | 30 |
| 360 × 740, normal/ampliado | 30 |
| 320 × 600, carrinho dividido e rolagem | 1 |
| 360 × 480, ampliado | 6 |
| 360 × 792 | 6 |
| 393 × 852 | 6 |
| 412 × 915 | 6 |

Claro e escuro foram exercitados, exceto o caso adicional de carrinho dividido, feito no claro. Todas as janelas mantiveram pelo menos 16 px laterais e 24 px verticais de separação do viewport, com conteúdo longo rolável. Cérebro segue o tema. WhatsApp fica no rodapé e quebra linha sem cortar o rótulo. Editar/Histórico possuem espaçamento; na altura curta suas ações secundárias são alcançáveis por rolagem explícita do rodapé, enquanto Adicionar/Voltar permanecem visíveis.

Foi encontrada e corrigida uma regressão de rodapé no carrinho durante esta QA: ações abaixo do quadro. A versão final mantém Total/Cancelar/Finalizar íntegros, com pagamentos no conteúdo rolável. Troca Dinheiro/Pix e divisão preservam itens e ID da compra; troca da forma de pagamento preserva rolagem já existente.

Essas dimensões são simulações de área útil CSS, não medições físicas de telas de 6,3/6,5/6,8 polegadas nem testes de teclado Android. 360 × 792 aproxima a resolução lógica derivada de WM/densidade antes dos insets do aparelho conectado.

## Movimento e regressão

**12 sequências de entrada/saída** do cérebro e resumo: dois temas × normal/leve/reduzido. Material não muda na saída, a superfície não reaparece depois de desaparecer, foco sai do diálogo e o agendador fica ocioso, sem camada de saída pendente. No Chrome do computador: entrada normal assentou em aproximadamente 349–366 ms, leve 383–400 ms; saída visível aproximadamente 216–217 ms. Movimento reduzido não anima. Não são métricas P95 nem comprovação em Android básico.

`qa/event-preparation-qa.json` também passou novamente: oito grupos, quatro layouts e oito cenários de quantidade/carrinho. Inclui falha/retry de gravação sem duplicar, adiamento offline, reload e retorno a dois eventos distintos, estoque vazio e quantidade vermelha somente nos números.

Zero erros JavaScript ou requisições locais inesperadas nas duas suítes. Requisições a serviços externos foram bloqueadas intencionalmente e classificadas pelo URL concreto. Todos os dados são fictícios; não houve operação comercial no celular, exportação de dados reais, envio de WhatsApp nem agendamento real de notificações. Contextos e navegadores foram encerrados antes do build nativo.
