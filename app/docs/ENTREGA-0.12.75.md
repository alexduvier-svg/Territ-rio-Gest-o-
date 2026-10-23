# Entrega — Estados e Conferência dos Eventos, 0.12.75/code115

Problema: o fechamento de feira oficial gravava fairClosedAt e o relatório, mas deixava status active. Isso permitia mostrar Finalizado em Eventos e Ativo em Produtos durante o horário ainda previsto. Além disso, Finalizar sem Conferir gravava um fechamento que bloqueava a retomada.

ERP.eventLifecycle diferencia término operacional, conferência pendente, encerramento confirmado e cancelamento. syncEvents corrige o estado legado para finished usando o registro de fechamento existente, sem criar vendas ou movimentos. Todas as feiras terminadas ficam em Histórico das Feiras e saem dos ativos e destinos de venda. O relógio de atualização também redesenha a página quando muda somente o evento.

Agendado usa verde. Conferência Pendente usa triângulo laranja de contorno junto do texto no card e no detalhe. Encerrada só após conferência confirmada. Ver Evento oferece Conferir Evento para pendências. Adiar conserva a carga livre reservada e permite retomar, inclusive adiamentos antigos com closedAt incorreto. Vendas e perdas novas só entram por confirmação canônica; os acertos já gravados permanecem idempotentes. Sem carga elegível, a confirmação encerra sem inventar quantidades. Cancelamento permanece separado.

Feira oficial também recebe status finished no fechamento. Um relatório adiado é preliminar e não é enviado como concluído antes da conferência; ao confirmar, o relatório atual substitui o mesmo registro da organização, após gravação durável. Nenhuma mudança no servidor. Memória45/documentooffline.

Validação:582 testes de unidade;8jornadas de navegador em claro/escuro,320ampliado/leve/reduzido,360/393/412;4jornadasCapacitor nos dois temas emReno14/PKJ110. Casos de oficial legado ativo+fechado, pendente automático, adiamento novo/antigo, cancelado, agendado, fechamento antes do horário final, histórico/reabertura e envio simulado uma vez por confirmação. Estoque/vendas/movimentos fictícios não mudaram ao corrigir o estado. SemERPprincipal, WhatsAppreal, agenda pessoal ou envio de relatório real; API simulada no fixture. SemFPS/GPU/bateria/básicofísico/TalkBack/runtime16KBmedidos.

APK9136050bytes, SHA256`7e2e39ef786cb5861987ce8a9ce50cbf9aa2d97fd8e039733042e69bdefccc60`, pacote`br.com.territorio.gestao2`, certificado original`f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`,v2/v3,48assets+2pontes idênticos a dist/fixture. ZIP/ELFLOAD alinhados16KB, sem microfone/GPS. Sem prova de execução emaparelho16KB.

Cópia conferida:`C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.75.apk`. Install-r:Reno14 2026-10-23 16:12:55 / PKJ110 2026-10-23 16:13:01,115/0.12.75/Statusok/firstInstallTimepreservados. Fixtures removidos. Não repetirbuild/testes/verificador/cópia/instalação75 por este registro. Clima27/servidor59/FirebaseSparkAppCheck/Calendar/ModoTeste/pacote/dadosreaispreservados. GitapenasAGRO2, Claudecffe32b/main956fddcinalterados apósfetchinicial/final. Semsubagentes/automação.

Implementação commit/push`ec00ab766add30f96eed10d153230954f71a8b85` confirmados no remotoAGRO2, worktree limpo antes do encerramento documental. Captura temporária agro-event075.png eforwards9341/9342 removidos dos dois aparelhos. Nenhuma pendência autorizada restante; não repetirAPK.
