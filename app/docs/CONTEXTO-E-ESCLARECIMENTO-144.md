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

A144 conecta, de forma experimental, Qwen0.6B ou GeminiNano à interpretação de perguntas do Gerente. Quando um modelo está preparado, o perfil de recursos permite e a interpretação está habilitada, o modelo propõe um plano JSON. O aplicativo valida entidades, filtros, referência anterior, natureza hipotética e revisão dos registros antes de consultar motores.

O caminho rápido determinístico permanece para perguntas já reconhecidas. Referências, hipóteses e consultas não identificadas podem usar o intérprete local. Há memória curta em RAM, vinculada a produtor, origem e revisão; não é memória de treinamento. Zerar, trocar o produtor ou modificar a base invalida o contexto antigo.

Os contratos abrangem saldo físico, entradas, quantidades vendidas, classificações, demonstrativo financeiro, pendências e histórico de compras, contagens de clientes/CNPJs, histórico de cliente, eventos, clima pelo módulo existente e simulação de desconto. Não é conversação irrestrita nem cobertura de qualquer cálculo possível. Períodos e combinações sem contrato são recusados ou esclarecidos. No máximo três tarefas por plano e contexto limitado para proteger o aparelho.

O contexto enviado ao modelo contém pergunta, seleção e rótulos/IDs mínimos de cadastros. Preços, saldos, documentos e telefones dos cadastros não entram no pedido de interpretação. O modelo não gera respostas financeiras nem tem ferramenta de gravação. O desconto hipotético é calculado pelo simulador existente e explicitamente não altera preço.

Uma interpretação utilizada pode ser conferida em “Como entendi sua pergunta” e corrigida por “Ajustar pergunta”. Se o modelo propôs a consulta, não é carregado outro modelo para resumir a mesma resposta. GeminiNano depende de disponibilidade oficial do AICore; Qwen0.6 usa o mesmo arquivo privado preparado na143. Sem modelo, consultas diretas continuam funcionando; referências não resolvidas pedem esclarecimento, preservando uma referência única já identificada quando possível.

A ligação de código não comprova qualidade geral de linguagem. Os testes remotos usam planos e provedores simulados para conferir limites e execução. A qualidade, latência e memória de inferência real no celular continuam pendentes de avaliação física. Não afirmar compreensão universal ou ausência absoluta de erros.
