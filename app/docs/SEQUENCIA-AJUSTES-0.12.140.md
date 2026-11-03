# Sequência de ajustes a partir da 0.12.140 (AGRO Gestão Claude)

Pedido do Alex em 03/11/2026: 25 ajustes. A ordem abaixo segue três regras:

1. **Primeiro o que pode estragar dado ou venda.** Defeitos de carrinho, estoque e aviso vêm antes de recursos novos.
2. **Depois a base, depois o que depende dela.** Cadastro de produto (unidade, embalagem, categoria) antes de estoque por fornecedor. Estoque e vendas certos antes de a Inteligência responder sobre eles.
3. **Um pacote por versão.** Cada etapa gera um APK, testes, teste nos dois temas em 320/360/393/412 px, instalação com `adb install -r` (dados preservados) e um commit próprio. Se uma etapa der problema, as outras não são afetadas.

Os números entre colchetes são os itens do pedido original.

---

## Etapa 0 — Diagnóstico e segurança (sem mudar o app)

| Item | O que fazer | Pronto quando |
|---|---|---|
| [8] Qwen | Procurar o Qwen no Git. **Resultado de 03/11:** não há Qwen em nenhum ramo enviado (main, codex/atualizacao-agro-gestao2, claude/agro-gestao3) nem nas pastas de projeto deste PC. Se a versão de teste do Codex estiver só no celular ou em outra pasta, o Alex indica onde. | Decisão registrada. Recomendação: **não embarcar LLM local** agora. Um modelo como o Qwen pesa de 0,5 a 4 GB, deixa celular básico lento e esquenta, e não lê os números do app melhor que os motores atuais (ver Etapa 5). |
| [17] Formulário | O formulário anexado não veio na mensagem. Assim que chegar, comparar cada pergunta com o que Gestão e o Cérebro já respondem. | Tabela pergunta → onde já existe → falta / redundante. |
| [20] Red team | Fazer uma lista de ataques e abusos possíveis antes de mexer: venda dupla, estoque negativo, carrinho travado, dados apagados sem backup, pergunta que faz a Inteligência inventar número, texto colado com instrução, dados de demonstração misturados com reais. | Lista virou casos de teste usados em todas as etapas. |

## Etapa 1 — Defeitos de venda e estoque (0.12.141)

Corrige o que atrapalha a venda de hoje.

| Item | O que fazer | Pronto quando |
|---|---|---|
| [4] Botão Finalizar desabilitado | Reproduzir: tocar no produto → carrinho abre → sair sem comprar → voltar → digitar valor. Achar o estado que não é recalculado ao reabrir e consertar no motor compartilhado do carrinho. | O botão habilita em todas as entradas no carrinho (produto, voz, pill, venda múltipla). Teste automático do caminho. |
| [2] Dois toques para estoque | Achar quando parou de funcionar (comparar com versões anteriores no Git) e restaurar. | Dois toques abrem o estoque do produto, no claro e no escuro, sem disparar venda. |
| [22] Venda múltipla com 1 pill | Tocar e segurar numa pill única não entra no modo de seleção. Habilitar o mesmo gesto da lista com várias pills. | Segurar entra na seleção múltipla com 1 ou com várias pills. |
| [21] Aviso de estoque zerado | Testar a caixinha vermelha no lugar de "Loja" e a notificação do Android: zerar um produto **no navegador ou no Modo Teste**, nunca vendendo de verdade no celular. | Caixinha e notificação aparecem e somem quando o produto volta a ter saldo. Se a notificação depende de permissão, o app avisa. |
| [10] Campos obrigatórios em vermelho | No cadastro de produto, campo obrigatório vazio (unidade de venda, preço, nome) fica com borda e rótulo em vermelho ao tentar salvar, com a mensagem ao lado. | Sem salvar produto incompleto. Vermelho legível nos dois temas e com texto ampliado. |

## Etapa 2 — Cadastro de produto (0.12.142)

Base para estoque, fornecedores e Inteligência.

| Item | O que fazer | Pronto quando |
|---|---|---|
| [13] Categoria por janela | Trocar as pills horizontais de "Produto para estoque" por uma linha com seta: "Toque na seta para escolher a categoria". A janela abre da linha e volta para ela (diretriz de aberturas) com Cafés, Hortifrúti, Laticínios e as demais. | Novo cadastro continua **sem categoria presumida**. Janela testada em 320 px. |
| [11] Café verde em saca | Categoria café verde sugere "Saca" na apresentação, não "Pacote". | Café torrado e moído continua em pacote. |
| [12] Saca de 60 kg | Opção 60 kg na apresentação de saca, a medida padrão do café. A calculadora já converte saca de 60 kg. | Venda e estoque em saca conferem com a conversão da calculadora. |
| [15] Embalagem livre | Em Configurações do produto, a pessoa escolhe ou escreve a embalagem: pote, sacola, litro, bandeja, pacote, caixa, maço, dúzia e outras. | Embalagem nova aparece certa na venda, no estoque, nas planilhas e no relatório. |
| [14] Hortifrúti ampliado | Incluir assa-peixe, outras plantas, ervas e verduras regionais que faltam no catálogo embarcado e nas diretrizes de produtos. O catálogo já tem assa-peixe em parte; conferir e completar. | Busca encontra os novos itens offline, com o nome usado na região. |
| [16] Lote e validade | Conferir com `knowledge/estoque-validade-contexto.md` e `features/advisor/validity-rules.js`: entrada com lote, validade por lote, aviso de vencimento, venda pelo lote mais antigo. | Divergências corrigidas ou registradas como limite. |

## Etapa 3 — Estoque, fornecedores e rastreio (0.12.143)

| Item | O que fazer | Pronto quando |
|---|---|---|
| [1] Estoque em Fornecedores | Em cada fornecedor: compras, quantidade comprada, quanto já foi vendido e quanto resta, por produto. Usa as compras já registradas; não cria compra sozinho. | Comprado − vendido − perdas = restante, conferindo com o saldo do Estoque. |
| [3] Quando entrou cada unidade | Pesquisar a entrada de um produto ou lote: data, quantidade, fornecedor, custo e validade. | Busca responde "quando entrou o café 250 g do lote X". |
| [23] Produto fora do catálogo | Cadastrar produtos e serviços que não estão na lista automática e conferir que venda, estoque, Gestão, planilhas e Inteligência os tratam igual aos do catálogo. | Teste automático com produto manual e com serviço. |

## Etapa 4 — Relatório do dia e reorganização da Gestão (0.12.144)

| Item | O que fazer | Pronto quando |
|---|---|---|
| [24] Relatório do fim do dia | No acompanhamento diário: total vendido, quantidade total de produtos, quais produtos, os 3 horários de maior venda, formas de pagamento e clientes identificados (horário, produtos, pagamento e de onde é). Receita e faturamento mais profundos e comparação entre dias ficam na Gestão. | Os números do dia conferem com a Gestão do mesmo dia. |
| [5] Cérebro × Gestão | Listar o que a Inteligência do Negócio (Cérebro) mostra e o que as seções da Gestão já mostram. Tirar as duplicações e levar o que é do Cérebro para baixo da seção Receita por dia. | Nenhuma informação aparece duas vezes com números diferentes. |
| [19] Orientação | Mover a seção de orientação para Produtos e Clientes. | Nada some na mudança; todas as ações continuam acessíveis. |
| [18] Botão Lançar custo colado | Separar o botão em Gestão › Custos. | Espaçamento igual ao dos outros cartões. |

## Etapa 5 — Inteligência do Negócio e "Pergunte sobre seu negócio" (0.12.145)

O maior item. Feito depois das etapas 1 a 4 para responder sobre dados já certos.

| Item | O que fazer | Pronto quando |
|---|---|---|
| [6] Inteligência acompanha todo o sistema | Uma única fonte de fatos para vendas, estoque, clientes, fornecedores, custos, eventos e lotes, a mesma que a Gestão usa. Nada calculado duas vezes de jeitos diferentes. | Cérebro e Gestão mostram o mesmo número para a mesma pergunta e o mesmo período. |
| [7] Perguntas variadas | Um motor de consulta local que entende a pergunta (produto, quantidade, período, cliente, CNPJ, local, forma de pagamento, mais/menos, quanto tem, quando) e responde com os dados históricos e os de agora. Exemplos: "o que vendi mais", "o que vendi menos", "quantos peixes tenho em estoque", "vendi para quantos CNPJ". Um banco de perguntas de teste com centenas de combinações, incluindo erros de digitação e fala. | Cada resposta mostra o período e de onde veio o número. Pergunta sem dado responde "não há registro", nunca inventa. Funciona offline. |
| [8] LLM | Só se o motor local não bastar, avaliar um modelo pequeno **apenas para entender a frase**. Ele não recebe os números e não calcula; quem responde continua sendo o motor do app. Medir peso, memória e tempo num celular básico antes de decidir. | Decisão baseada em medição, não em suposição. |

## Etapa 6 — Português, transparência e revisão final (0.12.146)

| Item | O que fazer | Pronto quando |
|---|---|---|
| [9] Português | Revisar todos os textos do app: acentos, concordância, crase, maiúsculas e títulos ("Curva Abc" virando "Curva ABC", por exemplo). Uma lista de termos padronizada (Fiado, Pix, Hortifrúti). | Revisão completa, com teste automático para os erros mais comuns. |
| [25] O que o app faz e o que não faz | Uma página em Ajustes, em linguagem simples: o que o app calcula e guarda, o que depende do que a pessoa registra, o que não promete (acurácia absoluta, recuperar dados após restauração de fábrica, desempenho medido em aparelho básico). | Texto revisado e coerente com a regra do projeto. |
| [20] Red team final | Rodar de novo a lista da Etapa 0 em cima da versão final. | Nenhum caso aberto, ou cada limite escrito. |

---

## Dependências

- A Etapa 2 vem antes da 3 porque fornecedor, lote e entrada usam unidade e embalagem.
- As Etapas 1 a 4 vêm antes da 5 porque a Inteligência só pode responder bem sobre dados certos.
- A Etapa 6 fecha o ciclo porque os textos mudam em todas as etapas anteriores.

## O que fica para o Alex

- Enviar o formulário do item 17.
- Dizer onde está a versão de teste com Qwen, se existir fora do Git.
- Testar cada versão no celular e responder com o que viu, como nas versões anteriores.
