# Codex 0.12.142 — abertura direta da Gestão

Correção solicitada em 06/11/2026 sobre o Codex 141, commit `3446f91a8c4747062e4f0706f11d701c0e9eaef0`. As funções da Gestão abriam primeiro uma janela de preparação; o conteúdo era inserido depois da animação. Isso produzia o quadro vazio percebido pelo produtor.

## Alteração

As 14 funções agora recebem o conteúdo real antes de abrir a janela: Ranking; Vendas, Resultado, Caixa e Custos; Produtos, Estoque, Clientes, Fornecedores, Indicadores e Comparação; Orientações, Simulações e Arquivos. A abertura conserva a origem do toque e a mola existente. A leitura adicional de Orientações também é montada antes da entrada.

Foram retirados o quadro de preparação, seu estilo e o preenchimento posterior. A rolagem de uma janela reconstruída é restaurada diretamente. A consulta genérica de métricas antigas só é feita nos caminhos que precisam dela. As funções fechadas continuam sem pré-cálculo de KPIs; não foi criado agendador, observador ou consulta de geometria na produção.

O período e os cálculos permanecem canônicos. Controle de privacidade, pergunta digitada, avisos de custo ausente, Voltar e navegação continuam integrados. O arquivo de vendas, os custos, as parcelas, o ROI e as demais funções da 141 não foram substituídos. A premissa de abertura com o conteúdo pronto foi registrada em `interface-guidelines.js`, versão 60.

## Validação e entrega

**Concluída em 06/11/2026:** 1.230 testes unitários, oito cenários de navegador e quatro jornadas físicas aprovados. A matriz cobre 320, 360, 393 e 412 px nos dois temas; em 320 px, texto ampliado, modo leve, efeitos reduzidos e altura de 568 px. As capturas sintéticas foram revisadas visualmente.

Cada cenário toca os 14 botões reais, verifica o conteúdo no evento de abertura e após a ação e lê os três primeiros quadros por `requestAnimationFrame`. São 168 aberturas e 504 leituras de quadros na soma dos casos de navegador e aparelhos. Os testes também verificam a ausência de trabalho antecipado com a Gestão fechada, a pergunta preservada ao alternar privacidade, o aviso de custo antes de outra abertura, a troca do mês sem quadro intermediário e a impossibilidade de uma abertura anterior substituir a tela seguinte. A preparação usa somente dados fictícios; a igualdade integral da base é conferida após restaurar a própria fixture.

Uma prévia da QA consultava `periodAnchor`, que não faz parte da ponte pública antiga. A verificação passou a comparar o mês efetivamente selecionado antes e depois da mudança; a exigência funcional foi mantida. Não houve alteração do APK por essa correção da QA.

APK **0.12.142/code183**, **9.390.897 bytes**, SHA256 `22e97555567c6481a141b30c976979cdf6edc28cc53b092bb2199a425b576cf1`. Pacote `br.com.territorio.gestao2`, nome AGRO Gestão Codex e certificado original preservados. Os 58 assets compilados e as duas pontes Cordova, CRC, assinaturas v2/v3 e estrutura ZIP/ELF de 16 KB foram conferidos.

O mesmo APK foi entregue neste workspace, em New project e em Território Gestão e instalado por atualização nos dois aparelhos: **Reno às 22:14:01 e PKJ às 22:14:05**, horários locais de 06/11. As primeiras instalações foram preservadas. Hash, processo e primeiro plano foram conferidos tecnicamente, sem nova confirmação visual humana do aplicativo principal.

Auxiliar final: `8c1d97d435bbce4efb8d4c8324a97e8544ac4e8e95a6015bd9d4988f8ee3ed59`. O pacote `br.com.territorio.gestao2.opening142`, a captura temporária e os forwards próprios 9413/9414 foram removidos dos dois aparelhos. KeepAwake liberado; auxiliares históricos preservados.

Provas: `qa/opening142-unit.txt`, `qa/opening142-package-review.json`, `qa/opening142-final-review.json` e `qa/opening142-delivery.json`; teste do início da abertura em `qa/management-opening142.cjs`. Não há leitura, limpeza ou restauração do banco principal pela QA, nova cópia de dados do Claude, alteração do checkout Claude ou publicação de backend. Não foram medidos FPS, bateria, aparelho básico físico ou execução em páginas de 16 KB.

A entrega está encerrada. Não repetir compilação, verificador, testes ou instalação para uma retomada documental.
