# AGRO Gestão 2 — 0.12.51/code91

Atualização instalada em21/10/2026, incorporando as alterações do AGRO Gestão3 fornecido pelo produtor. APK de referência0.12.50/376a8fe inicialmente recompilado com39arquivos iguais; Git reconsultado durante a tarefa e atualizações52,55,59,60,62 incorporadas até **cffe32b**. Nenhuma publicação em main ou no ramo Claude. A versão do AGRO2 é0.12.51; a numeração da linha AGRO3 é independente.

## Comportamento resultante

- Material, transparência/degradê, nomes nos cards e transições da referência, com molas via Web Animations em superfícies reais. Recolhimento completo e subjanelas preservando o pai. Fundo das janelas usa scrim de opacidade. Pulso decorativo único mantém estável a grade no duplo toque; envio vazio/erro/offline de relatório não substitui a grade.
- Seleção por segurar, até3produtos, Continuar e quantidade sequencial com Próximo/Concluir conforme a referência. Digitar não passa adiante sozinho; Carrinho habilita após Concluir recolher o último produto. Só as apresentações tocadas entram. Consulta exata por duplo; toque simples informa quantidade. A sequência automática da31não foi distribuída e foi substituída pelo pedido de copiar o APK3.
- Perfil e Negócio atualizado, foto em destaque, campos longos legíveis, Salvar fixo e foco/teclado sem o listener global bloqueante. Ordenação manual por família persistente, avisos e proposta de melhor vendido primeiro. Mesmo layout claro/escuro aprovado.
- Diretrizes de adaptação instaladas como memória versionada2, premissas23, texto offline e registry do motor. Uma política central separa janela e capacidade, preferências Automático/Leve, acessibilidade, sinais nativos e custo observado. Diagnóstico local limitado, sem perfil de hardware no backup. Fila opcional serial/limitada e DOM paginado; registros completos preservados.
- Diário separado de carrinho/formulários com confirmação de gravação, reconciliação por operationId, proteção contra repetição de venda e falha de espaço. Não modifica automaticamente registros ao restaurar. Escopo e lacunas detalhados na auditoria.
- Canais nativos de estoque da62: normal para acabando/Loja, alta prioridade para esgotamento na feira. Apresentação final depende de Android/ajustes individuais. Sem manter tela acordada. Clima27/proxy/consentimento/cacheOnly/bateria>=50% preservados; sem servidor alterado, GPS, microfone ou voz.

## Validação executada

382testes unitários passaram;27no conjunto específico de recursos/recuperação/armazenamento/notificações, com serviços nativos simulados.382já inclui esses27, não são somados.

QA de navegador isolado:104verificações comparativas/32comparações de material e tipografia,40de perfil/8comparações,30casos geométricos,32retornos,6cenários de relatórios sucesso/503/offline,2finalizações,174movimentos,36verificações de recuperação/adaptação e16de formulários/ciclos. Dois cenários grandes com2500produtos/10000vendas/1000clientes;80ciclos interrompidos de abrir/fechar. Zero errosJS nos relatórios aprovados. Claro/escuro,320/360/393/412 e alturas reduzidas; recuperação adicional em840px. Texto ampliado e modos leve/reduzido conforme cada relatório. Mudanças finais62de canais não alteram o visual comparado com60; testes nativos simulados cobrem migração/prioridade/permissão negada. Correção final de busy ao restaurar carga e calibraçãoVRR são de recuperação/política, sem alteração do material visual.

Testes usaram apenas dados fictícios e rede interceptada/bloqueada. Relatório503pode ter novo ciclo programado; no teste final foram até2POSTs, sem concorrência, mantendo pendência e grade estável. Não houve envio de relatório real nem transação de teste no app principal.

Teste físico isolado51nãoexecutado: instalação de pacote fictício separado falhou-99emduas tentativas; nova tentativa ficou em verificação e foi cancelada após confirmar data/tamanho da sessão. Não desabilitamos a proteção do aparelho. Nenhum pacote temporário instalado ficou no aparelho. A instalação/abertura do app principal assinada com certificado original foi bem-sucedida.

Não foram medidos FPS/GPU/bateria reais, início frio/commitp95, aparelho econômico/segundo chipset, TalkBack200%, runtime16KB ou iOS. Metas do DOCX seguem propostas, não certificação. Não se promete fluidez universal nem consumo zero. A auditoria registra limites de memória, persistência e formulários especiais: [ADAPTACAO-MEMORIA-ACAO-0.12.51.md](ADAPTACAO-MEMORIA-ACAO-0.12.51.md).

## APK e entrega

- Pacote `br.com.territorio.gestao2`, rótulo AGRO Gestão2, assinatura original v2/v3; certificado `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`.
- 5149058bytes; SHA256 `9711847c5360df89b0928372668290aa0abdcb1fe44cc362389fc20049e1921f`.40assets do build idênticos aos do APK. Alinhamento16KB verificado; nenhuma biblioteca nativa.soembarcada. Isso não substitui execução em sistema16KB.
- Pasta original: `C:\Users\alexd\PROJETOS\Território Gestão\AGRO-Gestao-2-0.12.51.apk`, hash conferido.
- Instalado com `adb install -r` em `2026-10-21 15:31:24`; `firstInstallTime=2026-10-14 18:17:06` preservado; abertura `Status:ok`. Sem limpar/desinstalar o app principal.
- Fonte a publicar exclusivamente em `codex/atualizacao-agro-gestao2`; conferir o commit desta entrega no histórico remoto. Lista em ARQUIVOS-0.12.51.md. Sem submissão PlayStore.
