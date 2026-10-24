# AGRO Gestão 2 — 0.12.84

Status: instalada nos dois aparelhos e cópia na pasta original, em24/10/2026. Publicação Git em conclusão.

## Alterações

A janela “Vendeu Mais do Que Levou” usa o campo numérico e o teclado já existentes no app, com contexto e quantidade em cartões do material comum. Não abre mais o teclado do Android automaticamente. Repor e Agora Não ficam no rodapé, abaixo do teclado arredondado, com espaçamento e alvos de toque adequados. Abrir/cancelar mantém os dados; a confirmação conserva a lógica anterior de reposição na carga da feira.

A mesma correção alcança a estimativa de procura depois da feira, a revisão local de pedidos e os campos numéricos das preferências e prévia do agente. Quantidades mantêm sua precisão; frete conserva duas casas e os listeners de totalização. Na prévia do agente, Atualizar/Cancelar ficam no corpo e Preparar/Voltar no rodapé, para não cortar o retorno com texto ampliado. O aviso nativo de finalizar feira agora encaminha à mesma ação atual da aba Eventos, em vez de abrir o painter legado.

Na pill Loja, a caixinha vermelha substitui o ícone verde sem forçar valores/olho para outra linha em320px. Reposição, Loja/seta, total e olho mantêm ações distintas. O título Entrada de Estoque ocupa a largura do conteúdo, alinhado aos cartões; Usar Outra Apresentação tem12px de espaço e48px de altura de toque, inclusive após expandir. Apresentações não repetem “Pacote · Pacote”; é apenas deduplicação do rótulo, sem mudar unidade/embalagem/identidade. Memória de interface54; três colunas e material existentes preservados.

## Evidência

638 testes unitários passaram. Oito jornadas finais focadas em320ampliado/leve/reduzido,360,393,412, claro/escuro passaram: fila real de aviso com venda fictícia, reposição e cancelamento, controles numéricos, pedido/frete e total, agentes, Loja e ações/privacidade separadas, título/margens/apresentações, encaminhamento nativo e as cinco abas. Ver qa/keyboard084-review-final.json. O relatório focado não mede deslocamentoX; a métrica pertence à regressão nativa completa. Houve também uma matriz completa preliminar; ela não substitui a validação do último APK.

As quatro jornadas Capacitor completas finais passaram no Reno e no PKJ, claro/escuro, com errors[] vazio e relatórios posteriores ao APK final. Incluem regressões de boot com cadastro pendente, navegação atômica, catálogo/cafés, edição/zeros, materiais e as novas janelas. Capturas fictícias foram inspecionadas. O desvio do alvo X foi menor que1px nos quatro casos. Uma primeira parada foi precisão geométrica: CSS44px retornava43.99999 por arredondamentoDPR; QA exige o mínimo CSS44 e tolerância geométrica0.01px. Não foi reduzido o alvo. Bloqueio do aparelho e perda do foreground interrompem as capturas. Tentativas interrompidas não contam como aprovação.

APK0.12.84/code124:9201779bytes; SHA2569fe6436798492812ad1beaf3f85e6835ed1ea265bf0d365ecfb0b9e83d2664e8. Certificadooriginal f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68, v2/v3. Cinquenta assets web e duas pontes iguais entre fonte compilada/APK/fixture; ZIP e ELF com alinhamento16KB estrutural conferidos. Pacote br.com.territorio.gestao2. A corrupção do pacote temporário após interrupção foi corrigida por rebuild completo somente do fixture; seu ZIP final foi testado íntegro. Não houve mudança da fonte por correções do harness.

## Preservação

Nenhum banco real foi lido/copiado; nenhum registro real, venda, mensagem de WhatsApp ou calendário pessoal foi criado/alterado para testes. A inspeção real autorizada do Reno ficou na interface; o cadastro em andamento foi preservado. Captura privada não será publicada. Os testes usam pacote separado e dados fictícios. Não houve mudança de clima, Firebase, servidor, assinatura ou pacote principal. Nenhuma biblioteca, motor de movimento ou observador foi adicionado. FPS/GPU/bateria, aparelho básico físico, TalkBack e execução em ambiente16KB não foram medidos.

## Instalação

Cópia original: AGRO-Gestao-2-0.12.84.apk na pasta Território Gestão, hash igual ao artefato validado. Atualização com adb install -r: Reno14 CPH2737 em24/10 às15:04:13 e PKJ110 às15:04:22. As datas da primeira instalação foram preservadas (Reno21/10 18:58:01; PKJ14/10 18:17:06). Boot frio confirmou os seis módulos em ambos: agent/motion/workflows/events/suppliers/training. Fixtures removidos; capturas privadas e arquivos próprios de tela/forwards removidos antes da publicação. Não repetir build/testes/cópia/instalação84 por alterações apenas documentais.
