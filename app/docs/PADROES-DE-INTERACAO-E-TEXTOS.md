# Regras permanentes de interação e redação

Solicitadas pelo produtor em 04/11/2026. Aplicam-se a todo ajuste de interface, integração de referência, texto novo e relatório do Codex.

## Espaçamento e áreas de toque

Ações independentes devem manter pelo menos 8 px CSS de separação entre si e dos outros controles. Entre grupos de ações e seções funcionais, usar pelo menos 12 px. O padrão usual deve oferecer 8–12 px ou mais conforme a hierarquia visual. Teclados compactos e opções do mesmo campo podem usar 6 px, com contornos e estados claros. Nenhuma área de toque pode sobrepor outra funcionalidade.

Usar gap no contêiner flex/grid e margens de seção coerentes. Ao faltar largura, permitir quebra ou disposição vertical, preservando a ordem e a área de toque. Navegação, linhas de lista e campo com seu botão de limpar são componentes coesos: precisam manter a separação visual de suas funções e não recebem margens globais que desmontem o componente. Toda exceção de componente deve ser identificada e verificada.

Conferir o estado normal, expandido, valores extensos, campos com erro, teclado e rodapé. Validar 320, 360, 393 e 412 px nos dois temas, incluindo texto ampliado, modo leve e efeitos reduzidos. O contrato verificável está em qa/ui-spacing-contract.json e o verificador compartilhado em qa/ui-spacing.cjs. Novos grupos independentes devem ser cobertos pelo verificador. A medição é feita na QA sintética, preservando a leveza do aplicativo.

## Português e significado

Adotar o rigor de revisão esperado de um doutor em língua portuguesa, com foco no português brasileiro. Verificar ortografia, acentuação, concordância verbal e nominal, gênero, número, regência, pontuação, coesão, coerência e significado no contexto. Reler o fluxo completo: título, instrução, botão, confirmação, erro e resultado devem descrever a mesma ação.

Preferir linguagem clara, direta, respeitosa e adequada a interfaces. Botões indicam a ação com verbos consistentes; instruções explicam o que informar e como corrigir. Manter termos canônicos em cadastro, vendas, estoque, relatórios, CSVs, inteligência e mensagens compartilhadas: preço, custo, lucro bruto, margem de contribuição, caixa, previsão e recebimento conservam seus significados. Ausência de registro é diferente de zero; previsão é diferente de realização.

Aplicar plural pelo valor efetivo: 1 produto / 2 produtos, 1 esgotado / 2 esgotados, 1 venda / 2 vendas e 1 parcela / 2 parcelas. Usar os formatadores canônicos pt-BR para dinheiro, quantidades, datas e horários. Preservar siglas como ROI, CRM, PDV, CSV, CPF e CNPJ e a grafia Pix. Nomes, marcas e registros históricos do produtor devem conservar sua identidade; revisão de texto da interface não autoriza reescrever dados do negócio.

Parágrafos explicativos de leitura devem receber justificação, hifenização adequada ao pt-BR e largura confortável. A avaliação em tela estreita deve impedir espaços excessivos, cortes arbitrários de palavras e perda de legibilidade. Títulos, rótulos, botões, códigos e valores seguem o alinhamento funcional do componente. Conferir quebras naturais, tamanho ampliado, acentos e textos longos nos dois temas. A revisão editorial contextual acompanha a verificação automática da geometria e é obrigatória em toda alteração textual.

## Verificação da regra de espaçamento

O aplicativo compilado 0.12.140 passou nos oito cenários de 320, 360, 393 e 412 px, nos temas claro e escuro, incluindo texto ampliado, modo leve e efeitos reduzidos em 320 px. Foram feitas 510 medições entre controles e blocos nos estados exercitados, com foco em Gestão, Vendas, reposição, produtos e margens, indicadores, ROI e parcelamento. As medições usam os limites de recorte e visibilidade dos componentes. Prova: qa/ui-spacing-review.json. A fonte de produção e os APKs instalados permaneceram iguais durante esta verificação.
