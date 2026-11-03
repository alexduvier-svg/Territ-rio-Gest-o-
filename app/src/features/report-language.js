// Linguagem dos relatórios (diretriz interna: app/docs/DIRETRIZ-LINGUAGEM-RELATORIOS.md).
// Quantidade e produto escritos como o produtor fala, seguindo a concordância do português:
// "2 dúzias de Ovos Caipiras", "2 Cafés Especiais TC Moídos · 250 g", "3 Acarás-Bandeiras Vivos",
// "1,5 kg de Pacu Inteiro". Funções puras: recebem o nome, a descrição de venda e a unidade.

const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'sem', 'ao', 'à', 'a', 'o']);
// Palavras que não mudam no plural, mas não encerram a concordância ("Cafés Gourmet TM Moídos").
const INVARIABLE = new Set(['gourmet', 'premium', 'extra', 'light', 'diet', 'zero', 'fit', 'bio', 'cristal', 'standard', 'mix']);
// Adjetivos comuns no catálogo que não se reconhecem pela terminação.
const ADJECTIVES = new Set(['caipira', 'silvestre', 'doce', 'verde', 'roxo', 'roxa', 'crespo', 'crespa', 'liso', 'lisa', 'fresco', 'fresca', 'puro', 'pura', 'novo', 'nova', 'velho', 'velha', 'grande', 'pequeno', 'pequena', 'maduro', 'madura', 'seco', 'seca', 'cru', 'crua', 'branco', 'branca', 'preto', 'preta', 'vermelho', 'vermelha', 'amarelo', 'amarela', 'azul', 'mole', 'duro', 'dura', 'forte', 'suave', 'picante', 'fino', 'fina', 'grosso', 'grossa', 'superior', 'inferior', 'médio', 'média', 'gordo', 'gorda', 'magro', 'magra', 'quente', 'frio', 'fria', 'vegano', 'vegana', 'raro', 'rara']);
const ADJECTIVE_END = /(ado|ada|ido|ida|ído|ída|oso|osa|al|vel|eiro|eira|ivo|iva|ico|ica|ente|ante)$/;
const IRREGULAR = { 'pão': 'pães', 'mão': 'mãos', 'grão': 'grãos', 'irmão': 'irmãos', 'alemão': 'alemães', 'capitão': 'capitães', 'cidadão': 'cidadãos', 'mel': 'méis', 'cru': 'crus' };
// Unidades em que o produto é contado dentro de um conjunto: "2 dúzias de Ovos Caipiras".
const COLLECTIVE = { 'Dúzia': ['dúzia', 'dúzias'], 'Meia Dúzia': ['meia dúzia', 'meias dúzias'], 'Caixa': ['caixa', 'caixas'], 'Saca': ['saca', 'sacas'], 'Bandeja': ['bandeja', 'bandejas'], 'Maço': ['maço', 'maços'], 'Sacola': ['sacola', 'sacolas'], 'Fardo': ['fardo', 'fardos'], 'Cesta': ['cesta', 'cestas'], 'Engradado': ['engradado', 'engradados'], 'Penca': ['penca', 'pencas'], 'Cacho': ['cacho', 'cachos'], 'Molho': ['molho', 'molhos'], 'Réstia': ['réstia', 'réstias'], 'Kit': ['kit', 'kits'] };
// Unidades de medida: "1,5 kg de Pacu Inteiro".
const MEASURE = { kg: 'kg', g: 'g', Litro: 'L', ml: 'ml' };
const SIZE = /^\d[\d.,]*\s?(g|kg|ml|L)$/;

const lower = w => w.toLocaleLowerCase('pt-BR');
const keepCase = (from, to) => (from && from[0] === from[0].toLocaleUpperCase('pt-BR') && from[0] !== from[0].toLocaleLowerCase('pt-BR')) ? to[0].toLocaleUpperCase('pt-BR') + to.slice(1) : to;
const isAcronym = w => /^[\p{Lu}\d]{2,}$/u.test(w);

// Plural de uma palavra pelas regras gerais do português (mantém a maiúscula inicial).
export function pluralWord(word) {
  const w = String(word || ''); if (!w) return w;
  const l = lower(w);
  if (IRREGULAR[l]) return keepCase(w, IRREGULAR[l]);
  let p;
  if (/ês$/.test(l)) p = l.slice(0, -2) + 'eses';
  else if (/[sx]$/.test(l)) p = l;
  else if (/ão$/.test(l)) p = l.slice(0, -2) + 'ões';
  else if (/al$/.test(l)) p = l.slice(0, -2) + 'ais';
  else if (/el$/.test(l)) p = l.slice(0, -2) + 'éis';
  else if (/ol$/.test(l)) p = l.slice(0, -2) + 'óis';
  else if (/ul$/.test(l)) p = l.slice(0, -2) + 'uis';
  else if (/il$/.test(l)) p = l.slice(0, -2) + 'is';
  else if (/m$/.test(l)) p = l.slice(0, -1) + 'ns';
  else if (/[rz]$/.test(l)) p = l + 'es';
  else p = l + 's';
  return keepCase(w, p);
}

// Plural do nome do produto: o substantivo e os adjetivos que concordam com ele. Para no primeiro
// conectivo ("Geleias de Morango") ou num segundo substantivo ("Queijos Meia Cura", "Bananas Prata").
export function pluralName(name) {
  const words = String(name || '').split(' ').filter(Boolean); if (!words.length) return '';
  const out = []; let open = true;
  words.forEach((w, i) => {
    if (!open) return out.push(w);
    const l = lower(w);
    if (i === 0) {
      const parts = w.split('-');
      return out.push(parts.some(p => CONNECTORS.has(lower(p))) ? [pluralWord(parts[0]), ...parts.slice(1)].join('-') : parts.map(pluralWord).join('-'));
    }
    if (CONNECTORS.has(l)) { open = false; return out.push(w); }
    if (isAcronym(w) || /\d/.test(w) || INVARIABLE.has(l)) return out.push(w);
    if (ADJECTIVES.has(l) || ADJECTIVE_END.test(l)) return out.push(pluralWord(w));
    open = false; out.push(w);
  });
  return out.join(' ');
}

const many = q => q === 0 || Math.abs(q) >= 2;

// Frase de um item vendido. description é a descrição de venda ("Moído · 250 g", "Vivo · Unidade").
export function itemPhrase({ qty, name, description = '', unit = '' }, quantity = n => String(n).replace('.', ',')) {
  const parts = String(description || '').split(' · ').map(s => s.trim()).filter(Boolean);
  const size = parts.filter(s => SIZE.test(s));
  const attrs = parts.filter(s => !SIZE.test(s) && lower(s) !== lower(unit) && !/^(unidade|venda por |peso \/ volume)/i.test(s) && !COLLECTIVE[s]);
  const base = [String(name || '').trim(), ...attrs].filter(Boolean).join(' ');
  const tail = size.length ? ' · ' + size.join(' · ') : '';
  const q = Number(qty) || 0, n = quantity(q);
  if (MEASURE[unit]) return n + ' ' + MEASURE[unit] + ' de ' + base + tail;
  if (COLLECTIVE[unit]) return n + ' ' + COLLECTIVE[unit][many(q) ? 1 : 0] + ' de ' + base + tail;
  return n + ' ' + (many(q) ? pluralName(base) : base) + tail;
}

// Contagem simples com concordância: count(3, 'venda', 'vendas') → "3 vendas".
export function count(n, singular, plural, quantity = v => String(v).replace('.', ',')) {
  return quantity(n) + ' ' + (n === 1 ? singular : plural || pluralWord(singular));
}
