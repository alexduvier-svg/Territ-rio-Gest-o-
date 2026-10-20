# Entrega — AGRO Gestão 2 0.12.27/code67

Motor econômico de clima: um único prazo em primeiro plano, mínimo30min e nunca antes da validade da fonte. Não usa setInterval nem sondagens contínuas. Pausa ao ocultar, ficar sem internet ou sair das áreas que usam o clima; ao voltar, verifica se a previsão venceu. Reaproveita consultas em andamento, mantém um único temporizador e aguarda pelo menos15min após falhas. Consulta/horário de verificação não são apresentados como nova previsão. Fonte, idade real e cópia offline preservadas.

No Android, uma única tarefa WorkManager de30min aproximados, internet conectada e BatteryNotLow do sistema; antes da rede, verifica também bateria>=50%. Abaixo50% ou bateria desconhecida, não consulta. Não tem receptor permanente de bateria, alarme exato, microfone/GPS, serviço contínuo ou wake lock manual. O Android pode adiar tarefas; não se promete horário exato, consumo zero ou previsão sempre nova antes de sair sem sinal. O percentual50% bloqueia a consulta: a tarefa do sistema ainda pode iniciar brevemente para avaliar a condição.

A tarefa em segundo plano sincroniza apenas o cache compartilhado do servidor (`cacheOnly=1`), nunca provoca nova consulta MET fora de uso. Na abertura, o app incorpora o cache nativo e consulta dados novos se estiverem vencidos. O armazenamento nativo é exclusivo de clima e não lê/reescreve a base ERP. Uma fila de I/O e sincronização nativa evitam operações simultâneas; gravação protege contra reativar uma preferência cancelada. Pode pausar segundo plano na janela Tempo; desativar previsão cancela o trabalho e limpa seu cache. Só cidade/UF vão ao servidor interno. Ninguém precisa criar conta externa ou configurar outra ferramenta.

Cache do servidor respeita Expires e usa revalidação condicional/ETag, inclusive validadores enfraquecidos pela compressão Cloudflare. Respostas304 evitam novo corpo de dados. Sem previsão em cache para segundo plano, responde204 sem acionar MET. Nenhuma chamada de teste criou/alterou pedidos, vendas, clientes ou estoque.

Premissasv14 instaladas no modelo/backup, separadas dos registros. Texto de ativação explica segundo plano/cache/bateria50%, controle de pausa no Android e limites reais da fonte. Sem alegar aprovação Play. Revisar a política pública e declaração de coleta antes da publicação, incluindo transmissão aproximada de município em segundo plano; não foi feita submissão.

## Validação

- 25testes do app (memória, previsão e relógio) e21do servidor PASS.
- 40verificações UI em4configurações: claro/escuro320pxampliado e393normal. Relógio virtual avança30min/horas, testa ausência de chamadas antes do prazo, pausa oculto/offline, retomada única, falha/espera,200mutaçõesUI sem duplicar, desativação em voo e preservação da base sintética.4superfícies/margens/Voltar íntegro; zero errosJS.
- 4testes instrumentados nativos executados no celular: limiar49/50/bateria desconhecida, validade/retry, acentos do município e configuração WorkManager/rede/bateria/30min/não expedito. Sem rede ou escrita nos registros. Pacote temporário de teste removido; app original reaberto Statusok.
- Servidor publicado:7f62c9ab-7c0b-4b9f-b602-5823cbabe41c. Cache-only realHTTP200 e condicionalHTTP304 confirmados após compressão; unitários garantem que o caminho de segundo plano não chama a fonte.
- Consumo real de bateria, entrega após30min de Doze/restrições OEM, execução de HTTP nativo em segundo plano, FPS/GPU e celular básico não foram medidos. A matriz visual/histórica completa não foi repetida. Testes de janela em Chrome isolado e políticas nativas instrumentadas; não confundir com benchmark energético ou garantia de tarefa executada.

Referências primárias: [WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) e [termos técnicos do MET](https://api.met.no/doc/TermsOfService), particularmente validade/cache e evitar novas consultas móveis fora de uso. A regra30min não implica que a fonte publique novos dados nessa frequência.

## Artefato

AGRO-Gestao-2-0.12.27.apk:5107916bytes, SHA256:1164c5b611e8df9353bf07ee81921bd8a0a69ed8f74f4d4ca82dde0b13aad638.
Mesmo pacote:br.com.territorio.gestao2; certificado:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68; assinatura v2/v3,38assets idênticos ao dist e alinhamento16KB. Voz/GPS/microfone continuam ausentes.
Cópia original conferida:C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.27.apk.
Instalado com adb install-r em 2026-10-20 19:24:59,Android67/0.12.27/aberturaStatusok; firstInstallTime 2026-10-14 18:17:06 preservado. Sem desinstalar ou limpar dados do app principal.
Publicação das fontes/QA somente no ramo codex/atualizacao-agro-gestao2; main é independente e deve ser preservado.
