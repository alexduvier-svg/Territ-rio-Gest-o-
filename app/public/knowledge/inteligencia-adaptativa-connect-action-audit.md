# AGRO GESTÃO — DIRETRIZ DE IMPLEMENTAÇÃO: INTELIGÊNCIA ADAPTATIVA AO DISPOSITIVO

**Destinatários:** Codex e Claude Code  
**Tipo:** Diretriz técnica/funcional para inspeção e implementação condicionada no projeto real  
**Data:** 22 de outubro de 2026  
**Prioridade:** Alta — estabilidade e compatibilidade acima de funcionalidades experimentais

## 0. ORDEM INICIAL OBRIGATÓRIA: INSPECIONAR ANTES DE MODIFICAR

**Primeira resposta do Codex deve ser um diagnóstico do repositório real, sem modificar arquivos.** Identificar:

1. Stack real do projeto: Kotlin, Java, Flutter, React Native, WebView, frameworks, SDK mínimo/alvo, Gradle, distribuição APK/AAB e configurações de build.
2. Bancos, repositórios e serviços existentes para vendas, estoque, clientes, catálogo, pedidos, eventos, clima, ERP/CRM e dashboards; motor de memória e ação; logs, trilhas de auditoria, testes, DI e filas locais.
3. Funcionalidades já implementadas e duplicidades. Determinar se **Connect**, **Action** e **Audit** já existem total ou parcialmente e **estender serviços existentes** em vez de criar componentes redundantes.
4. Mecanismos já existentes de detecção de capacidade, configuração, sincronização, processamento em segundo plano, política de memória e proteção de dados.
5. Pontos críticos que NÃO podem quebrar: venda, registro de pagamento, baixa de estoque, origem de venda PF/CNPJ/evento, eventos ativos, clientes, compartilhamento de pedidos e relatórios.
6. Disponibilidade e compatibilidade das bibliotecas nativas da stack; não presumir que o projeto é Kotlin nem migrar framework sem autorização.
7. Listar arquivos a alterar, impacto, riscos, plano de rollback, testes e necessidade de novas dependências. Solicitar aprovação técnica **antes de refatorações amplas ou mudanças destrutivas**. Para alterações aditivas, pequenas e comprovadamente seguras, executar conforme escopo aprovado.

**Não reinstalar voz/reconhecimento de fala. A função de voz foi retirada pelo responsável pelo projeto por problemas de funcionamento.** Não introduzir botão, dependência, serviço, permissão de microfone nem fluxos ocultos de voz. 

**Não exigir API externa, credencial, nuvem, assinatura, pagamento por token, login externo ou conexão permanente para os três agentes.** O app deve permanecer funcional offline. Não adicionar telemetria remota sem decisão explícita.

## 1. OBJETIVO DO SISTEMA ADAPTATIVO

Implementar **um único APK/AAB com comportamento adaptativo**, no qual uma rotina leve, executada **na primeira abertura após a instalação** (não dentro da instalação do Android), detecte a capacidade efetivamente disponível e habilite perfis locais apropriados.

- **CORE obrigatório em TODOS os aparelhos compatíveis:** funcionamento atual do AGRO Gestão e os três papéis Connect, Action e Audit por regras determinísticas e dados locais.
- **EXTENSÕES condicionais:** agregações estatísticas, insights mais complexos, auditorias por lotes e IA generativa local somente quando suportadas e aprovadas pelo perfil de desempenho.
- **Adaptação dinâmica:** reduzir carga quando faltar memória, bateria, armazenamento ou margem térmica, sem comprometer a integridade das operações centrais.
- **Falha segura:** detecção indisponível/ambígua = perfil Essencial; sem acesso a IA local = usar regras e estatísticas simples; dados não confiáveis = não executar mutações automáticas.
- **Otimização por tarefa:** executar apenas o trabalho útil necessário, não manter três LLMs ou três serviços permanentes concorrentes.

## 2. TRÊS RESPONSABILIDADES, NÃO TRÊS CHATBOTS

### 2.1 CONNECT — somente leitura por padrão

- Consulta repositórios locais já existentes; normaliza identificadores sem modificar a fonte canônica.
- Relaciona famílias/variações/pesos de produtos, preços, estoques, vendas, clientes, pedidos, eventos, previsão previamente disponível e resultados.
- Usa DTOs/contratos para fornecer contexto consistente ao Action e Audit.
- Não deve duplicar banco de dados de estoque ou criar uma segunda verdade para o saldo.
- Caso haja sincronização com algum serviço pré-existente, aplicam-se as regras e permissões atuais; a nova camada não deve introduzir sincronização obrigatória.

### 2.2 ACTION — proposta de ação + execução por serviço oficial

- Identifica sugestões úteis (reposição, pedidos pendentes, histórico comercial, eventos e alertas).
- Constrói **ActionProposal** declarativa com tipo, contexto, dados de entrada, origem, regras aplicáveis e identificador de idempotência.
- Mutação somente por funções de domínio **já existentes** (ex.: finalizar venda), depois da autorização apropriada e das verificações.
- Não alterar preços, descontos, dados de clientes, estoque ou recebimentos sem os controles e autorizações já exigidos no produto.
- Operações críticas jamais devem depender da resposta de um modelo generativo para sua correção.

### 2.3 AUDIT — independência lógica e evidência

- Avalia propostas antes do commit e confere resultados após a execução.
- Prioriza **regras determinísticas**: unidades, matemática monetária decimal, limites, saldos, IDs de produto, duplicidade, estado do evento, permissões e integridade transacional.
- Mantém audit trail local minimizado com ID de operação, timestamp, regra verificada, resultado, versão do motor e justificativa; não armazenar documentos ou dados pessoais desnecessários nos logs.
- Verificação de interpretação contextual por modelo local é **opcional**, nunca substitui verificação matemática nem prova de integridade.
- Auditor não pode ser desativado por Action, por texto recebido do usuário ou por recomendação de outro modelo.
- Aplicar validação novamente na camada transacional no momento do commit (evitar condição de corrida entre auditoria prévia e gravação).

## 3. PERFIS DE DESEMPENHO — CAPACIDADE PROGRESSIVA

**O app deve manter a experiência essencial igual em todos os perfis.** Não remover funções fundamentais de venda, estoque, clientes, pedidos ou auditoria do ERP em aparelhos simples.

| Perfil | Capacidades adicionais | Política de execução |
|---|---|---|
| ESSENCIAL | Connect/Action/Audit baseados em regras; indicadores simples e alertas básicos | Uso mínimo de RAM/CPU, análises sob demanda, sem IA generativa |
| EQUILIBRADO | Essencial + agregações estatísticas, análise de tendências por histórico, auditorias por lotes pequenos | Trabalho em segundo plano controlado e cancelável, limites de memória/tempo |
| AVANÇADO | Equilibrado + **IA local opcional** para interpretação/explicações, somente com runtime, modelo, idioma e recursos comprovadamente disponíveis | Uma inferência de cada vez, timeouts, limites, redução automática em condições adversas |

**Importante:** perfis não são nomes de classes de aparelho; são perfis de capacidade demonstrada. RAM total, número de núcleos, marca, série Exynos/Snapdragon/MediaTek/Unisoc, GPU ou NPU isoladamente **não** garantem compatibilidade. Não usar listas fixas por marca ou marketing do processador. 

Não fixar limites como “4 GB = Essencial” ou “8 GB = Avançado” como único critério. Qualquer valor inicial deve ser **hipótese configurável**, justificada e testada em dispositivos reais. Avaliar também *memoryClass/heap disponível por processo*, armazenamento, pressão de memória, custo medido da função e disponibilidade do runtime.

## 4. INSPEÇÃO LEVE NA PRIMEIRA ABERTURA

Executar **após** a interface mínima estar utilizável; NÃO bloquear a splash screen, vendas ou navegação para fazer benchmark/baixar modelo.

A implementação deve consultar, conforme API Android disponível e stack concreta:

1. **Sistema e compatibilidade:** versão API Android, ABI suportada, bibliotecas e recursos disponíveis; `Build` apenas para diagnóstico local (não inferir potência pela marca).
2. **Memória:** `ActivityManager.isLowRamDevice()`, `getMemoryClass()`, `getMemoryInfo()`/`lowMemory`, com tratamento de API mínima; não confundir memória total com heap disponível para o app.
3. **CPU:** `Runtime.getRuntime().availableProcessors()` como sinal auxiliar, não equivalente direto a desempenho.
4. **Armazenamento livre:** API apropriada ao diretório privado do app (`StatFs`) e tamanho real da extensão ou modelo potencial.
5. **Economia de energia:** `PowerManager.isPowerSaveMode()` e condições atuais de bateria quando acessíveis sem permissões invasivas.
6. **Estado térmico:** `PowerManager.getCurrentThermalStatus()` em Android 10/API 29+ e/ou APIs térmicas adicionais conforme versão; sem sondagem contínua excessiva.
7. **Suporte real a IA local:** no caso de AICore/ML Kit GenAI, consultar `checkStatus()`/`checkFeatureStatus()` e distinguir AVAILABLE, DOWNLOADABLE e UNAVAILABLE; verificar idioma/tarefa e condições do SDK. AICore **não** existe/funciona em todos os Androids. No caso de runtime próprio (ex. LiteRT/MediaPipe/LLM engine), verificar existência e compatibilidade do modelo e executar teste de inferência controlado.
8. **Qualidade medida:** benchmark CURTO, não intrusivo, em thread adequada e somente para recursos realmente candidatos; medir latência, memória de pico e falhas. Não impor benchmark longo no primeiro uso.

Persistir perfil/capacidades e versão do detector com mecanismo de preferências local já existente (DataStore se projeto nativo e for coerente com stack). Reavaliar em atualização importante do app/modelo, reinstalação, mudança significativa de disponibilidade de recurso e por pedido do usuário; evitar reexecutar testes pesados a cada abertura.

**Nunca executar código próprio durante a instalação do pacote Android.** Para distribuição Google Play, avaliar separadamente Play for On-device AI (beta) e asset packs com entrega na instalação, posterior ou sob demanda e segmentação por RAM/modelo, quando cabível. Para APK autônomo distribuído diretamente, componentes necessários para uso 100% offline desde a primeira abertura devem estar empacotados no APK; modelo opcional baixado posteriormente não estará disponível offline antes do download. Não aumentar significativamente o APK base sem demonstração de necessidade.

## 5. ALGORITMO DE DECISÃO RECOMENDADO (PSEUDOCÓDIGO)

```text
firstLaunch():
    renderEssentialUIImmediately()
    ensureCoreRepositoriesAndDomainValidationRemainActive()
    if noSavedCapabilityProfile or profileVersionOutdated:
        scheduleLightweightCapabilityScanOffMainThread()

scanDevice():
    signals = readSupportedOSSignalsSafely()
    localGenAI = checkOptionalRuntimeStatusWithoutDownloading()
    profile = ESSENTIAL // fallback conservador
    if signals.supportBackgroundAggregations && !signals.lowMemory && !signals.powerSave:
        profile = EQUILIBRADO
    if profile == EQUILIBRADO && localGenAI.available &&
       localGenAI.languageSupported && localGenAI.modelReady &&
       signals.storageSafe && signals.thermalSafe && signals.memoryBudgetSafe &&
       controlledInferenceProbeMeetsMeasuredBudgets:
        profile = AVANCADO
    persistLocalProfileAndEvidence(profile, nonIdentifyingSignals)
    exposeEnabledCapabilitiesToExistingServices()

beforeOptionalWork():
    if lowMemory or batterySaver or thermalStress or storagePressure:
        downgradeToSafeWorkPolicy()
        cancelOrDeferNonCriticalJobs()
    neverDisableRequiredFinancialAuditOrTransactionalGuards()

onDeviceImprovementOrRecovery():
    considerReevaluationWithHysteresisAndCooldown()
    upgradeOnlyAfterEvidenceAndStableConditions()

executeAction(proposal):
    context = CONNECT.readConsistentSnapshot()
    precheck = AUDIT.validateProposal(proposal, context)
    if precheck.requiresUserConfirmation: askUser()
    if precheck.blocked: showReasonWithoutMutation()
    else:
        result = DOMAIN_SERVICE.commitAtomicallyWithFinalValidation(proposal)
        AUDIT.recordAndVerifyResult(result)
```

Notas: esta é uma política de referência, não código pronto para compilar. Codex deve adaptar APIs, testes e concorrência ao projeto real e não presumir que `available` significa modelo já baixado ou idioma compatível. Exigir histerese para evitar alternância constante entre perfis.

## 6. COMPORTAMENTO DE CADA AGENTE POR PERFIL

| Tarefa | Essencial | Equilibrado | Avançado |
|---|---|---|---|
| Consultar estoque/produtos/preços | Sim | Sim | Sim |
| Preparar propostas de ação | Regras | Regras + tendência | Regras + tendência + explicação local opcional |
| Verificar valores, estoque, duplicidade | Sempre | Sempre | Sempre |
| Diagnóstico de reposição | Limiares simples | Histórico de giro | História + explicação textual local quando suportada |
| Identificar pedidos pendentes | Sim | Sim | Sim |
| Cruzar dados de vendas/eventos | Consultas diretas | Agregados | Agregados + narrativa local opcional |
| Interpretação de linguagem natural digitada | Não exigida | Não exigida | Opcional, apenas com runtime e idioma validados |
| Voz / microfone | **Não** | **Não** | **Não** |
| API remota paga | **Não** | **Não** | **Não** |

**Separar 'ter três agentes' de 'rodar três modelos'.** Se o aparelho for simples, os três papéis serão módulos de software determinístico. Se suportar IA generativa local, o modelo é um recurso compartilhado e sob demanda, nunca três inferências pesadas concorrentes.

## 7. ADAPTAÇÃO DINÂMICA DURANTE O USO

- Acompanhar `onTrimMemory` compatível com a versão, sinais de memória baixa, bateria, temperatura e latência real de tarefas opcionais.
- Usar listener térmico onde disponível ou verificações pontuais. **Não** fazer polling intenso.
- Ao detectar pressão, cancelar análises não críticas, reduzir lote, liberar modelos e caches opcionais e preferir perfil de trabalho inferior.
- Não parar, adiar, duplicar ou descartar transações de vendas já iniciadas; operações críticas têm prioridade e integridade atômica.
- Após recuperação estável, permitir nova análise de capacidade em momento oportuno, com *cooldown* para evitar flutuações.
- Registrar localmente motivos de downgrade de forma não intrusiva e expor somente um resumo compreensível em Configurações.
- Não manter IA generativa permanentemente carregada em memória quando o usuário não a utiliza.

## 8. TAREFAS EM SEGUNDO PLANO

- Seguir o agendador já adotado no projeto; em Android nativo, avaliar WorkManager para trabalhos adiáveis e persistentes, com `BatteryNotLow`, `StorageNotLow`, `RequiresCharging`/`DeviceIdle` quando apropriado.
- Cálculos triviais não precisam ser WorkManager nem serviço persistente.
- Não criar loops permanentes, notificações contínuas ou *foreground service* sem necessidade legitimada.
- Cargas pesadas não devem coincidir com fluxo de venda, pagamento, abertura da tela de estoque ou uso do carrinho.
- Trabalhos canceláveis e retomáveis devem preservar consistência e idempotência.

## 9. INFERÊNCIA DE IA LOCAL: REQUISITOS ESPECÍFICOS

IA generativa **não é requisito** dos agentes. Se for proposta como extensão:

1. Priorizar SDK/runtime mantido, compatível com SDK mínimo, ABI, modelos e políticas de distribuição. Comparar de forma justificada AICore/ML Kit GenAI (quando suporte disponível) vs modelos empacotados com LiteRT/MediaPipe ou alternativa adequada.
2. Conferir APIs concretas e suporte de idioma português do Brasil, tarefa e limites de entrada; não habilitar apenas porque o aparelho é topo de linha.
3. Distinguir modelo no APK, modelo disponível via sistema e download opcional (com consentimento explícito, tamanho exibido e opção de cancelar). Não iniciar downloads silenciosos.
4. Informar claramente o espaço exigido; usar verificação de integridade e proveniência do modelo; não carregar modelos grandes no fluxo crítico do ERP.
5. Não usar IA local para somas financeiras, baixa de estoque, autorizações ou garantia de correção; gerar apenas interpretação ou sugestões verificadas por regras.
6. Se dispositivo/runtimes incompatíveis ou modelo indisponível: usar instantaneamente os níveis determinísticos sem apresentar erro ao produtor.
7. Medir benefício antes de aumentar tamanho do APK, RAM e consumo de bateria. Se custo exceder benefício, deixar extensão desativada.

## 10. UI/UX: MINIMALISMO E TAMANHOS DIFERENTES

- **Nenhuma aba para cada agente.** Manter Produtos/Vendas, Estoque, Clientes, Gestão, Eventos e Clima atuais.
- Informações inteligentes discretas, no momento adequado, em cards/pills coesos; sem telas poluídas nem repetição de dados.
- Em Configurações → "Inteligência no dispositivo": exibir `Automático (recomendado)`; perfil efetivo `Essencial/Equilibrado/Avançado`; situação das análises locais; modo economia manual; botão `Reavaliar capacidade` com execução assíncrona.
- Não exigir diagnóstico inicial, tela extra ou permissões para iniciar uma venda.
- Permitir ao usuário escolher modo Essencial a qualquer momento; não oferecer forçar Avançado incompatível nem desativar auditoria obrigatória.
- Adaptar densidade, tamanhos de toque, texto e contraste à **largura disponível em dp**, escalonamento do texto, janela, orientação e tamanho de fonte; não usar resolução em pixels ou marca para determinar layout. Suportar telas menores e fontes maiores.
- Manter acessibilidade, estados carregando/erro e feedback claro sem animações custosas em aparelhos simples.
- Não reintroduzir busca por voz nem microfone.

## 11. SEGURANÇA E PRIVACIDADE

- Informações de clientes, documentos, estoque e vendas permanecem locais por padrão. Não enviar perfil de hardware, IDs ou dados comerciais a terceiros sem necessidade real, transparência e base legal.
- Evitar IMEI, identificadores persistentes e permissões de localização, contatos ou telefone apenas para classificar desempenho.
- Usar banco e armazenamento privados do aplicativo, backup/criptografia quando pertinentes à arquitetura real e política de proteção de dados.
- Nunca registrar textos integrais de clientes ou documentos em logs diagnósticos; usar mínimo necessário e política de retenção.
- Permissões de Action e limites de Auditor devem ser controlados pelo código de domínio, não por prompt.
- Manter trilha de auditoria inviolável na medida tecnicamente possível no contexto local, com controles de integridade e backup; não prometer inviolabilidade absoluta em aparelho comprometido.

## 12. MATRIZ DE TESTES OBRIGATÓRIOS

Testar em aparelhos físicos representativos e emuladores para cobertura adicional, incluindo pelo menos um dispositivo efetivamente limitado e outro com capacidade alta. Incluir modelos Samsung, Motorola, OPPO e marcas de entrada quando houver acesso, sem assumir comportamento por fabricante.

Cenários:

1. Primeira abertura offline, com bateria baixa e pouca memória: app abre rápido, usa Essencial, vende normalmente.
2. Primeiro uso em dispositivo intermediário: Equilibrado sem download e sem alterações visuais abruptas.
3. Aparelho avançado sem AICore/modelo: **não** habilitar IA generativa por engano; manter Equilibrado.
4. Aparelho avançado compatível, com modelo e idioma suportados: ativar recurso local opcional após teste seguro, sem afetar vendas.
5. Aumento de temperatura durante análises: suspender processamento extra sem perder transações.
6. Pressão de memória e encerramento pelo sistema: recuperar sessão e dados persistidos sem perda/duplicidade.
7. Modo economia de bateria e armazenamento reduzido: trabalho secundário adiado ou cancelado, fluxo principal preservado.
8. Atualização de APK/AAB: reavaliação quando necessária; sem migração destrutiva ou limpeza de dados.
9. Venda repetida por toques rápidos, confirmação e cancelamento: idempotência, integridade de estoque e transação atômica.
10. Venda PF/CNPJ/evento ativo: as restrições existentes permanecem corretas.
11. Produtos de mesma família e pesos variados (250g, 500g, 1kg): identidade e preços não são confundidos.
12. Pedidos e clientes: sem criar etapas de envio automático por canais externos.
13. Orientação do dispositivo/telas pequenas/acessibilidade: botões alcançáveis, sem corte de valores e ações.
14. Modelo local travando, indisponível ou devolvendo texto contraditório: fallback determinístico, nenhum dado financeiro alterado.
15. Benchmark real: medir abertura, latência de venda, scroll, memória, consumo e incidência de ANR/OOM nos aparelhos de teste.

Critérios de aceitação qualitativos: nunca impedir venda por falta de IA; não haver cobrança obrigatória por API; manter dados locais; nunca duplicar vendas; nenhuma regressão em estoque; não reativar voz; UI limpa; não ampliar significativamente tamanho/tempo de abertura sem justificativa e testes.

Metas quantitativas devem ser propostas com base no desempenho da versão atual e validadas em dispositivos reais; NÃO inventar garantias universais de 60 fps ou limites rígidos de tempo sem medição.

## 13. PLANO INCREMENTAL DE IMPLEMENTAÇÃO

**Etapa A — Somente leitura**: relatório de arquitetura, inventário funcional, diagnóstico de duplicidades, identificação de repositórios canônicos e plano de regressão.

**Etapa B — Capability Profiler**: detector leve, `DeviceCapabilityProfile`, `CapabilityPolicy`, persistência, estados de erro e testes; nenhuma IA generativa embutida.

**Etapa C — Núcleo Connect/Action/Audit**: ligar serviços existentes, propostas de ação, regras determinísticas e trilha local, mantendo interface atual.

**Etapa D — Adaptador dinâmico**: regras de downgrade, memória/térmica/bateria, tarefas sob demanda, testes de aparelhos lentos.

**Etapa E — Inteligência estatística**: somente se dados reais disponíveis e custo de processamento aceitável; provar utilidade com indicadores.

**Etapa F — IA local opcional**: estudo de viabilidade, compatibilidade, licença/modelo, tamanho do APK/AAB e bateria; NÃO instalar na fase anterior por presunção.

**Etapa G — Release controlado**: teste de regressão completo, comparativo de build, rollback e relatório final.

## 14. ENTREGÁVEIS EXIGIDOS DO CODEX

Antes de alterar código:
- Matriz `existe / parcialmente / não existe` para detecção de hardware, Connect, Action, Audit, segurança, persistência, agendamento e IA local.
- Plano com arquivos/módulos reais, dependências propostas, impactos e riscos.
- Parecer explícito: **É recomendável criar os três papéis? Quais já existem e devem ser reaproveitados?**
- Indicação de como preservar suporte aos aparelhos de entrada.

Depois de implementar cada etapa:
- Alterações efetuadas e justificativas; dependências/licenças e impacto no APK/AAB.
- Evidências de testes, incluindo casos de falha, downgrade e funcionamento offline.
- Diferenças de tempo de abertura, RAM, latência do fluxo de venda e travamentos em comparação à versão anterior (ou declarar que não foram medidas).
- Lista de funções testadas que permaneceram intactas; riscos remanescentes e rollback.
- Confirmação explícita de **sem voz, sem API paga obrigatória, sem três modelos simultâneos e sem duplicidade funcional desnecessária**.

## 15. MENSAGEM OPERACIONAL CURTA AO CODEX

> Analise a diretriz anexa e **primeiro faça inspeção somente leitura do projeto AGRO Gestão**. Confirme o que já existe em banco local, motor de memória/ação, agentes, verificações, performance e configurações. Não crie três chatbots nem reinstale a função de voz. Avalie implementar um único mecanismo adaptativo na primeira abertura do APK, com perfis Essencial, Equilibrado e Avançado e downgrade durante o uso. Todos os aparelhos devem manter Connect, Action e Audit determinísticos; IA generativa local será opcional e condicionada à compatibilidade real. Não introduza APIs pagas nem dependência online. Reutilize ao máximo funções existentes e preserve venda/estoque/cliente/evento. Entregue diagnóstico de duplicidades, plano de alterações, testes e riscos antes de começar a implementação.

## REFERÊNCIAS TÉCNICAS OFICIAIS (VALIDAR CONFORME A STACK)

- Android — ActivityManager: https://developer.android.com/reference/android/app/ActivityManager
- Android — Gestão de memória: https://developer.android.com/topic/performance/memory/manage-app-memory
- Android — PowerManager e estado térmico: https://developer.android.com/reference/android/os/PowerManager
- Android — Trabalho em segundo plano/WorkManager: https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work
- Google ML Kit — GenAI APIs e compatibilidade: https://developers.google.com/ml-kit/genai
- Google ML Kit — Prompt API / verificação de disponibilidade: https://developers.google.com/ml-kit/genai/prompt/android/get-started
- Google Play — IA no dispositivo (beta), asset packs: https://developer.android.com/google/play/on-device-ai
- Android — Baseline Profiles: https://developer.android.com/topic/performance/baselineprofiles/overview

**PRINCÍPIO FINAL:** o AGRO Gestão deve ser útil e confiável no celular mais simples compatível; dispositivos mais fortes recebem camadas adicionais de inteligência, jamais uma versão mais correta dos cálculos e operações financeiras.
