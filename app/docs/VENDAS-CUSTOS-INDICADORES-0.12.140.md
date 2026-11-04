# Vendas, custos e indicadores integrados — Codex 0.12.140

Entrega concluída em 04/11/2026 sobre a base própria 139, commit c0c6898e9dd37f486e117cbfa39ca334a47426a1. O mesmo APK está instalado no Reno e no PKJ e disponível nas duas pastas habituais. Identidade, assinatura e datas originais de instalação foram preservadas. Não houve novo port do Claude.

## Onde encontrar

- **Gestão → Vendas:** consultar os registros por dia, abrir uma venda e tocar no produto para informar ou corrigir seu custo por unidade. O Arquivo reúne os meses anteriores sem mover, duplicar ou apagar as vendas. Registros antigos com data inválida ficam separados, sem receber a data de hoje.
- **Custos pendentes:** o cadastro orienta o preenchimento antes dos campos de preço e custo. Custo vazio permanece desconhecido; zero só é conhecido quando informado explicitamente. No fim dos relatórios, nomes e apresentações dos produtos vendidos sem custo levam às vendas que precisam ser completadas.
- **Crédito:** o teclado permite informar de 1 a 60 parcelas. As datas mensais podem ser ajustadas no calendário; a soma permanece exata em centavos. Alterar o valor da venda exige conferir o plano novamente. Vendas antigas conservam a ausência de datas não informadas.
- **Repor estoque:** o produto ativo aparece com o teclado completo. Ver lista permite escolher os demais, quatro por página. Repor e Agora não mantêm a sequência; uma confirmação de gravação pendente não aplica a quantidade duas vezes.
- **Gestão → Indicadores:** margem bruta, contribuição e ticket têm explicação, fórmula e ação. Grupos expansíveis dão acesso a resultado, equilíbrio, cesta, CRM, ROI, payback e às áreas de Produtos, Estoque e Clientes.

## Contrato de integração

| Informação | Fonte e efeito | Proteção |
|---|---|---|
| Custo após a venda | Item histórico da própria venda; atualiza margens, demonstrativo, indicadores, consulta local e CSV | Revisão identificada, antes/depois e confirmação durável; preço cobrado, quantidade, estoque, pagamentos e cadastro atual preservados |
| Produto sem custo | Itens históricos, inclusive das devoluções do recorte | Preencher o cadastro atual não altera o passado silenciosamente; resultados dependentes permanecem parciais |
| Venda lançada posteriormente | Dia de ocorrência confirmado, separado do instante de gravação | Histórico, filtros, resumo diário, finanças, memória, relatórios de produtos e perguntas compartilham o mesmo dia; horário desconhecido não é presumido |
| Devolução | Sua própria data e o custo histórico atualizado | Receita e custo são estornados no período correspondente, sem uma segunda devolução de estoque |
| Parcelas no Crédito | Plano guardado na própria venda, com identificadores estáveis | Datas previstas não comprovam repasse da operadora e não se transformam em recebimentos de Fiado |
| Investimento | Lançamento do tipo investimento em Custos | A avaliação de ROI não cria uma despesa ou um pagamento adicional |
| CSVs | Dados atuais dos motores e das vendas | Custo pendente marcado; custo e lucro desconhecidos ficam em branco. Inclui dia canônico, revisão e parcelas previstas |
| Privacidade | Sessão financeira já existente | Valores e percentuais são ocultados no prazo do olho e ao sair/voltar; o formulário de ROI conserva os campos em edição |

Informar um custo posteriormente revisa a análise daquele período. A venda conserva sua identidade e suas revisões ficam disponíveis para consulta. O ciclo chamado GOAL pelo produtor usa essa mesma base: objetivo, leitura, conferência, orientação e revisão por alterações, reabertura e rotinas existentes. Não foi criado outro financeiro, estoque ou CRM.

As áreas fechadas não agregam os novos KPIs. As áreas abertas reagem aos eventos de gravação e retomada; listas são carregadas sob demanda, com 40 vendas por dia a cada expansão. Não há novo polling permanente ou promessa de execução contínua com as limitações do Android.

## Métricas e referência profissional

A transcrição identificada está em public/knowledge/crm-pdv-profissional.md. Ela registra como origem o documento AGRO_Gestao_Diretrizes_Profissionais_CRM_PDV_Codex.docx, versão 1.0 de 22/10/2026, SHA-256 4f0072c8acc752ee2300e15ccee186bcc1558ef761bf760d41eddff69ecd65ec. A matriz CRM-PDV-ADERENCIA-0.12.140.md separa o escopo desta entrega do manual completo. CRM integral, coortes e RFM não são apresentados como implementados.

As margens usam as somas do demonstrativo. O ticket exclui vendas integralmente devolvidas tanto do numerador quanto do denominador. Linhas por venda permite analisar a cesta sem somar quilos com pacotes. O CRM usa IDs de compradores identificados; compras anônimas continuam nas vendas sem criar pessoas fictícias. Recompra no período é uma medida distinta de retenção por coorte.

O ROI exige escolher um investimento registrado, usar o resultado gerencial do recorte e confirmar a parcela desse resultado que o produtor atribui ao investimento. A fórmula é (resultado atribuído − investimento) ÷ investimento × 100. A atribuição depende do produtor e não comprova causalidade ou retorno bancário. Custos históricos ou dias pendentes e inconsistências dos registros bloqueiam a avaliação. O payback é uma estimativa pelo ritmo médio de um recorte encerrado, quando o resultado atribuído é positivo. Taxas, tributos, fixos e retiradas seguem a configuração e os registros de Finanças.

## Verificação e instalação

Passaram 1.159 testes unitários, incluindo 26 casos novos; oito cenários completos de navegador nas larguras de 320, 360, 393 e 412 px, nos dois temas; e quatro jornadas físicas, com 108 verificações por aparelho e tema. Em 320 px, o navegador incluiu texto ampliado, modo leve, efeitos reduzidos e altura de 568 px. Os arquivos compilados e o APK mantiveram os mesmos hashes durante a matriz.

A primeira rodada clara do Reno encontrou o ROI oculto após o prazo de 30 segundos do olho. O diagnóstico sintético confirmou resultado de 2.000 centavos, investimento de 1.000 centavos e ROI de 100% ao revelar os valores. A preparação do teste passou a abrir uma nova consulta pelo olho antes das asserções financeiras. Timer e asserções foram preservados; a fonte de produção e o APK permaneceram iguais. A repetição completa do Reno passou nos dois temas. Prova: qa/sales140-native-privacy-diagnostic.json.

APK 0.12.140, código 181, com 9.337.561 bytes. SHA-256: 233ebd3b6d2eef05410b3a570ca93f10495b04c5c994123902409e0e477fc1dd. Pacote br.com.territorio.gestao2 e nome AGRO Gestão Codex. Certificado original: f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68. Foram conferidos 57 assets, duas pontes, CRC, assinaturas v2/v3 e alinhamento ZIP/ELF de 16 KB. A verificação estrutural não é uma medição de runtime com páginas de 16 KB.

Instalação no PKJ em 04/11/2026 às 11:53:17; primeira instalação de 28/10/2026 às 08:59:26 preservada. No Reno, em 04/11/2026 às 12:07:57; primeira instalação de 21/10/2026 às 18:58:01 preservada. São os horários registrados nos aparelhos. Hash, processos e primeiro plano foram conferidos; não houve nova confirmação visual humana da interface principal.

O auxiliar br.com.territorio.gestao2.sales140 usou somente dados fictícios, sem permissão de internet e com simulações de GPS, compartilhamento e navegação externos. Auxiliares, capturas temporárias dos aparelhos e portas próprias 9407/9408 foram removidos; KeepAwake foi liberado. O auxiliar histórico Reno.motionfixture foi preservado. A QA não leu, zerou ou restaurou o banco principal, não repetiu a migração 133 e não publicou backend. Não foram medidos FPS, bateria ou funcionamento em um aparelho básico físico.

Provas: qa/sales140-unit.txt, sales140-package-review.json, sales140-final-review.json, sales140-copies.json e sales140-delivery.json. O status final é installed-and-validated. Não repetir build, verificador ou instalação por documentação.

## Regras permanentes

As regras de espaçamento e revisão em português estão em PADROES-DE-INTERACAO-E-TEXTOS.md e AGENTS.md. O verificador compartilhado de espaçamento passou em oito cenários adicionais. A revisão editorial contextual é obrigatória em cada alteração. Esses registros e testes preservam a fonte de produção e a versão do APK entregue.
