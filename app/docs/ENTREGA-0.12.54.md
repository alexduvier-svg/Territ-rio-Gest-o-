# AGRO Gestão2 —0.12.54/code94

A entrada principal em Clientes agora envia uma lista simples por link. O cliente escolhe apresentações e quantidades, informa retirada ou entrega e toca Enviar pedido. O serviço registra a solicitação; o produtor a recebe ao abrir/atualizar o AGRO com internet. Cada venda e etapa continua dependendo de confirmação explícita do produtor. Não exige conta, leitor de PDF, plugin ou aplicativo adicional para o cliente.

Somente produtos próprios, cadastrados, ativos e com preço entram. Esgotados ficam visíveis sem compra. Em breve exige marcação explícita em Fotos, marca e história → Reposições; só aparece sem estoque. Reservas, pausa e dados vencidos recebem seus próprios estados. Reposição habilita após sincronizar. Pedir não baixa estoque como venda nem registra pagamento; reservas atômicas e confirmação existente impedem venda duplicada. A solicitação ainda precisa ser conferida pelo produtor, inclusive entrega e pagamento.

O portfólio de fotos/história é opcional. PDF e seus pedidos históricos continuam acessíveis em Portfólio e outras opções. Corrigidos o encaminhamento store-orders e o aviso no cabeçalho atual de Vender. A lista usa o material do app e as mesmas fontes Inter/Inter Tight, hospedadas no próprio serviço com licenças OFL. Janelas de quantidade abrem e retornam inteiras com transform/opacity; movimento reduzido é respeitado. Três colunas normais; em tela estreita com texto ampliado a lista pública adapta para duas. Vender no APK conserva suas três colunas.

## Validação e limites

- 401 testes unitários do app e24 do servidor passaram.
- 4 jornadas integradas produtor/cliente (claro/escuro;393normal/320ampliado, sinais de2GB e movimento reduzido),2 de perda de resposta/reload/reenvio e1 publicação inicial inteiramente dentro do app contra WorkerLOCAL passaram. A recuperação recebeu2POSTs e manteve1pedido.
- 47 verificações HTTP locais:13portfólio,11SQLite/pedidos/fontes,7backup,6feiras,10organizador. Produção recebeu apenas consultas públicas de saúde, sem pedido/cliente/catálogo real de teste.
- 4 jornadas em WebView físico: Reno14 CPH2737/359px e PKJ110/360px,2temas. Cada uma cobriu app e lista pública comAPI de pedidos SIMULADA no pacote separado. Back-end real foi testado em SQLiteLOCAL; não houve pedido de produção nos celulares.
- Texto e controles sem transbordamento nas configurações verificadas. Fonte/CSP reais carregaram no Worker local. Fotos/arquivos, WhatsApp e folha nativa de compartilhamento não foram enviados a contatos durante QA. Não afirmar desempenho em aparelho básico físico, FPS/GPU/bateria, TalkBack, iOS ou compatibilidade runtime16KB: não medidos. Matriz histórica completa de movimentos não repetida.

As premissas de interface26 ficam no modelo/backup e no código para instalações novas. Não há acesso a dados de negócio do APK principal pelos testes. Sem voz/microfone/GPS, novas dependências pagas ou submissão à Play Store. Main e ramo/APK3 do Claude preservados; referência Gitcffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b.

## Artefato e serviço

APK: AGRO-Gestao-2-0.12.54.apk, 5157250bytes. SHA256: `55d84a9ba7c1bb51198530c741b79e5d5257d394c7d255007f67d508dccb3456`. Pacote br.com.territorio.gestao2, certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturasv2/v3,40assets iguais ao dist e ao pacote de teste, zipalign16KB. Não confundir alinhamento com execução em kernel16KB.

Cópia original conferida: C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.54.apk.

Instalação-r Reno22/10/2026às08:26:35 e PKJàs08:26:44; code94/0.12.54/Statusok. firstInstallTime preservados: Reno21/10/2026às18:58:01;PKJ14/10/2026às18:17:06. Fixtures removidos dos dois. Nenhum dado apagado/desinstalação do principal.

Serviço publicado:0a83fdbe-9ecb-4745-b6f2-c46344082c33. Versão anterior confirmada7f62c9ab-7c0b-4b9f-b602-5823cbabe41c, sem mudança externa desconhecida. Rotas de clima/backups/feiras preservadas. Saúde pública: capabilities200, fonte200 com bytes idênticos, clima cacheOnly200 sem provocar consultaMET. Política climática27 mantida.

Git da implementação: commit/push`9dc169ac966eb27c317f0fb1511c2ed80b8d42e5` confirmado em codex/atualizacao-agro-gestao2, remoto idêntico e worktree limpo. Encerramento documental pode ter commit posterior. Main956fddc eClaudecffe32b preservados. NÃO repetir build/cópia/instalação/deploy por este documento. O checkpoint local registra o commit final após push.
