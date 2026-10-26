# Estoque, Lotes e Orientações

Referência local da implementação 0.12.87. Este texto não ativa funções nem comprova que uma atualização foi instalada. A entrega validada é registrada separadamente.

## Objetivo e Fonte dos Dados

O ERP mantém uma quantidade física por produto e apresentação. Os lotes dividem os movimentos dessa mesma quantidade; não há outro saldo para editar. A disponibilidade para venda considera as reservas aplicáveis, a validade e a condição do lote. Separar uma carga para feira reserva produtos, sem criar estoque adicional.

Cada orientação deve explicar a situação, os registros usados, a regra ou estimativa, as limitações e um próximo passo que o produtor possa avaliar. Não gerar compras, vendas, descontos ou perdas automaticamente.

## Validade Opcional por Entrada

Não Informada, Com Validade e Não Se Aplica são estados distintos. Uma reposição tem quantidade e validade próprias. O produtor pode escrever uma data, usar o calendário ou informar um prazo em dias ou meses a partir de uma referência explícita. A data calculada exige confirmação. Recebimento não significa fabricação.

O app não inventa o dia de um rótulo que informe apenas mês e ano. Prazo Informado, Data do Vencimento e Dias Restantes são informações diferentes. Os resumos usam quantidades restantes por lote, mantendo unidades incompatíveis separadas.

Priorizar a saída dos lotes elegíveis que vencem primeiro. Vencido ou em avaliação mantém saldo físico, mas fica indisponível para venda. Corrigir uma data vencida não libera o item automaticamente. Devoluções começam em avaliação e exigem conferência explícita. Destinação como perda depende de confirmação e movimentação auditada.

## Calendário e Avisos

A agenda interna deriva vencimentos, revisões e validades de cotações dos registros de origem. Validade da cotação não é validade do alimento. D−5 e D0 usam a infraestrutura de notificações existente, com IDs vinculados, cancelamento após esgotamento e sem repetir avisos retroativos. Entrega no aparelho depende da permissão e do Android; a consulta local permanece disponível.

## Feiras e Vendas Antigas

A faixa de validade da carga usa apenas quantidades dos lotes separados e a data da feira. Uma carga antiga sem identificação não recebe datas presumidas. Para informar vendas antigas, confirmar a data real dentro do evento; quando houver vários lotes possíveis, informar quais saíram. O momento do registro permanece auditado separadamente.

## Limitações das Recomendações

Ausência de vendas registradas não prova baixa procura. Cobertura baseada em dias corridos deve declarar o período e a falta de comprovação dos dias de exposição. Quantidade de compra depende de prazo de entrega confiável, segurança definida e entradas futuras confirmadas; sem isso, usar o mínimo manual e informar a limitação. Não sugerir promoção rentável sem custos e despesas conhecidos.

Custos históricos das vendas são preservados. Compras registradas em Fornecedores não criam movimentações físicas ou financeiras automaticamente. Campos de origem e conservação são opcionais, sem certificação do aplicativo.

## Referências

Diretrizes recebidas de Decisões, Validade e Calendário (24/10/2026) e Estoque: Objetivo → Contexto → Ação → Output (25/10/2026). As regras entram na Orientação existente, com liberação e feedback únicos, sem outro motor, serviço pago ou envio de dados do produtor a uma IA.
