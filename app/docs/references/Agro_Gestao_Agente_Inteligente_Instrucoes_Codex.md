# Agro Gestão — implementação do agente inteligente no APK

Especificação e ordem de execução para o Codex · 19/10/2026 · versão 1.1

## Estado confirmado pelo usuário

A voz JÁ ESTÁ INTEGRADA ao Agro Gestão. Este trabalho deve conectar o agente à implementação existente. Não reinstalar, substituir ou duplicar o reconhecimento, o botão de microfone ou o carrinho. As orientações sobre permissões e modelos abaixo são verificações de compatibilidade/regressão, não tarefas de reconstrução. Não assumir que o relato antigo de falha do microfone continua atual.

## 1. Parecer de viabilidade

É tecnicamente possível implementar um agente operacional integrado ao Agro Gestão. O núcleo recomendado usa banco local, serviços de negócio existentes, regras determinísticas e respostas estruturadas em português. Não depende de modelo generativo, assinatura ou servidor para vender, consultar estoque e gerar diagnósticos básicos.

Este parecer valida a arquitetura proposta, não o código atual do APK. O material recebido foi um texto conceitual; não foram fornecidos repositório, projeto Android ou APK para inspeção. Compilação, compatibilidade, tamanho, consumo e funcionamento real ainda precisam ser verificados pelo Codex no projeto.

| Capacidade | Decisão de implementação |
|---|---|
| Consulta e indicadores offline | Implementar no núcleo usando dados locais |
| Venda por voz offline | Viável com reconhecimento e modelo instalados; validar português e ruído em aparelho |
| Linguagem regional | Combinar transcrição, aliases locais, catálogo e esclarecimento de ambiguidades |
| Diagnóstico de estoque e feiras | Implementar quando os campos necessários existirem |
| Sugestão de recompra | Implementar com histórico suficiente; mensagem fica em rascunho |
| Conversa livre sobre qualquer assunto | Fora do MVP; parser local entende intenções delimitadas |
| Modelo generativo local | Opcional posterior, sujeito a compatibilidade e medição |
| IA remota | Opcional posterior, desativada por padrão; exige infraestrutura segura |
| Execução contínua com app fechado | Não prometer; usar trabalho oportunístico e atualização ao reabrir |
| Aprender sozinho | Guardar correções e feedback; não retreinar modelo nem alterar regras silenciosamente |
| WhatsApp automático offline | Não é possível entregar mensagens sem conexão; preparar compartilhamento manual |

WorkManager permite trabalho periódico com intervalo mínimo de 15 minutos e execução sujeita ao sistema. Isso não exige analisar a cada 15 minutos: usar eventos locais e uma verificação diária oportunística inicialmente. Gemini Nano/ML Kit possui suporte variável por dispositivo/API e não deve ser requisito universal. Vosk dispõe de reconhecimento offline para Android, mas é transcritor, não motor de decisão de vendas.

## 2. Instrução principal para o Codex

Implemente esta especificação no projeto REAL do Agro Gestão. Comece pela auditoria abaixo, documente o mapa e prossiga com as alterações compatíveis sem parar apenas para apresentar um plano. Preserve a arquitetura, os dados e as funções existentes. Adapte os nomes sugeridos aos padrões do projeto. Não crie outro aplicativo, outra base de vendas ou um superapp. Não substitua a camada central de persistência para adicionar o agente.

Se algum recurso depender de campo ausente, implemente a parte verificável, informe a limitação na interface e registre o que falta no relatório. Não invente dados nem simule uma integração como se estivesse funcionando. Interrompa apenas o trecho que exigir decisão estrutural realmente indispensável ou credencial indisponível; continue as tarefas independentes.

O objetivo da primeira entrega é um agente útil em aparelhos modestos, com quatro capacidades: preparar venda por voz/texto, analisar estoque, explicar resultados de feira e sugerir recompra. O termo “agente” descreve a coordenação dessas ferramentas; não obriga usar LLM.

## 3. Auditoria obrigatória antes das alterações

1. Ler AGENTS.md e instruções aplicáveis. Identificar stack, versões, comandos de build, minSdk/targetSdk e arquitetura real: nativo, Flutter, React Native, híbrido ou outra.
2. Localizar entidades e serviços de produto/variação, unidade, preço, custo, venda, estorno, estoque, cliente, evento e pedido. Identificar transações e validações já existentes.
3. Mapear persistência e isolamento por produtor/conta. Não introduzir Room se o projeto usa outra solução adequada. Em híbrido, verificar bridge e persistência acessível fora da WebView; WorkManager não executa JavaScript de interface automaticamente.
4. Mapear a voz já integrada: localizar o evento/callback de transcrição final, permissões, ciclo de vida e resolvedor atual. Conectar o agente nesse ponto, preservando comandos e confirmações existentes. Só corrigir defeito se reproduzido durante a integração; não assumir falha atual do microfone.
5. Procurar catálogo de mais de 2.500 produtos, diretrizes de linguagem regional, finanças e insights, e catálogo/pedidos por WhatsApp. Podem existir como assets, JSON, código ou documentos. Não pressupor que já foram incorporados.
6. Registrar encontrados/ausentes e respectivos caminhos. Conteúdo não fornecido não deve ser reconstruído como se fosse o original. O núcleo continua funcional com o catálogo efetivo do usuário.
7. Verificar origem fictícia dos dados atuais. Operar inicialmente como demonstração, explicitamente identificada. Não misturar exemplos e registros reais.
8. Registrar baseline de build/testes e telas atuais; planejar mudanças incrementais e migrações não destrutivas.

## 4. Arquitetura mínima

Fluxo: entrada → interpretação → consulta de dados → regras → explicação/prévia → confirmação quando necessária → serviço existente → auditoria → atualização dos insights.

| Componente lógico | Responsabilidade |
|---|---|
| AgentOrchestrator | Selecionar intenções e ferramentas permitidas, controlar estados e cancelamento |
| VoiceInputAdapter | Permissão, captura, transcrição parcial/final e erros |
| ProductResolver | Resolver aliases, unidades, IDs e variações com candidatos explícitos |
| KnowledgeRepository | Conhecimento local versionado, origem e regras extraídas dos documentos |
| BusinessRulesEngine | Cálculos determinísticos, critérios de elegibilidade e validações |
| InsightEngine | Produzir, priorizar, atualizar e deduplicar recomendações |
| AgentActionGateway | Consultas tipadas e propostas de ação pelos serviços do ERP |
| AuditRepository | Registrar confirmação, tentativa, execução e resultado com IDs |
| AIProvider opcional | Interpretar/explicar conteúdo, sem autoridade para gravar ou calcular valores oficiais |

Não crie oito módulos vazios por obrigação. Agrupe componentes quando adequado, mantendo os limites de responsabilidade. Toda leitura deve respeitar o produtor/usuário e o escopo selecionado.

### Contratos mínimos, adaptáveis à stack

- Request: requestId, actorId, scopeId, source (voz/texto/tela), text, createdAt.
- Interpretation: intent, items [{productId?, variantId?, quantity?, unit?, candidates[]}], unresolvedFields, parserVersion. Score só se tiver significado calibrado; não inventar percentual de certeza.
- ActionProposal: proposalId, actorId, scopeId, type, payload, dataRevision, expiresAt, status.
- Insight: id, ruleId/ruleVersion, scope, entityRefs, severity, observation, hypothesis?, nextAction, evidenceRefs, period, sampleSize, generatedAt, expiresAt, status, dataOrigin (demo/real).
- KnowledgeEntry: id, version, source, aliases, canonicalUnit?, applicability e prioridade. Diretriz específica validada prevalece sobre sugestão genérica.

### Conectar a voz sem duplicar execução

Mapear se a implementação atual apenas transcreve, preenche carrinho ou também confirma venda. Cada transcrição final deve ter um identificador e um único responsável por encaminhar sua intenção. Não executar simultaneamente o parser antigo e o novo agente para o mesmo comando. Resultados parciais só atualizam a exibição; não geram venda. Preservar o caminho existente de vendas quando adequado e acrescentar roteamento para consultas como “quanto café tenho?”, “como foi a feira?” e “quais clientes posso avisar?”. Comando fora do escopo deve oferecer orientação clara. Adicionar teste de uma fala processada uma única vez e teste de regressão dos comandos já suportados.

Estados da proposta: DRAFT → NEEDS_CLARIFICATION ou READY → CONFIRMED → EXECUTED. Alternativas: CANCELLED, EXPIRED, FAILED. Confirmar não significa executar com sucesso; persistir recibo e recuperar estado após fechamento do app.

## 5. Voz, linguagem regional e catálogo

Reutilizar o reconhecimento existente, corrigindo falhas. Se Vosk já está no projeto, preferir estabilizá-lo antes de substituição. Voz precisa de modelo português disponível, armazenamento suficiente e permissão de microfone. Caso o modelo necessite download inicial, informar isso; não anunciar voz offline antes de instalado. Verificar licença, ABI e distribuição do modelo. Não carregar LLM para interpretar comandos simples.

Estados visíveis: pronto, solicitando permissão, ouvindo, interpretando, revisar, erro. Mostrar texto captado e oferecer edição. Microfone só durante interação iniciada pelo usuário; liberar recursos ao sair, cancelar ou ir ao fundo. Se permissão negada/modelo ausente, texto e operação manual continuam disponíveis.

Fazer o cruzamento local em dois momentos:

1. Preparação autônoma: indexar catálogo e aliases na instalação/importação/atualização. Guardar versão/hash para evitar reindexar a cada abertura. Preparar candidatos usando unidades e variações. O catálogo geral sugere nomes; não cria estoque ou produtos vendáveis automaticamente.
2. Momento da venda: cruzar fala/texto com índice, cadastro ativo, variações, unidades, estoque e contexto. Estoque ajuda a informar disponibilidade, mas nunca deve transformar uma escolha ambígua em certeza.

Preservar nome exibido; normalizar caixa/acentos apenas para busca. Tratar numeral por extenso, singular após número, decimais e expressões regionais. “Maço” e “molho” podem ser aliases da unidade cadastrada; não presumir equivalência em todos os produtos. “Cacho” e “caixa” só convertem com fator registrado. Peso de embalagem não é quantidade vendida. Não aplicar correspondência aproximada automaticamente quando os candidatos forem próximos.

| Entrada | Resultado esperado |
|---|---|
| “vendi 3 mamão” | 3 unidades apenas se essa for a unidade cadastrada; senão esclarecer |
| “vendi três café especial” | Buscar variações; perguntar peso e moagem quando houver mais de uma opção |
| “vendi 3 taioba” | Exibir a unidade cadastrada na revisão; esclarecer se não definida |
| “vendi 5 mói de serraia” | Usar alias regional validado para serralha e unidade; sem alias confirmado, oferecer candidato |
| “vendi cinco molho de taioba” | Resolver quantidade 5 e alias de unidade validado |
| “um quilo e meio de tomate” | Quantidade decimal 1,5 kg; não duas linhas de venda |
| “dois café de 500 gramas” | 2 embalagens da variação 500 g; não vender 500 unidades |
| “vendi três café, cinco taioba e dois bolo de fubá” | Separar três itens; resolver cada ambiguidade sem perder os demais |

Incluir sinônimos/plurais existentes no índice e permitir correção local confirmada. Não alterar automaticamente nome canônico e não descartar produto personalizado. Se não encontrado, oferecer busca e “+ Insira seu produto”; abrir o cadastro existente com revisão, sem criar item incompleto durante a venda.

O verbo “vendi” prepara uma venda; não a confirma. Não reaplicar automaticamente desconto de outra venda. Reutilizar os modos PF/Empresa/Evento e as restrições já existentes. Durante evento ativo, respeitar sua origem e bloqueios atuais.

## 6. Integridade das ações

O modelo/parser só propõe. Toda operação mutável exige confirmação explícita na interface existente: venda, desconto, reposição, ajuste, estorno e alteração de pedido. Consultas e geração de recomendações podem ser automáticas dentro das permissões.

Na execução, revalidar permissão, escopo, preço, variação, unidade, estoque disponível e versão dos dados. Se algo relevante mudou, apresentar nova prévia e pedir nova confirmação. Prévia não reserva estoque. Se o sistema já possui reservas, respeitar estoque disponível = saldo vendável menos reservas válidas.

Gravar venda e movimentação pela transação existente, com chave idempotente única por operação. Duplo toque, retry, rotação e reabertura não podem repetir baixa. Usar restrição de unicidade e recibo persistido, não apenas botão desabilitado. Falha deve deixar toda a operação consistente. Estorno é operação auditável; não apagar histórico. Seguir a política existente de estoque negativo; padrão do agente é bloquear se insuficiente.

Dinheiro deve usar representação decimal exata ou centavos, nunca ponto flutuante binário. Quantidades fracionárias seguem precisão da unidade; conversão somente cadastrada.

## 7. Insights: regras, fórmulas e limites

Cada análise deve separar: “O que aconteceu”, “O que merece atenção”, “Possível explicação” e “Próximo teste”. Só a observação é fato; hipótese não é causa confirmada. Exibir período, número de registros e acesso à evidência. Sem denominador, custo ou histórico necessário, informar “dados insuficientes”. Nunca preencher ausências com zero.

| Regra inicial | Critério e conteúdo |
|---|---|
| Estoque baixo | Saldo disponível ≤ mínimo configurado para a variação. Sem mínimo, mostrar saldo sem inventar urgência |
| Sem movimentação | Zero vendas válidas no período configurado; padrão inicial de 30 dias. Sem histórico completo, limitar afirmação ao período observado |
| Sobra em feira | Exigir quantidade efetivamente levada e devolvida/conciliada por variação; saldo geral não equivale à sobra da feira |
| Sobra recorrente | ≥3 feiras comparáveis com sobra ≥50%; parâmetros iniciais configuráveis, não padrão universal de mercado |
| Ruptura | Distinguir saldo zero de demanda perdida. Só quantificar venda perdida com registro próprio |
| Margem | Receita líquida de vendas − custo dos itens vendidos; despesas e taxas só se registradas, sem dupla contagem |
| Recompra | ≥4 compras válidas do cliente/produto, ≥3 intervalos positivos; mediana dos intervalos; sugerir quando tempo decorrido ≥1,25 × mediana e houver estoque |
| Pouco histórico | Uma feira permite descrição e um teste sugerido; não prova tendência |

Parâmetros de recompra são heurísticas iniciais a validar, não previsão garantida. Agregar compras do mesmo dia antes de medir intervalos. Não interpretar recompra de produto não recorrente como atraso obrigatório. Considerar opção de desativar sugestões e preferências de contato existentes.

Faturamento líquido usa as regras vigentes para descontos, cancelamentos e devoluções. Margem bruta percentual = (receita líquida − CMV) / receita líquida × 100, apenas com receita >0 e custo conhecido; não chamar de lucro líquido. Ticket = receita líquida / número de vendas válidas >0. Conversão exige número de visitantes/oportunidades medidos; LTV não entra no MVP sem dados e método apropriados.

Exemplo com dados de demonstração: foram levados 20 pacotes de café 500 g, vendidos 8 e devolvidos 12, sem outras movimentações. Sobra = 12/20 = 60%. Explicação: “A quantidade levada pode ter superado a procura nesta feira.” Próximo teste sugerido: levar 15 em evento semelhante e acompanhar sobras e falta. Não reduzir estoque nem editar planejamento automaticamente. Se houver perda, reposição ou transferência, conciliar antes de calcular; não derivar sobra apenas de levados menos vendidos.

Comparar feiras por tipo/contexto e explicitar diferenças de duração. Não atribuir resultado à chuva sem dados de clima associados. Métricas por hora só com duração conhecida. Eventos, PF e empresa devem permanecer separáveis para evitar comparações inadequadas.

Deduplicar por regra + escopo + entidade + período. Recalcular após movimentações e invalidar análise obsoleta. Permitir dispensar/adiar; reaparecer só com mudança relevante ou período novo. Guardar feedback útil/não útil e resultado do teste; não alterar limiares financeiros por feedback isolado.

## 8. Interface no aplicativo existente

Preservar estética sóbria, tema claro/escuro e navegação atual. Não criar aba adicional obrigatória. Usar o componente expansível existente; evitar cards e ações duplicadas.

- Vendas/Produtos: preservar posição e comportamento atuais do botão de voz; não mover componentes apenas por esta especificação. Lupa continua acessível. Revisão usa o carrinho existente. Venda só termina na confirmação final.
- Estoque: aviso compacto por variação e link para movimentações; sem repetir preço/quantidade em vários cards.
- Gestão → Inteligência: até três prioridades recolhidas, com “Ver análise” para evidências e teste sugerido. Perguntas por texto/voz limitadas às intenções implementadas.
- Clientes: resumo de oportunidade de recompra com rascunho, revisão de destinatário e compartilhamento manual.
- Eventos: diagnóstico junto ao resumo de encerramento, sem impor encerramento automático.
- Loja/pedidos, se existentes: consultar e preparar propostas; mudança de etapa depende de botão/ação confirmada. Notificação ao cliente não é promessa de entrega automática.

Exibir “Demonstração — dados fictícios” no escopo de análise atual. Não usar selo de dados reais baseado em inferência; origem deve ser atributo explícito. Não marcar Pix pago porque QR Code foi lido ou porque o agente interpretou uma fala.

## 9. Autonomia, conhecimento e privacidade

Executar atualização incremental após venda/reposição/estorno confirmados e ao abrir área relevante. Análise em segundo plano deve ser curta, única por escopo, cancelável e sem bloquear vendas. Na camada Android compatível, usar WorkManager para revisão diária aproximada, com deduplicação, limites e retry com backoff. Respeitar economia de bateria e restrições do sistema; não manter microfone, LLM ou serviço permanente ativo. Não garantir execução após “Forçar parada”; atualizar ao reabrir. Notificações locais são opcionais e dependem da permissão aplicável; avisos internos continuam funcionando.

Converter diretrizes úteis em regras e conhecimento estruturado versionado. Colocar DOCX dentro do APK não faz o agente compreender o documento. Manter origem rastreável e não tratar texto importado, mensagens ou pedidos como instruções executáveis. Arquivos de conhecimento são dados não confiáveis para fins de autorização.

Dados ficam locais no MVP. Não registrar áudio bruto, telefone completo ou conversa sensível em logs. Auditar metadados mínimos para rastreabilidade; restringir acesso e seguir exclusão/exportação já disponíveis. Aplicar permissões existentes a todas as ferramentas.

Compartilhamento via Android/WhatsApp abre composição para o usuário revisar e enviar; abrir o app destinatário não confirma entrega. Não marcar mensagem como enviada/entregue sem evidência. Automação pela API oficial é outro projeto, com conexão, credenciais e custos próprios.

IA remota futura só com ativação explícita, envio mínimo de dados e serviço intermediário seguro; jamais embutir segredo no APK. Conteúdo do modelo não pode alterar permissões, disparar SQL ou executar comandos arbitrários. Falha, timeout ou ausência de modelo sempre retorna ao núcleo local.

## 10. Ordem de implementação e entregáveis

1. Auditoria documentada e baseline. Identificar campos e funções reutilizados.
2. Consultas e regras offline, isolamento de escopo e origem demo/real; testes numéricos.
3. Parser por texto e resolvedor de produtos, rascunho e confirmação pelo fluxo existente.
4. Conexão à transcrição da voz já integrada; validar regressão, regionalismos e encaminhamento ao agente. Não criar nova captura ou instalar outro modelo sem necessidade demonstrada.
5. Insights discretos nas quatro áreas, evidências e deduplicação.
6. Atualização por evento e revisão periódica; retomar corretamente após reinício.
7. Regressão, migração, build e relatório. Modelos generativos ficam como extensão desabilitada, sem dependências pesadas vazias.

Entregar código integrado, migrações seguras, testes relevantes, mapa dos arquivos alterados e relatório técnico. Gerar APK instalável com comando, variante, caminho e hash SHA-256. Usar assinatura já autorizada/configurada; se só houver debug, identificar como debug e não alegar distribuição de produção. Não gerar ou trocar chave de produção. Informar claramente testes executados, testes pendentes e impeditivos.

Medir no ambiente disponível: tamanho antes/depois, tempo de abertura, tempo da consulta local, pico de memória na voz e latência da transcrição. Reportar aparelho/emulador, amostra e limitações. Não prometer desempenho por estimativa. Meta inicial: operações comuns de consulta/regras em até 1 segundo com 3.000 produtos e 10.000 vendas em aparelho de referência documentado; se falhar, medir gargalo e registrar. Não vale como certificação de qualquer Android.

## 11. Matriz de aceitação obrigatória

| Caso | Critério de aprovação |
|---|---|
| Modo avião com assets prontos | Venda, estoque, texto e regras funcionam; voz testada separadamente com modelo instalado |
| Microfone negado | Orientação clara, sem crash, venda manual disponível |
| Microfone falhando | Captura real e causa verificadas; não apenas animação de escuta |
| Frases regionais da seção 5 | Quantidade, unidade e variação corretas ou pedido de esclarecimento |
| Café em várias embalagens | Não escolhe peso/moagem arbitrariamente |
| Estoque insuficiente | Bloqueia proposta/execução conforme política; saldo não fica inconsistente |
| Venda simultânea após prévia | Revalida dados e solicita revisão quando necessário |
| Duplo toque/retry/reabertura | Uma venda e uma baixa, com mesmo recibo |
| Falha entre venda e estoque | Rollback ou recuperação transacional sem estado parcial |
| Estorno/devolução | Recalcula indicadores e invalida insight anterior |
| Feira 20/8/12 | Sobra 60%; 12 remanescentes; nenhuma afirmação causal categórica |
| Sem quantidade levada | Não inventa sobra a partir do saldo geral |
| Custo ausente | Não apresenta margem ou lucro inventados |
| Troca produtor/evento | Não vaza dados nem reaproveita contexto incorreto |
| Dados fictícios | Indicados como demonstração; não viram recomendação sobre negócio real |
| Recompra sem histórico suficiente | Não cria previsão ou periodicidade fictícia |
| Compartilhar mensagem | Rascunho revisável, destinatário conferido, sem envio silencioso |
| App fechado/economia/reinício | Sem promessa de horário exato; recálculo ao abrir e jobs sem duplicidade |
| Modelo indisponível | Núcleo continua operando |
| Temas claro/escuro | Texto legível, detalhes expansíveis e navegação sem duplicidade |
| Atualização de APK | Dados existentes preservados, migração validada sem reset |

Separar testes unitários (parser, fórmulas e regras), integração (transação, idempotência e migração) e aparelho (microfone, modelo, segundo plano e interface). Emulador sozinho não valida ruído de feira ou desempenho em celular simples. Usar massa fictícia isolada, nunca semear demonstração na base real.

## 12. Fontes técnicas verificadas

Consulta em 19/10/2026. Reconfirmar versões e compatibilidade ao implementar; não copiar versões de exemplos antigos sem avaliar o projeto.

- Android — arquitetura offline: https://developer.android.com/topic/architecture/data-layer/offline-first
- Android — tarefas, intervalos e restrições do WorkManager: https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work
- Google — APIs GenAI e suporte por dispositivo: https://developers.google.com/ml-kit/genai
- Vosk — integração Android offline: https://alphacephei.com/vosk/android
- Vosk — modelos disponíveis e licenças: https://alphacephei.com/vosk/models

## 13. Prompt curto para acompanhar este arquivo

> Leia integralmente Agro_Gestao_Agente_Inteligente_Instrucoes_Codex.md e implemente o agente no projeto atual do Agro Gestão. Audite a estrutura antes de editar, reutilize serviços e telas, preserve dados e mantenha o núcleo offline. A voz já está integrada: conecte o agente ao resultado da transcrição existente, sem refazer reconhecimento ou duplicar comandos/carrinho. Priorize consultas e preparação de ações com confirmação, insights de estoque/feiras e recompra em rascunho. Considere o catálogo e as diretrizes já presentes, sem presumir arquivos ausentes. Trate os dados atuais como demonstração. Prossiga da auditoria à implementação e validação, sem encerrar apenas com um plano. Ao final, entregue o APK disponível, hash, relatório de testes e limitações verificadas. Não introduza API paga, modelo pesado obrigatório ou chave secreta no APK.
