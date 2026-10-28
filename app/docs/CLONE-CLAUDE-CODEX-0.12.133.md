# AGRO Gestão Codex 0.12.133

Pedido confirmado em 28/10/2026: copiar os estilos e os dados do Claude atual, mantendo o aplicativo como Codex. Essa orientação substitui a preservação das extensões próprias feita na integração132, pois elas deixavam a tela inicial e o Estoque diferentes.

## Fonte e identidade

- Claude: `4a15376e31589d01dc1aa645a243513e82dd3a06`, versão0.12.133. APK de referência SHA256 `aad54653ddf774bf24bcc0a0339ab0c5336c8b7dc967003b10ed44066d557f4b`.
- Codex: **AGRO Gestão Codex 0.12.133/code174**, pacote `br.com.territorio.gestao2`, certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`.
- 307 arquivos de runtime, recursos, dados de referência, testes e registro do motor conferidos contra a fonte. Somente os textos de identificação em `main.js` e `erp-ui.js` diferem. Todos os48CSS são iguais.
- As extensões Codex de interface, calculadora, finanças e limites, e suas quatro suítes exclusivas, foram retiradas para reproduzir a fonte escolhida. A versão133 inclui a centralização das miniaturas no mapa de Seções.

## Verificação atual

- 770 testes unitários aprovados, zero falhas. Os812 da integração132 pertencem à entrega anterior.
- Oito cenários funcionais no navegador:320/360/393/412px em claro/escuro, incluindo texto ampliado, movimento reduzido e modo leve em320px.
- 48 comparações visuais, sem pixels diferentes: tela inicial, seção expandida, mapa de Seções e os três níveis de Estoque.
- Quatro jornadas físicas completas, Reno14 e Find X8/PKJ nos dois temas, em pacote separado com registros sintéticos e rede bloqueada.
- Auxiliar de transferência testado no pacote sintético: backup, rejeição de manifesto incorreto sem alteração, cópia com bytes/hashes conferidos e repetição idempotente.
- APK release não depurável; assinatura v2/v3 original; ZIP íntegro;57assets compilados iguais aos embarcados, além das duas pontes Cordova. Alinhamento ZIP/ELF16KB estrutural conferido.

APK `AGRO-Gestao-Codex-0.12.133.apk`, **9.280.217bytes**, SHA256 `7235d1e83d25fcadc4ac1fc1c8d303d7bf3ec8e1d91f66b08af49958ce2788ce`.

## Dados e entrega

A transferência usa a origem Claude do próprio aparelho. Antes de substituir os diretórios de negócio e treinamento do Codex, exporta e valida o backup do destino no computador, confere a origem novamente e exige os hashes do backup e do manifesto. Os originais também ficam preservados na transação privada do aplicativo. Produtos, estoque, vendas, clientes, eventos, custos, fotos e preferências contidos nesses registros acompanham a cópia. Permissões Android e caches não fazem parte dos registros de negócio.

Os arquivos privados ficam em `.local-migrations/clone133/`, ignorado no Git. Os APKs auxiliares não contêm registros pessoais. Esta cópia de dados persistidos foi autorizada pelo pedido humano posterior; os testes funcionais continuam usando apenas registros sintéticos.

Entrega concluída: APK instalado com atualização nos dois aparelhos, primeiras datas preservadas e cópias idênticas nas duas pastas de entrega. Nove arquivos de origem foram copiados e verificados em cada aparelho, com backup anterior recuperável no computador e originais privados preservados. Os dois processos e atividades do Codex foram confirmados após a abertura. O Reno mostrou a interface carregada; a captura final do PKJ ficou preta, com tela desligada na verificação seguinte, sem alegar confirmação visual final nesse aparelho. Os quatro testes físicos sintéticos anteriores passaram. Auxiliares e cópias temporárias externas removidos. O registro final fica em `qa/clone133-delivery.json`.

Evidências: `qa/clone133-unit.txt`, `qa/clone133-source-review.json`, `qa/clone133-package-review.json`, `qa/clone133-final-review.json` e `qa/clone133-transfer-test.json`. Não houve publicação de backend, medição de FPS/bateria, aparelho básico ou teste Android com páginas de16KB.
