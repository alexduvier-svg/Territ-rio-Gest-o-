# Codex 0.12.139 — reposição e produtos esgotados

Correções solicitadas em 03/11/2026, sobre Codex138 (`908d1ba72a65a9dd7c54b6227ab8bf7c0620cbb6`). Mantidos nome AGRO Gestão Codex, pacote `br.com.territorio.gestao2`, certificado original e dados existentes. A consulta ao Git do Claude continuou na versão157/`b679b4b`; esta versão não acrescenta outro port.

## Reposição de vários produtos

O botão antigo Finalizar percorria a lista inteira, ignorava quantidades vazias e fechava a janela. Por isso, ao informar apenas o café, o peixe desaparecia junto com a janela.

A reposição agora confirma um produto por vez. Depois de salvar o café, abre automaticamente o próximo pendente, como o peixe. **Agora não** deixa aquele produto para depois, sem lançar a quantidade digitada nem alterar saldo, lotes ou movimentos. A lista mostra o produto atual, o progresso e os que já foram repostos. Listas com mais de quatro produtos têm navegação nos dois sentidos.

Cada confirmação aguarda a gravação. Se a confirmação nativa ficar pendente, **Confirmar gravação** tenta novamente sem adicionar a quantidade duas vezes. Duplo toque, troca de contexto e conclusão tardia após fechar a janela são protegidos. Uma recusa síncrona de persistência recupera o saldo anterior. As reposições já confirmadas continuam salvas ao deixar os demais para depois.

Ao digitar no teclado próprio, a rolagem do mesmo produto é preservada. O teste em 320 px com texto ampliado reproduziu o salto ao topo antes da correção. A verificação registra a posição no toque e admite somente o limite natural da nova altura do conteúdo.

## Indicadores e retorno

- Produto esgotado recebe uma única bolinha vermelha antes da primeira palavra: **● Café Especial TC**. O nome com hífen também recebe a bolinha antes da primeira palavra inteira.
- Retiradas as setas vermelhas de reposição e o triângulo junto à quantidade. A ação de tocar no produto esgotado para repor continua disponível.
- Cards de áreas e subgrupos do Estoque preservam o total de produtos e mostram, em vermelho, **1 esgotado**, **2 esgotados**, **3 esgotados**. Acabando e Em dia continuam conforme o saldo dos demais casos.
- O produto esgotado vai para o fim da sua lista. Qualquer quantidade positiva, mesmo uma unidade ainda abaixo do mínimo, devolve o produto à ordem original.
- Após registrar a venda, o botão verde passa a ser **Voltar ao Início**, com o mesmo nome acessível. Fecha a confirmação e volta à tela de vendas, sem criar uma nova venda ou rascunho.

A diretriz interna foi atualizada para não continuar recomendando o triângulo antigo.

## Validação e entrega

APK139/code180: **9.321.177 bytes**, SHA256 `ef8df91078cc1450c8cf2d49749ca731b4ba0b163dddfcbe94833530df19269f`. Assinatura original v2/v3, 57 assets compilados mais duas pontes Cordova, CRC e alinhamento ZIP/ELF de 16 KB aprovados. Fixture isolada `br.com.territorio.gestao2.restock139`, SHA256 `36dd15d8f79acc0519c2f1d1b4bf2a9d45f1296c80ed98d9032653752723a557`, sem permissão Internet.

Entrega concluída em **03/11/2026**. **1.133 testes unitários, oito cenários compilados em 320/360/393/412 px nos dois temas e quatro jornadas físicas completas: PASS.** São 13 casos unitários novos de fila, falha de gravação, duplo toque, fechamento, paginação, bolinha, plural e ordem. Em 320 px foram usados texto ampliado, modo leve e movimento reduzido. Cada jornada física validou 95 condições. PKJ: claro às17:35:30 e escuro às17:50:19; Reno: claro às17:37:19 e escuro às17:53:24.

O mesmo APK está no workspace, em New project e Território Gestão e nos dois aparelhos. Atualização com `install-r`: PKJ às **17:55:54**, Reno às **17:56:07**. Primeiras instalações preservadas:28/10/2026 08:59:26 no PKJ e21/10/2026 18:58:01 no Reno. Hash, versão, processo vivo e primeiro plano conferidos tecnicamente nos dois, sem nova confirmação visual humana dos aplicativos principais.

Auxiliar139, captura temporária no aparelho e forwards desta rodada removidos; KeepAwake liberado. Auxiliares históricos preservados. Metadata139 está `installed-and-validated`, com `installed=true`; não repetir compilação, verificador ou instalação por documentação.

Provas finais em `qa/restock139-final-review.json`, pacote em `qa/restock139-package-review.json`, instalação em `qa/restock139-delivery.json`, inventário em `qa/restock139-changes.json` e domínio em `qa/restock139-unit.txt`.

Os testes usam dados fictícios, inclusive a venda que valida Voltar ao Início. O auxiliar tem os assets compilados do APK principal, com apenas configuração e HTML próprios de teste. GPS, navegação externa, compartilhamento e HTTP são simulados no auxiliar. A base principal não é lida, zerada, copiada ou restaurada. Não há nova migração133, alteração no backend ou no checkout Claude.

A preparação de teste preserva o tema do cenário depois de restaurar a primeira cópia sintética e confere o tema antes de cada captura. As rodadas escuras foram repetidas após essa revisão. Uma rodada anterior do Reno parou na asserção de limpeza integral dos dados fictícios; a repetição completa passou com a mesma asserção, mantida no teste histórico. Relatórios anteriores ficam nos diagnósticos locais e não são usados como resultados finais.

As verificações estruturais de 16 KB não comprovam execução nesse tipo de sistema. Esta rodada não mede FPS, bateria ou aparelho básico físico. APKs, chaves, bancos e capturas privadas ficam fora do Git.
