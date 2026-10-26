# Avaliação da Diretriz de Estoque — 26/10/2026

Atualização após a avaliação: integração concluída e instalada na 0.12.87 em 26/10/2026. Consulte ENTREGA-0.12.87.md. Os estados de desenvolvimento citados abaixo registram o momento da análise inicial.

Documento recebido: AGRO_Gestao_Diretriz_Estoque_Objetivo_Contexto_Acao_Output.md (25/10/2026). Pedido humano: verificar se há necessidade. Leitura integral e comparação com ERP, Orientação/forecast, reservas, lotes e diretriz anterior de validade.

## Decisão

Adotar como especificação complementar no motor existente. Não criar um segundo motor, cadastro, saldo ou agendador. Registro deste texto não equivale a recurso instalado. 0.12.87 continua em desenvolvimento, sem APK novo.

## Já existente ou em desenvolvimento

- ERP: movimentações vinculadas, idempotência, devoluções, custo histórico e auditoria transacional.
- Variações/unidades: saldos próprios; sem conversão implícita entre embalagens.
- Orientação: fatos, método, limitações, até três prioridades, liberação/feedback e ações propostas.
- 87 em fonte: validade opcional por entrada, FEFO, quarentena, reservas de feiras, distinção físico/elegível, calendário civil e plano D−5/D0. Telas, agenda e reconciliador de avisos estão em fonte e QA isolado; ativação principal, Android e entrega ainda pendentes.

## Complementos necessários

1. Saldo comercial é físico menos lotes inelegíveis e reservas aplicáveis, sem dupla subtração. A fórmula abreviada do documento físico menos reservas não inclui sozinha vencidos/quarentena. Data de atendimento de feira deve considerar lotes elegíveis até o fim do evento.
2. Cobertura deve declarar período e dias observados. O forecast atual usa dias corridos desde a primeira venda da janela; não comprova dias de exposição nem disponibilidade. Sem esses registros, apresentar referência limitada ou usar mínimo manual; não afirmar previsão confiável de falta.
3. Não emitir compra numérica por prazo observado sem evidência da entrega, estoque de segurança explicitado e entradas futuras confirmadas. Não converter compra histórica em entrada ou pedido previsto.
4. Baixa saída é ausência de vendas registradas; não prova falta de demanda ou excesso, especialmente em feiras pontuais e artesanato.
5. Custo/fornecedor e origem por recebimento, quando disponíveis, são opcionais e rastreáveis. Custos de novos lotes não reescrevem o custo das vendas antigas. Não mudar a política financeira de custeio sem definição explícita.
6. Promoção exige custo e despesas conhecidos; não recomendar escoar item vencido, prazo inventado, compra automática ou baixa sem confirmação.
7. UI: um aviso por situação, detalhes expansíveis e texto além da cor. Reusar a mesma consulta para perguntas prontas e alertas automáticos.

## Validação

Aceites do novo documento incorporados ao checklist da 87. Fonte atual: 744 testes locais do app e 47 do servidor; oito combinações de tela/tema e quatro jornadas adicionais passaram em navegador sintético. Validação física Android pendente. Não alegar novos recursos instalados, desempenho físico, bateria ou notificações entregues antes da integração e QA final.
