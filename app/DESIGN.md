# Território — guia de design

Referência obrigatória para qualquer mudança visual. O padrão é o **rigor de design da Apple**,
aplicado a um app Android para produtores rurais que vendem em feiras.

## Estilos do app

Em **Ajustes → Aparência → Estilo do app** (independente do tema claro/escuro):

| Estilo | Padrão | Onde está |
|---|---|---|
| **Feira** | sim | `src/layout-feira.css` + funções `feira*` em `src/legacy/erp-ui.js` + `src/features/interface.js` |
| **Território** | — | o visual original do mockup (`src/legacy/app.css`) |

As funções são as mesmas nos dois. O estilo Feira muda **estrutura**, não só cores:

- **Vender:** cartão "Vendendo em … | Hoje · N vendas", busca, categorias em linha rolável, grade de 3 colunas (nome, apresentação, preço; "a partir de" quando há vários preços).
- **Estoque:** três botões Em dia / Baixo / Esgotado (tocar abre a reposição), busca, categorias, lista agrupada por categoria (nome, apresentação, selo Esgotado/Baixo, quantidade e unidade).
- **Cadastro de produto:** lista que expande — cada configuração mostra o valor à direita, uma aberta por vez; ao escolher, abre a próxima ainda sem escolha.
- **Resumo:** cartão de destaque (receita, vendas, ticket, resultado), gráfico de receita por dia, depois a Orientação.

## Gestos

- **Toque longo (0,6 s)** num cartão de Vender entra no modo de seleção (vibração curta): até **3 produtos**, barra "Vender N produtos" acima das abas; o 4º é recusado com aviso. Voltar do Android ou "Cancelar" sai do modo. Toque normal continua abrindo a venda de um produto. Código: `src/features/multisell.js`.

## Cores

- **Destaque:** o verde-oliva do Território, `--action-green` `#7FA653`, com texto `--green-text` `#14210d`. Nunca o azul padrão do iOS nem um verde novo.
- Tinta de destaque para links e aba ativa: `--accent-ink` (`#4f7a2a` claro, `#a7c97f` escuro).
- Estados: verde = em dia/indo bem, laranja = baixo/atenção, vermelho = esgotado/urgente, azul `#0a84ff` = oportunidade.
- Texto sobre cor de fundo sempre com contraste próprio (nada de azul-marinho sobre verde).

## Tipografia

- Texto: **Inter**. Títulos e números grandes: **Inter Tight** (estilo Feira).
- Valores e quantidades com algarismos de largura fixa (`tabular`).
- Palavras inteiras: sem hifenização automática ("Tradicio-nal" é proibido).
- Rótulos de opção com inicial maiúscula na exibição.

## Regras de layout (inegociáveis)

1. **Texto nunca sai do botão nem é cortado.** Botão nunca menor que a palavra mais longa (`min-width: min-content`); grupos de opções fluem em linhas, sem colunas fixas. Ver `src/fit.css`.
2. Toque mínimo de **48 dp**.
3. Nenhum elemento sobrepõe outro; a barra de abas flutuante nunca cobre conteúdo.
4. Uma ação principal por tela; linguagem simples, sem jargão ("Resumo", não "Gestão"/"ERP").
5. Antes de cada versão, rodar a auditoria `tests/overflow-audit.js` (zero ocorrências em 360 e 412 px, nos dois estilos, com e sem texto ampliado).

## Movimento (`src/motion.css`)

- Janelas sobem como folha (mola `cubic-bezier(0.32, 0.72, 0, 1)`), botões afundam a 97% no toque.
- Conteúdo desliza **só na troca de tela**, nunca a cada toque.
- Avisos sobem de baixo; alertas balançam de leve; sucesso dá um pequeno "pulo".
- Tudo desligado com "reduzir movimento" do sistema ou "Reduzir transparência" do app.

## Processo

- Ideias de layout novas: **desenhar as telas primeiro** (mockup clicável) e implementar depois da escolha.
- Testar em tamanho de celular no navegador e no aparelho real antes de entregar.
