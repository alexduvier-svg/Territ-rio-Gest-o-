// Regra properNames (interface-guidelines): todo nome próprio do app — produto, família, variedade,
// sabor, cliente, cidade, bairro, evento, local e negócio — é escrito com cada palavra iniciando em
// maiúscula ("Queijo Meia Cura"), não importa como foi digitado. Conectivos ficam minúsculos no meio
// ("Doce de Leite", "Pé de Moleque"), siglas digitadas em maiúsculas são mantidas ("Leite UHT") e
// medidas depois de um número continuam como são ("250 g", "1 kg", "500 ml", "1 L"). A correção acontece
// ao gravar, então vale para qualquer tela, importação ou backup; exibições também passam por ela.

const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'sem', 'ao', 'aos', 'à', 'às', 'a', 'o', 'os', 'as', 'd\'', 'del', 'y']);
const UNITS = new Set(['g', 'kg', 'mg', 'ml', 'l', 'lt', 'un', 'und', 'dz', 'pct', 'cx', 'm', 'cm', 'mm']);
// Siglas que ficam como estão quando digitadas em maiúsculas; palavras comuns em caixa alta não.
const ACRONYMS = new Set(['TC', 'TM', 'TE', 'UHT', 'SIF', 'SIM', 'SIE', 'SISBI', 'IG', 'DOP', 'MEI', 'ME', 'EPP', 'LTDA', 'CNPJ', 'CPF', 'PIX', 'QR', 'UF', 'AGRO', 'EMATER', 'EPAMIG', 'IMA', 'MAPA', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']);
const acronym = word => ACRONYMS.has(word) || /^[B-DF-HJ-NP-TV-Z]{2,4}$/.test(word);
const capitalize = word => word ? word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLocaleLowerCase('pt-BR') : word;

export function properName(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return text;
  // Everything typed in capitals is a name, not a row of acronyms.
  const shouting = text === text.toLocaleUpperCase('pt-BR') && /\p{Lu}.*\p{Lu}.*\p{Lu}/u.test(text) && text.split(' ').length > 1;
  const words = text.split(' ');
  return words.map((word, index) => {
    const previous = words[index - 1] || '';
    if (/^\d/.test(word)) return word.toLocaleLowerCase('pt-BR');
    if (/\d$/.test(previous) && UNITS.has(word.toLocaleLowerCase('pt-BR'))) return /^l$/i.test(word) ? 'L' : word.toLocaleLowerCase('pt-BR');
    if (!shouting && acronym(word)) return word;
    const lower = word.toLocaleLowerCase('pt-BR');
    if (index > 0 && index < words.length - 1 && CONNECTORS.has(lower)) return lower;
    // Hyphenated and bracketed words: every part starts in capital, connectors stay low.
    return lower.replace(/(^|[-–/(“"'])(\p{L})/gu, (m, mark, letter) => mark + letter.toLocaleUpperCase('pt-BR'))
      .replace(/-(De|Da|Do|E)-/g, m => m.toLocaleLowerCase('pt-BR'));
  }).join(' ');
}

const fixField = (record, field) => {
  if (!record || typeof record[field] !== 'string' || !record[field].trim()) return 0;
  const fixed = properName(record[field]);
  if (fixed === record[field]) return 0;
  record[field] = fixed;
  return 1;
};

// Corrects the names stored in the producer's data, in place. Returns how many fields changed, so a
// caller can save only when something actually changed. Records, quantities and prices are untouched.
export function normalizeRecordNames(data) {
  if (!data || typeof data !== 'object') return 0;
  let changed = 0;
  for (const p of Array.isArray(data.products) ? data.products : []) {
    for (const field of ['name', 'baseName', 'coffeeSpecies', 'coffeeVariety', 'coffeeRoast', 'coffeeProcess', 'coffeeFermentation', 'variety', 'flavor', 'catalogBase']) changed += fixField(p, field);
  }
  for (const c of Array.isArray(data.clients) ? data.clients : []) {
    for (const field of ['name', 'city', 'neighborhood']) changed += fixField(c, field);
  }
  for (const e of Array.isArray(data.events) ? data.events : []) {
    for (const field of ['name', 'place']) changed += fixField(e, field);
  }
  if (data.settings) for (const field of ['businessName', 'producerName', 'city']) changed += fixField(data.settings, field);
  return changed;
}
