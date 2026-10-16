import * as Catalog from '../product-catalog.js';
import { CATALOG_KNOWLEDGE } from '../../data/catalog-knowledge.js';

const vocabularyIntent = /unidades?|apresenta[cç][aã]o|embalage|cadastr|registrar produto|ins[ei]rir produto|plural|ma[cç]os?|molhos? de (taioba|folhas|ervas)/i;
const ignored = new Set('a o as os um uma uns umas de da do das dos e em por para com eu meu minha meus minhas como qual quais quero posso preciso devo deveria uso usar vendo vender vendido vendida cadastrar cadastro cadastros produto produtos registrar inserir insira unidade unidades embalagem embalagens apresentacao apresentacoes nome nomes plural sistema app sao seria tem tenho vai voce ja sabe se no na nos nas'.split(' '));
export const isCatalogQuestion = question => {
  const text=String(question||'');
  // Registration of a customer/expense and sold quantities remain operational questions.
  if(/(?:cadastr\w*|registr\w*|ins[ei]r\w*)\s+(?:(?:um|uma|o|a|novo|nova)\s+)*(?:clientes?|fornecedores?|despesas?|contas?|eventos?|feiras?|pagamentos?|vendas?)\b/i.test(text))return false;
  if(/quantas? unidades?|unidades?\s+(?:vendid|vendi|vender|lev|sobr)/i.test(text))return false;
  return vocabularyIntent.test(text);
};

export function catalogReference(question) {
  const terms = Catalog.normalize(String(question || '').slice(0,500)).split(' ').filter(term => term && !ignored.has(term)).slice(0,8);
  const query = terms.join(' ');
  const matches = isCatalogQuestion(question) && query && Catalog.isCatalogReady()
    ? Catalog.searchCatalog(query,{limit:6}).items.map(record => ({
      id:record.id,name:record.nome_exibicao,category:record.appCategory,
      unit:Catalog.toProductSuggestion(record).unit,form:record.forma,
      content:record.conteudo_quantidade,contentUnit:record.conteudo_unidade,
      note:record.observacao,confirmName:!!record.confirmar_denominacao,
    })) : [];
  return { version:CATALOG_KNOWLEDGE.catalogVersion,type:'suggestions_only',rules:[...CATALOG_KNOWLEDGE.rules],matches };
}

export function catalogVocabularyAnswer(question) {
  if (!isCatalogQuestion(question)) return null;
  const reference=catalogReference(question);
  const regional=/ma[cç]os?|molhos? de (taioba|folhas|ervas)/i.test(question)
    ? 'Maço e molho podem nomear a unidade de folhas e ervas; escolha o rótulo que você usa. Não há peso fixo nem conversão automática. Molho culinário continua sendo outro produto.\n\n' : '';
  if (!reference.matches.length) return regional+'No cadastro, busque seu produto e escolha a apresentação real. Se não encontrar, toque em + Insira seu produto. Confirme a unidade e informe os valores reais. As escolhas ficam na memória local deste produtor.';
  const lines=reference.matches.slice(0,4).map(item=>`• ${item.name}: unidade sugerida ${item.unit}${item.confirmName?' — confirme a denominação':''}.`);
  return regional+'Referências para cadastro:\n'+lines.join('\n')+'\n\nEscolha e confirme a apresentação que você comercializa. Estas sugestões não informam seu estoque, preço ou custo; os produtos cadastrados mantêm seus dados próprios.';
}
