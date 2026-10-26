Registro posterior: a primeira implementação foi entregue na0.12.88, com composição de custos/taxas e guarda de carga. Ver ENTREGA-0.12.88.md. A avaliação abaixo descreve o momento anterior, quando a0.12.87 ainda não incluía Contas.

# Avaliação — Calculadora Contas e Integração com Finanças

26/10/2026. Pedido humano: continuar a entrega anterior, avaliar se é possível e se integra Finanças da Gestão. PDF de8páginas lido integralmente; páginas2/7 conferidas visualmente. Git atualizado: origin/claude/agro-gestao3 avançou de cffe32b para22e3813, a implementação citada foi localizada e revisada. Nenhum merge/cherry-pick desse ramo foi realizado. AGRO2 permanece no seu ramo autorizado.

## Conclusão

Viável, offline e coerente com Finanças existentes. Reaproveitar a calculadora e os dados/cálculos canônicos. A versão2 hoje tem Básica/Científica; o modo Contas ainda NÃO está implantado nem incluído na entrega0.12.87. Esta é avaliação e registro do desenho solicitado, sem criar outra aba, saldo ou motor financeiro.

## Desenho Humano Mais Recente

Manter a aparência da calculadora normal. Ao lado do ícone científico, acrescentar um ícone de$ (preferível a banco, pois não implica conexão bancária). O$ transforma o conteúdo na MESMA janela usando o motor de transição existente; retorno à calculadora preserva seu estado. Esta preferência posterior substitui o seletor segmentado de três partes descrito no PDF. Contas em seções expansíveis: Preço, Vendas e Descontos/Taxas, uma aberta por vez. RodapéVoltar fixo, corpo rolável, margens e dois temas. Sem abrir outra calculadora sobreposta.

Cada resultado do modoContas deve ter explicação prática, dados usados, condição/limitação e próximo passo. Sem pop-up em cada tecla, sem IA online, sem inventar relações do negócio para operações aritméticas livres. Recalcular apenas a conta e sua explicação, preservando foco e teclado. Resultados são simulações; não entram nas métricas, aprendizado ou notificações reais como operações registradas.

## Integração Canônica

| Assunto | Fonte já existente | Cuidado |
|---|---|---|
| Produto e custo | ERPModel/costKnown, ordem do Estoque | custo0confirmado difere de ausente; mesma variação/unidade |
| Taxas, fixos e retirada | settings.finance + finance.js | distinguir configuração confirmada de defaults normalizados |
| Receita e indicadores | statement/productMargins/recorte canônico | devoluções/descontos e competência/caixa separados; Fiado não é recebido até a baixa |
| Equilíbrio por unidade | simulação pura sobre dados informados | não duplicar o equilíbrio financeiro mensal registrado; custos variáveis e unidades explícitos |
| Usar Preço | editor existente do produto | preencher rascunho, nunca salvar automaticamente; revalidar produto/ator/unidade |
| Insights | regras locais de explicação da simulação | sem outro saldo ou motor; linguagem condicional e limitações visíveis |

## Ajustes Necessários Antes de Adaptar o Código do Claude

1. **Proveniência.** financeSettings() completa taxas com defaults1,99/4,98. Esses valores não podem receber a marca SeusDados só porque o normalizador os retorna. Usar valores efetivamente confirmados; ausências continuam vazias. Taxa não informada pode ser excluída de uma simulação, mas o resultado precisa dizer que é parcial, sem afirmar taxa zero real.
2. **Perdas e sobras.** Produto que voltou e continua vendável não é perda. Separar perda física e não vendido; não criar um limite universal de10% para todos os produtos e contextos.
3. **Contribuição e lucro.** Preço menos custo não é automaticamente lucro líquido. Indicar despesas consideradas/ausentes. A unidade de empate cobre custos informados; nem sempre já gera lucro (se a divisão for exata, o excedente só começa na unidade seguinte).
4. **Comparação mensal.** Mês atual incompleto versus mês anterior inteiro exige aviso de recortes diferentes ou comparação equivalente. Não interpretar a diferença bruta como tendência comprovada.
5. **Limites matemáticos.** Validar100% de taxas, contribuição não positiva, quantidades/unidades, valores não finitos e precisão. Custo0é conhecido, mas não sustenta acréscimo percentual sobre o custo nem define sozinho um preço por markup. Não preencher0por ausência.
6. **Entradas brasileiras.** Preservar1.234,56/1.200/9.5 e rejeitar formatos inválidos, não converter agrupamentos errados em números aparentemente válidos.
7. **Reuso seletivo.** O commit22e3813 também altera Fiado/finance.js/core. A versão2 usa credit.receipts e cálculo canônico já diferente do receivable do ramo3. Não substituir arquivos inteiros nem mesclar a identidade/versionamento do outro APK; adaptar apenas módulos/UX pertinentes e testar a compatibilidade.
8. **Mensagens condicionais.** Ex.: Com os custos informados, um desconto reduz quanto cada venda deixa. Para manter a mesma contribuição, seria necessário venderX% a mais. Isso não prevê procura nem garante compensação.

## Próxima Etapa de Implementação

Concluir0.12.87 primeiro. Depois adaptar fórmulas puras e testes-ouro do commit22e3813, acrescentar casos de lacunas/limites e cálculos canônicos. Integrar como modo da calculadora, ícones acessíveis, seções expansíveis e explicação de cada resultado. Conferir modo leve,320ampliado/360/393/412,claro/escuro/teclado e os dois aparelhos. Só então registrar como função entregue. Não publicar cálculos ou alterações de preço por causa deste documento.

## Complementos Humanos

O link privado Claude é referência de informação, não de layout. Tentativa de leitura pelo navegador disponível exigiu login; conteúdo do artefato não foi visualizado. O código do commit22e3813 e o PDF foram de fato revisados. Preservar o layout atual do AGRO2. Todo o app deve fornecer informações úteis e ser integrado pelo mesmo motor: fatos locais→contexto→orientação→ação proposta→auditoria. Evitar passividade, duplicação e avisos em excesso. Simulações da calculadora permanecem identificadas e separadas dos fatos registrados.
