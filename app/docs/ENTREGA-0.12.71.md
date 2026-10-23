# Agenda, Preparação e Fechamento — 0.12.71/code111

Estado: concluída e instalada nos dois aparelhos em23/10/2026, preservando registros e primeira instalação. Implementação publicada no ramoAGRO2; encerramento documental abaixo.

## Comportamento

- Aviso de preparação em Produtos: data vermelha nos dois temas, dispensa persistente pelo X por ocorrência/horário, retirada automática uma hora antes do início. O mesmo relógio operacional existente agenda a retirada. Ela remove só o aviso e preserva os nós da grade. Reabrir/retomar também revalida. O X do aviso descartável permanece.
- Agenda: escolher uma conta leva a uma confirmação visível do salvamento, com calendário escolhido e lembrete de1440min. Salvar novamente atualiza o compromisso próprio sem duplicar. Ver na Agenda usa um intent Android de visualização restrito ao evento exportado pelo app, preferindo o Google Agenda se instalado e oferecendo retorno claro se indisponível. Não varre compromissos pessoais. O arquivoICS é alternativa de compatibilidade; o Google Agenda Android pode não aceitar sua abertura.
- Voltar: normalizado com seta, centralização e rodapé comum; suprimeX redundante por presença do retorno, inclusive janelas de agenda e subfluxos. Retornos que estavam dentro da rolagem migram para o rodapé. Pilha única de ações ocupa a largura toda.
- Cancelar Evento junto ao horário, dentro do card de dados; em tela estreita/texto ampliado o controle acomoda em outra linha sem cortes. Cancelados não recebem lembrete de finalizar.
- Evento com horário encerrado continua disponível para conferência. Finalizar Evento distingue término automático de fechamento confirmado. Três cards compactos: reposições, vendas não registradas, perdas/brindes; mesmo estoque geral/carga/reservas, validação conjunta e cópia transacional. Origem e pagamento explícitos, repetição idempotente. Perdas baixam uma vez sem gerar receita. Conferir sobra não duplica acertos. Relatório oficial preserva consentimento, fila e gravação durável anterior ao envio.
- Perfil e Negócio: mesmo motor e material, expansão/retorno curtos. Reprodução isolada70: escala0,30 e deslocamento vertical354px. Candidato71: escala0,94 e deslocamento18px. Corrigido reinício da animação causado pelo title-case assíncrono mudar a identidade da janela. Título é normalizado antes de pintar, identidade de movimento ignora só maiúsculas/minúsculas. Não é medição certificada deFPS/GPU.
- Premissas de interface41 e documento offline atualizados. Identidade, assinatura, registros reais, clima27, servidor59, FirebaseSpark/AppCheck e notificações existentes preservados.

## Fonte técnica

[Android Calendar Provider — intents e lembretes](https://developer.android.com/identity/providers/calendar-provider). A conta e o Android controlam sincronização, som e entrega dos avisos. Não foi testada uma conta pessoal ou a sincronização Google.

## Validação

568testes de unidade passaram. Matriz de navegador8casos passou: claro/escuro,320px ampliado/leve/reduzido e360/393/412. Verificadas margens, Voltar inteiro, fechamento de evento terminado, três acertos e saldo20→17 (venda2+perda1), sem dupla contagem. Em393px nosdois temas, relógio simulado confirmou retirada no corte exato sem substituir a grade. Perfil com uma só animação raiz após normalização.

Quatro jornadas Capacitor passaram nos dois celulares e nos dois temas. Cenários da lista de agendas usam contas fictícias simuladas para não consultar contas pessoais.

Nos DOIS: permissão oficial do fixture, CalendarProviderLOCAL real salvar/atualizar sem duplicar,1440min, rejeição de outra chave, visualização própria interceptada antes de abrir app externo e remoção do calendário/lembrete passaram (2instrumentados por aparelho;4ao todo). A primeira revisão do interceptador de teste não bloqueava o MIME resolvido: foi corrigida para interceptar ACTION_VIEW antes da resolução e o teste passou nosdois; o primeiro compromisso LOCAL também foi removido. Nenhum compromisso pessoal foi consultado.

Limites: não medir desempenho de aparelho básico por dois aparelhos de maior capacidade. Sem testes reais de ERPprincipal, WhatsApp ou agenda pessoal. SemFPS/GPU/bateria/TalkBack/runtime16KB/GoogleSync/som medidos. Não houve publicação naPlayStore nem deployservidor.

## Pergunta sobre alarme Android

Já existe aviso nativo1hora antes de cada dia do evento no canalSeusEventos, com permissãoAndroid. Não depende deGoogleAgenda; o canal/aparelho controlam som e o agendamento é inexato. Não foi adicionado outro alarme aoRelógio: ACTION_SET_ALARMpadrão temhora/minuto/diasde repetição, semdatafuturauniversal. Essa resposta não significa teste de som/Doze/OEM garantido.

## Pacote e Instalação

APK: AGRO-Gestao-2-0.12.71.apk,9131954bytes; acréscimo4096bytes sobre70. SHA2565db4a5e4faad5edaea7236ab346ed5f38fda253d4c0213d45544b9b4e6a6c549. Pacotebr.com.territorio.gestao2/code111, certificadooriginal/v2v3,48webassets+2pontesconferidos. ZIPeELF LOAD16KB verificados em metadados, sem alegar execução em aparelho16KB. SemGPS/microfone.

Cópia conferida na pastaC:/Users/alexd/PROJETOS/Território Gestão. adb install-rReno14às13:50:42 ePKJ110às13:50:53 em23/10/2026;version111/0.12.71 eaberturaStatusok nosDOIS. FirstInstallTimeReno21/10às18:58:01 ePKJ14/10às18:17:06preservados. Fixtures/instrumentação removidos; calendáriosLOCALremovidos pelo teste.

Git: fonte emcodex/atualizacao-agro-gestao2;Claude cffe32b/main956fddcconsultados no início, integração eprépublicação, semnovidades. Implementação commit/pushd455978d71da936745550692f825ae79a8292c56 confirmados no remotoAGRO2, worktree limpo antes deste encerramento documental. Nenhuma pendência autorizada restante. Não repetir build/testes/cópia/instalação por este registro.
