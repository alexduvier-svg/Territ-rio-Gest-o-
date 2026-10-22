# Arquivos alterados — 0.12.64

- src/features/financial-session.js: política de visibilidade por sessão e ciclo de vida, sem timer.
- src/main.js: instalação da política.
- src/legacy/erp-ui.js: olho fechado antes do primeiro paint, máscara sem recriar campos, Histórico das Feiras, criar por pill/sem+ e detalhe com rodapé comum/casinha.
- src/features/event-experience/form.js e events.css: formulário, data/horário pareados, títulos únicos em até3colunas adaptáveis e palavras inteiras.
- src/features/event-learning.js: deduplicação de títulos com pontuação normalizada.
- src/data/interface-guidelines.js e public/knowledge/premissas-interface.md: premissas permanentes/interface34.
- tests/financial-session.test.mjs e tests/event-form.test.mjs: privacidade/idempotência/isolamento/registros e títulos equivalentes.
- package.json,package-lock.json,android/app/build.gradle:0.12.64/code104.
- docs/ENTREGA-0.12.64.md e esta lista; QA privacy064/events064 e relatórios sintéticos.

Checkpoint/metadata/binários/scripts locais de instalação ficam no workspace. SDK, chaves, credenciais e dados reais não são enviados ao Git.
