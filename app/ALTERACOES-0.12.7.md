# AGRO Gestão 2 — 0.12.7 / código 47

Na seção Valores e estoque do cadastro, os rótulos Preço por, Custo por, Estoque inicial e Estoque mínimo ficam vermelhos, com cores próprias para claro e escuro. Os valores digitados conservam a cor de texto normal.

O aviso lilás de venda pendente voltou a pulsar suavemente e seu carrinho balança. Cada ciclo de 3,6 segundos tem intervalo de repouso; usa somente transform/opacity CSS. Aguarda a entrada física terminar e pausa no toque. Modo leve, Reduzir efeitos e movimento reduzido do sistema mantêm o aviso estático. O aviso continua aparecendo apenas quando há uma venda pendente.

Validação visual isolada dos dois temas: quatro rótulos vermelhos, duas animações após a transição de entrada, nenhuma animação em movimento reduzido/modo leve e nenhuma alteração de vendas, movimentos ou saldo. Não houve repetição da suíte geral nem transações de teste no aparelho real; a mudança é de apresentação. Evidências em ../qa/labels-pending-smoke.json e capturas values-labels/pending-sale.

Arquivos de app alterados:

- src/interface-refinements.css
- src/motion.css
- package.json
- package-lock.json
- android/app/build.gradle

Build/validação: ../qa/build-rotulos.ps1, ../qa/labels-pending-smoke.cjs. O estado final de assinatura, assets, hash e instalação fica em native-apk-validation-0.12.7.json. Este documento sozinho não confirma instalação.
