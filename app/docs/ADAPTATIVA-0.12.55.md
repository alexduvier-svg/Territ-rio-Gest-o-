# Inteligência adaptativa — 0.12.55/code95

Implementação aditiva da diretriz de22/10, sobre os serviços existentes. Um APK; nenhum modelo generativo, microfone, SDK pago, banco paralelo, telemetria ou novo servidor.

## Política única de recursos

A interface inicia normalmente. Um evento explícito após sua instalação libera a leitura assíncrona de capacidades, depois de dois frames; não há benchmark ou download na abertura. O plugin AgroAgentScheduler existente consulta MemoryInfo/lowMemory, lowRam/memoryClass, espaço privado, energia/bateria, térmica API29+ e sinais auxiliares. Eventos de memória, energia, armazenamento e térmica atualizam a política; não existe loop de sondagem. UI_HIDDEN não é tratado como pressão de memória.

Essencial é o fallback para evidência desconhecida ou condição adversa. Equilibrado permite agregações locais controladas quando há sinais suficientes. Núcleos, RAM total, marca ou chip isolados não habilitam perfil. Não existe opção de forçar Avançado. Efeitos visuais e trabalho computacional são eixos separados: faltar detecção não remove o visual aprovado.

Hipóteses iniciais configuráveis em policy.js: espaço livre mínimo128MiB, restrição por bateria até20% sem carga, térmica severa3+, combinação de heap até128MiB com poucos núcleos ou lowRam do sistema; três atrasos comparáveis locais em30s reduzem efeitos. Recuperação por120s estáveis em primeiro plano, sem aproveitar tempo oculto. Esses valores não são garantias universais nem medição de bateria/FPS.

O arquivo pequeno agro-capability-v2.json fica em getNoBackupFilesDir, separado dos registros e do Auto Backup Android. Somente a preferência manual Automático/Essencial é comercialmente persistida; não se restaura o diagnóstico de um aparelho em outro. Reavaliar capacidade usa o mesmo controle/estilo da Aparência. Não pede permissões novas.

## Connect e execução opcional

DTOs por lista explícita de campos; nenhuma foto, telefone, endereço de pedido, documento importado ou cópia do banco completo. Índice/estoque não carregam histórico comercial. Preservam nomes, apresentações e fatos; não truncam resultados silenciosamente. Limites de linhas e tamanho serializado recusam análises grandes com orientação para relatórios por período, sem bloquear o ERP.

Uma fila serial de trabalho reconstruível, limitada, ordenada e cancelável. Navegação, venda, saída do app e pressão interrompem o Worker e liberam pendências. Timeout também termina o Worker. Uma consulta cancelada não reabre janela por cima da venda. Falta de Worker mantém consulta simples de estoque; não transfere agregação pesada para a thread da interface. Análises automáticas são adiadas em Essencial; consultas do produtor permanecem sob demanda.

## Action e Audit

Propostas declarativas com versão, origem, regras, contexto e chave de idempotência. Preparar carrinho não registra venda. Autorização final permanece no fluxo existente, com revalidação atual de preço/estoque, reservas, destinatário e evento. Sem envio automático de mensagens.

A auditoria privada na closure do ERP é chamada pelas funções oficiais: complete, move e refund. Não aceita sinal para desligar auditoria. Confere identidade/unidade, precisão de quantidades, saldo anterior/novo, centavos inteiros seguros, linhas/custos conhecidos, desconto e pagamentos. Cliente e movimentações são preparados antes da aplicação; resultado real é conferido antes de retornar ao commit durável existente, com restauração dos campos afetados se a conferência falhar.

domainAudit retém os últimos200 registros minimizados de pré/pós operação: ID, data, versão2, regra, resultado e motivo técnico. Fica no mesmo snapshot A/B e backup da operação. Sem nome, telefone, texto livre ou documento. Repetição idempotente não cria nova baixa nem trilha duplicada. Retorno exige apresentação/unidade verificável; inconsistência exige revisão, sem reparo automático.

Fiado conserva a receita/estoque na venda e caixa na baixa. Recebimento integral contém prova determinística própria, verifica saldo pós-aplicação e rejeita reutilização de ID em outra venda. Auditoria não significa proteção absoluta contra aparelho comprometido, nem altera fórmulas contábeis ou transforma sugestões em garantias.

## Operação e reversão

Servidor, clima27/WorkManager30min, fila de relatórios, pedidos, certificado, pacote e arquivos reais preservados. A revisão diária existente ganha StorageNotLow e atualização de restrições; continua apenas marcando revisão pendente, sem processar ERP em serviço permanente.

Para reversão, publicar correção de código maior com mesmo pacote/certificado e manter os campos novos compatíveis; nunca desinstalar/limpar o principal ou forçar downgrade. Não houve submissão à Play Store.

## Cobertura e limites

Resultados exatos e hashes em ENTREGA-0.12.55.md/APK-0.12.55.json. Testes usam dados fictícios, rede externa bloqueada e pacote Android separado; nenhum pedido ou venda real de teste. Dois aparelhos capazes não comprovam desempenho em aparelho básico. Não foram medidos FPS/GPU, consumo, p95/ANR/OOM comparativo, comportamento térmico/low-memory induzido no Android, outras marcas, TalkBack ou runtime16KB. A cobertura de pressão/falhas é determinística; alinhamento16KB do APK é verificação estática.
