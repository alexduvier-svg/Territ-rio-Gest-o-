# AGRO Gestão — Diretrizes de decisões proativas, validade e calendário

Versão: 1.0 · 24 de outubro de 2026
Destinatários: Codex e Claude Code
Natureza: especificação proposta para implementação no projeto existente. O código do aplicativo não foi inspecionado neste documento.

## 1. Objetivo e resultado esperado

Criar uma habilidade integrada ao motor de decisões que identifique situações relevantes, ofereça comparações e permita agir com poucos toques. O produtor não precisa formular uma pergunta para receber uma orientação. Combinar análises automáticas, perguntas prontas e, posteriormente, perguntas escritas.

Adicionar controle OPCIONAL de validade em entradas de estoque e produtos recebidos de fornecedores. Quando houver uma data válida, criar automaticamente um evento no calendário interno, com lembretes cinco dias antes e no próprio dia. Não exigir preenchimento para cadastrar produto, fornecedor ou repor estoque.

Reaproveitar os módulos de estoque, vendas, fornecedores, calendário, notificações e Gerente que já existirem. Não criar uma aba para cada especialista nem um segundo cadastro do produtor.

## 2. Auditoria inicial obrigatória para os implementadores

Antes de editar, mapear modelos, serviços, telas, regras de venda, armazenamento, calendário e agendamento já existentes. Ler as instruções do repositório e diretrizes instaladas; identificar sobreposições e registrar qual implementação será a fonte única de cada informação.

Não presumir framework, banco, sistema de notificações ou arquitetura. Adaptar os nomes conceituais deste documento ao projeto real. Se uma função já atende à necessidade, estendê-la. Evitar dois agendadores, dois motores de recomendações ou dois saldos de estoque concorrentes.

Codex e Claude Code devem trabalhar com mudanças identificáveis e verificar alterações recentes antes de editar os mesmos arquivos. Entregar resumo das decisões, migrações e validações; não afirmar que texto instalado já equivale a função implementada.

## 3. Três maneiras de ativar a análise

| Acesso | Comportamento | Prioridade |
|---|---|---|
| Automático | Eventos do app acionam regras e atualizam orientações | Primeira entrega |
| Perguntas prontas | Botões consultam dados atuais e calculam a resposta | Primeira entrega |
| Pergunta escrita | Interpretação encaminha a consulta aos mesmos serviços | Evolução posterior |

Perguntas prontas não são respostas fixas. Exemplos: “O que vence primeiro?”, “Vale fazer promoção?”, “Quanto levar à feira?”, “Qual fornecedor compensa?” e “O que precisa de atenção hoje?”. Se faltarem dados, informar o que falta e permitir completar apenas o necessário.

Gerar automaticamente a orientação não autoriza compra, desconto, envio de mensagens, descarte ou ajuste de estoque. Ações que alteram o negócio exigem comando do produtor. Eventos internos e lembretes de validade são automáticos conforme esta especificação.

## 4. Interface de validade opcional

Na entrada ou reposição de estoque, oferecer uma seção recolhível “Lote e validade · opcional”. Não acrescentar um formulário longo à tela principal de venda.

Estado inicial: “Não informada”. Oferecer três estados explícitos:

| Estado | Significado | Efeito |
|---|---|---|
| Não informada | Não existe uma data registrada | Nenhum vencimento ou lembrete é presumido |
| Com validade | Existe uma data confirmada ou um período com referência | Agendar e acompanhar o lote |
| Não se aplica | O usuário declarou que esse controle não se aplica ao item | Não criar vencimento |

Um campo vazio nunca significa validade infinita. “Não se aplica” não é certificação do aplicativo de que o produto não vence. Para itens sem vencimento, permitir separadamente uma data opcional de revisão de estoque, qualidade ou condição; nomear como revisão, sem convertê-la em validade.

Campos sugeridos, exibidos progressivamente:

- Lote: texto opcional; usar identificador interno quando não houver código do fabricante.
- Quantidade recebida: reutilizar o campo existente da entrada.
- Fabricação ou produção: opcional, exceto quando usada como referência do cálculo.
- Estado da validade: não informada, com validade ou não se aplica.
- Vencimento: data, sem horário, com apresentação DD/MM/AAAA.
- Alternativa “Informar período”: quantidade, unidade e data de referência.
- Origem da data: rótulo, fornecedor, produção própria ou estimativa informada pelo usuário.
- Observações de conservação: opcionais, sem substituir orientações do fabricante.

No resumo: “Validade: 20/11/2026 · avisos em 15/11 e 20/11”. Permitir desativar os lembretes ou alterar sua configuração sem apagar a validade.

## 5. Regras de período e data

Permitir data exata OU período calculado. Exemplo: “10 dias após produção”, produção em 01/11/2026, resulta em data sugerida de 11/11/2026 pela convenção de soma de dias; mostrar a data para confirmação, pois instruções de contagem do fabricante podem diferir.

Exigir referência explícita para calcular o período. Não assumir que recebimento é fabricação. Usar a data de recebimento como referência apenas quando isso for indicado e confirmado pelo usuário. Uma validade padrão no produto é somente um preenchimento sugerido para novos lotes.

Para meses, usar meses de calendário; se o dia não existir no mês de destino, limitar ao último dia e mostrar o resultado. Não converter automaticamente um mês em 30 dias. Não inventar dia exato quando o rótulo trouxer apenas mês e ano: manter precisão mensal e pedir confirmação da convenção antes de ativar alertas de dia exato.

Se a data exata e o período divergirem, apresentar o conflito e pedir qual valor está correto. Não prolongar a validade por conveniência, histórico de venda ou recomendação de IA. Estimativas precisam ficar identificadas; não transformar estimativa em informação do fabricante.

## 6. Validade por lote e estoque único

Manter o produto como cadastro único e as entradas/lotes como partes do mesmo estoque geral. Exemplo: Queijo 500 g, lote A com 8 unidades e vencimento em 10/11; lote B com 12 unidades e vencimento em 20/11. Total do produto: 20 unidades. Não criar dois produtos duplicados.

Conservar vínculos entre entrada, fornecedor, compra e lote quando disponíveis. Uma nova reposição não deve sobrescrever a data do lote anterior. Manter saldo por lote compatível com a fonte de estoque já existente, com atualização transacional; não introduzir um segundo livro de estoque.

Sugerir saída dos lotes com vencimento mais próximo, entre os disponíveis e elegíveis. Lotes sem data permanecem identificados; não presumir que são mais novos ou mais seguros. Permitir corrigir a alocação de lote com rastreabilidade.

Vencimento não deve apagar unidades nem gerar descarte automático. Manter quantidade física e separar disponibilidade comercial. Como padrão proposto, lote com data vencida fica indisponível para venda e para sugestões comerciais, com indicação do motivo. No dia da validade, mostrar “Vence hoje”; após esse dia, “Vencido”, ressalvadas condições de uso mais restritivas cadastradas.

Devoluções, cancelamentos, perdas e ajustes devem reutilizar os fluxos existentes e recuperar o lote original quando conhecido. Uma devolução não libera automaticamente um item para venda sem avaliação de sua condição.

## 7. Fornecedores: separar significados de validade

Validade pertence ao produto/lote fornecido, não ao cadastro da pessoa ou empresa fornecedora. Incluir os campos no recebimento ou na compra vinculada ao fornecedor.

Separar três conceitos:

| Informação | Onde fica | Uso |
|---|---|---|
| Vencimento do produto recebido | Lote/entrada | Estoque, calendário e prevenção de perdas |
| Validade da proposta ou cotação | Cotação | Saber até quando preço e condições foram oferecidos |
| Prazo mínimo de validade restante na entrega | Condição de compra do item | Comparar propostas e verificar recebimento |

Exemplo: cotação de embalagem válida até 05/11; queijo entregue com vencimento em 20/11. Não usar 05/11 como vencimento do queijo.

Campos opcionais complementares: prazo de entrega, data prevista, quantidade mínima, frete, preço e unidade normalizados, validade restante prometida e validade efetivamente recebida. Quando uma cotação tiver data de validade, aplicar a mesma infraestrutura de calendário, com tipo “Cotação”, rótulos próprios e avisos D−5/D0 quando habilitados.

Fornecedor sem prazo de validade cadastrado continua utilizável. Comparações devem declarar essa ausência. Não atribuir qualidade sanitária ou reputação a partir de preço ou validade isolados.

## 8. Calendário e avisos automáticos

O calendário interno é o padrão. Não exige conta externa, internet nem acesso à agenda do aparelho. Ao salvar uma data exata confirmada, criar ou atualizar um evento de vencimento por lote, com dois lembretes: D−5 e D0.

Usar chave estável por entidade e tipo, por exemplo lote + vencimento. Alterar a data deve atualizar o mesmo evento e cancelar os avisos antigos. Salvar novamente ou sincronizar não pode gerar duplicatas. Reutilizar o calendário e agendador atuais.

Datas de validade são datas civis locais; não convertê-las para meia-noite UTC de forma que mudem de dia. Adotar o fuso do usuário. Horário padrão proposto para o lembrete: 08h, ajustável. Evento de calendário pode ser de dia inteiro; horário do aviso é independente.

| Situação no cadastro | Comportamento |
|---|---|
| Faltam mais de 5 dias | Agendar D−5 e D0 |
| Faltam exatamente 5 dias | Mostrar alerta atual e agendar D0; evitar notificação duplicada |
| Faltam de 1 a 4 dias | Mostrar “Vence em X dias” e agendar D0; não retroagir D−5 |
| Vence hoje | Mostrar aviso atual; notificar uma vez conforme horário e preferências |
| Já venceu | Mostrar imediatamente o estado vencido; não agendar avisos no passado |
| Sem data ou não se aplica | Não criar evento de vencimento |

Se o horário do aviso já passou no dia do cadastro, usar um único aviso atual no app, sem disparar uma sequência de lembretes atrasados. Se o aparelho estava desligado ou a permissão foi negada, reconciliar os estados ao abrir e mostrar pendências atuais, sem prometer entrega pontual de notificações do sistema.

Reagendar quando necessário após reinicialização, atualização, restauração, mudança de fuso ou alteração de preferências. Usar os mecanismos suportados pelo sistema real; evitar alarme exato ou serviço permanente sem necessidade.

Quando o saldo do lote chegar a zero, cancelar lembretes futuros e manter histórico do evento sem pendência ativa. Se o saldo voltar a ser positivo, reavaliar a data e agendar apenas o que ainda fizer sentido. Remover a data cancela seus avisos. Exclusão lógica deve cancelar avisos preservando trilha de auditoria.

Agenda do celular: integração opcional e separada, com as permissões exigidas pela plataforma. Negação não impede calendário interno. Se o projeto já tiver exportação ICS, reaproveitá-la; exportação manual não garante atualização automática de cópias importadas. Não criar automações no ChatGPT: estes são recursos do APK.

## 9. Motor de decisões e cenários com datas

Acionar análises ao salvar lote, alterar validade, vender, devolver, registrar perda, atualizar compra/cotação, abrir o app ou alcançar uma data relevante. Avaliar apenas entidades afetadas e consolidar mudanças próximas.

Exemplos de regras:

- Produto com saldo e vencimento próximo: oferecer “Ver alternativas”, considerando validade, margem, demanda e possibilidade de atendimento antes do prazo.
- Feira posterior ao vencimento: retirar esse lote da quantidade sugerida e explicar a diferença entre estoque físico e elegível.
- Fornecedor com preço menor e prazo restante curto: comparar economia com consumo previsto e risco de sobra.
- Cotação vencendo: oferecer revisão da compra, sem criar urgência comercial artificial nem presumir que o preço seguirá válido depois.
- Estoque sem data: permitir completar informação, sem classificá-lo como vencido ou sem validade.
- Item sem vencimento e revisão marcada: lembrar da revisão, sem inventar risco alimentar.

Exemplo: saldo de 30 unidades, 4 dias até vencimento e ritmo histórico comparável de 5 unidades/dia. Uma projeção linear simples sugere saída de 20 unidades e possível sobra de 10. Mostrar como estimativa condicionada ao ritmo e aos dias de venda, sem afirmar que são 10 perdas certas. Se não houver histórico suficiente, comparar cenários informados pelo usuário sem percentuais inventados.

Comparar manter preço, desconto escolhido pelo produtor, redução de produção futura e busca de encomendas, quando aplicáveis. Não recomendar vender ou consumir item vencido, alterar rótulo, estender prazo ou presumir que processamento torna um item seguro. Não usar a IA para diagnosticar segurança do alimento pela aparência.

Resultado esperado pode ser calculado por soma de probabilidade × resultado líquido, somente com probabilidades fundamentadas ou hipóteses explicitamente identificadas. Incluir custo, frete, perdas, caixa e prazo. Não confundir chance de chuva com queda proporcional das vendas; tratar dependências entre fatores. Havendo pouca evidência, apresentar faixas e cenários sem falsa precisão.

## 10. Interface limpa e controle do produtor

Usar um card prioritário na Gestão: “12 unidades vencem em 5 dias · Comparar opções”. Agrupar alertas do dia, em vez de emitir uma notificação por unidade ou lotar a tela de venda.

Na expansão, mostrar: motivo, produto/lote, quantidade restante, datas, alternativas, dados utilizados, limitações e ação possível. Perguntas prontas devem consultar os mesmos serviços da análise automática.

Oferecer: ver lote, comparar opções, corrigir data, configurar avisos e depois. “Depois” pode ocultar a sugestão até nova data, mas não remove a validade nem libera lote vencido. Desativar notificações não modifica o estado do estoque. Distinguir sugestão dispensada de evento concluído e notificação entregue.

Priorização por consequência e proximidade, sem linguagem alarmista. Não repetir sugestão dispensada sem mudança relevante; registrar a condição de reapresentação. Textos curtos, área de toque adequada e informações acessíveis também sem depender de cores.

## 11. Modelo de dados conceitual

Adaptar ao esquema existente, preservando migrações compatíveis:

- Produto: identidade e eventual período padrão sugerido.
- Lote/entrada: produto, fornecedor/compra, quantidade, referência de produção/recebimento, estado da validade, data civil de vencimento, precisão, origem, período/unidade/referência e revisão opcional.
- Cotação: fornecedor, itens, unidades, preço, frete, entrega e data de validade da proposta.
- Evento interno: entidade de origem, tipo, data, estado e identificador estável.
- Lembrete: evento, deslocamento em dias, horário, identificador de agendamento e estado.
- Recomendação: regra, entidades, versão dos dados, explicação, cenários, prioridade, estado e condição para reapresentação.
- Auditoria: alteração relevante, valor anterior/novo, momento, origem e versão da regra.

Não armazenar dados derivados em fontes concorrentes. Se houver cache de estado, torná-lo invalidável/recalculável. Separar o estado de validade do estado físico/comercial do lote.

## 12. Desempenho, operação offline e falhas

Executar a primeira versão com regras determinísticas e cálculos simples locais. Não exigir modelo generativo, API paga ou conexão para validade, calendário interno, comparações básicas e perguntas prontas.

Consultar por saldo positivo e intervalo de datas, com índices compatíveis com o banco real. Não varrer todo o histórico a cada renderização, não fazer polling contínuo e não manter serviço em segundo plano apenas para checar datas. Paginar listas, processar fora da interação crítica e agendar notificações em janela compatível com limites do sistema.

Reconciliar no início e em eventos relevantes. Se houver sincronização, usar operações idempotentes e resolver versões para não ressuscitar avisos antigos. Em estoque legado sem lotes, migrar para uma entrada de origem com validade não informada; não inventar data ou fornecedor.

Persistir a alteração e a intenção de agendamento de forma recuperável. Falha ao agendar não deve perder o lote nem mostrar “aviso garantido”. Manter a pendência visível internamente e permitir nova tentativa. Permissão negada deve ser comunicada de forma objetiva nas configurações de lembretes.

## 13. Verificações de aceitação

1. Cadastrar e vender produto sem validade continua possível; não surge data automática.
2. “Não informada” e “Não se aplica” permanecem distintos após fechar e reabrir o app.
3. Dois lotes do mesmo produto com datas diferentes somam corretamente no estoque único e recebem eventos separados.
4. Vencimento em 20/11/2026 gera lembretes em 15/11 e 20/11, no fuso local.
5. Salvar duas vezes não duplica evento ou notificação; editar a data cancela avisos antigos.
6. Cadastro dentro da janela D−5, no próprio dia e após vencimento segue a tabela de casos sem alertas retroativos repetidos.
7. Estoque zero cancela avisos futuros; devolução/estorno reavalia apenas o necessário.
8. Ausência de internet ou permissão de agenda não impede calendário interno; permissão de notificação negada mantém aviso no app.
9. Validade da cotação nunca se torna vencimento do produto.
10. Comparação para feira posterior ao vencimento exclui o lote inelegível, sem apagar quantidade física.
11. Migração preserva saldos e registros anteriores, sem obrigar o usuário a preencher novos campos.
12. Reinício, troca de data/fuso e fim de mês não deslocam indevidamente o vencimento.
13. Pergunta pronta e regra automática apresentam resultados coerentes para os mesmos dados; ausência de evidência não gera probabilidade inventada.
14. Telas pequenas e aparelho de menor capacidade permanecem utilizáveis, sem processamento contínuo.

Implementar testes de domínio para cálculo de datas, saldo e agendamento idempotente, além de validar os fluxos reais no ambiente disponível. Informar explicitamente quais verificações dependem de dispositivo e ainda não foram realizadas.

## 14. Sequência de entrega

Primeiro: auditoria e migração compatível; validade opcional por lote; calendário interno D−5/D0; agendamento local; estados visuais e cancelamento de avisos.

Depois: vínculo completo com recebimentos/cotações, agrupamento de alertas e perguntas prontas sobre vencimentos e fornecedores.

Em seguida: comparação de cenários, histórico de decisões e integração opcional com agenda externa. Perguntas livres e recursos mais pesados entram apenas se trouxerem benefício demonstrável.

Entregar documentação dos módulos reutilizados, conflitos resolvidos, alterações feitas, verificações executadas, limitações e caminhos para configurar avisos. A habilidade só está concluída quando os dados opcionais, eventos, lembretes e decisões funcionam juntos sem duplicar o estoque nem prejudicar as vendas atuais.
