# AGRO Gestão 2 — 0.12.8 / código 48

A janela do cérebro e suas análises internas passam a usar expansão curta, orientada ao toque, com escala inicial de 0,94 e deslocamento máximo de 18 px. A geometria anterior podia mover a borda distante mais de 200 px. A mola tem uma acomodação discreta e uma saída mais rápida; o material fica estável durante o fechamento, sem trocar blur ou cor. A API nativa de fechar continua síncrona. Modo leve reduz a distância e movimento reduzido desliga a animação.

Em Valores e estoque, os quatro rótulos vermelhos usam Inter semibold de 14 px, espaçamento consistente e cores sóbrias específicas para claro/escuro. Texto ampliado usa 16 px. O título segue a hierarquia estrutural do sistema e os valores digitados preservam a cor normal. O relevo permanece nas superfícies; as letras não recebem sombras decorativas.

A premissa permanente de volume, nitidez, estilo, textura e profundidade foi instalada no modelo local `interfaceGuidelines`, no documento offline e no AGENTS.md. A gravação inicial aguarda a durabilidade nativa. A premissa acompanha o modelo e o backup; a restauração mantém a versão vigente e não substitui revisão posterior.

O documento Regras_Janelas_Desempenho_Agro_Gestao.docx foi registrado como referência, com hash e avaliação de lacunas. Esta revisão não migra o armazenamento nem declara aprovada a matriz de carga, P95/P99 ou uso em aparelho básico. Ver docs/REVISAO-JANELAS-DESEMPENHO-2026-10-16.md.

## Arquivos de app e premissas alterados

- src/features/motion/index.js
- src/features/motion/geometry.js
- src/glass.css
- src/features/product-stock.css
- src/interface-refinements.css
- src/data/interface-guidelines.js (novo)
- src/legacy/erp-core.js
- src/main.js
- public/knowledge/premissas-interface.md (novo)
- package.json
- package-lock.json
- android/app/build.gradle
- ../AGENTS.md

## Verificação e suporte

- tests/motion-geometry.test.mjs: geometria do cérebro, modo leve e saída sem reaparecimento.
- tests/product-memory.test.mjs: instalação, restauração, revisão posterior e integridade dos registros.
- 24 testes focados passaram: spring, geometry e product-memory.
- ../qa/brain-values-qa.cjs/json: janela por toque real, claro/escuro, normal/leve/reduzido, interrupções, ausência de flash/clones, rótulos e texto ampliado em 320/360 px, contraste e memória após recarregar.
- ../qa/build-interface.ps1, ../qa/verify-interface-apk.py: build assinado e conferência byte a byte dos assets.
- docs/references/Regras_Janelas_Desempenho_Agro_Gestao.txt e docs/REVISAO-JANELAS-DESEMPENHO-2026-10-16.md: referência e limites da avaliação.

O resultado final do QA e a confirmação de instalação estão nos respectivos JSON. Nenhuma transação fictícia foi criada no aparelho real. `native-apk-validation-0.12.8.json` registra assinatura, hash, versão e instalação verificados; este changelog sozinho não confirma instalação.

Resultado final: QA passou, seis cenários de movimento, 24 de tipografia e três de memória. Na execução isolada de Chrome, entrada até repouso aproximadamente 480 ms e saída até opacidade≤1% aproximadamente 217 ms; não são P95 nem medidas de Android. APK de 4.225.530 bytes, 27 assets conferidos, assinatura original v2/v3 e release não depurável. Instalado com sucesso por adb install -r; dumpsys confirmou0.12.8/code48 e lastUpdateTime2026-10-16 09:43:52, preservando firstInstallTime2026-10-14 18:17:06.
