# Arquivos alterados — 0.12.63

- src/features/event-experience/form.js: organização do formulário existente, sugestões e relógio comum.
- src/features/event-experience/surfaces.js: cards/lista/detalhe, carga paginada, atalhos Loja/ativo e análises na Gestão.
- src/features/event-experience/index.js e events.css: integração e materiais responsivos nos dois temas.
- src/features/event-learning.js: sugestões individuais derivadas do histórico existente.
- src/features/store/availability.js: leitura de saldos de carga em lote, sem mudar as regras de disponibilidade.
- src/features/weather/index.js: renderização do controle de clima no card; motor/fonte/cache inalterados.
- src/legacy/erp-ui.js: delegações finais de Eventos/Gestão/Loja e retirada de Concluir só no teclado da carga.
- src/data/interface-guidelines.js: memória/interface33.
- tests/event-form.test.mjs: agrupamento, isolamento, nomes livres/completar e horários exatos.
- package.json, package-lock.json e android/app/build.gradle:0.12.63/code103.
- docs/ENTREGA-0.12.63.md e esta lista; QA events063 e relatórios sintéticos.

O plugin Android de Agenda não mudou. Checkpoint/metadata/binários/scripts locais de instalação permanecem no workspace. SDK, dependências geradas, credenciais, chaves e dados reais não são enviados ao Git.
