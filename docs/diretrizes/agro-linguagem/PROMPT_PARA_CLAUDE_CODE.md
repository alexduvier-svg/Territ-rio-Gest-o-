# Mensagem para colar no Claude Code

Coloque a pasta `agro-linguagem/` na raiz do repositório do AGRO Gestão e envie ao Claude Code:

---

Leia `agro-linguagem/DIRETRIZES_LINGUAGEM_E_FALA.md` inteiro antes de começar.

1. Execute a **seção 0**: descubra a stack do app e **encontre a memória de produtos que já existe (mais de 2 mil produtos)** — arquivos, SQLite/IndexedDB/localStorage/Preferences ou Cloudflare (D1/KV/R2). Me mostre o esquema, a contagem real e onde está. Verifique também se já existe algum corretor, autocomplete ou reconhecimento de voz no código. **Não altere nada antes de me mostrar isso.**
2. Depois da minha aprovação, integre `motor-linguagem.js` + `dicionario_agro_ptbr.json` conforme a seção 3, carregando o catálogo existente com `motor.carregarCatalogo()` (mapeie os campos reais) e `definirProdutor()` com o usuário logado.
3. Aplique o campo de lançamento com barra de sugestões e tratamento de composição de teclado (seção 3.4, exemplo em `integracao/CampoLancamento.jsx`), adaptado ao visual do app.
4. Voz (seção 4): botão apertar-e-falar → Cloudflare Worker (`integracao/transcrever-worker.js`, confira na documentação da OpenAI os campos de `gpt-transcribe`) → `motor.interpretar()` → cartão de confirmação. Sem internet: reconhecimento nativo do Android em pt-BR. A chave da OpenAI nunca vai dentro do APK.
5. Rode `node agro-linguagem/testes.mjs` (precisa dar 50 ok, 0 falha) e os testes do app. Gere o APK de teste e me diga como instalar no OPPO.
6. Ao final, me entregue um resumo do que mudou e uma lista de frases para eu testar com os produtores na Feira Mensal.
