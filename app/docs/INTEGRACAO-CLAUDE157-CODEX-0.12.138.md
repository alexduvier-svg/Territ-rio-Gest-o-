# Codex 0.12.138 — integração Claude148–157

Pedido de 03/11/2026: consultar novamente o Git do Claude e atualizar o Codex. Fonte consultada e confirmada no remoto: **Claude 0.12.157**, commit `b679b4b71bd505fb14ee094995b0307465402200`. Base própria: Codex137, `e11b5f3c9cc756d35e3ddacbf915c1c6ca2f577b`. Foram incorporados os dez commits desde Claude147; a numeração própria continua **Codex 0.12.138/code179**.

## Alterações incorporadas

- Resumo do dia com quantidade de itens, destaques por horário, clientes identificados, local e pagamento; listas expansíveis e vendas em ordem de horário.
- Gestão com Inteligência do Negócio abaixo de Receita por Dia, Orientação em Produtos e Clientes, espaçamento de Custos e histórico de vendas por dia/horário.
- Motor local para perguntas em português sobre vendas, produtos, estoque, compradores, pagamentos, períodos e lucro bruto. Não registra operações a partir de uma pergunta.
- Português dos nomes e frases de produtos, concordância e apresentação dos relatórios.
- Comparação automática com o período anterior, nomes de períodos, variação e pontos percentuais. Períodos em andamento usam o trecho equivalente do anterior.
- Página em Ajustes explicando o que o aplicativo faz, de quais registros depende e os seus limites.
- Troca de abas e áreas do estoque com a nova tela opaca, sem a imagem anterior por baixo. O Codex evita construir uma cópia de saída que seria descartada e mantém o controle de todo o grupo de animações.
- Inteligência abre primeiro a janela com conteúdo provisório e preenche a análise após a expansão.
- Aviso de estoque zerado também na Loja, opção Vou repor depois, reativação após reposição e novo esgotamento e marca visual dos produtos zerados.

Mantidas as proteções próprias de privacidade, caixa separado de previsões, custo desconhecido, CSVs, arquivamento durável, busca de lotes, cópias locais verificadas, confirmação de zerar/restaurar e Seu lugar135. Não foi repetida a transferência de dados133.

## Revisão necessária ao portar

O novo motor de perguntas foi ajustado antes da entrega para respeitar o local selecionado, datas civis canônicas de Brasília, ano explícito e limite do instante atual. Um produto não encontrado não recebe o total de outros produtos. Quantidades históricas de unidades diferentes permanecem separadas; rateio antigo mantém o total em centavos.

Compradores sem identificação não viram pessoas distintas ou pessoas físicas presumidas. A frequência de uma forma de pagamento é separada do valor vendido, e Fiado não é apresentado como dinheiro recebido. Margem com receita zero não produz NaN/infinito; custo histórico desconhecido continua desconhecido. A comparação de lucro sinaliza dados parciais e não calcula uma margem total comparável quando faltam custos.

Os detalhes de uma venda usam o nome e a descrição históricos quando registrados. O preenchimento atrasado da Inteligência só vale para a mesma janela, modelo e dados que o iniciaram. A opção Vou repor depois aguarda gravação durável, restaura o estado em caso de falha e só aceita produtos ainda elegíveis. O envio nativo revalida a confirmação do produtor depois da consulta de permissão.

A página O que o app faz distingue as contas/perguntas locais da análise opcional por um provedor externo configurado pelo produtor. A integração não remove nem publica esse recurso opcional.

## Evidências e limites

Entrega concluída em **03/11/2026**. **1.120 testes unitários, oito cenários compilados em 320/360/393/412 px nos dois temas e quatro jornadas físicas completas: PASS.** Em 320 px foram usados texto ampliado, modo leve e movimento reduzido; cada jornada física validou 82 condições.

APK: **9.321.177 bytes**, SHA256 `0df91c4c6a33455a3c5bc3a35d860a014a9230bb5609168f48324cd4a8e55bb4`. O mesmo arquivo está no workspace, em New project e Território Gestão e nos dois celulares. Instalação com preservação de dados: PKJ às **16:45:35**, Reno às **16:47:55**. Datas originais, hashes e processo/primeiro plano conferidos tecnicamente. Não houve nova confirmação visual humana do aplicativo principal.

Os auxiliares138, capturas temporárias e forwards desta rodada foram removidos; KeepAwake liberado e auxiliares históricos preservados. A preferência de oferecer a opção Já desbloqueei nas futuras solicitações ficou registrada em AGENTS.md.

Estado e resultados finais em `qa/update138-final-review.json`; pacote em `qa/update138-package-review.json`, instalação em `qa/update138-delivery.json` e inventário em `qa/update138-integration.json`. O relatório de domínio completo fica em `qa/update138-unit.txt`.

As jornadas de interface usam dados fictícios e auxiliar Android separado. GPS, compartilhamento e navegação externa são simulados. Zerar/restaurar é exercitado apenas nessa base descartável. Nenhum banco principal é lido, copiado, limpo ou restaurado por este trabalho.

O lembrete nativo reavalia o estoque e permite um novo aviso após o intervalo de 20 horas se o produto continuar zerado e não tiver sido reconhecido pelo produtor. Isso depende da verificação pelo aplicativo, da permissão e do Android; esta entrega não mede ou garante execução contínua em segundo plano. O restante por fornecedor continua estimado, sem vínculo comprovado de cada venda com uma compra.

A linguagem é produzida por regras locais, que podem não abranger todo nome regional ou marca. O motor de perguntas cobre os padrões reconhecidos e conserva o caminho anterior para outras consultas. Não prevê demanda nem comprova recebimento bancário.

Assinatura, assets, CRC e alinhamento ZIP/ELF de 16 KB são conferências estruturais. Não equivalem a medição de FPS, bateria, desempenho em aparelho básico ou execução em sistema com páginas de 16 KB. O checkout Claude e o backend permanecem sem alterações por este trabalho. APKs, chaves, dados e capturas privadas ficam fora do Git.
