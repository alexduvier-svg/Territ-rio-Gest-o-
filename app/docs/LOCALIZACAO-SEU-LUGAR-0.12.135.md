# Seu lugar — Codex 0.12.135

Pedido: trazer para o Codex a localização revisada no Claude, corrigir os pontos1–5 da revisão, trocar “porteira” por “seu lugar” e deixar placas fora do escopo. O usuário confirmou que o destino deve ser sempre o Codex. Depois pediu conferir e aproveitar as últimas mudanças viáveis do Git Claude.

Estado em 29/10/2026: APK135 compilado, validado e instalado no Reno e no PKJ. O mesmo arquivo foi conferido nas duas pastas de entrega. Fontes, testes e provas resumidas pertencem ao ramo Git próprio do Codex.

## Origem e escopo

- Base Codex134: `3d922f47f3421954e07a5e822d8878fd0fdcb439`.
- Localização Claude136: `725acde387c3141a997ceb0baffbad8bd8559f23`, com o GPS/código/Street View das versões134 e135.
- Última mudança revisada e incorporada seletivamente: Claude137, `87039bf0c1d648e8f84c65e11fd9639fb3cc35c3`: comunidade no perfil, mensagem em blocos, referências numeradas e coordenadas para copiar.
- Código, pacote, nome, assinatura e dados continuam do Codex. Os módulos de movimento e `interface.js` da correção134 foram mantidos sem alteração; não houve merge integral do Claude.

Não foram adicionados placas, diretório público, mapas offline próprios, descoberta automática de Street View, consulta automática ao ERD-MG ou publicação de backend. Nenhuma cópia de dados do Claude foi repetida.

## Como usar

Em **Perfil e negócio**, abra **Seu lugar**:

1. No acesso usado por quem chega, toque em **Marcar pelo GPS**.
2. Uma leitura com erro estimado acima de30m é recusada. O lugar anterior permanece selecionado. O plugin tenta obter20m e aguarda até25s; são critérios de aceitação, não garantias da precisão real.
3. Quando houver uma posição aceitável, o app apresenta uma proposta. Use **Conferir no Maps** para reconhecer o ponto.
4. Toque em **Confirmar meu lugar** para gravar. Descartar ou fechar o perfil antes da confirmação não aplica a proposta.

Também é possível abrir **Já tenho um Plus Code ou ERD** e informar um código global completo, com oito caracteres antes de `+`. O app aceita precisões de10 a15 dígitos e links completos de `plus.codes`. Códigos abreviados não são completados por adivinhação de município.

Ao escolher ERD-MG, o registro aparece como **ERD-MG informado por você**. Essa indicação registra a origem declarada pelo produtor; o app não consulta nem certifica o cadastro estadual. O ponto mostrado para um código informado é o centro da célula, sem apresentá-lo como uma medição de GPS.

## Ajustes de confiabilidade

| Ajuste solicitado | Comportamento resultante |
|---|---|
| Confirmar seu lugar | GPS e código informado viram proposta antes de substituir o cadastro; GPS fraco/inválido não grava |
| Orientar corretamente o uso sem sinal | Mensagem explica como baixar toda a região do trajeto; não promete que salvar o destino ou iniciar a rota baixe o mapa |
| Conferir a gravação | Alterações da localização, referências e Street View verificam a persistência e a confirmação durável; falhas restauram o valor anterior e não anunciam sucesso |
| Validar links | Domínio real HTTPS, ponto/ângulos/identificador validados; link malformado não lança erro; a inclinação do link de Conceição é preservada como `-4°` |
| Código completo e endereço existente | Código completo na tela e na mensagem; entrada de Plus Code/ERD existente com origem explícita e confirmação |

A identidade do modelo é conferida antes e depois da gravação. Respostas tardias do GPS são descartadas quando o perfil fecha ou o contexto muda. O GPS é solicitado somente por ação do produtor e o plugin interrompe a leitura ao sair do app. Não existe acompanhamento contínuo de localização.

O Street View continua sendo indicado pelo produtor. Links curtos precisam de conexão para serem resolvidos; se a leitura falhar, o link anterior é mantido e os botões voltam a funcionar. As imagens abrem por um link externo, sem carregar mapas pesados na janela do perfil.

## Compartilhamento e últimas mudanças do Claude137

A mensagem traz blocos separados para produtor/comunidade/município, código completo, até cinco referências em ordem, Google Maps, Waze, coordenadas para copiar, Street View opcional e orientação para trechos sem sinal. A numeração usa `1)` para não juntar o número da referência com uma distância como “300 metros”.

O Google Maps recebe a ação de navegação; o Waze recebe destino, navegação e zoom. Isso pode abrir uma prévia ou a navegação conforme disponibilidade de localização, aplicativo e rota. A existência de Street View não foi usada como prova de que o trajeto até o lugar está correto. Os formatos foram conferidos nas documentações oficiais de [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) e [Waze Deep Links](https://developers.google.com/waze/deeplinks).

A orientação offline acompanha a [ajuda do Google Maps](https://support.google.com/maps/answer/6291838?hl=pt-BR&co=GENIE.Platform%3DAndroid): baixar previamente a área completa da viagem. Nenhum mapa é enviado junto pelo compartilhamento. O Street View precisa de internet. A localização não é publicada automaticamente, mas integra os dados locais e pode fazer parte dos backups que o produtor habilitou.

## Validação

- **813 testes unitários aprovados**, incluindo GPS fraco/inválido, proposta sem mutação, códigos existentes, refinamento da célula, persistência recusada, falha no disco, espera por confirmação durável, rollback e troca de contexto.
- **Oito jornadas compiladas aprovadas**: 320/360/393/412px, claro/escuro; 320px com texto ampliado, modo leve e movimento reduzido. Incluem os fluxos anteriores de abas/venda/estoque/calculadoras e as novas jornadas de localização.
- **Quatro jornadas físicas aprovadas** no Reno e no PKJ, claro/escuro, com o auxiliar de hash exato. As jornadas finais terminaram no PKJ às14:36:23/14:38:39 e no Reno às14:42:59/14:45:09 de29/10/2026.
- GPS, compartilhamento, navegação externa e resolução HTTP usados nas jornadas são simulados pelo harness, somente no pacote sintético. Não foram lidos o GPS real, bancos reais ou conteúdo de aplicativos pessoais.
- O auxiliar usa os assets compilados conferidos com a produção, com alterações somente de HTML de seed/configuração, pacote separado e permissão de internet removida. Não há controles de teste adicionados ao runtime de produção.

As imagens da validação são sintéticas e ficam no diretório local de visualizações. As provas resumidas estão em `qa/place135-final-review.json`, `qa/place135-package-review.json`, `qa/place135-unit.txt` e `qa/place135-delivery.json`. Os testes não estabelecem precisão real do GPS, transitabilidade das estradas, validação oficial no ERD-MG, FPS ou navegação offline própria.

## APK e entrega

`AGRO-Gestao-Codex-0.12.135.apk`, código176, **9.288.409bytes**.

SHA-256: `8c4650ebe967a1625a5327d0520fb82dce1acfe6eb36fc4283be4a1f585ce0af`.

Pacote `br.com.territorio.gestao2`, nome AGRO Gestão Codex e certificado original preservados. Assinaturas v2/v3, CRC,57assets compilados e duas pontes Cordova conferidos; alinhamento ZIP/ELF de16KB verificado estruturalmente, sem alegar medição de runtime16KB.

A instalação usa `-r`, sem limpar dados; verifica versão/hash/primeira instalação, processo e primeiro plano. O instalador é idempotente e mantém recibos entre aparelhos. Ao concluir, remove somente o auxiliar `place135`, sua captura temporária e seus redirecionamentos de depuração, liberando a manutenção de tela ligada. Não repetir build/verificador/instalação por alterações de documentação.

| Aparelho | Atualização135 | Primeira instalação preservada |
|---|---|---|
| PKJ110 | 29/10/2026 14:41:59 | 28/10/2026 08:59:26 |
| Reno CPH2737 | 29/10/2026 14:47:34 | 21/10/2026 18:58:01 |

Hash idêntico nos dois aparelhos e nas cópias de `New project` e `Território Gestão`. Processos vivos e primeiro plano confirmados após abertura; não há nova confirmação visual humana dos aplicativos principais. Auxiliares `place135`, capturas temporárias e redirecionamentos próprios removidos; manutenção de tela ligada liberada. Metadados e recibo135 estão em `installed-and-validated`; não repetir a instalação para documentação.
