# Codex 0.12.137 — atualizações do Claude final 147

Pedido de 03/11/2026: conferir o Git do Claude final 147 e atualizar o Codex 136. Fonte confirmada no remoto: `8180b4283b8242844eb5a2c53fc7159f127f7218`. Base própria: `78edfb5e2a44fc0819e5cf904420d4cb5f85c535`. A numeração continua independente: Codex **0.12.137**, código Android **178**.

## O que entrou

- Carrinho disponível quando todas as quantidades são válidas, mesmo com a revisão de vários produtos aberta; reabertura sem travar.
- Dois toques no produto abrem a consulta do estoque. Segurar seleciona tanto os cards quanto as linhas largas, inclusive quando há só um produto.
- Campos obrigatórios com indicação visual após tentar salvar. Custo vazio continua desconhecido.
- Categoria escolhida por janela; embalagem comum ou digitada; café verde sugere saca de 60 kg, sujeita à confirmação. Novos itens regionais de Hortifrúti no catálogo offline.
- Remover da família arquiva o produto sem apagar saldo, vendas e histórico. Há acesso aos produtos removidos mesmo quando a família inteira deixa de aparecer.
- Validade dentro de Disponível, apresentação no cabeçalho do produto e pesquisa de entradas por data ou código do lote, incluindo entradas esgotadas.
- Estoque estimado por fornecedor a partir das compras confirmadas, com ressalva explícita sobre a ausência de vínculo de cada venda com uma compra.
- Valores financeiros voltam a ficar ocultos após 30 segundos. A ocultação preserva um formulário em preenchimento.
- Sobreposição de opacidades entre abas para evitar a passagem pelo fundo, preservando o cancelamento completo das animações e a ausência de recuos da correção Codex134.

O arquivo importado `SEQUENCIA-AJUSTES-0.12.140.md` contém um **plano** do Claude. As etapas futuras ali descritas não foram apresentadas como funções já implementadas na 147.

## Revisão da integração

Preservadas as proteções Codex136: privacidade explicada nos relatórios, CSVs completos, caixa registrado separado de previsões, indicadores com limites históricos e confirmação/cópia verificada antes de zerar ou restaurar. Seu lugar135, identidade, pacote e certificado próprios continuam preservados.

Foram corrigidos problemas encontrados durante esta integração:

- Quantidade decimal de compra não perde o ponto decimal; unidades históricas diferentes não são somadas. O período das vendas mostrado no fornecedor corresponde à primeira compra considerada, no horário de Brasília.
- Datas de fornecedores são formadas por ano, mês e dia, sem depender da apresentação variável do locale no Node ou WebView.
- Arquivamento revalida a venda aberta e aguarda gravação durável; uma falha restaura os campos anteriores, inclusive a data. A recuperação continua acessível sem produtos ativos naquela família.
- Uma busca atrasada de lotes não pode reabrir uma janela fechada nem substituir outro diálogo.
- Cópias privadas mantêm a ordem mesmo com gravações no mesmo milissegundo ou relógio retrocedendo.

O teste de interrupção tardia de movimento mede a propriedade e o cancelamento dentro do próprio WebView, evitando que a latência do ADB transforme uma animação já concluída em falha de medição. Os demais cenários históricos foram preservados.

## Validação e entrega

Entrega concluída em 03/11/2026. **843 testes unitários, oito cenários compilados em 320/360/393/412 px nos dois temas e quatro jornadas físicas completas no Reno e no PKJ: PASS.** Em 320 px também foram usados texto ampliado, modo leve e movimento reduzido.

APK: **9.304.793 bytes**, SHA256 `f94e6152aed3a88ecb13f8f17ef706b4a2f0dccc5407e40529db316f647d81cf`. O mesmo arquivo está no workspace, nas pastas New project e Território Gestão e instalado nos dois celulares. Atualizações com `install -r`: PKJ às **12:14:15**, Reno às **12:17:10**. Datas originais de instalação preservadas, hashes conferidos e processo/primeiro plano confirmados tecnicamente; não houve nova confirmação visual humana do aplicativo principal.

Os auxiliares137, a captura temporária de cada aparelho e os forwards desta rodada foram removidos; KeepAwake foi liberado. Nenhum auxiliar histórico foi removido. Os candidatos anteriores foram substituídos após as correções encontradas nos testes; somente o hash acima é a entrega final.

Estado final e comprovantes: `qa/update137-final-review.json`, `qa/update137-package-review.json` e `qa/update137-delivery.json`. O inventário de commits, arquivos e decisões está em `qa/update137-integration.json`.

Os testes usam somente dados sintéticos em navegador e auxiliar Android separado. GPS, compartilhamento e navegação externa são simulados no auxiliar. Nenhuma leitura, cópia, limpeza ou restauração dos dados do aplicativo principal faz parte desta atualização. O teste de zerar/restaurar ocorre somente na base fictícia.

Assinatura original, identidade, CRC, assets e alinhamento ZIP/ELF de 16 KB são conferidos estruturalmente. Isso não representa teste em sistema com páginas de 16 KB, medição de FPS, bateria ou desempenho em aparelho básico. O restante por fornecedor é uma estimativa, sem rastreabilidade comprovada por lote de origem.

Nenhum checkout Claude foi modificado e nenhum backend foi publicado. APKs, chaves, dados e capturas privadas não são publicados no Git.
