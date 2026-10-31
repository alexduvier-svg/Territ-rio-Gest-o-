import { normalizePortuguese as norm } from './portuguese.js';
// Read-only comparisons are recognized before the sale parser sees quantities.
export function productRankingRequest(question){const q=norm(question);
 if(/^(?:(?:eu )?vendi|(?:quero|vou) vender|vender|adicion|coloc|registre|anote|apague|exclua|zere)\b/.test(q))return null;
 if(!/produt|itens|mercador|o que/.test(q)||!/vend|giro|fatur|receita|lucro|rentavel/.test(q)||!/mais|menos|maior|menor|melhor|pior|top|ranking|classific/.test(q))return null;
 const quantity=/vend|giro/.test(q),profit=/lucro|rentavel/.test(q),revenue=/fatur|receita|valor vendido/.test(q);
 return {criteria:[...(quantity&&!revenue?['quantity']:[]),...(revenue?['revenue']:[]),...(profit?['profit']:[])].filter((v,i,a)=>a.indexOf(v)===i),top:/mais|maior|melhor|top|ranking|classific/.test(q),bottom:/menos|menor|pior|ranking|classific/.test(q)};
}
// Financial questions use the same statement as Gestão. Keep recipes and
// product rankings with their existing specialists.
export function isFinancialQuestion(question){const q=norm(question);
 if(/culin|receita.*(?:bolo|geleia|doce|pao|banana|ingrediente)|como.*(?:cozinhar|preparar)|qual.*produto|produto.*(?:mais|menos|melhor|pior)/.test(q))return false;
 return /fatur|receita|receb|a receber|para receber|pra receber|quanto.*(?:vend|ganh)|dinheiro.*entrou|entrou.*dinheiro|(?:qual|quanto|mostr|valor|total|resum).*\b(?:lucro|margem|resultado|taxas|fiado)\b/.test(q);
}
// Read contracts over existing modules. Unsupported calculations remain explicit, never guessed.
export function businessQueryGate(question){const q=norm(question);
 if(/semana passada|mes passado|aumentou|caiu|cairam|essa dica.*funcionou|mais que/.test(q))return {status:'needs_clarification',message:'Para comparar, selecione os períodos e a origem na Gestão. Esta consulta ainda não apura automaticamente períodos equivalentes nem comprova causas da mudança. Posso mostrar o recorte atual; não vou inventar a comparação.'};
 if(/posso dar.*desconto|se aumentar|se eu subir|(?:simul|aumentar).*(?:preco|desconto)|quanto.*produzir|resultado.*(?:minuto|hora)|lucro.*(?:minuto|hora)/.test(q))return {status:'unavailable',message:'Essa simulação exige produto e apresentação, custos variáveis, quantidade e, quando aplicável, ficha ou tempo medido. Ela ainda não está liberada neste campo. Consulte o diagnóstico e os controles existentes da Gestão; nenhum preço, estoque ou pedido foi alterado.'};
 if(/(?:250|500|1000)\s*(?:g|gramas?).*(?:melhor|que|versus|vs)|esse produto|este produto/.test(q))return {status:'needs_clarification',message:'Confirme o nome e a apresentação de cada produto. Não escolho uma variação automaticamente nem comparo por kg sem a composição confirmada. O relatório Produtos e Margens mostra as apresentações separadas no recorte atual.'};
 return {status:'supported',message:''};
}
export const BUSINESS_QUERY_CONTRACT=Object.freeze({version:1,readOnly:true,reference:'knowledge/perguntas-negocio.md',sourceSha256:'5d4241662374ddb10010678abacf7e66d50171acfeaaaf1b4cddf3d9b318d570',supported:['revenue_selected_period','recorded_receipts','outstanding_credit','known_gross_product_result','current_product_top_bottom_by_unit_revenue_profit','stock','cached_weather','local_reference'],partial:['natural_language_patterns','product_identity','comparable_periods','complete_variable_contribution'],unavailable:['unrestricted_conversation','production_without_validated_sheet','unmeasured_time_profit','freeform_cloud_context']});
