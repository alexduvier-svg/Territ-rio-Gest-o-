# Entrega — AGRO Gestão 2 0.12.62/code102

Eventos ficaram mais simples dentro do material existente. Ver Evento e Vender no Evento têm ações vermelhas e status com ponto/rótulo legível. Vender no Evento só retoma a preparação enquanto a carga ainda não foi salva; não inicia uma venda sem carga. Ao salvar, o atalho desaparece e a seção Estoque do Evento mostra os produtos separados e seus saldos. Carga inicial e preparação retomada usam o mesmo fluxo, sem duplicar estoque físico. Clima e preparação persistente foram mantidos.

Avisar Clientes Sobre o Evento tem mensagem editável e opção de incluir a lista EM TEXTO dos produtos disponíveis da carga. Não depende de publicar loja, fotos ou número do produtor. Revalida estoque físico/carga/vendas/perdas/reservas locais e online conhecidas antes de compartilhar. A lista não reserva nem registra pedido sozinha; o cliente responde pelo WhatsApp e o produtor confirma. Texto longo demais oferece convite sem lista e seleção pela Lista em Texto, sem truncar. Nenhuma mensagem real foi enviada no teste.

Evento passado tem olho para mostrar/ocultar valores, sem revelar valores involuntariamente no retorno. Ações/ícone de custo alinhados ao material comum; botão + da carga no controle redondo comum. Ajustes não repete Voltar abaixo da logo e versão.

Cancelar Evento está no detalhe, com confirmação. Sem vendas/pedidos pendentes, mantém o evento no histórico como Cancelado, preserva carga/custos/estoque e libera a alocação para outras vendas. Com vendas, orienta finalizar para fazer a conferência; com pedidos de retirada pendentes, exige resolvê-los. Não apaga registros financeiros, não desfaz vendas nem cancela pedidos silenciosamente. Se foi exportado para agenda externa, a confirmação explica que o compromisso deve ser removido nessa agenda.

## Agenda e opções gratuitas

Lembrete na Agenda → Escolher Agenda solicita a permissão oficial READ_CALENDAR/WRITE_CALENDAR somente após o toque. O produtor escolhe e confirma uma agenda já configurada no Android. O evento e um lembrete de1440min (1dia antes) são gravados juntos pelo Calendar Provider; repetir na mesma agenda atualiza o evento sem duplicar. Chave privada de associação por produtor/evento, sem e-mail/conta no ERP. Consulta apenas metadados das agendas aptas a gravar lembretes e, para atualizar, eventos exportados pelo próprio pacote. Não consulta compromissos pessoais. Sem polling, serviço novo ou SDK Google; funciona também com agenda local/OEM sem Google. A sincronização de uma agenda Google é feita pelo Android quando disponível. Som/notificação/sync dependem da agenda, permissões e configurações do aparelho. Salvar com menos de24h de antecedência não recupera o horário do aviso que já passou. Alterações futuras no app exigem salvar novamente na mesma agenda; não há sincronização automática bidirecional.

Recusa/ausência de agenda/erro têm alternativa Baixar Calendário (.ics) com VALARM de1dia. A importação no Google Agenda pela web é oficialmente oferecida no computador; não se promete importação automática no Chrome Android nem que toda agenda respeite o VALARM. Ao importar, conferir o aviso na agenda escolhida.

Base técnica: [Calendar Provider Android](https://developer.android.com/identity/providers/calendar-provider) permite agendas/eventos/lembretes com autorização; [lembretes Google Calendar](https://developers.google.com/workspace/calendar/api/concepts/reminders) são definidos em minutos antes do início; [importação Google Agenda](https://support.google.com/calendar/answer/37118?hl=pt-BR) descreve o caminho ICS no computador. Consultados22/10/2026. A integração escolhida reutiliza a conta/agenda do celular e dispensa contratar serviço ou configurar credenciais/API no AGRO.

Outros usos pertinentes e gratuitos do mesmo caminho: vencimento de Fiado, entrega/retirada combinada e preparação da feira, sempre por confirmação do produtor. São possibilidades de evolução; nesta entrega, a exportação implementada é para eventos. Lembretes Android do próprio AGRO e compartilhamento revisado no WhatsApp continuam disponíveis. Envio automático no WhatsApp e sincronização Google Tasks/Gmail não foram adicionados.

## Validação e limites

471 testes unitários PASS. Quatro jornadas de navegador: claro/escuro393normal e320textoampliado/modoleve/movimentoreduzido. Quatro jornadas Capacitor nosDOIS (Reno14/CPH2737 ePKJ110) e2temas PASS. Criação de evento fictício, Adicionar Depois, retomar/carga/seção, convite offline com texto completo, olho, cancelamento e integridade de produtos/vendas/movimentos verificados. Layout com margens laterais20px, rolagem e botões sem estouro horizontal. Nenhum banco ERP principal/transação real acessados.

Permissão oficial de agenda exibida/recusada nosDOIS, com recusa respeitada. UI da seleção/semagenda/erro/save simulada para não ler contas reais. Teste adicional REAL no CalendarProvider dosDOIS: agenda LOCAL descartável própria (sync_events=0), salvamento nativo e segundo salvamento atualizando UM evento, UM lembrete1440min/METHOD_ALERT, e limpeza da agenda verificados por instrumentação. Nenhuma conta Google ou agenda pessoal acessada. O teste nativo encontrou o getLong do Capacitor rejeitando ids Integer; corrigido para optLong e repetido com sucesso. Sem sincronização/alarme sonoro Google real medidos.

Sem medição deFPS/GPU/bateria, aparelho básico físico/TalkBack/runtime16KB. Os dois aparelhos não comprovam desempenho universal em celulares baratos. Reaproveitado motor comum, nenhum blur/animação pesada/tarefa periódica novo. Interface32/documento offline; motor60s/clima27/servidor59/pacote/certificado/dados reais preservados.

## APK e instalação

Pacote br.com.territorio.gestao2, versão0.12.62/code102, 5206519bytes (+8192bytes, cerca de0,16%). SHA256 `e0f1e9e6585ee5e5fadf8f5a92746d62ee6a07fb2100ddf13cbb71e53d9f7d46`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinatura v2/v3,41assets iguais ao dist/fixture, zipalign16KB, sem GPS/voz/microfone. Novas permissões opcionais de agenda documentadas acima.

Cópia conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.62.apk`. Install-r concluído: Reno14 2026-10-22 17:33:44; PKJ110 2026-10-22 17:33:51. AberturaStatusok, firstInstallTime de ambos preservado, sem limpar dados. Fixtures/instrumentação removidos; calendários LOCAL temporários removidos antes disso. Servidor não alterado/republicado, nenhuma submissão à Play.

Git: somente codex/atualizacao-agro-gestao2. Referência Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b e main956fddceec2b994e32c154c5197424a4f56df7f2 preservados; consultar último log/remoto para commit final. NÃO repetir build/cópia/instalação por este documento.
