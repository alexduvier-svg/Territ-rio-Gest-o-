# Gestão, Contas e Perfil — Codex 0.12.136

Pedido implementado sobre Codex135 (`2d7d69e`), com integração das novidades Claude138–140, até `f03317b`. O Codex mantém pacote, assinatura, dados, localização135 e correções próprias de movimento e finanças. O checkout e o remoto do Claude não foram alterados.

## Alterações

- Perfil e negócio usa expansão curta, dirigida ao botão, com a superfície inteira e continuidade ao interromper a mola. O modo leve reduz a amplitude; movimento reduzido continua respeitado.
- Os pontinhos eram a privacidade financeira. Cada relatório oferece aviso e controle Mostrar/Ocultar valores. Guias de leitura ficam fechadas, dando acesso rápido aos números.
- Arquivos e planilhas fica em seção própria após Produtos e clientes. Contém CSV de resumo do período e o pacote completo com CSVs por área. O backup completo continua sendo o formato de restauração.
- Contas exporta os sete assuntos, de Produção rural a Crédito e investimento, com entradas, extras, valores efetivos, resultados, campos ausentes, fórmulas/orientações disponíveis e proveniência. A exportação não cria registros operacionais.
- Caixa registrado exclui fixos e retirada apenas previstos. Uma reserva de planejamento mostra o saldo após essas previsões separadamente. O demonstrativo mantém seus custos por competência. Caixa calculado não é extrato bancário e não inclui saldo inicial ausente.
- Pareto ganha espaçamento; Datas e horários tem estado vazio próprio e contagem por hora registrada. Clientes distingue compras de pessoas únicas. Fornecedores informa que seu histórico é global, não movimenta estoque/caixa automaticamente e não deve duplicar o custo histórico dos produtos em custos extras.

## Novidades do Claude integradas

`d293206`/138 trouxe a organização, explicação da privacidade e CSVs; as funções correspondentes do Codex foram preservadas com suas melhorias de integridade, extras e resumo geral. O movimento curto do Perfil foi mantido, enquanto as demais aberturas passam a aceitar a escala mínima do Claude para fontes pequenas.

`e99ca3f`/139 acrescenta ABC pelo lucro bruto conhecido, cobertura histórica do estoque e comparação mensal. Os indicadores usam o motor financeiro canônico, não estimam custo ausente, não misturam unidades em efeitos de preço/quantidade e não tratam cobertura histórica como previsão de demanda. Devoluções, datas futuras e origem são consideradas na janela de estoque. Comparações mensais avisam sobre duração diferente e mês incompleto. Registro em `docs/motor/registry.json`.

`f03317b`/140 acrescenta Zerar dados com cópias locais. A integração Codex confere conteúdo exato, serializa cópias, protege a primeira e as três recentes, bloqueia índice ilegível e falhas de gravação, aguarda confirmação durável e recupera o modelo anterior em falhas. ZERAR e RESTAURAR precisam ser digitados. Restaurar também protege os registros atuais antes da troca. O recurso fica bloqueado no Modo Teste. Desinstalar ou perder o aparelho pode perder essas cópias; o backup externo continua necessário.

## Validação e entrega

Estado em29/10/2026: **instalado e validado nos dois aparelhos**. Passaram832 testes unitários, oito jornadas compiladas em320/360/393/412px nos dois temas (320 com texto ampliado, modo leve e movimento reduzido) e quatro jornadas físicas completas, incluindo cópia/restauração apenas de dados fictícios. Provas em `qa/manage136-final-review.json` e `qa/manage136-delivery.json`.

No Reno, a primeira rodada escura falhou numa asserção temporal de navegação herdada; a repetição completa do mesmo tema e do mesmo APK passou sem alteração da fonte ou redução da asserção. No PKJ, o ColorOS apresentou dois PIDs do auxiliar: o runner passou a selecionar o PID que possui o socket WebView. Os testes históricos foram preservados.

APK final: `AGRO-Gestao-Codex-0.12.136.apk`, versão136/código177,9.296.601bytes. SHA-256 `7c5a9212cf982980e804d4bb9dc746ea2ed82f135bf35710604c8a1982480ab4`. Pacote `br.com.territorio.gestao2`, certificado original,57assets compilados +2pontes Cordova, CRC e assinaturas v2/v3 conferidos. Alinhamento ZIP/ELF16KB é verificação estrutural, sem teste de runtime16KB.

Nenhum banco, GPS ou aplicativo pessoal é usado nos testes. Zerar/restaurar é exercitado exclusivamente no pacote auxiliar sintético. Não houve publicação de backend, transferência de dados Claude ou envio automático de arquivo a terceiros. Não são alegadas medições de FPS, bateria ou hardware de celular básico.

| Aparelho | Atualização136 | Primeira instalação preservada |
|---|---|---|
| PKJ110 | 29/10/2026 17:06:27 | 28/10/2026 08:59:26 |
| Reno CPH2737 | 29/10/2026 17:07:16 | 21/10/2026 18:58:01 |

Instalação com `-r`; hash idêntico no workspace, nas pastas New project/Território Gestão e nos dois aparelhos. Processos vivos e primeiro plano confirmados após abertura; sem nova confirmação visual humana dos aplicativos principais. Auxiliares `manage136`, capturas temporárias e redirecionamentos9397/9398 removidos, mantendo o auxiliar histórico do Reno intacto. KeepAwake liberado. Metadata e recibo em `installed-and-validated`; não repetir build, verificador ou instalação para documentação.

Os números continuam dependentes dos registros: faltas de custos e de identificação limitam a leitura; fixos configurados são rateios de planejamento e não conciliam automaticamente contas pagas. O resumo CSV é analítico, e o pacote de CSVs não substitui o backup completo de restauração.
