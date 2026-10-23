# Calendário e Olho do Resumo — 0.12.67/code107

Pedido posterior à instalação66: separar Calendário do Município de Participar de Outra Feira, corrigir Voltar e deixar o olho do Resumo do Dia mostrar/ocultar valores sem abrir ou fechar a janela.

## Correção

- Calendário em seção própria, com20px de intervalo, inclusive com Participar de Outra Feira expandido.
- Todos os diálogos municipais entram na política comum de rodapé de retorno: Voltar inteiro, seta do sistema, material/tipografia existentes, sem X redundante. Conteúdo longo rola sem comprimir o rodapé.
- O olho muda somente os textos financeiros, ícone e estado acessível. Os valores pertencem ao resumo consultado; a janela não é reaberta, fechada ou reconstruída. Nós do conteúdo, campo de custo ainda não salvo e rolagem são preservados. A página de fundo só é atualizada após o fechamento real e o fim do retorno.
- Privacidade de sessão preservada: ao pausar/bloquear/retomar, ocultar os valores. Um novo toque permite vê-los novamente.
- Premissa37 e documento offline registram o comportamento. Sem nova dependência, agendador, chamada de rede ou alteração no motor de clima/Firebase/servidor.

## Validação

538testes unitários PASS. Oito jornadas de navegador: claro/escuro,320pxcomtextoampliado/modoleve/movimentoreduzido e360/393/412normal. Testes verificam distância real das seções, cinco variantes de rodapé, conteúdo inteiro, ausência de X, toque real no olho, valores visíveis/ocultos, identidade dos nós, posição estável, nenhum showModal/close ou movimento da janela durante os toques, campo/rolagem e ocultação de sessão. Quatro jornadas físicas isoladas em Reno14/PKJ nos dois temas PASS. Os JSONs finais confirmam os mesmos critérios no WebView nativo.

Nenhum banco principal, venda real, envio WhatsApp ou agenda pessoal é usado no teste. Sem FPS/GPU/bateria/celular básico físico/TalkBack/runtime16KB medidos; modos leves e telas pequenas foram verificados no navegador. Identidade e assinatura originais, dados reais e integrações anteriores preservados. Não houve deploy ou nova configuração Firebase.

Instalação, tamanho e SHA256 finais constam no registro de validação e checkpoint. Não repetir builds/instalações de versões anteriores por este documento.

## Arquivos

- `src/legacy/erp-ui.js`: rodapé municipal registrado e olho com atualização de valores na superfície existente.
- `src/features/municipal-calendar/index.js`: seta/rótulo do retorno no padrão comum.
- `src/features/municipal-calendar/municipal.css`: intervalo entre seções e rodapé que não encolhe.
- `src/data/interface-guidelines.js`, `public/knowledge/premissas-interface.md`: premissa37.
- `package.json`, `package-lock.json`, `android/app/build.gradle`: versão67/code107.
- `qa/calendar067*.cjs`, resultadosJSON e `qa/unit-calendar067.txt`: regressão isolada.
- Este documento e `AGENTS.md`: evidências e retomada. Binários, dados e configuração Firebase local ficam fora do Git.

## Registro final

APK9119666bytes; SHA256 `2fe66d87b6dd710cd2d68ae21946a6d15a761ac21e6b3d1bb9c22596c9d5a442`; certificado original/v2/v3,48assets+2pontes, ZIP/ELF16KB. Cópia original conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.67.apk`. Instalação-r22/10/2026 Reno22:33:07/PKJ22:33:13,107/0.12.67, Statusok e firstInstallTime preservados. Fixtures removidos; dados reais intactos. Publicação apenas no ramo AGRO2; conferir commit/remoto no log, sem repetir entrega.
