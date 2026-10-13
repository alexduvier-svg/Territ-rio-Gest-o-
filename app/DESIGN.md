# AGRO Gestão — guia de design

Referência obrigatória para qualquer mudança visual. O padrão é o **rigor de design da Apple e do
ColorOS 16/17**, aplicado a um app Android para produtores rurais que vendem em feiras.
Princípios: **minimalismo, beleza, eficiência e funcionalidade** — nada repetido, nenhum controle em dobro.

## Estilos do app

Em **Ajustes → Aparência → Estilo do app** (independente do tema claro/escuro):

| Estilo | Padrão | Onde está |
|---|---|---|
| **Feira** | sim | `src/layout-feira.css`, `src/polish.css` + funções `feira*`/`mg*` em `src/legacy/erp-ui.js` + `src/features/interface.js` |
| **Clássico** | — | o visual original do mockup (`src/legacy/app.css`) |

As funções são as mesmas nos dois. O estilo Feira muda **estrutura**, não só cores:

- **Vender:** cartão "Vendendo em … | Hoje · N vendas" com olho, busca, categorias em linha rolável, grade de 3 colunas (nome, apresentação, preço).
- **Estoque:** três botões Em dia / Baixo / Esgotado (tocar abre a reposição), categorias, lista agrupada por categoria. Sem campo de busca: a lupa do topo busca.
- **Cadastro de produto:** lista que expande; escolha feita mostra ✓ verde e o valor à direita. Pesos padrão 250 g / 500 g / 1 kg; produtos do mais caro ao mais barato.
- **Clientes:** inclui o Catálogo (abaixo de "Próximos eventos").
- **Gestão (nos dois estilos):** painel de controle num cartão só (Dia / Semana / Mês / Ano, ‹ período ›, botão "Local" que abre folha) → card 3D de receita → gráfico do menor para o maior → Orientação enxuta → **uma lista** de detalhes (Produtos, Resultado, Pagamentos, Melhor dia e horário, Onde vendeu, Clientes, Relatórios), cada linha abrindo uma folha → Ferramentas (Inteligência, Sua marca, Sua banca). O olho esconde todo valor em dinheiro da página.

## Componentes aprovados

- **Card 3D de destaque** (`.feira-hero` em `src/polish.css`): superfície neutra com relevo de tecla (luz no topo, "espessura" embaixo), dados em blocos de vidro, **verde só nos detalhes** (rótulo, olho, Resultado). Cards coloridos inteiros não: pesam entre cards escuros. Valores longos diminuem (`long`/`xlong`), nunca reticências. Reutilizar para outros números de destaque.
- **Relevo de tecla**: teclados, campos de Valores e Estoque, teclas da reposição.
- **Fechar janela**: círculo cinza translúcido com ×, toque de 44 px.
- **Seletor**: `<select>` abre folha no estilo do app (`picker-sheet`).
- **Compra múltipla**: círculo oliva = em edição, círculo cinza = falta, ✓ verde com salto = pronto.

## Gestos

- **Toque longo (0,6 s)** num cartão de Vender entra no modo de seleção (vibração curta): até **3 produtos**, barra "Vender N produtos" acima das abas. Código: `src/features/multisell.js`.

## Cores

- **Destaque:** verde-oliva `--action-green` `#7FA653`, texto `--green-text` `#14210d`. Nunca o azul do iOS nem um verde novo.
- Tinta de destaque para links e aba ativa: `--accent-ink` (`#4f7a2a` claro, `#a7c97f` escuro).
- Estados: verde = em dia/indo bem, laranja = baixo/atenção, vermelho = esgotado/urgente, azul `#0a84ff` = oportunidade.
- **Toda cor nova é conferida nos temas claro e escuro.**

## Tipografia

- Texto: **Inter**. Títulos e números grandes: **Inter Tight**.
- Valores e quantidades com algarismos de largura fixa (`tabular`).
- Palavras inteiras: sem hifenização automática.

## Regras de layout (inegociáveis)

1. **Texto nunca sai do botão nem é cortado.** Ver `src/fit.css`.
2. Toque mínimo de **44–48 px**.
3. Nenhum elemento sobrepõe outro (inclusive em toque: conferir `elementFromPoint` em botões sobre texto).
4. Uma ação principal por tela; linguagem simples, em português.
5. Antes de cada versão, rodar `tests/overflow-audit.js` (zero ocorrências em 360 e 375 px, nos dois estilos e temas).

## Movimento (`src/motion.css`, `src/polish.css`)

- Janelas sobem como folha com mola sutil (passam um pouco e assentam); seções abertas pelo toque quicam uma vez; botões afundam no toque.
- Rodapé: cada ícone faz um gesto curto ao entrar (carrinho rola, caixa abre/fecha, pessoas pulam, calendário vira, barras crescem).
- Conteúdo desliza **só na troca de tela**.
- Tudo desligado com "reduzir movimento"; celulares simples recebem o modo leve (`html.lite`).

## Processo

- Ideias de layout novas: **desenhar as telas primeiro** (mockup clicável) e implementar depois da escolha.
- Testar em tamanho de celular no navegador e no aparelho real antes de entregar.
