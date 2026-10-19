// Versioned knowledge derived from the reviewed attachment; never executable authorization.
export const AGENT_GUIDELINES=Object.freeze({
 version:1,id:'operational-agent',source:'Agro_Gestao_Agente_Inteligente_Instrucoes_Codex.md v1.1',authority:'reference_only',
 parameters:{stagnantDays:30,minimumComparableFairs:3,surplusRatio:0.5,minimumBuyingDays:4,rebuyElapsedMultiplier:1.25},
 entries:[
  {id:'identity',version:1,applicability:'all',priority:100,rule:'Origem e produtor explícitos; não transformar catálogo, simulação ou exemplo em registro real.'},
  {id:'sale',version:1,applicability:'sale',priority:100,rule:'A fala final só prepara. Revisar ambiguidades, preço, unidade, saldo e versão; confirmação existente e operação idempotente com recibo.'},
  {id:'alias',version:1,applicability:'language',priority:90,rule:'Apelido local confirmado prevalece sobre sugestão genérica; não renomear o produto e não converter caixa/cacho sem fator cadastrado.'},
  {id:'stock',version:1,applicability:'stock',priority:80,rule:'Urgência exige mínimo configurado. Sem venda significa apenas ausência de registro no período observado.'},
  {id:'fair',version:1,applicability:'event',priority:90,rule:'Carga e contagem por apresentação devem reconciliar vendas e perdas. Sobra geral não é sobra da feira; uma feira não é tendência.'},
  {id:'finance',version:1,applicability:'finance',priority:100,rule:'Centavos e custos históricos. Usar demonstrativo existente, datas de devolução e dados insuficientes; não prometer lucro líquido.'},
  {id:'rebuy',version:1,applicability:'clients',priority:90,rule:'Mediana dos intervalos em dias distintos, consentimento e saldo. Rascunho editável; compartilhar não comprova envio/entrega.'},
  {id:'evidence',version:1,applicability:'insights',priority:90,rule:'Até três prioridades; fato, hipótese e teste separados, evidências/período/amostra. Feedback não autotuna limites financeiros.'},
  {id:'background',version:1,applicability:'android',priority:100,rule:'Trabalho diário aproximado sinaliza revisão; recalcular ao reabrir/mudar dados. Sem microfone ou serviço contínuo.'},
 ],
 documents:{audit:'docs/AGENTE-AUDITORIA-0.12.16.md',offline:'knowledge/agente-operacional.md'},
});
