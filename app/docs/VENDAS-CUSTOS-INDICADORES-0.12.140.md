# Vendas, custos e indicadores integrados — Codex0.12.140

Base própria139: c0c6898e9dd37f486e117cbfa39ca334a47426a1. Implementação no app/ do Codex; nenhum novo port do Claude. Estado:1159testes e8cenários de navegador aprovados; APK conferido e copiado às duas pastas habituais. Validação física e instalação pendentes de conexão dos aparelhos.

## Uso

- Gestão → Vendas → consultar registros por dia, abrir uma venda e tocar no produto para informar ou corrigir seu custo por unidade. Arquivo reúne os meses anteriores sem mover, copiar ou apagar as vendas originais. Datas inválidas antigas ficam separadas, sem virar a data de hoje.
- O cadastro avisa antes de preço/custo: custo vazio deixa a análise incompleta. Zero só representa custo conhecido quando informado explicitamente. No fim dos relatórios, produtos e apresentações vendidos sem custo aparecem por nome, com acesso às vendas que precisam ser completadas.
- Crédito abre o teclado de parcelas, gera datas mensais e permite ajustá-las no calendário. De1a60parcelas, com soma exata em centavos e datas ordenadas. Alterar o valor da venda exige conferir o plano novamente. Registros antigos continuam sem datas presumidas.
- Repor estoque mostra o produto ativo e o teclado inteiro. Ver lista permite escolher os demais, quatro por página. Repor/Agora não continuam a sequência; a confirmação pendente não aplica a mesma quantidade duas vezes.
- Gestão → Indicadores apresenta margem bruta, contribuição e ticket, com explicações e fórmulas. Grupos expansíveis abrem equilíbrio, resultado, cesta, CRM, ROI/payback e acessos a Produtos, Estoque e Clientes.

## Contrato de integração

| Informação alterada | Fonte e efeito | Proteção |
|---|---|---|
| Custo depois da venda | Item histórico da própria venda; recalcula custo total, margens, demonstrativo, indicadores, consulta local e CSV | Revisão, operação identificada e histórico de antes/depois; não altera cadastro atual, preço cobrado, quantidade, estoque ou pagamentos |
| Produto sem custo | Item histórico, incluindo devoluções do recorte | Cadastro atual preenchido não conserta o passado silenciosamente; resultados dependentes ficam parciais |
| Venda tardia | Dia de ocorrência confirmado, distinto do instante de gravação | Histórico, filtros, resumo diário, finanças, memória, relatórios de produto e perguntas usam o mesmo dia; horário desconhecido não é inventado |
| Devolução | Própria data de devolução e custos históricos atualizados | Não cria uma segunda devolução de estoque; os períodos de venda e devolução continuam separados |
| Parcelas no Crédito | Plano guardado na própria venda, com identificadores estáveis | Datas previstas não confirmam repasse da operadora e não viram recebimentos de Fiado |
| Investimento | Lançamento do tipo investimento em Custos | ROI não cria despesa/pagamento adicional nem usa um valor investido avulso |
| Exportações | Dados atuais dos motores e das vendas | CSV de vendas marca custo pendente, deixa custo/lucro desconhecidos em branco e inclui dia canônico, revisão e parcelas previstas |
| Privacidade | Sessão financeira já existente | Indicadores e ROI ocultam valores ao sair/voltar; percentual, seleção e confirmação em edição são preservados |

O custo informado posteriormente revisa a análise daquele período. A venda original permanece identificada e as revisões de custo ficam consultáveis; o app não congela uma conclusão antiga como se os dados ainda fossem os mesmos.

O ciclo chamado GOAL pelo produtor usa a mesma base: objetivo, leitura, conferência, orientação e revisão por alterações/reabertura/rotinas existentes. Não foi criado um segundo financeiro, estoque ou CRM. A área fechada não agrega os novos KPIs; as áreas abertas reagem aos eventos de gravação e retomada, preservando formulários em edição. Não há novo polling permanente ou promessa de execução24horas no Android.

## Métricas e material de referência

O material identificado é a transcrição em public/knowledge/crm-pdv-profissional.md do AGRO_Gestao_Diretrizes_Profissionais_CRM_PDV_Codex.docx, v1.0/22out2026, SHA2564f0072c8acc752ee2300e15ccee186bcc1558ef761bf760d41eddff69ecd65ec. A matriz CRM-PDV-ADERENCIA-0.12.140.md separa a implementação desta rodada do manual completo. Não se anuncia CRM integral, coortes ou RFM implementados.

As margens usam as somas do demonstrativo, e não médias simples de percentuais. Ticket exclui vendas integralmente devolvidas em numerador e denominador. Linhas por venda não soma quilos com pacotes. CRM usa IDs de compradores identificados; compras anônimas continuam nas vendas sem virar pessoas fictícias. Recompra no período não é retenção de coorte.

ROI exige escolher investimento registrado, usar o resultado gerencial do recorte e confirmar a parcela desse resultado que o produtor atribui ao investimento. A fórmula é (resultado atribuído − investimento) ÷ investimento ×100. A atribuição é informada pelo produtor; não comprova causalidade ou retorno bancário. Custos históricos/dias pendentes e inconsistências bloqueiam a avaliação. Payback é estimativa de ritmo médio de um recorte encerrado, quando o resultado atribuído é positivo. Taxas, tributos, fixos e retiradas seguem a configuração e os registros de Finanças.

## Verificação e entrega

Fonte final:1159testes unitários aprovados, incluindo26novos casos sobre custo histórico, idempotência, retorno, centavos, parcelas, CRM, ROI, datas e CSV. A jornada nova passou em320×568 com texto ampliado/lite/efeitos reduzidos, incluindo confirmação pendente e privacidade. Matriz completa8cenários aprovada,320/360/393/412nos dois temas, com107verificações nos320reduzidos e108nos demais; assets eAPK idênticos do início ao fim. As4jornadas físicas140 ainda não foram executadas.

APK181/0.12.140:9337561bytes, SHA256233ebd3b6d2eef05410b3a570ca93f10495b04c5c994123902409e0e477fc1dd. Pacote br.com.territorio.gestao2, nome AGRO Gestão Codex, certificado original f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68.57assets+2pontes, CRC/assinaturasv2v3/ZIP e ELF16KB estruturais conferidos. Verificação estrutural não é medição de runtime16KB.

Auxiliar próprio br.com.territorio.gestao2.sales140, sem permissão de internet, com dados fictícios e mocks de GPS/compartilhamento/navegação externos. Não houve leitura/reset/restauração do BDprincipal, nova migração133, escrita no Claude ou publicação de backend. Não há medição de FPS, bateria ou aparelho básico físico. APK, chaves, bancos e capturas privadas permanecem fora do Git.

Provas atuais: qa/sales140-unit.txt, sales140-package-review.json, sales140-final-review.json e sales140-copies.json. sales140-delivery.json só será emitido após instalação. O status técnico só será promovido para instalado após as verificações físicas e install-r de cada aparelho. Não repetir build ou verificador depois da entrega por documentação.
