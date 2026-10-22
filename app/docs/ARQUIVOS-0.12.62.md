# Arquivos alterados — 0.12.62

- src/legacy/erp-ui.js: eventos, carga, cancelamento, privacidade e Ajustes.
- src/features/event-experience/{model.js,index.js,events.css}: regras, integração Agenda e superfícies existentes.
- src/features/store/index.js: convite Sobre e lista em texto da carga sem publicação.
- src/main.js: instalação do módulo e estilos.
- src/data/interface-guidelines.js: memória/interface32.
- android/app/src/main/java/br/com/territorio/gestao/{AgroCalendarPlugin.java,MainActivity.java}: integração opcional Android.
- android/app/src/main/AndroidManifest.xml: permissões opcionais de agenda.
- android/app/src/androidTest/java/br/com/territorio/gestao/CalendarExportInstrumentedTest.java: calendário LOCAL isolado e limpeza.
- tests/event-experience.test.mjs: regras de carga, disponibilidade/reservas, convite, datas e cancelamento.
- package.json,package-lock.json,android/app/build.gradle:0.12.62/code102.
- docs/ENTREGA-0.12.62.md e esta lista; QA events062 e relatórios isolados.

Checkpoint/metadata/artefatos binários e scripts locais de instalação ficam no workspace; segredos, dados reais, SDK e chaves não são enviados ao Git.
