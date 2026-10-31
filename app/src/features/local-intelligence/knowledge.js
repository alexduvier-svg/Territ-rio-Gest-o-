import lexicon from '../voice/lexicon.json' with {type:'json'};
import { CATALOG_KNOWLEDGE } from '../../data/catalog-knowledge.js';
import { DECISION_GUIDELINES } from '../../data/decision-guidelines.js';
import { INTELLIGENCE_HIERARCHY } from '../../data/intelligence-hierarchy.js';
// Bundled references only, never the producer's entire records.
export const MODEL_KNOWLEDGE=JSON.stringify({idioma:'pt-BR',dicionario:lexicon.meta.versao,catalogo:CATALOG_KNOWLEDGE.version,matematica:DECISION_GUIDELINES.version,hierarquia:INTELLIGENCE_HIERARCHY.version,setores:INTELLIGENCE_HIERARCHY.sharedKnowledge.sectors,regras:['Nomes e unidades vêm do cadastro confirmado; aliases não alteram a identidade do produto.','Quantidade, receita, lucro bruto e caixa são indicadores distintos.','Custos ausentes não são zero; unidades diferentes não são somadas.','Os trechos já foram calculados pelos motores do app. Selecione-os sem escrever valores ou fórmulas novas.']});
