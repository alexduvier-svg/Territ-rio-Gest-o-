# AGRO Gestão2 0.12.58/code98 — entrega concluída

## Comportamento implementado

Clientes separa duas ações: **Enviar Lista de Pedidos** (nomes, apresentações, valores e quantidades clicáveis; sem fotos obrigatórias) e **Enviar Portfólio** (marca, fotos e história; Fazer Pedido abre a mesma lista). Venda Registrada usa as mesmas duas ações. Primeiro envio publica pelo app após revisar nome e WhatsApp; cada envio tem apenas um URL. Compartilhamento é revisado e confirmado pelo usuário no WhatsApp; nenhum envio real foi feito nos testes.

Clientes prioriza **Clientes a $ Receber**, símbolo vermelho imediatamente antes de Receber, depois **Pedidos e Entregas**, as duas ações de envio, cadastro e opções secundárias recolhidas. Foram removidos atalhos repetidos da superfície principal; PDF, respostas anteriores, comunicação e oportunidades continuam acessíveis.

Pedidos reservam quantidade; preparo/pronto/saída não são vendas. Na entrega/retirada, o checkout existente registra pagamento, desconto e baixa uma vez. Retirada não exige rota. Pedidos conhecidos aparecem em faixa laranja e lembrete local; confirmação de pagamento de Fiado é manual, na data combinada e com método/data de recebimento. Dinheiro só entra no caixa após recebimento. Reabertura/backup mantêm descontos, pedidos e recebimentos.

Evento tem aviso revisado com opção da **mesma lista**, qualificada por evento. Só aceita produtos da carga registrada, no limite da carga restante, estoque geral e reservas atômicas. Sem carga, evento encerrado ou dado vencido, bloqueia novos pedidos; aviso sem lista continua disponível. Um pedido já conhecido pode ser finalizado depois do horário, atribuído à sua feira original.

## Separação, reposição e fechamento

Exemplo: dez pacotes no geral e cinco separados para feira deixam cinco livres em casa. Separação não cria entrada nem baixa o saldo físico. O canal de pedidos geral usa o saldo não alocado; o canal da feira usa sua carga. Reserva online é subtraída uma única vez.

Finalizar Feira mantém a conferência existente e acrescenta **Repus ou Vendi sem Registrar**. Em Acertos da Feira, escolher produto, quantidade reposta, origem (estoque de casa / entrada nova), quantidade vendida sem registro e pagamento. Produto já cadastrado mas ausente da carga também pode ser incluído. Estoque de casa só transfere alocação; entrada nova declarada gera movimento de entrada auditado. Venda faltante usa o preço cadastrado e a forma informada, flag unregistered e operação idempotente. Valida carga, unidade e reservas antes de gravar a cópia completa. Depois retorna à sobra atualizada, sem duplicar correções ao clicar Confere. Fiado e pagamentos divididos permanecem no carrinho com dados completos.

Histórico durável: eventLoads/items/restocks, event.fairActivities, vendas e movimentos do ERP. O relatório inclui as vendas faltantes uma vez nos totais e no resumo da conferência. Não há aprendizagem que invente reposição ou venda.

## Validação no computador

- 444 testes unitários do app; 31 do servidor, sem falhas.
- Quatro jornadas de navegador: claro/escuro,393px normal e320px com texto ampliado,modo leve/movimento reduzido. Pedido público real no Worker SQLite LOCAL, disponibilidade/primeiro envio sem fotos, dois links separados, etapas antes do pagamento, desconto/Fiado, baixa manual, retirada e fechamento10/5/5.
- 24 verificações SQLite de compatibilidade:13portfólio e11loja; versões antigas continuam podendo registrar antes do preparo.
- Corrigidos CORS de resposta DO imutável e a validação antiga de status apenas requested. Regressões incluídas.
- Teclado numérico comum ganhou espaço no formulário de acertos: concluir a quantidade antes de voltar às ações de registro. Margens/rolagem/material comuns, sem novo desenho.

## Validação nos aparelhos e distribuição

Quatro jornadas Capacitor passaram: Reno14/CPH2737 e PKJ110, cada um nos temas claro e escuro. Foram conferidos pedidos, fechamento da feira, Fiado, persistência e criação/remoção de notificações; sinais nativos de capacidade e armazenamento privado noBackup também verificados. A sincronização de notificações agora é serial, com prazo e ativação explícita de permissão. Cancelamento remove também avisos já entregues pelo Android, sem repetir ao reabrir.

APK final: **5.186.039 bytes**, SHA256 `77888d228e4907caaeea7f1dea11f32c53a7b44f8a0111cb09ffb1749bbc3f09`. Pacote `br.com.territorio.gestao2`, versão98/0.12.58, certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3, alinhamento16KB e41assets idênticos ao dist e fixture final. Sem GPS, microfone ou bibliotecas de voz.

Cópia original conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.58.apk`. Instalado com `adb install -r` em22/10/2026: Reno às13:05:55 e PKJ às13:06:00. Ambos confirmaram98/0.12.58 e abertura Statusok; firstInstallTime preservados, respectivamente21/10/2026 às18:58:01 e14/10/2026 às18:17:06. Fixtures removidos. Nenhum banco principal lido/exportado, nenhuma limpeza ou transação real de teste.

Servidor publicado na versão `e3253369-6038-44d4-813a-aaf7c6ef0c40`, preservando os mesmos bindings e o motor de clima27. Saúde de pedidos HTTP200 com CORS Android e clima cacheOnly HTTP200/MET90pontos conferidos após publicação, sem criar pedidos reais. Git consultado no início e antes da publicação: Claude `cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b` e main `956fddceec2b994e32c154c5197424a4f56df7f2` preservados. Publicação Git somente no ramo `codex/atualizacao-agro-gestao2`; commit/push `bfbdd36e5e940d9ca5e5be2a491e181bb1366d71` confirmados no remoto. Encerramento documental posterior não altera o APK.

Evidências: `qa/unit-orders058.txt`, `qa/unit-orders058-server.txt`, `qa/orders058-review.json`, quatro `qa/orders058-native-*.json`, testes SQLite e `qa/orders058-live.json`. Metadata de assinatura/cópia/instalação permanece local em `native-apk-validation-0.12.58.json`. Não repetir build, verificador, cópia, instalação ou deploy por este registro.

## Limites

Novo pedido online precisa sincronizar para chegar ao app; o acompanhamento de pedidos já conhecidos usa notificações locais. Não há promessa de chegada instantânea com app fechado. Lembretes dependem de permissão, Android/OEM e agendamento aproximado; não são um serviço permanente nem cobrança automática. Testes usam registros fictícios isolados, sem ler o banco principal ou criar transações reais. FPS/GPU/bateria, aparelho básico físico, TalkBack e runtime16KB não medidos nesta entrega; alinhamento de APK é verificação separada de runtime. Não houve submissão à Play Store.
