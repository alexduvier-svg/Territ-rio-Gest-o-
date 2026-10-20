# Entrega — AGRO Gestão 2 0.12.25/code65

O indicador de tempo saiu da pill Loja e fica ao lado de Área de vendas, como b37.jpeg: nuvem vetorial e temperatura prevista para agora, sem fundo ou palavra Tempo. A entrada Organizar foi retirada dessa linha a pedido do produtor; preferências de ordem já salvas e os demais fluxos são preservados. Sem dado disponível, —°; a imagem de referência não fixa a temperatura. O toque abre a mesma ativação opcional e previsão. Traços de chuva azuis só aparecem com previsão de precipitação. Sem animação ociosa, dependência nova ou consulta adicional.

Premissa v12 instalada no modelo/backup, separada dos registros de negócio. Integração MET/IBGE, consentimento, fonte/data/cache offline, Eventos, servidor e identidade do APK mantidos.

## Validação desta alteração

- 17 testes existentes de memória/catálogo e previsão passaram.
- 64 verificações UI em 8 configurações: claro/escuro, 320/360 px com texto ampliado e 393/412 px normal. 24 superfícies registradas: preços, janela e indicador.
- Indicador na mesma linha e centralizado com o rótulo; fundo/sombra ausentes, área de toque de 44 px e sem transbordamento. Temperaturas sintéticas 20° e 27° confirmam uso do dado; previsão seca não desenha chuva. Organizar ausente da linha, sem tempo dentro da pill Loja.
- Ativação, cache, falha offline, desativação, fonte e horários de evento seguem funcionando; nenhuma mudança nos registros sintéticos de produtos/vendas/estoque. Toque em navegador Chrome isolado, zero erros JS.
- Matriz completa histórica não repetida. Sem transações reais de teste. FPS/GPU nativos e aparelho básico não medidos. Servidor não alterado nem republicado. Não houve submissão à Play Store.

## Artefato

AGRO-Gestao-2-0.12.25.apk: 5,103,820 bytes. SHA256:bf7989c37474565c5c3cb35365b99543b0cf9a750eb0fc9e47adee5b81ab344c.
Certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68. Pacote:br.com.territorio.gestao2; v2/v3,38assets idênticos ao dist, zipalign16KB, sem GPS/voz/microfone.
Cópia conferida na pasta original C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.25.apk.
Instalado com adb install-r em 2026-10-20 18:40:45; Android65/0.12.25 e aberturaStatusok. firstInstallTime 2026-10-14 18:17:06 preservado. Sem desinstalar ou limpar dados.
Fontes, premissa e QA deste registro pertencem exclusivamente ao ramo codex/atualizacao-agro-gestao2; main independente preservado.
