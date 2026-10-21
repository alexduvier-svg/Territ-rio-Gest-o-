# Auditoria — Adaptação, memória e ação (AGRO Gestão 3)

Data: 21/10/2026 · Ramo: `claude/agro-gestao3` · Versão: 0.12.60
Diretriz: `AGRO_Gestao_Diretrizes_Adaptacao_Memoria_Acao_Codex_Claude_Code.docx` (v1.0), nesta pasta.
Aparelhos reais medidos: OnePlus PKJ110 (Android, 1440×3168, 360 dp de largura) e OPPO Reno 16 CPH2737
(Android 16, MediaTek Dimensity 8350 / MT6897, 12 GB, 1256×2760, 359 dp de largura, 120 Hz).

## Tecnologia e módulos

Capacitor 8 + Vite; interface em WebView (Chromium 155). Interface legada em `src/legacy/erp-ui.js` com
extensões por reatribuição; módulos em `src/features/*`; nativo em `android/app/src/main/java`.

## Inventário por responsabilidade

| Responsabilidade | Onde já existe | Decisão |
|---|---|---|
| Política de adaptação (janela, efeitos, carga) | não havia serviço central | **Criado** `features/adaptation/policy.js` (uma fonte; saídas independentes; `html[data-window|data-height|data-effects|data-workload]`; `TerritorioAdaptation.policy()`). |
| Detecção de aparelho fraco | `features/interface.js` `detectLite` **e** `features/motion/index.js` `installMotionBudget` (mesma regra de núcleos/memória) | **Duplicidade consolidada**: fica só no motor de movimento; a política lê o resultado. |
| Modo leve por desempenho medido | `motion/index.js` `installFrameBudget` (21/10/2026) | Mantido como fonte canônica; agora reavaliado a cada 7 dias. Medido: OnePlus 3,9% → completo; Reno 32% → leve. |
| Menos efeitos / reduzir movimento | Ajustes "Menos efeitos" (`data-reduce-effects`); `prefers-reduced-motion` | Mantidos; prevalecem na política. |
| Sombra atrás das janelas | `dialog::backdrop` animado (não era composto) | Trocado pela camada `.fluid-scrim` (opacidade no compositor). |
| Toque e rolagem | `touchstart` bloqueante no documento (seletor de lista) | Corrigido: só em cada `select`. |
| Teclado | página de trás redesenhada a cada passo | `html.sheet-typing` esconde a página atrás da janela durante a digitação. |
| Gestos de cartão (1 toque, 2 toques, segurar) | `workflows/index.js` (toques), `reorder.js` (segurar/arrastar), `multisell.js` (seleção) | Um reconhecedor por gesto; mantido. Toque único espera 200 ms pelo segundo toque. |
| Idempotência da venda | `draft.operationId` (E.uid) e conferência em `chooseSaleRecipient` antes de gravar | Mantido (fonte canônica). |
| Gravação durável | `native/save-queue.js` `durable()`; venda só é confirmada após o disco | Mantido. Falha de espaço gera aviso recuperável. |
| Rascunho de venda | `draft` e `draftResumeBanner` (retomar venda) | Mantido. |
| Fotos | `squarePhoto(file, 512)` | Mantido (redução perto do tamanho de exibição). |
| Trabalho em segundo plano | WorkManager: `AgroWeatherWorker`, `AgroAgentReviewWorker` | Mantido; degraus por bateria no clima. |
| Clima | `features/weather` (cache, validade, sem conexão) | Mantido. |
| Memória de regras | diretrizes versionadas em `model.data.*Guidelines` | Acrescentada `adaptationGuidelines` v1. |

## Conflitos (D3)

1. **Uma coluna abaixo de 360 dp** (diretriz §3/§4) × **três colunas compactas também em tela estreita**
   (regra `salesCards`, aprovada pelo produtor). Prevalece a regra do produtor para a grade de Vender; em
   cartão estreito o nome quebra depois da primeira palavra.

## Medições (antes → depois), OnePlus e Reno, `gfxinfo`, toque real via adb

- Rolagem da janela de perfil (OnePlus): p99 13 ms.
- Teclado subindo (OnePlus): p90 46–81 → 18–21 ms; descendo 53–77 → 42–44 ms.
- Abrir/fechar janelas (Reno, efeito completo): p90 46–125 ms; sem animação, o primeiro desenho da tela
  nova custa 48–150 ms — custo do aparelho, não do movimento.

## Pendências (não executadas — não aprovadas)

- Início frio, gravação de venda (p95) e memória em aparelho básico de 2–3 GB.
- Massa sintética (2500 produtos, 10000 vendas, 1000 clientes) e encerramento no meio da gravação.
- Páginas de memória de 16 KB e ABIs das bibliotecas nativas (voz).
- TalkBack e fontes de 150 % e 200 %.
- iPhone: destino separado (APK não instala no iOS).
