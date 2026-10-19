# AGRO Gestão — app Android

App Android (Capacitor 8) com vendas, estoque, clientes, eventos e gestão local. A fonte atual está em `src/`; o mockup original é referência histórica. Não reexecutar a migração sobre o código atual.

A atualização 0.12.10 corrige a ordem de famílias na entrada de estoque, cadastro com custo zero, opções de formato/peso e janelas centralizadas com rolagem e tema coerente. Mantém preparação de feira, privacidade e resumos semanais/mensais da 0.12.9. Veja `ALTERACOES-0.12.10.md` para os recursos, verificações e entrega. Padrões de interface e catálogo são embarcados; dados pessoais apagados precisam de backup para recuperação.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/legacy/` | Código do mockup (CSS, `erp-core.js`, `erp-ui.js`), migrado uma vez por `tools/migrate-from-mockup.mjs`. Agora é a fonte; edite aqui. |
| `src/native/storage.js` | Dados gravados em arquivo no aparelho (dois slots alternados + backup diário de 14 dias). Coberto pelo Backup automático do Android. |
| `src/native/shell.js` | Botão voltar, vibração, salvar/compartilhar arquivos, links externos, lembretes de eventos e cor das barras. Respeita o desligamento da tela configurado no aparelho. |
| `src/features/advisor/` | Orientação no Resumo. `knowledge.js`: o material de apoio da feira (Branding, Percepção, PDV, KPIs) em linguagem simples, sem os números fictícios do estudo de caso. `engine.js`: regras que leem os números reais e dizem o que aconteceu e o que fazer, em três níveis (frase + ações, explicação, números). `index.js`: painel, detalhes, guia da banca e checklists. Também alimenta a Inteligência (sem IA: texto local; com IA: orientação e método enviados no contexto). |
| `src/features/product-period-reports.js` | Resumos de 7 e 30 dias completos desde a primeira venda real: até três mais/menos por quantidade na mesma unidade, valor líquido vendido ou lucro bruto com custo histórico conhecido. Estados e preferências acompanham o modelo/backup; notificações são convites privados para abrir o resumo local. |
| `src/data/market-catalog.js` | Banco de produtos de mercado municipal por área e grupo, com unidade padrão. No cadastro, escolhida a área, o autocompletar só sugere itens dela. |
| `tests/` | `node --test tests/*.test.mjs`: domínio, memória, catálogo, finanças, relatórios, persistência, física e preparação de eventos. |
| `src/features/backup.js` | Backup automático criptografado (envia alterações quando há conexão, verifica a cópia no servidor, restaura por código de recuperação) e lembrete semanal de backup. Criptografia em `backup-crypto.js`. |
| `src/features/server.js` | Endereço e chamadas ao servidor (`../portfolio-server`). |
| `src/features/portfolio.js` | Publica o portfólio online (`../portfolio-server`): prepara as fotos, envia só as novas e guarda o link. O QR após cada venda passa a abrir essa página. Endereço do servidor em `VITE_PORTFOLIO_API` (veja `.env.example`). |
| `src/shell.css` | Fonte Inter, áreas seguras (ponta a ponta), alvos de toque de 48dp. |
| `resources/icon.svg` | Arte do ícone. `npm run icons` gera ícones adaptativos, monocromático, splash e ícone da Play Store (`resources/store/`). |
| `android/` | Projeto Android nativo (gerado por `cap add android`, com tema, manifesto e ícones ajustados). |

## Comandos

Requisitos: Node 22+, JDK 21 (`JAVA_HOME`), Android SDK 36 (`ANDROID_HOME`).

```bash
npm install
npm run dev          # navegador, http://localhost:5173
npm run apk:debug    # gera android/app/build/outputs/apk/debug/app-debug.apk
npm run aab:release  # pacote da Play Store (exige chave de assinatura configurada)
```

Em aparelho de desenvolvimento, com depuração autorizada:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Para atualizar o AGRO Gestão já instalado, usar `npm run apk:debug` (chave debug deste PC, a mesma das versões anteriores) e `adb install -r`. O AGRO Gestão 2 (pacote br.com.territorio.gestao2, outra chave) fica no ramo `codex/atualizacao-agro-gestao2`. Não desinstalar nem limpar os dados para contornar incompatibilidade de assinatura.
