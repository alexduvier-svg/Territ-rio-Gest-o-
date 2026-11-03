# Diretriz interna: linguagem dos relatórios

Vale para o Resumo do dia, a Gestão, a Inteligência do negócio, os textos enviados por WhatsApp, as planilhas lidas por pessoas e qualquer diagnóstico do app. O relatório deve soar como um gestor que conhece a banca falando com o produtor: português correto, frases curtas e números que significam a mesma coisa nos dois lados de uma comparação.

Código de referência: `app/src/features/report-language.js` (`itemPhrase`, `pluralName`, `pluralWord`, `count`), com testes em `app/tests/report-language.test.mjs`. A regra resumida também está em `interface-guidelines.js` (`reportLanguage`).

## 1. Quantidade e produto

A quantidade concorda com o produto, como se fala na feira.

| Unidade | Forma | Exemplo |
| --- | --- | --- |
| Conjunto: dúzia, meia dúzia, saca, caixa, maço, bandeja, sacola, penca, cacho, kit | quantidade + unidade (no plural quando ≥ 2) + "de" + produto | 2 dúzias de Ovos Caipiras · 1 dúzia de Ovos Caipiras · 2 sacas de Café Verde · 60 kg |
| Peso e volume: kg, g, L, ml | quantidade + símbolo + "de" + produto | 1,5 kg de Pacu Inteiro · 2 L de Leite |
| Contada: pacote, pote, vidro, garrafa, unidade | quantidade + produto no plural | 2 Cafés Especiais TC Moídos · 250 g · 3 Acarás-Bandeiras Vivos · 1 Geleia de Morango · 250 g |

- O plural pega o substantivo e os adjetivos que concordam com ele (Cafés Especiais Moídos, Bananas Nanicas).
- O plural para no primeiro conectivo (Geleias de Morango, Pés-de-Moleque) e quando surge um segundo substantivo (Queijos Meia Cura, Bananas Prata, Bettas Cauda Dupla).
- Siglas não mudam (TC, TM, UHT). Também não mudam palavras estrangeiras ou invariáveis (Gourmet, Premium, Extra, Light).
- Palavras compostas com hífen pluralizam as duas partes (Acarás-Bandeiras), salvo quando têm conectivo (Pés-de-Moleque).
- O plural vale para 0 e para quantidades a partir de 2. Para 1 e números entre 1 e 2 (1,5 dúzia), a forma fica no singular.
- O tamanho vem no fim, depois de " · " (· 250 g). "Unidade" e "Venda por kg" não se repetem no texto, porque a frase já diz a unidade.
- Os itens de uma mesma venda são separados por ponto e vírgula: "2 dúzias de Ovos Caipiras; 1 Café Especial TC Moído · 250 g".

## 2. Maiúsculas e nomes

- Nomes próprios (produtos, clientes, feiras, locais) seguem a regra `properNames`: cada palavra com maiúscula e conectivos em minúscula. Os títulos também; o produtor escolheu manter assim.
- Um rótulo que abre a frase ou o campo começa com maiúscula: Antes, Subiu, Caiu, Igual.
- Palavras comuns no meio da frase ficam em minúscula: dúzias, vendas, pacotes.

## 3. Comparações

- Nomear o período em vez de usar "agora" e "antes": Nov e Out; Seg. 03/11 e Seg. 27/10; feira de 12/10 e feira de 05/10; 2026 e 2025.
- Comparar sempre recortes equivalentes. Um mês em andamento (1 a 3/11) é comparado com os mesmos dias do mês anterior (1 a 3/10), nunca com o mês inteiro. Uma semana em andamento vai até o mesmo dia da semana anterior, e um dia em andamento até o mesmo horário do dia anterior. O recorte usado é escrito logo abaixo do título.
- A ordem segue a lógica do negócio: volume (vendas concluídas), dinheiro (receita, ticket médio), qualidade (lucro bruto, margem) e, por fim, o produto (o que mais subiu, o que mais caiu e a saída da apresentação principal).
- Cada linha traz os dois valores e a variação com sentido claro. Para dinheiro e contagem: "Subiu R$ 120,00 (+15%)". Para margem: em pontos percentuais ("Caiu 2,1 p.p."), nunca em porcentagem de porcentagem.
- A variação percentual só aparece quando o período anterior tem base (valor maior que zero). Sem base, escrever "sem base no período anterior". Zero registrado não prova queda.
- Uma base pequena (menos de 5 vendas em um dos lados) recebe um aviso de que a diferença pode ser acaso.

## 4. Tom

- Descrever o que os registros mostram. Não prometer resultado nem afirmar causa sem dado.
- Valores em dinheiro obedecem ao olho de privacidade em todas as telas.
- Um aviso diz o que fazer em seguida, em uma frase.
