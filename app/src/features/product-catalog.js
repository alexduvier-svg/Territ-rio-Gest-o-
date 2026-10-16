import policy from '../data/product-catalog-policy.json' with { type: 'json' };
import { STOCK_CATALOG_GUIDELINES } from '../data/stock-catalog-guidelines.js';
import { PRODUCT_CATALOG_ADDITIONS } from '../data/product-catalog-additions.js';
export { STOCK_CATALOG_GUIDELINES };

/** Vocabulary is bundled offline. Loading it never creates a producer product. */
let ready = false, pending = null;
let records = [], families = [], byId = new Map(), byFamily = new Map(), index = [];
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
export const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
export const normalizeProductName = value => policy.baseAliases[normalize(value)] || normalize(value);
export function categoryFor(category, record = null) {
  if (category === 'Doces e conservas' && record?.subcategoria === 'Conservas e antepastos') return 'Conservas e temperos';
  if (category === 'Polpas e frutas processadas' && record?.subcategoria === 'Frutas desidratadas') return 'Hortifruti-Granjeiro';
  return policy.categoryMap[category] || category || 'Outros';
}
const unitAliases = new Map();
for (const [code, unit] of Object.entries(policy.units)) {
  for (const alias of [code, unit.singular, unit.plural, unit.abreviatura, ...(unit.aliases || [])]) unitAliases.set(normalize(alias), code);
}
// Additional existing app labels retain their own meaning; notably Cacho != Dúzia.
for (const [code, aliases] of Object.entries({ vidro:['vidro','vidros'], sacola:['sacola','sacolas'], frasco:['frasco','frascos'], bisnaga:['bisnaga','bisnagas'], lata:['lata','latas'], barra:['barra','barras'], meia_duzia:['meia dúzia','meias dúzias'] })) for (const alias of aliases) unitAliases.set(normalize(alias), code);
export const normalizeUnit = value => unitAliases.get(normalize(value)) || normalize(value);
const legacyUnits = { un:'Unidade', kg:'kg', g:'g', l:'Litro', ml:'ml', maco:'Maço', pe:'Pé', duzia:'Dúzia', pacote:'Pacote', pote:'Pote', garrafa:'Garrafa', bandeja:'Bandeja', caixa:'Caixa', saco:'Saco', cacho:'Cacho', penca:'Penca', peca:'Peça', pedaco:'Pedaço', fatia:'Fatia', porcao:'Porção', vaso:'Vaso', muda:'Muda', rolo:'Rolo', kit:'Kit', par:'Par' };
const packaged = new Set(['pacote','pote','garrafa','bandeja','caixa','saco','peca','pedaco','fatia','porcao','vaso','muda','rolo','kit','par','vidro','frasco','bisnaga','lata','barra']);
function sourceSaleUnit(record) {
  const unit = normalizeUnit(record.unidade_venda), packaging = normalizeUnit(record.embalagem);
  return unit === 'un' && packaged.has(packaging) ? packaging : unit;
}
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 });
export function unidadeLabel(quantity, unit, { regional = false, abbreviated = false } = {}) {
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) throw Error('Quantidade inválida');
  const code = normalizeUnit(unit), configured = policy.units[code];
  const regionalLabel = code === 'maco' && (regional || /^molhos?$/.test(normalize(unit)));
  const labels = regionalLabel ? configured.rotulos_regionais[0] : configured;
  if (['kg','g','l','ml'].includes(code)) return configured.abreviatura;
  if (abbreviated && configured) return configured.abreviatura;
  return labels ? Number(quantity) === 1 ? labels.singular : labels.plural : String(unit || '');
}
export function quantityLabel(quantity, unit, options) {
  return `${numberFormatter.format(Number(quantity))} ${unidadeLabel(quantity, unit, options)}`;
}
export function catalogInfo() {
  const categories = { ...policy.categories };
  for (const record of PRODUCT_CATALOG_ADDITIONS) categories[record.categoria] = (categories[record.categoria] || 0) + 1;
  return { version: policy.version, total: policy.total + PRODUCT_CATALOG_ADDITIONS.length, sourceTotal: policy.total, appAdditions: PRODUCT_CATALOG_ADDITIONS.length, families: ready ? families.length : policy.familyCount, sourceFamilyCount: policy.familyCount, categories, sourceCategories: { ...policy.categories }, categoryMap: { ...policy.categoryMap }, ready, rules: [...policy.rules], sourceSha256: policy.sourceSha256 };
}
export const isCatalogReady = () => ready;
const familyKeyOf = record => JSON.stringify([normalizeProductName(record.nome_base), normalize(record.sabor), normalize(record.variedade)]);
const familyName = record => String(record.nome_exibicao || record.nome_base).split(' — ')[0].trim();
function decodePacked(packed) {
  if (!Array.isArray(packed.rows) || !Array.isArray(packed.strings) || !Array.isArray(packed.fields)) throw Error('Catálogo inválido');
  const numeric = new Set(['conteudo_quantidade','confirmar_denominacao']);
  return packed.rows.map(row => {
    const record = Object.fromEntries(packed.fields.map((field, i) => {
      const value = row[i];
      return [field, numeric.has(field) ? value : Array.isArray(value) ? value.map(k => packed.strings[k]) : value == null ? null : packed.strings[value]];
    }));
    return finishRecord(record);
  });
}
function finishRecord(record) {
    record.status = 'sugestao_catalogo';
    record.appCategory = categoryFor(record.categoria, record);
    record.familyKey = familyKeyOf(record);
    record.unidade_rotulos = policy.units[normalizeUnit(record.unidade_venda)] || null;
    Object.freeze(record.aliases); Object.freeze(record.unidades_permitidas);
    return Object.freeze(record);
}
export function loadCatalog() {
  if (ready) return Promise.resolve(catalogInfo());
  if (!pending) pending = import('../data/product-catalog-data.js').then(module => {
    const decoded = [...decodePacked(module.default), ...PRODUCT_CATALOG_ADDITIONS.map(record => finishRecord({ ...record, aliases:[...record.aliases], unidades_permitidas:[...record.unidades_permitidas] }))], ids = new Map(), groups = new Map(), nextIndex = [];
    for (const record of decoded) {
      if (!record.id || ids.has(record.id)) throw Error('ID duplicado no catálogo de referência');
      ids.set(record.id, record);
      let family = groups.get(record.familyKey);
      if (!family) { family = { key:record.familyKey, name:familyName(record), category:record.appCategory, sourceCategory:record.categoria, presentations:0, recordId:record.id, records:[] }; groups.set(family.key, family); }
      family.records.push(record); family.presentations++;
      const phrases = [record.nome_base,record.nome_exibicao,record.nome_singular,record.nome_plural,record.nome_busca_plural,record.sabor,record.variedade,record.forma,record.embalagem,record.categoria,record.appCategory,...record.aliases];
      nextIndex.push({ record, name:normalize(record.nome_exibicao), base:normalize(record.nome_base), text:[...new Set(phrases.filter(Boolean).map(normalize))].join(' | ') });
    }
    records = decoded; byId = ids; byFamily = groups; families = [...groups.values()]; index = nextIndex; ready = true;
    return catalogInfo();
  }).catch(error => { pending = null; throw error; });
  return pending;
}
export const getCatalogRecord = id => byId.get(String(id)) || null;
export const familyPresentations = key => [...(byFamily.get(String(key))?.records || [])];
const stopWords = new Set(['de','da','do','das','dos','e']);
function search(query, { category = '', limit = 12, offset = 0 } = {}, grouped = false) {
  if (!ready) return { items:[], total:0 };
  const normalized = normalize(query), terms = normalized.split(' ').filter(term => term && !stopWords.has(term));
  const selectedCategory = normalize(category), hits = [];
  for (const entry of index) {
    const p = entry.record;
    if (selectedCategory && selectedCategory !== 'todos' && normalize(p.appCategory) !== selectedCategory && normalize(p.categoria) !== selectedCategory) continue;
    if (!terms.every(term => entry.text.includes(term))) continue;
    const score = normalized && (entry.name === normalized || entry.base === normalized) ? 0 : normalized && entry.name.startsWith(normalized) ? 1 : 2;
    hits.push({record:p,score});
  }
  hits.sort((a,b) => a.score - b.score);
  let result;
  if (grouped) {
    const seen = new Set(); result = [];
    for (const hit of hits) if (!seen.has(hit.record.familyKey)) {
      seen.add(hit.record.familyKey);
      const { records:ignored, ...family } = byFamily.get(hit.record.familyKey);
      result.push(family);
    }
  } else result = hits.map(hit => hit.record);
  const start = Math.max(0, Math.floor(Number(offset) || 0));
  const count = Math.max(1, Math.min(100, Math.floor(Number(limit) || 12)));
  return { items:result.slice(start, start+count), total:result.length };
}
export const searchCatalog = (query, options) => search(query, options, false);
export const searchFamilies = (query, options) => search(query, options, true);

/** No stock, prices, costs, IDs of producer records, or certification are inferred. */
export function toProductSuggestion(record) {
  if (!record?.id || !record.nome_base) throw Error('Selecione uma sugestão válida');
  const code = sourceSaleUnit(record), contentUnit = normalizeUnit(record.conteudo_unidade), q = record.conteudo_quantidade;
  const coffeeOrEgg = record.categoria === 'Cafés' || record.categoria === 'Ovos';
  return {
    category: categoryFor(record.categoria, record), baseName: record.nome_base, name: familyName(record),
    type: coffeeOrEgg ? record.variedade || '' : '', variety: coffeeOrEgg ? '' : record.variedade || '',
    flavor: record.sabor || '', format: record.forma || '', unit: legacyUnits[code] || record.unidade_venda,
    weight: q != null && ['g','kg'].includes(contentUnit) ? Number(q) * (contentUnit === 'kg' ? 1000 : 1) : 0,
    volume: q != null && ['ml','l'].includes(contentUnit) ? Number(q) * (contentUnit === 'l' ? 1000 : 1) : 0,
    contentCount: q != null && !['g','kg','ml','l'].includes(contentUnit) ? Number(q) : 0,
    contentUnit: q != null && !['g','kg','ml','l'].includes(contentUnit) ? legacyUnits[contentUnit] || record.conteudo_unidade : '',
    catalogId: record.id, catalogBase: record.nome_base, catalogForm: record.forma,
    catalogPackaging: record.embalagem, catalogVersion: policy.version, catalogIdentityComplete: true,
    catalogSourceCategory: record.categoria,
    catalogNote: record.observacao || '', catalogConfirmName: !!record.confirmar_denominacao,
    allowedUnits: [...(record.unidades_permitidas || [])].map(unit => legacyUnits[normalizeUnit(unit)] || unit),
  };
}

function scopeOf(product) {
  return normalize(product.producerId || product.businessId || product.tenantId || product.ownerId || 'local');
}
function contentOf(product, source, issues) {
  let quantity = null, unit = null;
  if (source) { quantity = product.conteudo_quantidade; unit = quantity == null ? null : normalizeUnit(product.conteudo_unidade); }
  else {
    const candidates = [];
    if (Number(product.weight) > 0) candidates.push([Number(product.weight), 'g']);
    if (Number(product.volume) > 0) candidates.push([Number(product.volume), 'ml']);
    if (Number(product.contentCount) > 0) candidates.push([Number(product.contentCount), normalizeUnit(product.contentUnit)]);
    if (own(product,'contentQuantity') && product.contentQuantity != null) candidates.push([Number(product.contentQuantity), normalizeUnit(product.contentUnit)]);
    if (candidates.length > 1) issues.push('Conteúdos conflitantes');
    if (candidates.length) [quantity, unit] = candidates[0];
    for (const field of ['weight','volume','contentCount']) if (own(product,field) && (!Number.isFinite(Number(product[field])) || Number(product[field]) < 0)) issues.push('Conteúdo inválido');
  }
  if (quantity == null) { if (source && product.conteudo_unidade != null) issues.push('Unidade sem conteúdo'); return [null,null]; }
  quantity = Number(quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || !unit) issues.push('Conteúdo inválido');
  if (unit === 'kg') { quantity *= 1000; unit = 'g'; }
  if (unit === 'l') { quantity *= 1000; unit = 'ml'; }
  return [Math.round(quantity*1e6)/1e6,unit];
}
/** An incomplete legacy presentation is reviewable, never an automatic duplicate. */
export function commercialIdentity(product = {}) {
  const source = own(product,'nome_base'), issues = [];
  const base = normalizeProductName(source ? product.nome_base : product.catalogBase || product.baseName || product.name);
  const scope = scopeOf(product);
  const completeFlag = source || product.catalogIdentityComplete === true || product.identityComplete === true;
  const flavor = normalize(source ? product.sabor : product.flavor);
  const variety = normalize(source ? product.variedade : product.variety || product.type);
  const form = normalize(source ? product.forma : own(product,'format') ? product.format : product.catalogForm);
  const unit = source ? sourceSaleUnit(product) : normalizeUnit(product.unit);
  const explicitOwn = !source && product.identityComplete === true;
  const confirmedUnitPackaging = explicitOwn && product.unitConfirmed === true ? policy.units[unit]?.singular || product.unit : '';
  const packaging = normalize(source ? product.embalagem : product.catalogPackaging || product.packaging || (packaged.has(unit) ? legacyUnits[unit] || product.unit : confirmedUnitPackaging));
  if (!base) issues.push('Nome-base ausente');
  if (!form && !(explicitOwn && typeof product.format === 'string')) issues.push('Forma não identificada');
  if (!unit) issues.push('Unidade não identificada');
  if (!packaging) issues.push('Embalagem não identificada');
  if (!completeFlag) issues.push('Apresentação antiga ou não confirmada');
  const content = contentOf(product, source, issues);
  const extras = ['brand','origin','material','size','composition','specification','declaredFormula','manufacturer','producerName'].map(field => normalize(product[field]));
  if (!source && product.type && product.variety && normalize(product.type) !== normalize(product.variety)) extras.push(normalize(product.type));
  const parts = [scope,base,flavor,variety,form,unit,...content,packaging,...extras];
  const complete = !issues.length;
  return { key:complete ? JSON.stringify(parts) : null, complete, base, scope, issues, parts };
}
function relatedBase(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;
  const a = left.split(' '), b = right.split(' ');
  return Math.min(a.length,b.length) > 0 && (left.startsWith(right+' ') || right.startsWith(left+' '));
}
export function duplicateCandidates(products, incoming) {
  const candidate = commercialIdentity(incoming), exact = [], review = [];
  for (const product of products || []) {
    if (!product) continue;
    const existing = commercialIdentity(product);
    if (existing.scope !== candidate.scope) continue;
    const incomingCatalogId = incoming.catalogId || (own(incoming,'nome_base') ? incoming.id : null);
    const existingCatalogId = product.catalogId || (own(product,'nome_base') ? product.id : null);
    const sameCatalogId = incomingCatalogId && existingCatalogId && incomingCatalogId === existingCatalogId;
    if (sameCatalogId) {
      // A stable ID is not permission to overwrite a changed presentation.
      if (candidate.complete && existing.complete && candidate.key === existing.key) exact.push(product);
      else review.push(product);
    } else if (candidate.complete && existing.complete && candidate.key === existing.key) exact.push(product);
    else if ((!candidate.complete || !existing.complete) && relatedBase(existing.base,candidate.base)) review.push(product);
  }
  return { status:exact.length ? 'exact' : review.length ? 'review' : 'none', exact, review };
}
/** Pure import helper: producer arrays are copied; suggestions never activate themselves. */
export function importWithoutDuplicates(existing, incoming) {
  const products = [...(existing || [])], report = { inserted:[], ignored:[], review:[] };
  const byKey = new Map(), byCatalogId = new Map(), incomplete = [];
  const stableId = product => product.catalogId || (own(product,'nome_base') ? product.id : null);
  const register = product => {
    const identity = commercialIdentity(product), id = stableId(product);
    if (identity.complete && !byKey.has(identity.key)) byKey.set(identity.key,product);
    if (id) { const matches = byCatalogId.get(id) || []; matches.push({product,identity}); byCatalogId.set(id,matches); }
    if (!identity.complete) incomplete.push({product,identity});
  };
  for (const product of products) register(product);
  for (const candidate of incoming || []) {
    const identity = commercialIdentity(candidate), id = stableId(candidate);
    const conflicts = (byCatalogId.get(id) || []).filter(match => match.identity.scope === identity.scope && (!identity.complete || !match.identity.complete || match.identity.key !== identity.key)).map(match=>match.product);
    const unknown = incomplete.filter(match => match.identity.scope === identity.scope && relatedBase(match.identity.base,identity.base)).map(match=>match.product);
    if (!identity.complete || conflicts.length || unknown.length) { report.review.push({product:candidate,candidates:[...new Set([...conflicts,...unknown])]}); continue; }
    if (byKey.has(identity.key)) { report.ignored.push({product:candidate,existing:byKey.get(identity.key)}); continue; }
    products.push(candidate); report.inserted.push(candidate); register(candidate);
  }
  return { products, report };
}

export default {STOCK_CATALOG_GUIDELINES,loadCatalog,isCatalogReady,catalogInfo,searchCatalog,searchFamilies,familyPresentations,getCatalogRecord,toProductSuggestion,normalize,normalizeProductName,normalizeUnit,categoryFor,unidadeLabel,quantityLabel,commercialIdentity,duplicateCandidates,importWithoutDuplicates};
