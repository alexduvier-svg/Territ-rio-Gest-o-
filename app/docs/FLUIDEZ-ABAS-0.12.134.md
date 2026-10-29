# Fluidez de navegação — Codex 0.12.134

Correção solicitada para engasgos ao abrir Estoque, Vender e outras abas, principalmente no Reno. A base é o Codex 0.12.133 (`8ce5661`). Esta alteração mantém o nome AGRO Gestão Codex, o pacote `br.com.territorio.gestao2`, o certificado e os dados existentes.

**Entregue em 29/10/2026: instalada no Reno e no PKJ, com as pastas de entrega conferidas.** As comparações físicas 133/134 e as quatro jornadas funcionais passaram nos dois aparelhos e nos dois temas.

## O que mudou

O controlador antigo voltava a linha do tempo da animação quando a interface perdia um intervalo de processamento. Isso fazia o movimento parar ou recuar justamente sob carga. Esse mecanismo foi removido. As curvas de mola continuam as mesmas.

A transição agora permanece sob controle até terminar tanto a saída quanto a entrada. Antes, a saída liberava o grupo cerca de 433 ms antes de terminar a entrada. Tocar em outra aba nesse intervalo podia deixar a animação anterior sem cancelamento. A última aba escolhida agora cancela o grupo inteiro anterior, inclusive quando há toques rápidos ou interrupções.

Os ícones de navegação usam trajetórias físicas calculadas antecipadamente e reproduzidas pela Web Animations API. Os desenhos, posições e curvas originais foram preservados, com cancelamento que restaura estilo e ordem dos elementos. As transições entre níveis do Estoque também cancelam e limpam a camada anterior ao receber uma nova ação.

As telas iniciais do Estoque deixam de produzir listas detalhadas de produtos e lotes que seriam descartadas. Os observadores de interface ignoram cópias transitórias e decoração; o ajuste de texto reutiliza medições quando conteúdo, largura e fonte continuam iguais. Conteúdo recolhido deixa de ser medido com largura zero.

## Validação concluída

| Prova | Resultado |
|---|---|
| Testes unitários | 789 aprovados; 19 novos para trajetórias, cancelamento, ciclo de vida e renderização do Estoque |
| Jornadas compiladas | Oito cenários em 320/360/393/412 px, claro/escuro; 320 px com texto ampliado, modo leve e movimento reduzido |
| Fluxos | Cinco abas, venda/cancelamento, níveis de Estoque, fornecedores, sete calculadoras, perfil e formulários de produto/cliente/evento |
| Interrupções | Toques rápidos, nova aba durante a entrada, transições de Estoque interrompidas e limpeza final das camadas |
| Aparência | 48 cenas estáticas idênticas à 133; zero pixels diferentes e mesmos CSS |
| Jornadas físicas | Quatro aprovadas: Reno e PKJ, claro e escuro; dados sintéticos, hash do auxiliar exato e guarda de primeiro plano |
| Ícones em movimento | 24 casos de geometria comparados com a fonte anterior; maior diferença de matriz inferior a 0,000003; opacidade e traço iguais |
| Pacote Android | Identidade Codex, assinatura original v2/v3, CRC, 57 arquivos compilados e duas pontes Cordova conferidos; alinhamento ZIP/ELF de 16 KB estrutural |

Nos testes controlados de navegador, com carga de CPU de 1×, 4× e 6× e dois temas, o tempo total de trabalho da interface nas dez trocas caiu de 13% a 22% em relação à 133. A 134 não voltou a linha do tempo das animações, inclusive no caso separado com uma pausa artificial de 100 ms. Os números e as condições estão em `qa/motion134-performance.json`.

Ainda existem tarefas longas sob CPU limitada. Essa simulação não estabelece fluidez universal em celulares baratos. Intervalos de `requestAnimationFrame` e contadores de escrita da linha do tempo não são medições de FPS da GPU. O perfil adicional com coleta de CPU serve para diagnóstico e tem sobrecarga; não substitui a comparação sem perfilador.

A comparação física final manteve os pacotes sintéticos em primeiro plano, com guarda de tela desbloqueada antes e depois das navegações. Cada linha soma dez trocas naturais; a pausa artificial fica separada.

| Aparelho/tema | Recuos 133 → 134 | Trabalho da interface 133 → 134 |
|---|---|---|
| Reno/claro | 61 → 0 | 5.385 → 5.000 ms |
| Reno/escuro | 62 → 0 | 5.527 → 5.304 ms |
| PKJ/claro | 24 → 0 | 2.857 → 2.788 ms |
| PKJ/escuro | 0 → 0 | 2.768 → 2.643 ms |

A versão corrigida também teve zero recuos nos quatro casos separados com pausa artificial de 100 ms. O tempo de trabalho físico caiu cerca de 2% a 7% nesta rodada; tarefas longas ainda apareceram. Os resultados não são uma medição de FPS nem uma promessa de ausência de engasgos em todo aparelho. As medições preliminares anteriores foram excluídas deste resultado final.

## APK e entrega

Versão `0.12.134`, código `175`, arquivo `AGRO-Gestao-Codex-0.12.134.apk`, 9.280.217 bytes.

SHA-256: `085b52ea95a91a1ea630ea9310f239a0699d59cf8d12a7befb1c39347601b63a`.

Certificado SHA-256: `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`.

Os dois aparelhos receberam a atualização com `-r`, com hash exato, processo vivo e pacote em primeiro plano após abertura. As primeiras datas de instalação foram preservadas. A confirmação de processo/primeiro plano é técnica; não foi apresentada como confirmação visual humana do aplicativo principal. As capturas e jornadas funcionais são dos auxiliares sintéticos.

| Aparelho | Atualização em 29/10/2026 | Primeira instalação preservada |
|---|---|---|
| PKJ110 | 08:23:52 | 28/10/2026 08:59:26 |
| Reno/CPH2737 | 08:30:17 | 21/10/2026 18:58:01 |

Os horários foram reportados pelos aparelhos. Os auxiliares `integration133` e `motion134`, a captura temporária própria e os redirecionamentos de depuração desta rodada foram removidos; a manutenção de tela ligada foi liberada. O mesmo APK foi conferido no workspace, em `New project` e em `Território Gestão`. Recibos em `qa/motion134-delivery.json`, com estado final `installed-and-validated`.

O roteiro está em `qa/run-motion134-final.ps1`; aceita `-DeviceSerial` para endereço de depuração atualizado e `-ReuseWindows` para reutilizar as janelas sintéticas abertas. `qa/deliver-motion134.ps1` exige as evidências do aparelho escolhido antes de instalar, preserva recibos entre execuções, evita reinstalar o hash já entregue e só marca conclusão global quando os dois aparelhos estão atualizados.

Todos os testes desta correção usam dados sintéticos em pacotes isolados, sem acesso ao banco principal. Não houve nova cópia de dados do Claude, alteração do backend, publicação de backups ou limpeza dos dados dos aplicativos principais. Os auxiliares de teste foram removidos ao concluir; sua manutenção de tela ligada existiu somente durante a validação.

Resumo verificável: `qa/motion134-final-review.json`. Os rastros completos e imagens sintéticas permanecem no diretório local de visualizações, em `motion134-*`. Fontes e QA pertencem exclusivamente ao ramo `codex/atualizacao-agro-gestao2`, sem merge adicional do Claude. Não repetir a compilação, o verificador de pacote, as jornadas ou a instalação por alterações de documentação.
