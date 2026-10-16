# AGRO Gestão 2 — 0.12.6 / código 46

## Mudanças

- Entrada de estoque: categoria, produtos próprios e busca; tocar em um produto existente abre reposição com seu ID/unidade e quantidade vazia. Atalhos incluem saldo zerado. Produtos próprios recebem prioridade conforme entradas confirmadas.
- Cadastro novo: botão **+ Insira seu produto**, nome digitado preservado, categoria manual respeitada, apresentação e unidade confirmadas antes dos valores. Removidas a badge vermelha Estoque geral e a duplicação Categoria sugerida. Título **Produtos para estoque**.
- Catálogo offline com 2.479 sugestões, famílias/apresentações, aliases, plurais, unidades e nomes regionais. Asset compacto de 432.835 bytes, carregado sob demanda. Sugestões não criam produtos de venda, preços, custos, estoque ou transações.
- Memória por produto/apresentação, desde o cadastro confirmado. Contadores somente para entradas positivas registradas; perdas, correções, cancelamentos e edições não aumentam a frequência. IDs e variantes permanecem distintos.
- Deduplicação por identidade comercial, incluindo unidade/conteúdo/embalagem. Registros antigos incompletos exigem revisão; nenhuma fusão por semelhança de nome. Maço/molho no campo de unidade não se confunde com molho culinário; cacho não vira dúzia.
- **+** na posição anterior da calculadora. Painel e reposição mantêm categorias/famílias contíguas, independentemente da ordem de cadastro. Cafés ficam juntos: Especial, Gourmet, Tradicional e demais tipos; moído antes de grãos e pesos crescentes. Preço desempata apresentações equivalentes.
- Número da quantidade em vermelho no carrinho, com cores próprias para temas claro/escuro.
- Ícone do Estoque: duas abas abrem, maçã cai dentro e abas fecham com mola discreta. Movimento só ao tocar; modo reduzido/leve respeitado.
- Conhecimento de catálogo: regras pequenas e documentos/lista embarcados, disponíveis offline; a inteligência recebe somente referências pertinentes à pergunta, sem lista inteira nem disponibilidade inventada.
- Gravação nativa em slots A/B com checksum e releitura antes da confirmação. Primeiro backup diário preservado mesmo após reiniciar. Falha síncrona não trava a fila. Retry de cadastro/reposição pendentes não duplica quantidade ou produto. Backup completo inclui memória, regras e metadados.

## Validação

153 testes do aplicativo passaram. 14 verificações do fluxo no build de produção passaram, sem erros JavaScript: cadastro, apresentações, revisão de legado, temas claro/escuro em 320/360 px, reload, falha de gravação/retry, cancelamento, catálogo e cinco documentos locais, busca offline e ordem do painel/alertas/lote de reposição. Carrinho adicional conferido nos dois temas e sequência da caixa verificada. Dados de teste isolados; nenhuma transação real foi criada no celular.

A versão final do APK, sua assinatura/hash e o estado de instalação são registrados em `native-apk-validation-0.12.6.json` depois do build. Esta nota, por si só, não confirma instalação.

## Persistência

Dados e memória sobrevivem ao fechamento, reinício e atualização mantendo o mesmo pacote/assinatura. Limpar dados, desinstalar ou perder o aparelho requer restaurar uma cópia externa; não há promessa de permanência absoluta. Não foi configurado envio remoto automático de novos nomes ou dados do produtor.

## Arquivos alterados/adicionados

### Aplicativo

- `src/main.js`
- `src/legacy/erp-core.js`
- `src/legacy/erp-ui.js`
- `src/interface-refinements.css`
- `src/motion.css`
- `src/features/motion/nav-icons.js`
- `src/features/product-catalog.js`
- `src/features/product-stock.css`
- `src/features/stock-order.js`
- `src/features/advisor/catalog-vocabulary.js`
- `src/features/advisor/agent.js`
- `src/features/advisor/knowledge.js`
- `src/features/fair-surplus.js`
- `src/features/fair-surplus-ui.js`
- `src/native/storage.js`
- `src/native/save-queue.js`
- `src/data/catalog-knowledge.js`
- `src/data/product-catalog-compact.json`
- `src/data/product-catalog-policy.json`
- `src/data/product-catalog-data.js`
- `public/knowledge/catalogo-agro/INSTRUCOES_PARA_O_CODEX.md`
- `public/knowledge/catalogo-agro/LEIA_PRIMEIRO.md`
- `public/knowledge/catalogo-agro/LISTA_COMPLETA.md`
- `public/knowledge/catalogo-agro/unidades_e_plurais.json`
- `public/knowledge/catalogo-agro/resumo_categorias.json`
- `tools/build-product-catalog.mjs`
- `package.json`
- `package-lock.json`
- `android/app/build.gradle`

### Testes

- `tests/product-catalog.test.mjs`
- `tests/product-memory.test.mjs`
- `tests/catalog-vocabulary.test.mjs`
- `tests/stock-order.test.mjs`
- `tests/storage.test.mjs`
- `tests/backup-memory.test.mjs`
- `tests/save-queue.test.mjs`

QA e reprodução ficam em `../qa/`: stock-flow.e2e.cjs/json, stock-production.e2e.cjs/json, unit-catalog.txt, build-catalog.ps1 e capturas. Arquivos de produção em dist e assets nativos são gerados no build.

Documentos de referência foram lidos e adaptados ao contexto do app. O metadado original informa 1.270 famílias; os registros contêm 1.269 tuplas distintas base/sabor/variedade, preservadas todas as 2.479 apresentações.
