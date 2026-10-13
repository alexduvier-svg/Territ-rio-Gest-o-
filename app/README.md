# Território — app Android

App Android (Capacitor 8) construído a partir de `../territorio-gestao-mockup.html`.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/legacy/` | Código do mockup (CSS, `erp-core.js`, `erp-ui.js`), migrado uma vez por `tools/migrate-from-mockup.mjs`. Agora é a fonte; edite aqui. |
| `src/native/storage.js` | Dados gravados em arquivo no aparelho (dois slots alternados + backup diário de 14 dias). Coberto pelo Backup automático do Android. |
| `src/native/shell.js` | Botão voltar, vibração, salvar/compartilhar arquivos, links externos, tela sempre ligada na venda, cor das barras do sistema. |
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

Instalar no celular conectado por USB (depuração USB ativa):

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
