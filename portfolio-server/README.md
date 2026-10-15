# Território — servidor

Cloudflare Worker do app Território. No ar em **https://agro-gestao.agro-gestao.workers.dev**.

Faz três coisas:

## 1. Portfólio online

A página pública que o cliente abre ao escanear o QR mostrado após a venda.

- Página sem JavaScript, rápida em qualquer celular, com tema claro/escuro automático.
- Conteúdo: foto e nome do produtor, história, botões **Conversar no WhatsApp**, **Baixar PDF** e **Salvar contato**, próximas feiras e produtos com fotos e preços de referência.
- Publicação só por comando do produtor ("Publicar/Atualizar página"), porque expõe fotos, preços e contatos.
- Cada portfólio tem um token secreto, guardado nos dados do app. Só o aparelho do produtor atualiza ou tira a página do ar.
- Fotos endereçadas por SHA-256: ao atualizar, só as fotos novas são enviadas.

## 2. Leitura automática do QR

O QR de cada venda leva uma marca aleatória (`/p/<página>?r=<marca>`). Quando o cliente abre a página, o servidor registra só a marca e a hora (sem IP nem dados do aparelho). O registro expira em 90 dias. Pré-visualizações de link (WhatsApp, Facebook, robôs) não contam. O app consulta essas marcas e marca "QR code lido ✓" sozinho; o Resumo mostra quantas leituras foram automáticas.

## 3. Backup automático criptografado

O app cifra os dados **no celular** (AES-256-GCM, chave derivada do código de recuperação por HKDF) e envia só o conteúdo cifrado. O servidor não consegue ler nada. O identificador da cópia e a senha de acesso também saem do código, então o código sozinho restaura tudo em outro celular. O servidor devolve o SHA-256 do que gravou, e o app só considera a cópia "verificada" se bater com o que enviou. Uma versão do dia anterior é mantida. Código: [`src/backups.js`](src/backups.js) e [`../app/src/features/backup-crypto.js`](../app/src/features/backup-crypto.js).

## Desenvolvimento

```bash
npm install
npm run dev              # http://127.0.0.1:8787
npm test                 # com o dev rodando: 13 verificações do portfólio e das leituras
node tests/backup.mjs    # 7 verificações do backup criptografado
```

Para testar contra o servidor publicado: `BASE=https://agro-gestao.agro-gestao.workers.dev npm test`.

O app em modo dev (`npm run dev` em `../app`) usa este servidor local automaticamente.

## Colocar no ar

Já configurado na conta Cloudflare do produtor (`wrangler.toml`: conta, KV `PORTFOLIOS` e KV `BACKUPS`). Para publicar uma nova versão:

```bash
npx wrangler deploy
```

O endereço do servidor que o app usa fica em `../app/.env.production` (`VITE_PORTFOLIO_API`).

## Limites conhecidos

- Qualquer pessoa pode criar um portfólio pela API (não há contas de usuário). Antes de distribuir o app em escala, adicionar limite de criação por IP ou login do produtor.
- Plano gratuito do KV: **1.000 gravações por dia na conta inteira**. Cada publicação usa de 2 a 3 gravações (mais uma por foto nova); cada leitura de QR, uma; cada backup automático, uma (o app envia no máximo a cada 10 minutos). Serve bem para alguns produtores; para dezenas, passar para o plano Workers Paid (US$ 5/mês, milhões de gravações).
- Backup de até 20 MB cifrado por produtor.
