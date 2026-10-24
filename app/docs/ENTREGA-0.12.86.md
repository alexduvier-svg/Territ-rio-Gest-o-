# AGRO Gestão 2 — 0.12.86

Status: instalada nos dois aparelhos e cópia na pasta original em 24/10/2026. Publicação Git pendente no momento deste registro.

## Resultado

O Que Vou Levar usa Próximo/Concluir à esquerda e Inserir Quantidade à direita, ambos em pills do sistema. Campos de quantidade verdes, teclado único, digitação de vários dígitos e avanço com rolagem foram preservados. Concluir fecha somente o teclado; Salvar e Adicionar Depois permanecem no rodapé. Cabeçalho e teclas têm 12 px de separação; Limpar/Apagar têm 10 px antes dos controles.

Próximas Ações acompanha pedidos, fiados e preparação/conferência de eventos na Gestão e na Inteligência. Reutiliza os registros canônicos, o worker e a política de recursos atuais, com estados Para Conferir, Aguardando Você e Concluídas. A ação abre a área existente após revalidação. Somente a confirmação na origem conclui a tarefa. Nenhuma venda, pagamento, etapa de pedido ou WhatsApp é executada automaticamente. Há limite de memória, identificação por produtor/origem, auditoria sem dados pessoais, proteção de duplo clique, resposta atrasada e falha imediata de persistência. Regras em CONTINUIDADE-0.12.86.md, hierarquia3 e memória56.

## Falha encontrada e corrigida

O diagnóstico nativo do Reno capturou o callback de uma promessa concluída que permanecia marcada como em andamento. Cache e erro síncrono podiam limpar a referência antes da atribuição; a próxima leitura manual entrava em microtarefas sem fim e o WebView terminava. A atribuição agora precede a execução, inclusive nos retornos imediatos. Dois testes do controlador real reproduziram timeout antes; os três casos cache/erro/coalescência passaram depois. Uma venda fictícia incompleta do ensaio também foi substituída pelo registro canônico ERPModel.complete; essa troca sozinha não resolvia a falha. Não se atribui a correção apenas à animação.

## Validação

657 testes unitários e oito jornadas de navegador passaram em claro/escuro, larguras320 com texto ampliado/modo leve/efeitos reduzidos,360,393,412. A inspeção encontrou e corrigiu as abas de tarefas que escapavam da grade pequena; abaixo de360px os estados ficam empilhados e os controles mantêm alvos de toque.

Quatro jornadas completas Capacitor passaram no Reno14 e PKJ110, dois temas, sem pageerrors. Cobrem cinco abas, boot com cadastro pendente, café/estoque/fornecedores, navegação e retorno, teclado, clima/localização fictícia e os novos fluxos de tarefas. No ensaio herdado de Orientação, o Reno registrou abertura mas a espera baseada em raf expirou. A abertura e o recolhimento foram conferidos diretamente no fixture, e a espera passou a consultar o estado a cada100ms, mantendo as mesmas assertivas. As rodadas completas seguintes passaram sem alterar o app para essa espera.

APK0.12.86/code126,9209971bytes,SHA256aaa72250fd74c4451bf7b1957d5689291038d6749b9a2f8b06d4a07772a9ca15. Pacotebr.com.territorio.gestao2, certificadooriginalf5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68,v2/v3. Cinquenta assetsweb+duas pontes correspondem ao dist, ao APK principal e ao APK de teste compilado. ZIP e ELF16KB verificados estruturalmente; não houve ensaio em aparelho16KB. Nenhum servidor ou serviço pago foi alterado nesta entrega.

## Instalação e preservação

Cópia original AGRO-Gestao-2-0.12.86.apk em C:/Users/alexd/PROJETOS/Território Gestão, hash conferido. Atualizações adb install -r:

- Reno14: atualização 2026-10-24 18:19:44; primeira instalação preservada 2026-10-21 18:58:01.
- PKJ110: atualização 2026-10-24 18:19:55; primeira instalação preservada 2026-10-14 18:17:06.

Boot frio confirmou agent/motion/workflows/events/suppliers/training em ambos. O ADB precisou reconectar nos mesmos endereços já pareados antes da instalação; não houve novo pareamento ou reset. Fixtures, arquivo próprio de captura e forwards9341/9342 removidos. Permissões e posição real não foram alteradas/consultadas para QA; testes utilizaram pacote separado e dados fictícios. Sem banco real lido/copiado, transações reais, WhatsApp ou calendário pessoal. Não foram medidos FPS/GPU/bateria/TalkBack ou aparelho básico físico.

## Próxima diretriz autorizada

A diretriz recebida sobre decisões, validade e calendário foi lida e registrada. A auditoria está em AUDITORIA-VALIDADE-CALENDARIO-0.12.87.md. Lotes, vencimentos e lembretes D−5/D0 ainda não fazem parte desta versão; a implementação será realizada no estoque, calendário, notificações e motor existentes, por fases, conforme o documento. Registro de texto não equivale a recurso instalado.
