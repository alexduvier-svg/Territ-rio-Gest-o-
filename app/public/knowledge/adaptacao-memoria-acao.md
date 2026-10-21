# Adaptação, memória e ação

Referência canônica: src/data/adaptation-guidelines.js, versão1. Fonte: documento do produtor de21/10/2026. Metas de desempenho são propostas, não certificações. Capacidade não é classificada por marca ou chip. Voz permanece removida por pedido explícito.

Diretrizes de adaptaçãomemória e açãodo AGRO Gestão
Telas pequenas e aparelhos com recursos limitados
Destinatários  Codex e Claude CodeAplicação  Projeto existente do AGRO GestãoNatureza  Especificação para auditoria e implementação incrementalData  21 de outubro de 2026  •  Versão 1.0
Resultado esperado
O produtor deve conseguir vender, consultar e repor estoque, acessar clientes e recuperar seu trabalho em uma tela pequena e em um celular de menor desempenho. O sistema deve ajustar a apresentação e o custo de processamento, preservar a integridade dos registros e manter as ações essenciais disponíveis.
Adotar uma política central de adaptação baseada na janela disponível, nas capacidades efetivamente expostas pelo sistema e em medições do próprio app. Exynos, Snapdragon, MediaTek, Unisoc e chips Apple não devem receber classificações fixas de qualidade. Uma família de processadores reúne gerações e configurações diferentes.
Três responsabilidades distintas
Memória operacional é a RAM usada por telas, imagens e tarefas. Memória persistente é o conjunto de dados, preferências, regras e evidências armazenadas. O motor de ação decide, agenda e executa comandos. Reduzir consumo de RAM não autoriza apagar vendas, rascunhos, documentos ou ações ainda necessárias.
Aplicação ao projeto real
Este documento não atesta a estrutura atual do aplicativo nem substitui uma inspeção do repositório. Codex e Claude Code devem identificar a tecnologia, os módulos e as diretrizes já instaladas antes de propor mudanças. Reutilizar a implementação existente sempre que ela atender aos critérios daqui.
Os números de desempenho, limites de cache e cenários de teste deste documento são metas iniciais propostas para o AGRO Gestão. Devem ser calibrados no projeto e em aparelhos reais; não são garantias de fabricantes ou limites universais do Android e do iOS. As referências técnicas oficiais estão na seção 13.

2  Auditoria e eliminação de duplicidades
Antes de programar, pesquisar no código, nos documentos, nas configurações e nas dependências as regras de layout, memória, voz, catálogo, clima, estoque, vendas, filas e agentes. Ler as instruções locais aplicáveis. Não criar um segundo motor apenas porque a diretriz chegou por outra ferramenta.
Inventário obrigatório
Para cada responsabilidade, registrar localização, consumidores, versão da regra, testes existentes e comportamento observado. Procurar cópias por finalidade e por comportamento, além de nomes iguais. Duas funções chamadas de forma diferente podem baixar o mesmo clima ou executar a mesma baixa de estoque.
Situação encontrada
Decisão exigida
Mesma regra com comportamento equivalente
Manter uma fonte canônica e fazer os consumidores usá-la.
Regras parcialmente sobrepostas
Consolidar a parte comum e preservar diferenças de domínio justificadas.
Documento contradiz código validado
Verificar requisito atual, impacto e evidências; atualizar a fonte que estiver incorreta.
Regra antiga ainda é consumida
Migrar chamadas e dados antes de desativá-la; preservar compatibilidade necessária.
Duas gravações da mesma ação
Centralizar comando, transação e chave de idempotência.
Implementações específicas por plataforma
Manter adaptadores necessários sob um contrato comum; não eliminar diferenças legítimas.

Como tomar a melhor decisão
Priorizar, nesta ordem: integridade dos dados e segurança da operação; requisito atual do produto; correção demonstrada por testes; compatibilidade com a arquitetura; custo de manutenção e desempenho medido. O arquivo mais novo, mais longo ou escrito por uma ferramenta específica não vence automaticamente.
Quando a decisão for técnica e reversível, executar a consolidação e registrar a justificativa. Quando houver dúvida que possa alterar dinheiro, saldos, consentimentos ou significado de dados históricos, manter o comportamento seguro e explicitar a decisão de produto que falta. Não apagar registros para resolver conflitos de regras.
Coordenação entre Codex e Claude Code
Usar o mesmo repositório, contratos e registro de decisões. Cada entrega deve informar commit de partida, arquivos alterados, migrações e verificações. Evitar edições simultâneas no mesmo arquivo; integrar alterações e executar a verificação pertinente antes do próximo ciclo. Se ambas as ferramentas produzirem soluções, comparar e consolidar uma implementação.
Preferir os documentos de arquitetura já existentes. Se faltarem, criar um mapa curto de responsabilidades e um registro de decisões, em vez de vários arquivos de instruções com o mesmo conteúdo. Esta auditoria deve resultar em alterações concretas e rastreáveis.

3  Tamanho de tela e área disponível
Calcular layout a partir da área atual da janela, considerando largura, altura, teclado, barras do sistema e recortes. Polegadas, resolução física e nome do modelo não determinam o espaço utilizável. No Android, usar dp para layout e sp para texto; no iOS, pontos e escalonamento de fonte; na web, unidades e viewport próprios. Não tratar essas unidades como pixels físicos equivalentes. [1–4]
Janela Android
Aplicação proposta no AGRO Gestão
Largura abaixo de 360 dp
Subfaixa interna de teste: preferir uma coluna e formulários em tela inteira.
360 a menos de 600 dp
Janela compacta: uma coluna como base; duas apenas quando o conteúdo permanecer legível.
600 a menos de 840 dp
Janela média: avaliar lista e detalhe, conforme altura e escala de texto.
840 dp ou mais
Janela expandida ou maior: distribuir conteúdo com largura máxima e painéis úteis.
Altura abaixo de 480 dp
Altura compacta: reduzir cabeçalhos e priorizar área rolável e ação principal.

Os limites de 600 e 840 dp e a altura de 480 dp vêm das classes Android. A subfaixa de 360 dp é uma decisão proposta para este produto. Janelas a partir de 1200 e 1600 dp também têm classes próprias; não é necessário criar mais telas se um mesmo padrão já resolver o uso. [1]
Leitura e toque
Usar alvos de toque de pelo menos 48 × 48 dp no Android e adotar 44 × 44 pt como referência de projeto no iOS. Ícones podem ser menores dentro desses alvos, sem sobreposição de áreas clicáveis. Respeitar a fonte escolhida pelo usuário e testar 100%, 130%, 150% e 200%, além das categorias de acessibilidade do iOS. [2–4]
Não reduzir automaticamente letras, preços ou botões para fazer a tela caber. Permitir quebra de linhas, crescimento vertical e rolagem. Não cortar nome, condição, peso, unidade, quantidade ou valor necessários à decisão. Cor de status deve vir acompanhada de texto ou símbolo acessível.
Reorganização sem perda de estado
Rotação, tela dividida, janela flutuante, teclado e mudança de escala devem preservar produto selecionado, carrinho, valores digitados e posição útil. Atualizar a composição visual sem criar outra venda ou reiniciar o fluxo. Em telas largas, manter linhas de texto com largura confortável, sem esticar campos indefinidamente.
Em implementações web ou híbridas, testar o viewport visual quando o teclado abre, insets e unidades de altura dinâmica. Acesso a hardware deve ocorrer por adaptadores existentes; não presumir que um navegador exponha RAM, temperatura e processador com a mesma precisão de um app nativo.

4  Vendas janelas e navegação compacta
Hierarquia da venda
Na tela de produtos, mostrar nome, condição, peso ou unidade e preço com contraste suficiente. Exemplo: Café especial • moído • 250 g • R$ 25,00. Manter produtos da mesma família contíguos e em ordem crescente de peso, inclusive ao mudar de duas colunas para uma. Ordenar por peso normalizado, não alfabeticamente pelo rótulo.
O carrinho deve destacar produto, quantidade, subtotal e total. Cliente e cidade podem começar recolhidos, com expansão clara e resumo do que já foi preenchido. Campos obrigatórios devem se revelar antes da conclusão, com foco no primeiro erro e explicação próxima ao campo.
Janelas e teclado
Usar diálogo curto para confirmações simples. Para quantidade, pagamento ou formulário longo em janela pequena, preferir tela dedicada ou painel que possa ocupar a altura útil inteira. Evitar diálogos dentro de diálogos. O botão de concluir deve permanecer alcançável por rolagem e acima do teclado, sem cobrir o último campo.
Manter margens adaptáveis e respeitar a área segura inferior. Rodapé, carrinho, botão flutuante e teclado não podem disputar o mesmo espaço. Cabeçalhos e resumos fixos devem encolher ou rolar quando a altura útil cair; não manter grandes áreas decorativas imobilizadas.
Gestos existentes sem efeitos duplicados
Verificar no projeto os contratos de um toque, pressionar e segurar e dois toques. A intenção já discutida para o AGRO Gestão é: um toque abre o produto no carrinho; pressionar permite selecionar até três produtos; dois toques consultam o estoque. Confirmar a implementação real antes de ajustar essa interação.
Um reconhecedor deve arbitrar os gestos para que um duplo toque não dispare primeiro a venda. Medir o atraso de reconhecimento do toque simples e evitar tornar todo clique lento. Usar os parâmetros de acessibilidade da plataforma e oferecer ações visíveis equivalentes para selecionar e consultar estoque. Não criar um segundo manipulador independente em cada camada.
Exemplo de adaptação
Em uma janela de 320 dp com fonte ampliada, trocar a grade por lista. Cada item preserva nome, apresentação e preço; a quantidade fica em controle de toque amplo. O cliente permanece em seção expansível. Na confirmação, o total e a ação Finalizar venda ficam acessíveis mesmo com o teclado aberto.
No mesmo aparelho, retirar desfoque e animações decorativas se houver restrição de recursos. Não retirar preço, indicação de gravação, validação de quantidade ou acesso ao carrinho. No tema claro e no escuro, preservar contraste, feedback de seleção e leitura de campos desabilitados.

5  Processadores marcas e compatibilidade
O processador influencia custo e velocidade, mas não determina sozinho a experiência. Considerar geração do chip, ABI do sistema, RAM utilizável pelo processo, armazenamento, GPU, aquecimento, versão do sistema e carga concorrente. Não escolher o modo leve apenas pelo nome Exynos, Snapdragon ou MediaTek.
Família ou grupo
O que verificar e como adaptar
Qualcomm Snapdragon
Verificar ABI e bibliotecas nativas; medir CPU e renderização. Não exigir SDK proprietário para vender.
Samsung Exynos
Aplicar os mesmos testes; investigar GPU e drivers somente diante de falha reproduzível.
MediaTek Helio e Dimensity
Testar a configuração concreta; limitar concorrência e validar áudio, câmera e aceleração opcional.
Unisoc e outros chips Android
Validar instalação, RAM, armazenamento e dependências. Manter caminho básico por CPU quando cabível.
Apple e chips da série A
Tratar como destino iOS separado, com ciclo de vida e ferramentas próprios. APK não instala no iPhone.

Cobertura por marca
Incluir aparelhos Motorola, Samsung, OPPO, Multi/Multilaser, Xiaomi/Redmi/POCO, Realme, ASUS e Apple na seleção de testes conforme acesso e público real. Essa lista orienta cobertura, não representa ranking de uso no Brasil. Diferentes modelos de uma mesma marca podem exigir perfis distintos.
Variações de permissões, teclado, compartilhamento, câmera e restrição de bateria precisam de teste no aparelho. Criar exceção por fabricante ou modelo somente para problema comprovado, com versão afetada, teste, alternativa e condição de remoção. Evitar listas permanentes de marcas consideradas lentas.
Instalação e dependências nativas
Inspecionar minSdk, targetSdk, ABIs e todas as bibliotecas nativas, inclusive as trazidas por voz, banco, câmera e frameworks. Validar arm64-v8a; avaliar armeabi-v7a apenas se o público, a cadeia de ferramentas e as dependências justificarem suporte a sistemas de 32 bits. CPU de 64 bits não garante sistema operacional de 64 bits. [8]
Verificar compatibilidade das bibliotecas nativas com páginas de memória de 16 KB e testar o pacote final nesse ambiente. Não confundir página de memória com resolução de tela. Confirmar a exigência vigente do canal de distribuição na liberação. [9]
Não elevar a versão mínima do sistema nem migrar framework automaticamente. Para iPhone, avaliar uma compilação iOS da base existente ou outro destino compatível; interfaces, permissões, armazenamento e plugins exigem validação específica. Compartilhar regras quando viável, sem prometer portabilidade automática do APK.

6  Política central de adaptação
Reutilizar ou criar um único serviço de política com saídas independentes para layout, efeitos, carga de trabalho e uso de memória. Uma tela pequena em aparelho potente pode precisar de layout compacto e processamento completo; uma tela grande em aparelho limitado pode precisar de visual simples e tarefas serializadas.
Sinais de entrada
Observar dimensões da janela, escala de texto, preferências de acessibilidade, estado do app, capacidade conhecida do aparelho e resultados de operações reais. No Android, avaliar isLowRamDevice e memoryClass com disponibilidade por versão; memoryClass não mede toda a RAM nativa ou gráfica. Não interpretar RAM livre momentânea como orçamento integral do app. [7]
Usar sinais de bateria, economia e estado térmico somente quando disponíveis. Na ausência de informação confiável, escolher uma política conservadora. Não instalar benchmark pesado nem monitorar hardware continuamente para decidir se a própria aplicação deve ficar leve.
Perfil proposto
Comportamento
Automático
Seleciona políticas por capacidade e observação; padrão de instalação.
Leve
Remove blur e animação decorativa; reduz cache, prefetch e concorrência; preserva funções essenciais.
Padrão
Usa efeitos discretos e carga moderada quando as medições permitem.
Ampliado
Permite tarefas opcionais mais custosas, sob demanda e com limites; não aumenta coleta de dados.

Mudança de perfil sem oscilação
Como ponto de partida configurável, entrar no modo leve quando o sistema indicar limitação relevante ou quando três operações comparáveis excederem o orçamento em uma janela de 30 segundos. Desconsiderar espera de rede, digitação e carga de diagnóstico. Uma falha grave deve bloquear a tarefa problemática imediatamente, sem aguardar a janela.
Retornar ao perfil anterior somente após pelo menos dois minutos de estabilidade em primeiro plano, sem pressão conhecida. Reavaliar ao retomar o app e após mudança significativa de condição. Usar relógio monotônico para intervalos; não depender da hora do calendário.
Oferecer em Configurações uma escolha simples entre Automático e Leve. Preferência de reduzir movimento e restrições atuais do sistema prevalecem sobre efeitos avançados. Salvar preferência e versão da política, sem sincronizar o diagnóstico de um celular como se valesse para todos os dispositivos do usuário.
Contrato técnico sugerido
A política deve produzir layoutMode, effectsMode, workloadMode, imageCacheBudget, heavyTaskConcurrency e reasonCode, ou equivalentes já existentes. Toda mudança deve ser observável em diagnóstico, sem mostrar siglas técnicas ao produtor. Não duplicar decisões em cada tela ou agente.

7  RAM dados persistentes e memória inteligente
Memória operacional
Carregar apenas a página de dados e os elementos visuais necessários. Usar listas virtualizadas, consultas indexadas e assinaturas vinculadas ao ciclo de vida. Cancelar busca obsoleta e liberar listeners, câmera, áudio, arquivos e referências de telas encerradas. Medir heap gerenciado, memória nativa e gráfica quando a tecnologia permitir. [5]
Decodificar imagens perto do tamanho de exibição e limitar cache por bytes, com política de descarte. Um bitmap RGBA de 4000 × 3000 pode ocupar cerca de 45,8 MiB descomprimido, independentemente de o JPEG ser pequeno. Evitar converter arquivos grandes em base64 e manter várias cópias simultâneas.
Não depender de um aviso final do sistema para salvar dados. No Android, vários níveis antigos de onTrimMemory deixaram de ser enviados desde a API 34 e foram descontinuados na API 35. Usar notificações aplicáveis, transições de ciclo de vida e orçamentos preventivos; não construir a proteção somente nesses callbacks. [6]
Memória persistente
Separar registros autoritativos de caches reconstruíveis. Vendas, movimentos de estoque, documentos, consentimentos e ações pendentes pertencem ao armazenamento persistente adequado. Preferências e estados pequenos usam a solução já adotada. Arquivos grandes ficam como arquivos, com referências e metadados, sem carregar seus bytes em todo acesso.
Carrinho e formulários relevantes devem possuir rascunho persistente incremental. Salvar mudanças concluídas de edição e o comando antes de sua execução, com debounce curto e limite definido para texto livre. Evitar depender exclusivamente de onPause, fechamento normal ou estado de interface em RAM.
Memória de regras e evidências
Para recomendações, registrar origem, versão, data de observação, validade, entidade relacionada e grau de confiança. Preferências explícitas, fatos transacionais e inferências têm pesos diferentes. Resumo gerado por IA não substitui uma venda registrada nem pode sobrescrever um documento original.
Consolidar regras equivalentes por identificador estável e escopo. Não unir produtores, produtos ou clientes somente por nome parecido. Detectar contradições e manter rastreabilidade das decisões. Usar resumos e recuperação seletiva para que o histórico inteiro não seja carregado ou enviado a cada interação.
TTL pode expirar clima, miniaturas e resultados de análise reconstruíveis; nunca deve apagar automaticamente comprovantes ou comandos pendentes. Invalidação de insight deve acompanhar a versão dos dados de entrada. A falta de armazenamento deve produzir erro recuperável, sem confirmar uma gravação que não ocorreu.

8  Motor de ação e recuperação segura
O motor deve continuar correto quando o app estiver lento, mudar de tamanho ou for encerrado. Apresentação, recomendação e execução são etapas distintas. Agentes podem sugerir uma ação; somente o serviço de domínio autorizado pode alterar venda, preço, pagamento ou estoque.
Caminho de um comando
Capturar intenção → validar dados e permissão → atribuir identificador estável → persistir comando → executar transação → registrar resultado → atualizar interface. Reutilizar a chave do checkout em novos toques e tentativas; não gerar outra a cada clique. Consultar o resultado existente antes de repetir. Não prometer entrega exatamente uma vez por depender de uma fila.
Na venda local, validar saldo e gravar venda, itens e movimentos na mesma transação, quando estiverem no mesmo banco. Usar restrição de unicidade e controle de concorrência no armazenamento. Desabilitar o botão durante a gravação ajuda a interface, mas não substitui idempotência.
Estados e falhas
Modelar estados como rascunho, pendente, em execução, concluído, falhou e cancelado, conforme o domínio. Persistir número de tentativas, próxima tentativa e erro sanitizado. Recuperar comandos em execução interrompidos com lease ou estratégia equivalente; não deixá-los bloqueados para sempre.
Se houver sincronização, usar outbox ou mecanismo equivalente na mesma transação dos dados locais. Repetição deve ter espera progressiva, limite e chave de idempotência no destino quando disponível. Se o serviço externo não oferece deduplicação, reconciliar antes de repetir operações com efeitos financeiros ou mensagens.
Prioridades e trabalho em segundo plano
Dar prioridade à venda e à reposição solicitadas pelo usuário. Em seguida, atender consulta visível; depois, sincronização necessária; por último, relatórios, indexação e análises opcionais. Manter baixo o número de tarefas custosas simultâneas. Usar o agendador persistente já integrado; no Android, considerar WorkManager para trabalho adiável adequado. [11]
Economia de bateria, Doze e restrições do fabricante podem adiar tarefas. Não garantir execução em horário exato nem continuidade ilimitada com app fechado. Reconciliar ao abrir e oferecer atualização manual. Após forçar parada, não presumir retomada automática antes de nova abertura. [12]
Garantias que o modo leve deve preservar
Não perder ou duplicar venda; não alterar fórmulas financeiras; não remover validação de saldo; não enviar mensagem por conta própria; não marcar pedido como entregue sem evento de domínio. Uma ação adiada deve informar estado compreensível. “Compartilhado” não significa recebido ou lido pelo cliente.
Após encerramento no instante de salvar, consultar a transação pelo identificador: se gravada, mostrar o resultado; se não gravada, restaurar o rascunho. Atualização do sistema ou do app deve manter dados e permitir migrações testadas com recuperação documentada.

9  Otimização dos módulos existentes
Interface e apresentação
No modo leve, substituir vidro com desfoque por fundo sólido ou translúcido simples, diminuir camadas e sombras e retirar animações contínuas. Manter hierarquia, espaçamento e áreas de toque. Evitar reconstruir a tela inteira quando apenas uma quantidade muda. Não desabilitar aceleração gráfica global sem diagnóstico reproduzível.
Produtos estoque e clientes
Paginar e virtualizar listas; manter chaves estáveis; consultar e agregar no banco. Atualizar somente itens afetados. Aplicar busca com debounce inicial de 200 a 300 ms, cancelamento de resultado antigo e índices apropriados. Um catálogo de 2500 ou mais produtos não exige carregar todas as imagens nem um modelo de linguagem.
Clima e recomendações
Reutilizar a integração e o cache de clima existentes. Consolidar requisições simultâneas e exibir localidade e horário da última atualização; sem conexão, informar que o dado está desatualizado. Não recalcular todos os insights a cada toque: invalidar apenas análises afetadas por nova venda, estoque, data ou dado meteorológico. [10]
Voz já integrada
Auditar o motor atual antes de adicionar qualquer biblioteca. Carregar recursos de voz sob demanda e liberar captura ao terminar. Em aparelho limitado, evitar reconhecimento, OCR, exportação e análise pesada simultâneos. Reaproveitar dicionário de produtos e variantes locais já existentes, com confirmação quando produto ou quantidade estiverem ambíguos.
Carteira do produtor fotos e documentos
Processar uma imagem ou página por vez; criar miniaturas e corrigir orientação com limite de resolução adequado à tarefa. Preservar o original. OCR pode usar versão reduzida, com opção de recorte ou maior definição quando a leitura falhar. Separar extração de texto, interpretação e confirmação de validade; uma imagem não comprova automaticamente autenticidade.
Não carregar modelo generativo local grande por padrão. Antes de ativar IA, medir memória, latência e energia com os modelos reais. Oferecer fluxo manual ou análise posterior se faltarem recursos. GPU ou NPU são otimizações opcionais condicionadas a suporte comprovado, com alternativa e captura de falhas.
Relatórios catálogo e compartilhamento
Gerar PDF por partes e usar arquivos temporários controlados, evitando manter o documento inteiro e todas as imagens na RAM. Preservar o arquivo final até concluir o compartilhamento. Usar as funções de compartilhamento existentes e retornar ao mesmo estado ao abrir WhatsApp ou outro app. Não presumir que o iPhone permita o mesmo fluxo Bluetooth do Android.
Evitar serviço permanente, consulta em loop, localização contínua ou tela acordada sem necessidade. Otimizar primeiro o trabalho executado e o volume de dados, antes de acrescentar um novo framework, SDK de diagnóstico ou dependência online.

10  Metas iniciais e medição
Adotar metas para orientar a primeira otimização, registrando aparelho, sistema, versão do app, massa de dados e condições. Medir compilação de produção ou equivalente perfilável, sem debugger; separar primeira instalação, migração e execução normal. Mediana e p95 devem acompanhar a quantidade de amostras. [13–14]
Métrica
Meta inicial proposta
Como verificar
Feedback de toque
p95 até 100 ms
Do evento ao feedback visível; separar arbitragem de gestos.
Abrir tela com dados locais
p95 até 500 ms
Do comando de navegação à tela útil e interativa.
Início frio utilizável
p95 até 3 s
Medir TTID e TTFD; TTFD corresponde ao fluxo essencial pronto.
Gravar venda local
p95 até 500 ms
Do confirmar ao commit durável; excluir compartilhamento e rede.
Fluidez de rolagem
Até 5% de quadros fora do prazo
Usar prazo do display e ferramenta de jank; investigar pausas visíveis.
Cache de imagens no modo leve
Começar entre 8 e 16 MiB
Calibrar pelo orçamento do processo; não reservar o máximo à força.
Tarefas pesadas simultâneas
Começar com 1 no modo leve
Fila limitada e cancelamento de trabalho obsoleto.
Integridade em falhas
Zero perdas ou duplicações nos testes
Injetar encerramento, repetição e falha de gravação.

As metas acima são requisitos propostos do produto. Não são valores oficiais de aprovação das lojas. Se a base atual não as atingir, registrar a diferença, corrigir o gargalo principal e documentar o orçamento viável antes de declarar compatibilidade com o aparelho.
Memória e armazenamento
Medir memória em repouso, pico de venda, listas, voz, câmera e PDF. Definir um teto por plataforma e perfil após a medição; não usar um único teto arbitrário para todos os frameworks. Repetir um ciclo representativo de abrir e fechar telas pelo menos 20 vezes e investigar crescimento retido após estabilização.
Limitar caches em disco separadamente de documentos do usuário. Verificar espaço antes de operações grandes, tratar falha de gravação e limpar temporários órfãos com regra segura. Não usar largeHeap, coleta de lixo forçada ou encerramento do próprio processo como solução padrão.
Diagnóstico proporcional
Usar ferramentas existentes: Android Studio Profiler, Perfetto e Macrobenchmark quando aplicáveis; DevTools em interfaces web; instrumentos equivalentes do framework e Xcode Instruments no iOS. Registrar duração, perfil, motivo de adaptação e erro sem CPF, áudio, fotos, documentos ou conteúdo de clientes. Diagnóstico remoto é opcional e depende da política já adotada.

11  Matriz de testes e critérios de aceite
Selecionar aparelhos reais por capacidade e comportamento, além de marca. Emuladores ajudam na cobertura visual e de sistema, mas não demonstram bateria, temperatura, drivers e desempenho de um celular econômico. Registrar explicitamente quando um perfil ainda não foi testado fisicamente.
Eixo
Cobertura mínima proposta
Janelas Android
320 × 568, 360 × 640, 393 × 852 e 412 × 915 dp; 600 e 840 dp de largura; altura abaixo de 480 dp.
Acessibilidade
Fontes 100%, 130%, 150% e 200%; TalkBack; reduzir movimento; temas claro e escuro.
Recursos
Android de 2–3 GB, 4 GB e 6 GB ou mais, quando disponíveis; incluir dispositivo low-RAM se suportado.
Processador e marca
Ao menos duas famílias de chip em aparelhos reais; priorizar econômico Motorola ou Samsung e ampliar para OPPO e Multi conforme acesso.
Sistema e pacote
Versão mínima declarada e versão recente suportada; ABIs distribuídas; ambiente de páginas de 16 KB se aplicável.
Condições adversas
Sem internet, rede intermitente, pouco espaço, economia de bateria, aquecimento e retorno de outro app.
Destino Apple
Se houver versão iOS, testar iPhone menor suportado, fonte acessível, teclado e interrupção do app; marcar pendente se não houver build.

Cenários obrigatórios
1. Vender três produtos de uma mesma família, ajustar quantidade e finalizar com teclado aberto na menor janela. Confirmar leitura de nome, peso e preço e ausência de botões encobertos.
2. Repetir toque de confirmação, alternar rotação e encerrar o processo antes e depois do commit. Ao retornar, conferir uma venda, um conjunto de movimentos e o saldo correto.
3. Com voz ativa ou documento em análise, iniciar venda. Confirmar prioridade da interação e contenção de tarefas pesadas, sem gravar interpretação ambígua como venda.
4. Abrir e fechar estoque, clientes, câmera e PDF em ciclos. Verificar liberação de recursos, estabilidade de memória e ausência de listeners duplicados.
5. Carregar massas sintéticas de 2500 produtos, 10000 vendas e 1000 clientes; executar busca, ordenação e relatório. Incluir nomes longos, valores grandes e unidades diferentes.
6. Forçar parada, reiniciar e atualizar a instalação sobre uma base anterior. Verificar rascunhos, migrações, fila e recuperação sem depender de conectividade.
Aceitar a entrega somente com fluxo essencial íntegro, ausência de cortes na cobertura definida, recuperação comprovada e medições registradas. Resultados não executados devem aparecer como pendentes, nunca como aprovados.

12  Execução e instrução para as duas ferramentas
Sequência de implementação
Etapa 1  Mapear o projeto e medir a base. Entregar tecnologia, módulos, regras existentes, duplicidades, riscos de dados, aparelhos testados e gargalos medidos. Não introduzir dependências antes de demonstrar a necessidade.
Etapa 2  Corrigir layout e ciclo de vida. Resolver cortes, teclado, alvos de toque, rascunhos e recriação de telas. Verificar a venda ponta a ponta antes de acrescentar adaptação automática.
Etapa 3  Consolidar a política. Reutilizar serviços, aplicar perfil leve, limites de cache, virtualização e fila com concorrência controlada. Separar layout de capacidade de processamento.
Etapa 4  Fortalecer memória e ação. Implementar apenas lacunas reais de rastreabilidade, idempotência, transações, recuperação e invalidação de recomendações. Preservar o histórico.
Etapa 5  Medir e validar. Comparar antes e depois, executar a matriz pertinente e entregar limitações, migrações e reversão. Não declarar suporte a iPhone ou a uma família inteira de aparelhos com base apenas em emulador Android.
Texto para orientar Codex e Claude Code
Trabalhem no projeto existente do AGRO Gestão e usem esta diretriz como requisito de adaptação a telas pequenas e recursos limitados. Antes de alterar, inspecionem a arquitetura, os documentos já instalados, as instruções locais e as implementações de layout, memória, voz, clima, estoque, vendas, filas e agentes.
Verifiquem duplicidade de informações e funções, inclusive regras semanticamente iguais com nomes diferentes. Escolham uma fonte canônica com base na integridade dos dados, no requisito atual, nos testes e na manutenção. Consolidar não significa apagar diferenças legítimas de plataforma ou remover dados históricos. Registrem decisões e migrem os consumidores.
Adaptem pela janela disponível, escala de fonte, capacidade exposta e desempenho medido. Não classifiquem o aparelho apenas por Motorola, Samsung, OPPO, Multi/Multilaser, Apple ou por Exynos, Snapdragon, MediaTek e Unisoc. Auditem ABIs, bibliotecas nativas, sistema mínimo e compatibilidade de páginas de memória quando aplicável.
Preservem o fluxo de venda, os cálculos, os saldos, os rascunhos e a execução sem duplicação. Simplifiquem primeiro efeitos, imagens e tarefas opcionais. Usem as funções de voz e os documentos de linguagem e produtos que já estiverem no projeto, sem instalar outro motor equivalente. Não adicionem APIs ou serviços pagos por padrão.
Implementem mudanças pequenas, com reversão e evidência. Usem os mesmos contratos entre as duas ferramentas, integrem alterações antes da próxima rodada e evitem fontes paralelas de verdade. Ao concluir, entreguem arquivos alterados, decisões de consolidação, medições antes e depois, testes executados e pendências reais. Se não puderem executar um teste, declarem a limitação e mantenham o item pendente.

13  Referências técnicas oficiais
Consulta em 21 de outubro de 2026. Referências sustentam conceitos de plataforma; perfis, números de aceitação e decisões específicas do AGRO Gestão são propostas deste documento. Conferir versões de APIs e ferramentas na implementação. Nenhum aparelho ou repositório foi inspecionado para esta diretriz.
[1] Android Developers  Use window size classes
[2] Android Developers  Make apps more accessible
[3] Apple Developer  Human Interface Guidelines Accessibility
[4] Apple Developer  Get started with Dynamic Type WWDC24
[5] Android Developers  Manage your app memory
[6] Android Developers  ComponentCallbacks2 API reference
[7] Android Developers  ActivityManager API reference
[8] Android Developers  Android ABIs
[9] Android Developers  Support 16 KB page sizes
[10] Android Developers  Build an offline first app
[11] Android Developers  Task scheduling
[12] Android Developers  Power management resource limits
[13] Android Developers  App startup time
[14] Android Developers  Overview of measuring app performance
Uso das referências  O documento adota alvos de toque e classes de janela como base de projeto. Os mecanismos de memória e agendamento devem ser selecionados conforme sistema, framework e versões efetivamente usados. Recursos opcionais nunca devem se tornar condição para concluir uma venda local.


Memória canônica v2 — atualizaçãoClaude0.12.62/cffe32b: aparelhos capazes mantêm os efeitos completos; aliviar efeitos apenas por restrição de recursos/sistema, acessibilidade, escolha explícita ou lentidão observada. Uma única política do AGRO2, sem duplicar o medidor.
