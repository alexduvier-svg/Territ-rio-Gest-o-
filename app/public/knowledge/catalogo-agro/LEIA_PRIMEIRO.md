# Catálogo para o AGRO Gestão

São 2.479 produtos e apresentações em 22 categorias. O total inclui embalagens e formatos diferentes, como bolo inteiro e pedaço. Há 1.270 combinações de produto-base, sabor e variedade. Nenhum dado de venda, custo, preço ou estoque foi criado.

## Arquivos

1. `INSTRUCOES_PARA_O_CODEX.md`: pedido completo de implementação, incluindo o botão “+ Insira seu produto” e a regra para ignorar duplicatas.
2. `catalogo_produtos.json`: catálogo estruturado para importar como sugestões.
3. `LISTA_COMPLETA.md`: lista para leitura, organizada por categoria, com nomes no plural e unidades.
4. `unidades_e_plurais.json`: unidades, plurais e nomes regionais, incluindo maço/maços e molho/molhos.
5. `resumo_categorias.json`: contagens, escopo e referências de apoio.
6. `deduplicacao.mjs`: código de referência para evitar duplicidades.
7. `validar_catalogo.mjs`: verificação executável do catálogo e das regras de referência.

## Uso no Codex

Extraia o ZIP e envie a pasta ao projeto. Peça: “Implemente as instruções de INSTRUCOES_PARA_O_CODEX.md usando catalogo_produtos.json, adaptando os campos ao modelo atual, sem sobrescrever dados existentes. Mostre o resultado dos testes de importação, busca, plurais e unidades.”

O pacote é um ponto de partida amplo, não uma lista de todos os produtos possíveis. Novos sabores, itens e apresentações devem continuar disponíveis no cadastro. Os nomes regionais e as unidades podem ser ajustados pelo produtor.

A seleção foi preparada para este projeto. As referências da Embrapa e do MAPA indicadas nos metadados apoiam partes do vocabulário de frutas e charcutaria; não são a fonte individual de todas as sugestões nem certificam os produtos.
