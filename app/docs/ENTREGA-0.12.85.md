# AGRO Gestão 2 — 0.12.85

Status: instalada nos dois aparelhos e cópia na pasta original em24/10/2026; publicação Git em fechamento.

## Comportamento

Tempo ganhou a opção Usar Minha Localização, em um cartão recolhível do material existente. A posição é lida pontualmente via provedores Android de rede/GPS, com permissão durante o uso, escolha aproximada respeitada, prazo de 12 segundos e cancelamento ao fechar/pausar. Não houve adição de SDK Google ou biblioteca de localização. Cidade cadastrada permanece disponível quando a localização falha; feiras continuam usando seu município agendado.

As coordenadas são arredondadas a três casas antes da ponte e da rede; previsão por ponto e municipal têm caches distintos. O cache nativo de localização fica fora dos dados/exportações/backups do negócio. A tarefa de segundo plano permanece exclusivamente municipal, cache compartilhado, internet e bateria a partir de 50%. Não há GPS em segundo plano. Regras de privacidade e distribuição em LOCALIZACAO-TEMPO-0.12.85.md; memória de interface55.

Os ícones distinguem sol, lua, nuvens e pancadas conforme o símbolo do MET. A janela informa o período previsto. O GPS melhora o local da consulta, mas não transforma previsão em observação de chuva; temperatura alta não é usada para inventar sol. RainViewer não foi integrado.

## Verificação

643 testes unitários do app e 35 do servidor passaram. Oito jornadas de navegador passaram, nos dois temas e larguras320ampliado/leve/reduzido,360,393,412. Verificam opção explícita, ponto simulado, negativa/timeout/aproximada, cancelamento tardio, persistência da preferência sem coordenadas no ERP, município do evento preservado, configuração municipal do Worker, ausência de GPS passivo nas cinco abas e margens/rodapé/alvos. Fonte final congelada; nenhuma mudança financeira.

O servidor foi publicado com deployment a7c7042c-8f29-4955-b013-4a6e6d72a14e. A consulta municipal anterior, a consulta por ponto e cacheOnly passaram em verificação pública com coordenadas fictícias; não foram usados dados do negócio nem posição real.

APK0.12.85/code125,9201779bytes,SHA256433f2b3abc069de3ce787a3f3cc2265029ccaa939167fcda803dba4434571a4b. Certificadooriginalf5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68,v2/v3. Cinquenta assetsweb+duas pontes iguais entre compilação/APK/fixture; ZIP e ELF alinhados16KB estruturalmente. Pacote br.com.territorio.gestao2. COARSE/FINE opcionais, sem localização em segundo plano ou microfone.

## Preservação

Os ensaios usam pacote separado e dados fictícios, sem ler/copiar banco real, criar transações, enviar WhatsApp ou acessar calendário pessoal. Não foram medidos FPS, GPU, bateria, aparelho básico físico, TalkBack ou execução em dispositivo16KB. A homologação inclui geometria pequena e modo leve/reduzido; isso não substitui medições físicas em todos os aparelhos do mercado.

## Conferência física e instalação

As quatro jornadas completas Capacitor passaram no Reno14 e PKJ110, claro/escuro, com errors[] vazio e relatórios posteriores ao APK final. Incluem as cinco abas, cadastro pendente durante boot, navegação/rollback, configuração de café, estoque/fornecedores, controles numéricos e localização simulada. Antes do mock, cada jornada confirmou no plugin real que locate(requestPermission:false) retorna permission-required, sem acionar o sensor. Aproximada, negativa, timeout, cancelamento e ponto consultado foram exercitados com respostas fictícias; não se afirma teste de precisão do GPS físico. As capturas sintéticas nos dois temas foram inspecionadas. Uma tentativa do ensaio de Orientação parou na seção expansível; abrir/fechar foi conferido separadamente, e o ensaio passou nas retomadas completas aguardando o estado do DOM e registrando eventos para diagnóstico. Não houve alteração da fonte do app por esse ajuste do harness.

Seis testes instrumentados nativos passaram em cada aparelho: bateria50/valor desconhecido, validade/tentativa, município normalizado, WorkManager30min/rede/bateria, coordenadas finitas/arredondadas e isolamento município/GPS. Ver qa/weather085-native-policy-reno.txt e pkj.txt. Esses testes são puros, sem sensores, rede ou agendas pessoais.

Cópia original AGRO-Gestao-2-0.12.85.apk na pasta Território Gestão, SHA igual ao artefato validado. Atualização adb install -r: Reno24/10 às16:16:38 e PKJàs16:18:02. As primeiras instalações foram preservadas (Reno21/10 18:58:01, PKJ14/10 18:17:06). O boot frio confirmou agent/motion/workflows/events/suppliers/training nos dois. Na retomada do instalador, o Reno já tinha o APK idêntico, confirmado por hash do base.apk; não foi reinstalado novamente. Fixtures/testpackages, arquivo próprio de captura e forwards foram removidos.

Localização global já estava ligada nos dois e permaneceu assim. O Android do Reno negou GRANT_RUNTIME_PERMISSIONS ao ADB. Não foi contornada essa restrição: a permissão de localização do app continua dependente da escolha normal do usuário ao tocar em Usar Minha Localização, nos dois aparelhos. Nenhuma posição real foi consultada. Permissões futuras e instalações da Play Store seguem esse mesmo fluxo explícito.
