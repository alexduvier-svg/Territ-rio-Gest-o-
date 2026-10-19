# Agente operacional 0.12.16 — revisão e limites

Implementação local do material v1.1 recebido em 19/10/2026. Auditoria anterior: AGENTE-AUDITORIA-0.12.16.md. Mantém o ERP, armazenamento privado alternado, fila de gravação, backup e confirmação de venda existentes. Não criou outra base de negócio, LLM, serviço pago ou envio de áudio. Textos de referência não executam instruções.

## Comportamento entregue

Gestão → cérebro incorpora o agente no lugar das prioridades anteriores, preservando o resumo financeiro e o olho. Até três prioridades recolhidas, período/amostra/origem, evidências por ID, fatos separados de hipóteses e próximo teste. Perguntas locais por texto ou pelo mesmo microfone. Clientes recebe entrada compacta para recompra; Eventos recebe análise junto ao detalhe. Não há nova aba obrigatória. O estoque mantém seus sinais e histórico existentes.

Voz de Produtos continua voltada a vendas. Um item seguro usa o caminho existente. Vários itens recebem prévia, preservando ambiguidades e quantidades das outras linhas. A mesma sessão final tem um único encaminhador; parciais e repetição do callback não criam outra proposta. O carrinho e o toque habitual em Finalizar Venda registram a operação. Produto ausente oferece cadastro existente. Apelidos opcionais exigem confirmação local e podem ser removidos.

Propostas guardam contexto, escopo, revisão dos registros, validade de 15 minutos, estado, auditoria e recibo. Antes de preparar e confirmar, revalidam contexto/revisão; preço, unidade, quantidade e estoque também passam pelo serviço existente. Chave de operação persistida na venda impede repetição após reinício, duplo toque ou retry; payload diferente com a mesma chave é recusado. Não há reserva inventada. Uma cópia do modelo reúne venda, estoque, movimentos e recibo no mesmo snapshot. A fila Android confirma gravação durável antes da tela de sucesso. Se houver falha, a transação íntegra permanece pendente de gravação/retry; o app não anuncia sucesso nem baixa de novo. Não substituímos isso por uma transação SQL ou garantimos recuperação de dados apagados sem backup.

Sobra exige carga registrada e contagem conferida por apresentação, reconciliada com vendas e perdas. Reposição já embutida na carga não é somada novamente. Registros posteriores invalidam a conferência para essa análise. Exemplo de fixture: 20 levados, 8 vendidos e 12 conferidos = 60%. Uma feira não prova tendência. Repetição exige ao menos três eventos do mesmo grupo e duração semelhante (80% a 125% da referência); critérios de quantidade mínima e sobra são configuráveis. Sem grupo/duração/conferência, não afirmar recorrência ou causa climática.

Recompra exige consentimento, estoque, quatro dias distintos de compra, três intervalos positivos, mediana e tempo decorrido de pelo menos 1,25 vez essa mediana. Compras do mesmo dia são agrupadas. Preferências globais e exclusão por produto; convite editável com destinatário revisado. Só um toque explícito abre composição no WhatsApp; não há confirmação de envio/entrega. Nenhuma mensagem real foi enviada nos testes.

Finanças consulta o demonstrativo vigente, centavos, descontos, datas de devolução e custo histórico. Sem custo conhecido, não inventa margem; sem vendas válidas, não inventa ticket. Taxas configuradas e gastos ausentes são identificados. Não calcula LTV, conversão sem denominador ou lucro líquido garantido. Ausência de venda se refere ao recorte observado (30 dias por padrão, configurável), sem presumir histórico completo ou demanda perdida.

Índice ativo versionado/hash, aliases por contexto, conhecimento estruturado versionado e manual offline. Catálogo geral continua sugestão (2.480 referências), sem criar estoque. Não reclassificamos dados reais como exemplos. Preferências, auditoria limitada a 200 registros e até 50 propostas acompanham modelo/backup; áudio, transcrição bruta e telefone não entram na auditoria. Feedback não autotuna limites financeiros.

Consultas analíticas usam Web Worker, cache por contexto/revisão/período/preferências, deduplicação de análise em andamento e expiração em uma hora. Recalculam após alterações, retomada e abertura relevante; mudar contexto invalida propostas. Erro/timeout não executa operações e texto/manual continuam disponíveis. O recálculo preserva a pergunta digitada.

## Android e desempenho

WorkManager 2.11.2: tarefa única diária aproximada, bateria não baixa, backoff e tentativas limitadas. O worker grava apenas um sinal privado de revisão pendente. Não lê outra cópia do ERP, abre WebView ou microfone, envia mensagem ou calcula tudo com o app fechado. O cálculo JS ocorre por eventos/retomada; não prometer horário exato ou execução após Forçar parada. Sem notificação financeira automática nova.

Fonte primária do agendamento: [Android WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) e [versões oficiais](https://developer.android.com/jetpack/androidx/releases/work).

Benchmark isolado no computador i5-12400F/Node 24, fixture de 3.000 produtos e 10.000 vendas: parser frio 124 ms; parser aquecido mediana 0,85 ms, p95 1,26 ms; regras mediana 148 ms, máximo 171 ms; índice mediana 1,25 ms; revisão mediana 8,37 ms. Valores arredondados da execução em qa/agent016-benchmark.json. Meta de um segundo atendida nesse ambiente; não comprovada em celular Android básico. Não são latência do microfone, abertura do APK, FPS ou consumo de bateria medidos.

## Validação

275 testes de domínio passaram: base anterior e 41 novos cenários, incluindo multiitem, numeral composto, decimal, unidade, peso de embalagem, alias, escopo/produtor, estoque/mínimo, conferência/perdas, recorrência, mediana/consentimento, preferência, revisão/expiração, cancelamento/replay e recibo após reinício/estorno.

QA de navegador com dados fictícios: 4 conjuntos de fluxos do agente e 4 superfícies, mais 8 conjuntos da voz/regressão em 4 superfícies; 1 fluxo/superfície adicional de falha durável e retry. Claro/escuro, larguras 320/360/393/412 CSS px, altura até 620 px e texto ampliado. Zero erros. Os controles ficaram dentro da janela, com margens laterais e rolagem interna; nenhum botão cortado nos cenários conferidos. A quantidade de polegadas sozinha não determina o viewport.

Captura nativa foi simulada por RPC na QA de navegador. Não medimos precisão acústica, ambiente de feira, ruído, sotaque ou FPS em aparelho básico nesta entrega. O produtor manteve a decisão de usar voz offline aceitando a limitação; não prometemos precisão equivalente ao GPT Voice. Não criamos vendas nem exportamos registros reais do celular. Não executamos um dia inteiro do WorkManager ou teste de Forçar parada; a tarefa foi compilada e sua inclusão no APK conferida. Qualidade real da escuta precisa de teste de campo pelo produtor.

## Arquivos e entrega

Lista em ALTERACOES-0.12.16.md. APK/pacote/certificado/hash e confirmação de instalação estão registrados abaixo. Preservar a linha AGRO Gestão 2 e seu certificado; não sobrescrever main, que é outro aplicativo.

## Entrega confirmada — 19/10/2026

AGRO Gestão 2 0.12.16/code56, pacote br.com.territorio.gestao2. APK original `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.16.apk`, 56,345,020 bytes; SHA256 `45460979ad56ede83dc8ea6b1fb80788ee1ae8a91b963f37e5ba97e69751d51b`. Cópia conferida byte a byte por hash com o APK assinado do workspace.

Assinatura v2/v3 com certificado original SHA256 `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`; release sem debug, 35 assets iguais ao dist, quatro bibliotecas ARM32/64, ZIP e ELF64 alinhados a 16KB. Modelo offline original preservado; WorkManager e worker nativo presentes no APK.

`adb install -r` por Wi-Fi retornou Success. Android confirmou versionName0.12.16/code56 e lastUpdateTime19/10/2026 15:32:09, com firstInstallTime14/10/2026 18:17:06 preservado. Processo do app aberto, PID29365; nenhum teste de transação ou exportação de base real. Publicação somente no ramo codex/atualizacao-agro-gestao2; main independente permanece preservado.
