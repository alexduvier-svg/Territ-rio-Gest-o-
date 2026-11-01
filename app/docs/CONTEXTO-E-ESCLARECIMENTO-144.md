# Regra de entendimento contextual — prioridade da inteligência

Diretriz do produtor em01/11/2026: o mais importante é compreender suposições, contexto e referências. Respostas genéricas são proibidas. Esclarecer é necessário apenas quando a dúvida continuar depois de considerar o contexto válido.

## Ordem obrigatória

1. Interpretar a pergunta atual junto ao contexto válido da conversa, do produtor e do recorte selecionado.
2. Resolver referências como “ele”, “esses produtos”, “aquela feira” e “no mês passado” usando entidades e períodos efetivamente identificados.
3. Distinguir consulta de fatos, hipótese, simulação, previsão, comparação e pedido de ação. Uma suposição do usuário não é evidência nem autorização para alterar registros.
4. Construir um plano de leitura com entidades, filtros e cálculos permitidos pelos motores canônicos.
5. Validar o plano e consultar os registros originais. O modelo interpreta linguagem; não cria números, SQL, scripts ou transações.
6. Se houver duas referências plausíveis, perguntar exatamente sobre a ambiguidade. Se faltar um custo, fator de conversão ou período necessário, pedir somente o dado faltante.
7. Responder ao que foi perguntado, indicando o contexto, as fontes e as limitações necessárias. Não usar resumo geral ou dicas de outro assunto para encobrir falta de entendimento.

## Exemplos de comportamento esperado

| Contexto | Pergunta | Interpretação exigida |
| --- | --- | --- |
| Café Especial250g identificado | “E se eu baixar dois reais?” | Hipótese de desconto desse produto. Usar a simulação existente e manter o preço cadastrado. |
| Vendas de outubro consultadas | “E no mês passado?” | Resolver o período em relação ao contexto explicitado; se puder significar setembro ou o mês anterior à data atual, esclarecer essa diferença. |
| Dois produtos discutidos | “Ele está dando prejuízo?” | Esclarecer qual produto; não escolher o primeiro. |
| Um produto e período identificados | “Ele está dando prejuízo?” | Consultar custos históricos e receita desse produto; custos incompletos impedem afirmar lucro ou prejuízo apurado. |
| “Acho que caiu porque choveu” | “Foi isso mesmo?” | Tratar a afirmação como hipótese causal. Registros de vendas e clima não bastam, por si só, para comprovar a causa. |
| Dados zerados | “Tem produto pra chegar?” | Informar a ausência de compras cadastradas; não recuperar exemplos ou a resposta anterior. |

## Estado real da implementação

O143 mantém Qwen0.6B e GeminiNano em um painel de diagnóstico. Eles ainda não interpretam, de maneira ampla, as perguntas do negócio. Não declarar que o aplicativo entende qualquer formulação apenas porque o modelo está instalado.

O trabalho144 corrige a rota demonstrada na captura e aplica a regra de esclarecimento nas respostas desconhecidas do Gerente e do Orientador. Isso é uma correção de comportamento; não equivale à implementação completa de interpretação semântica contextual.

A conexão dos modelos ao Gerente exige um contrato de planos tipados, memória curta por produtor/origem, descarte após mudança de base e avaliação de referências, hipóteses e filtros. Os resultados precisam ser testados antes de habilitar execução automática. Ampliar expressões reconhecidas não substitui essa etapa.

Esta diretriz é a prioridade da evolução da inteligência. Não usar a regra “perguntar se não souber” como justificativa para ignorar um contexto que o aplicativo já possui.
