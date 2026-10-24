# Continuidade Local — Connect → Orientação → Action → Audit

## Uma origem para cada resultado

O acompanhamento de Próximas Ações lê os mesmos pedidos, recebíveis e eventos utilizados pelas telas existentes. Não mantém outro saldo, outro cálculo financeiro ou cópia dos dados dos clientes. O worker de inteligência compartilhado recebe somente identificadores e os estados necessários. O Gemini continua restrito às explicações gerais, sem registros do produtor.

Connect recolhe um DTO limitado ao produtor e à origem atuais. Orientação identifica o que está pendente, ordena por integridade e prazo e explica a próxima etapa. Action revalida a identificação da fonte e abre a tela existente. Audit registra a validação e confirma a abertura. A conclusão depende da prova no domínio: recebimento confirmado, pedido entregue ou conferência do evento concluída. Apenas abrir uma tela não recebe dinheiro, entrega pedido ou encerra feira.

## O que aparece

Gestão → Orientação e o painel de Inteligência mostram Próximas Ações. Para Conferir, Aguardando Você e Concluídas separam a situação atual. O acompanhamento abrange pedidos em preparo/retirada/entrega, fiados na data combinada ou em atraso e preparação/conferência de eventos. Feiras com carga salva continuam acompanhadas até o evento; cancelamento não é contado como conclusão bem-sucedida. Referência ausente, duplicada ou inválida nunca é concluída automaticamente.

A abertura da etapa é registrada como Aguardando Você até que os registros mudem. Novas etapas retornam para conferência. Não há botão que declare concluída uma pendência sem confirmação na origem. Mudanças entre produtores ou modo de teste não herdam pendências da outra área.

## Operação e limites

A memória guarda até 100 referências e 160 registros de auditoria, sem nomes, telefones, valores ou endereços. A lista mostra 20 tarefas inicialmente, até 60 por estado; o produtor pode consultar as áreas de origem. A coleta recusa históricos acima de 6.000 linhas para preservar memória. Operações reais de venda, recebimento e estoque continuam nos módulos atuais e precisam de ação do produtor.

A conferência é acionada por alterações, abertura/retomada e pelos próximos limites de data relevantes enquanto o app está visível. Uma única tarefa compartilha o worker e respeita a política de recursos. Não existe serviço permanente, novo agendador Android, polling contínuo, IA paga, upload de dados ou envio automático de WhatsApp. Com o app fechado, permanecem somente os lembretes nativos que já existiam; não se promete execução permanente do gerente.

Persistência falha restaura a memória anterior. Cliques repetidos na mesma ação não abrem etapas duplicadas. Uma resposta atrasada não reabre uma janela fechada nem substitui a navegação escolhida pelo produtor. Atualizações de contagem atuam apenas no DOM vivo, preservando as camadas de saída da animação.

## Correção da conferência em cache

O diagnóstico nativo capturou um ciclo de microtarefas quando uma conferência já resolvida permanecia referenciada como em andamento. O caminho de cache e uma falha síncrona na leitura terminavam antes da atribuição da promessa. A execução agora inicia em uma microtarefa após atribuir essa referência, e o bloco finally a libera em todos os caminhos. Testes do controlador real demonstraram timeout nos dois casos antes da mudança e aprovação após ela, além da coalescência de chamadas concorrentes. A validação física deve usar o APK final; logs diagnósticos não substituem os relatórios finais.

## Preparação da feira

O Que Vou Levar mantém um teclado comum. Próximo/Concluir fica à esquerda, Inserir Quantidade à direita; ambos usam pills do sistema. Quantidades são verdes, com vários dígitos permitidos antes de avançar. O foco acompanha o próximo produto com rolagem. Concluir fecha o teclado e não salva a carga. As ações finais continuam Salvar e Adicionar Depois, com espaço próprio. Há 12 px entre o cabeçalho e os dígitos e 10 px antes de Limpar/Apagar.

## Diretriz posterior

A diretriz recebida em 24/10 sobre lotes, validade e calendário foi registrada como referência para a próxima etapa. Esta versão de continuidade não implementa esse controle. O arquivo recebido não deve ser apresentado como função já disponível no APK.
