# Adaptação, memória e ação — auditoria da integração51

Requisito humano de21/10/2026: incorporar o DOCX fornecido no sistema, na memória e no motor. SHA256 do original:718ae156123cb0f76a92df58e841d20b1492dd9506c45d697c6d704208373168. Texto completo preservado em references/Adaptacao_Memoria_Acao_2026-10-21.txt e referência offline em knowledge/adaptacao-memoria-acao.md. Documento é requisito de produto; suas metas não são medições nem aprovação de loja.

## Arquitetura e decisões de consolidação

- Base: Capacitor8/WebView, JavaScript/DOM, modelo ERP local, armazenamento nativo de dois slots com checksum/leitura de confirmação e backups diários. Sem migração de banco ou descarte de histórico.
- Referência visual: APKAGRO3/0.12.50/376a8fe, recompilação inicial de39arquivos idênticos ao APK; atualizações posteriores52,55,59,60,62 até cffe32b consultadas no Git. Preservados pacote gestao2/certificado, clima27 e consentimento, proteção da grade30, pulso único31 e portão Carrinho após Concluir. Nenhum push em main ou no ramo Claude.
- Hardware leve duplicado em interface.js/motion/index.js substituído por resources/policy.js. O classificador de quadros do Claude não é uma segunda fonte persistente: eventos de movimento alimentam a mesma política com prazo do display nativo quando disponível. Só amostra movimento real iniciado por interação recente; não executa teste de carga ou loop em repouso e ignora sessões de diagnóstico. Não usa marca/processador como ranking.
- Layout pela janela visual, altura/teclado e preferências existentes, independente da capacidade. Três colunas aprovadas pelo produtor prevalecem sobre a sugestão de uma coluna do DOCX em320dp. Tema/texto ampliado/movimento reduzido continuam respeitados.
- Automático/Leve em Aparência, preferência persistente. Motivo/perfil e amostras ficam em diagnóstico local limitado, sem CPF, nomes, fotos ou envio remoto. Três excessos comparáveis/30s simplificam efeitos; retorno apenas após120s em primeiro plano estável. Sinais nativos de lowRAM/memoryClass/economia/temperatura consultados ao abrir/retomar, sem polling.
- Análise e exportação usam uma fila opcional limitada, uma tarefa pesada ativa. Trabalho enfileirado obsoleto é cancelado ao sair da tela/app; comandos financeiros continuam fora dessa fila. Agente não agenda recálculo de fundo na tela de quantidade. Cache de análises limitado a2/4resultados.
- Produtos/estoque/clientes têm apresentação paginada36/60itens, carregando mais sob demanda, sem cortar os registros. Famílias mantêm agrupamento e expansão. Isto limita DOM; não é migração para consultas SQL nem virtualização do banco. A massa completa ainda reside no modelo atual.
- Orçamento de imagens8/16MiB é contrato da política. Não foi instalado cache de bitmaps novo nem certificado limite de heap nativo. Os processadores de imagem existentes foram preservados; este orçamento ainda exige calibração física.

## Recuperação e integridade

Diário incremental pequeno (máximo128KiB), isolado dos dados autoritativos, com debounce300ms. Nativo usa mais dois slots com checksum/seq/leitura de confirmação na fila existente. Navegador usa armazenamento local com leitura de confirmação. Falha não recebe confirmação positiva. Carrinho conserva operationId e valores digitados; produto, cliente, perfil e carga direta conservam preenchimento sem confirmar automaticamente o cadastro. Fotos/arquivos não são copiados ao diário. Cancelar/concluir grava tombstone; não apaga vendas.

Antes de registrar venda, o diário precisa confirmar gravação. O domínio existente valida saldo, reutiliza operationId/fingerprint, grava o modelo e aguarda durable. Ao reiniciar, operação já registrada abre seu resultado; operação não registrada restaura intenção para conferência. Não recria venda automaticamente. Outra identidade não recebe rascunho de produtor anterior. Sem mudança de fórmulas, pagamentos, mensagens ou filas de relatórios.

Cadastro de produto aberto dentro da preparação de evento com callback não é recuperado como produto geral isolado, para não perder o destino da carga. Este contexto especial permanece como lacuna registrada; carga direta possui diário. Outros formulários não relacionados (documentos/finanças) não ganharam recuperação genérica nesta etapa. Não há promessa de recuperação de todos os pixels, campos de arquivo ou comandos externos.

## Evidências e limites

Resultados finais e quantidades estão em ENTREGA-0.12.51.md e qa/*051*.json. Todos os cenários financeiros usam massa sintética isolada e rede bloqueada/interceptada; nenhuma transação de teste foi criada no app principal. Falta de espaço injetada no adaptador e reinício/repetição antes/depois do commit conferem não duplicação. Não usar essas simulações como prova de durabilidade contra toda falha física.

Metas propostas: feedbackp95<=100ms, telap95<=500ms, iníciofrio<=3s, commitp95<=500ms, jank<=5%. NÃO medidas como conformidade nesta entrega. Tempos do cenário de massa em Chrome são descritores do ambiente de teste, sem equivalência ao Android econômico. Não foram medidos heap gerenciado/nativo/gráfico, bateria real, Doze/OEM, Perfetto/Macrobenchmark, TalkBack150/200%, segundo chipset, iOS ou runtime16KB. APK é inspecionado quanto a alinhamento16KB; isso não substitui teste de execução nesse ambiente. Voz permanece removida por instrução explícita, sem outro motor/serviço pago.

Referências oficiais consultadas: [classes de janela](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes), [isLowRamDevice](https://developer.android.com/reference/android/app/ActivityManager#isLowRamDevice()), [estado térmico](https://developer.android.com/reference/android/os/PowerManager#getCurrentThermalStatus()). Fundamentam os sinais e a separação de janela/capacidade, não as metas particulares do produto.

Reversão: publicar código de versão maior com o motor anterior preservando pacote/certificado e os registros, nunca desinstalar/limpar/downgrade. Diário separado pode ser ignorado por fonte anterior; dados de negócio continuam no adaptador autoritativo existente. Não apaga backups para reduzir consumo.


Atualização final62: bloco nativo de notificações de estoque importado de cffe32b, sem substituir os demais ciclos nativos. Canal normal estoque-v2 e canal de alta prioridade estoque-feira; canal antigo estoque removido pela migração da referência. Ajustes de notificação continuam com cada pessoa/Android. Não se afirma que o app garante acender a tela em todos os fabricantes. Metadados de regras atualizados para adaptação2/interface23. Calibração de rAF reconhece WebView60Hz sobre display120Hz sem confundir com lentidão; não aceita cadência uniforme30Hz como base saudável.
