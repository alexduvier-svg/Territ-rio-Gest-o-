# AGRO Gestão2 0.12.59/code99 — entrega técnica concluída

Pedidos e Entregas mostra a ativação dos lembretes, o estado da consulta e os clientes com seus pedidos e ações de preparo/entrega. Foram retirados os atalhos de envio, fotos/marca/história e PDF dessa janela. Em Clientes, Portfólio tem seção própria, separada de Enviar Lista de Pedidos. Os controles, materiais, tipografia, abertura e retorno seguem o sistema existente.

## Envio e lista do cliente

A primeira publicação agora tem campos no painel comum do app, explicação do WhatsApp do produtor, texto pontuado/justificado, andamento visível, erro na própria janela e botão recuperável. O destinatário é escolhido no compartilhamento do WhatsApp; esse campo não consulta a agenda. A publicação não é ignorada quando uma atualização de estoque está ocupada. Requisições de portfólio têm prazo; publicação concorrente não é tratada como sucesso. Um link já publicado pode ser compartilhado sem aguardar nova consulta de rede.

O cliente recebe uma lista própria: cards horizontais, nome/apresentação/preço e Escolher Quantidade, mantendo os materiais e os dois temas do app. Sem fotos obrigatórias. Esgotados/reservados continuam bloqueados pelo servidor. O pedido é registrado ao tocar Enviar Pedido; o resumo posterior pelo WhatsApp é opcional. O mesmo link acompanha as etapas. O botão de WhatsApp no acompanhamento recebeu o acabamento dos controles.

## Avisos e primeira abertura

Ao abrir/retomar o app, a consulta de pedidos começa imediatamente; atualizações bem-sucedidas emitem evento explícito para banner e notificações. Novos pedidos geram aviso dentro do app. Uma falha na publicação do estoque não impede a leitura dos pedidos já recebidos; conflitos continuam visíveis e não autorizam sobrescrever o estoque de outro aparelho. Consultas sem mudança não reconstroem a janela de pedidos nem perdem sua posição de leitura.

Na primeira abertura, após o cadastro inicial e sem interromper outra janela, o app oferece Permitir Notificações ou Agora Não. Permitir usa a autorização oficial do Android; recusar não impede vendas e a explicação não se repete após a escolha. A marca dessa escolha é local à instalação, fora do modelo de negócios. Lembretes podem ser ativados posteriormente na janela de pedidos.

Com lembretes ativados, internet e bateria não baixa, um WorkManager único verifica novos pedidos em segundo plano, em intervalo mínimo aproximado de15min. Uma consulta autenticada e limitada retorna somente IDs dos pedidos ainda aguardando preparo. Token/escopo/IDs ficam no arquivo privado noBackup; não lê nem regrava o banco ERP. Troca de produtor, pausa da loja ou revogação da permissão desativam a configuração. Repetições são deduplicadas; não há serviço permanente, microfone, GPS, alarme exato, ciclo de tentativas rápidas nem bloqueio da tela. HTTP nativo tem prazos, tamanho limitado, host fixo e não segue redirecionamentos com a credencial.

O Android/OEM pode adiar a tarefa. Não há promessa de aviso instantâneo com app fechado ou consumo zero. O servidor não renova o estoque físico em segundo plano: a disponibilidade continua sujeita às regras de atualização e reservas existentes. WhatsApp continua com envio revisado pelo produtor; não foi implantada API de mensagens automáticas nem forçada permissão no Chrome. A página pertence ao serviço Cloudflare já usado pelo AGRO.

## Validação

- 447 testes unitários do app e32do servidor passaram.
- 24 verificações SQLite locais:13portfólio e11loja, incluindo compatibilidade dos clientes anteriores.
- Quatro jornadas de navegador: claro/escuro,393px normal e320px com texto ampliado/modo leve/movimento reduzido. Clique real no botão de publicação, validação inline, envio sem fotos, pedido público, rota privada de alertas, detecção no retorno, checkout, Fiado, desconto, retirada e fechamento da feira.
- Quatro jornadas Capacitor: Reno14/CPH2737 e PKJ110, cada um nos dois temas, com registros fictícios e APIs redirecionadas ao Worker LOCAL. Primeira abertura nos dois: Agora Não respeitado e permissão oficial concedida ao fixture. Nenhum envio real pelo WhatsApp ou acesso ao ERP principal.
- Oito testes Android instrumentados (quatro por aparelho): restrições da agenda, notificação nativa sem dados do cliente, deduplicação, rejeição de resposta de escopo antigo/trabalho parado, lista limitada e arquivo noBackup. Respostas sintéticas: não foi medido HTTP nativo real com app fechado, Doze ou atraso OEM.

Fonte e assets finais idênticos entre APK, dist e fixture. Sem medições de FPS/GPU/bateria, aparelho básico físico, TalkBack ou runtime16KB. O navegador em modo leve não substitui teste em aparelho básico. Não houve submissão à Play Store.

## Distribuição e identidade

APK **5.190.135 bytes**, SHA256 `9a04fe0308bcacd36328aa0e30375de1b37c2db5d0777bc4484bc5abc0da5f95`; pacote `br.com.territorio.gestao2`,99/0.12.59. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinatura v2/v3,41assets e alinhamento16KB. Sem permissão GPS/microfone ou bibliotecas de voz.

Cópia conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.59.apk`. Instalado com `adb install -r` em22/10/2026: Reno14 às14:16:58 e PKJ às14:17:03, versão99/0.12.59 e abertura Statusok. firstInstallTime preservados, respectivamente21/10/2026 às18:58:01 e14/10/2026 às18:17:06. Fixtures e APKs de instrumentação removidos; nenhum dado real limpo ou transação real de teste.

Servidor publicado `d868a5b3-b7d8-499e-aef1-b47ccef2debd`, mesmos bindings e motor de clima27. Saúde pública200, CORS Android, guarda da nova rota e clima cacheOnly200/MET89pontos conferidos, sem ler lojas reais. Git Claude `cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b` e main `956fddceec2b994e32c154c5197424a4f56df7f2` consultados e preservados; publicação somente AGRO2. Memória/interface29 e regras de primeira abertura no documento offline.

Evidências em `qa/orders059-review.json`, quatro `qa/orders059-native-*.json`, dois `qa/orders059-instrumented-*.txt`, resultados unitários/SQLite e `qa/orders059-live.json`. Metadata de assinatura/cópia/instalação fica local em `native-apk-validation-0.12.59.json`. Não repetir build, verificador, cópia, instalação ou deploy por este registro. Confirmação do commit/push registrada no encerramento documental.
