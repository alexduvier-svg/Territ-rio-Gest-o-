# Entrega — AGRO Gestão 2 0.12.26/code66

A janela Tempo combina próximas horas em cards horizontais e próximos dias em cards expansíveis. Cada dia mostra data, mínima/máxima dos horários previstos e volume de chuva disponível, com barra comparativa e seta. Ao tocar, aparecem os horários daquele dia. O indicador de nuvem+temperatura na página Produtos permanece como na 0.12.25.

Somente dias/horários fornecidos são exibidos, sem interpolar temperaturas nem inventar horizontes. Hoje considera o restante do dia; períodos incompletos são sinalizados. Mínima/máxima se referem aos horários disponíveis. Ausência de chuva estimada é desconhecida, nunca zero inventado. A soma respeita intervalos da fonte, sem sobreposição; cruzamentos de meia-noite usam estimativa proporcional e aviso.

O conteúdo rola na janela com margens e Voltar inferior íntegro; cards de horas rolam horizontalmente. Atualizações preservam posição de leitura, trilhas e dias abertos. Recolhimento ocioso comum de15segundos, motor de seções existente, sem dependência ou animação ociosa nova. Temas claro/escuro e texto ampliado considerados. Sem consultas extras para ver/expandir dias: a previsão já recebida fornece o horizonte. MET/IBGE, ativação opcional, fonte/data/cache offline, consentimento e servidor permanecem.

Premissasv13 persistidas no modelo/backup, separadas dos registros de negócio.

## Validação

21 testes existentes/novos de memória e previsão PASS: dia de Brasília, mistura1/6h, meia-noite, sobreposição, chuva desconhecida, horizonte real, datas/temperaturas e preservação do cache. 98 verificações UI/32 superfícies em oito configurações PASS: claro/escuro,320/360px com texto ampliado e393/412normal. Dias reais disponíveis/expansão/recolhimento por toque e15s ociosos, cards horizontais, margens/rolagem/Voltar íntegro, cache/ativação/desativação/offline e Eventos conferidos. Atualização preserva dia aberto e posição, sem chamada adicional. Zero erros JS; registros sintéticos inalterados. Consulta pública real pelo cliente JavaScript: HTTP200, MET Norway,90pontos e10dias disponíveis, agregados sem erro; não cria registros de negócio. Nenhuma transação real de teste; GPU/FPS nativos e aparelho básico não medidos. Matriz completa histórica não repetida. Servidor não alterado/republicado; nenhuma submissão Play.

Referência técnica consultada: [formato de previsão MET Norway](https://api.met.no/doc/ForecastJSON), campos instantâneos e intervalos seguintes1/6/12h. Horários exibidos em Brasília conforme o sistema.

## Artefato

AGRO-Gestao-2-0.12.26.apk:5103820bytes. SHA256:3221d4d6279f4adff80ad0e4ae44ae5e2f67bc0d70f78f21d8ccd0c74bd6ed2e.
Pacote:br.com.territorio.gestao2; certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68; v2/v3,38assets idênticos ao dist,zipalign16KB,semGPS/voz/microfone.
Cópia conferida em C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.26.apk.
Instalado com adb install-r em 2026-10-20 18:57:17,Android66/0.12.26 e aberturaStatusok; firstInstallTime 2026-10-14 18:17:06 preservado. Sem desinstalar/limpar.
Fontes, memória e QA pertencem exclusivamente ao ramo codex/atualizacao-agro-gestao2; main independente preservado.
