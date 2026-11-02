# QA 148 · navegador real (Chrome headless, 360×780)

Requer `npm i playwright-core` numa pasta auxiliar e `vite preview --port 4173` do app.
- `ask.cjs` — 50 perguntas do “Pergunte sobre seu negócio” pelo Gerente completo, sem internet e sem modelo (resultado: 50/50 com rota).
- `../questions148.mjs` — as mesmas perguntas só no motor `readQuery` (34/50; finanças, fiado e custos seguem pelo motor da Gestão, fora dele).
- `cart4.cjs` — Continuar comprando → tocar outro produto → Voltar sem comprar → Retomar: o carrinho anterior volta com Finalizar habilitado.
- `form2.cjs` — “Café verde” sugere Saca; salvar incompleto marca tipo, formato, embalagem, peso, preço e custo em vermelho.
- `gestao.cjs` — estrutura da Gestão: Inteligência do negócio sem Próximas Ações repetido.
