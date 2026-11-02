# AGRO Gestão Teste 148 — Qwen retirado, Gerente offline ampliado e revisão dos 20 itens

Data: 02/11/2026. Ramo `claude/agro-gestao-148-teste`, a partir de `codex/agro-gestao-147-auditoria` (5338fea). Versão 0.12.148-teste.1, código 190. Pacote da edição de testes: `br.com.territorio.gestao2.codextesteia` (mesmo da 147, atualiza sem apagar dados).

## Como compilar o APK (Codex, no ambiente com Android SDK e a chave preservada)

1. `git fetch origin claude/agro-gestao-148-teste && git checkout claude/agro-gestao-148-teste`
2. `cd app && npm ci && npm run build && npx cap sync android`
3. `cd android && ./gradlew assembleCodexTesteIaRelease` (ou a mesma tarefa usada na 147), com as variáveis `AGRO_SIGNING_*` da chave IA (certificado SHA-256 `b1b8f2c7…0c86`).
4. Não é mais preciso o projeto `:qwenmodel` nem a propriedade `includeQwenAssetPack`. A biblioteca LiteRT-LM foi removida: o APK deve ficar cerca de 20 MB menor.
5. Instalar como atualização do Codex Teste 147, sem desinstalar.

Código Java alterado sem compilação local (este ambiente não tem o Android SDK): `AgroLocalIntelligencePlugin.java` (reescrito: só voz offline e limpeza das cópias antigas do Qwen) e `AgroModelDiagnosticsPlugin.java` (somente Gemini Nano). Foi feita verificação de sintaxe com `javac`. Se a compilação acusar algo, os dois arquivos são os pontos a conferir.

## 1. Qwen retirado; ordem oficial de interpretação

- Removidos do app, do APK e do fluxo: Qwen 0.6B e 1.7B, LiteRT-LM, asset pack, template de conversa, licenças, download pelo Hugging Face e a seleção de trechos.
- Ordem: **Gemini online** (principal, com chave e autorização) → **Gemini Nano** (sem internet, só onde o Android/AICore oferece) → **motores do app** (sempre). Consentimento, cancelamento e mudança de contexto nunca trocam de modelo.
- Na primeira abertura, as cópias privadas do Qwen deixadas pelas versões de teste são apagadas (até ~1,5 GB liberados).
- A configuração de inteligência mostra os três níveis numerados; a comparação passou a ser Gemini online × Gemini Nano.

## 2. Itens 1–20 conferidos em navegador real (Chrome, 360 × 780) e corrigidos

| Item | Situação encontrada | Ação na 148 |
|---|---|---|
| 1 Estoque em fornecedores | Compra/recebimento parcial existia, mas a lista não mostrava o que faltava | Cada compra mostra situação, quanto chegou e quanto falta |
| 2 Dois toques | Funcionava até ~200 ms entre toques; 280 ms virava venda | Janela 350 ms (Android usa 300 ms); testado com toque emulado 120–320 ms |
| 3 Entrada de uma unidade | Histórico sem apresentação; “1 kg” não filtrava | Histórico mostra tipo/formato/peso/unidade; pesquisa entende kg e meio quilo |
| 4 Carrinho | Depois de Continuar comprando → tocar produto → Voltar, o aviso do carrinho sumia | Aviso considera itens confirmados; Retomar reabre o carrinho com Finalizar habilitado |
| 5 Inteligência × Gestão | “Próximas Ações” repetido dentro do diagnóstico | Bloco repetido removido; expansor renomeado “Ações sugeridas e consultas” |
| 6/7 Perguntas | 27 de 50 perguntas respondidas sem internet; Gerente ficava preso em esclarecimento | 50 de 50 com rota; novo motor `offline-answers.js`; “undefined” no período corrigido |
| 8 Qwen na memória | Diretrizes citavam Qwen como ativo | Diretriz versão 3 registra a retirada |
| 9 Português | Anglicismos visíveis, nomes sem acento | Varredura do texto visível; correções pontuais |
| 10 Campos vermelhos | Funcionava, mas o erro espremia Preço/Custo | Mensagem abaixo do campo |
| 11 Café verde | Nome “Café verde” sugeria Pacote | Café verde/cru/em coco/beneficiado sugere Saca |
| 12 60 kg | Presente | Mantido |
| 13 Seta de categorias | Presente | Mantido |
| 14 Hortifruti | 4 plantas | +16 (Mangarito, Major-gomes, Bredo, Língua-de-vaca, Tanchagem, Boldo, Poejo, Mastruz, Dente-de-leão, Picão, Arruda, Guaco, Melissa, Carqueja, Folha de bananeira, Urucum) |
| 15 Embalagem livre | Faltavam Sacola, Litro e outras | Lista universal sempre em Mais opções, além de “Outra opção” |
| 16 Lote e validade | Opcional, “Não informada” | Mantido; validade também consultável no Gerente |
| 17 Formulário | Perguntas analíticas cobertas pelo Gerente | Sem seção redundante (ver abaixo) |
| 18 Lançar custo | Espaço já corrigido; texto repetido | Explicações fundidas |
| 19 Orientações | Acesso em Produtos e Clientes | Mantido |
| 20 Red team | — | Ver abaixo |

## 3. Perguntas respondidas sem internet (bateria `qa/questions148.json`)

Vendas (mais/menos vendido, hoje, semana, mês, por produto, por kg), estoque (por produto, acabou, acabando, repor, valor do estoque, produtos cadastrados), clientes (quantos compraram, quem mais comprou, CNPJs), finanças (faturamento, lucro, margem, ticket, a receber, fiados, custos, comparação mensal), forma de pagamento, dia da semana, horário, entradas e compras pendentes, validade e lotes, preço mais caro/barato, produtos sem venda. Abreviações: qto, qtos, vc, hj, pra.

## 4. Formulário da feira (item 17)

Mais vendeu, menos vendeu, forma de pagamento, produtos sem venda, faixa de preço e sobras já são respondidos pelo Gerente e pelos relatórios. Opinião (gostou, pretende voltar, observações) e “em quanto tempo esgotou” exigem dados que o app não registra; não devem ser inventados. Recomendação mantida: não criar uma seção duplicando o questionário.

## 5. Red team das mudanças

- Respostas offline usam somente registros elegíveis (origem real × demonstração, produtor, local) e respeitam o modo de privacidade (valores em pontinhos).
- Planos interpretados por IA (`productIds`) não são desviados pelas respostas rápidas.
- Intervalos explícitos (“desde…”, “entre…”) continuam pedindo datas na Gestão.
- “2 kg de tilápia” (a granel) continua sendo quantidade, não apresentação.
- Retomar o carrinho só descarta uma rodada sem nenhuma quantidade.

## 6. Verificações

- 923 testes de código aprovados (eram 917 na 147; testes do Qwen substituídos por testes da nova ordem e 14 novos).
- DOM QA da 147 (`qa/intelligence147-dom.mjs`) aprovado sobre o código 148.
- Roteiros em navegador real em `qa/browser148/`.
- Não executados aqui: compilação Android, instalação física, Gemini com a chave real, Gemini Nano físico, toque em tela física.

## 7. Pendências observadas (não alteradas)

- Cadastro de “Queijo minas” sugere Pacote e tipos de leite (Integral, Desnatado…) em vez de tipos de queijo.
- Categorias “Apicultura” (dados de exemplo) e “Mel e Apícolas” aparecem separadas no seletor.
