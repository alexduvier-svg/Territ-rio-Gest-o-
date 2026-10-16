/** Rebuild the bundled, read-only vocabulary. Never imports stock or financial values. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const source = process.argv[2];
if (!source) throw Error('Informe a pasta de origem do catálogo.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = await fs.readFile(path.join(source, 'catalogo_produtos.json'));
const { metadados, produtos } = JSON.parse(original.toString('utf8'));
const { unidades } = JSON.parse(await fs.readFile(path.join(source, 'unidades_e_plurais.json'), 'utf8'));
const categoryMap = {
  'Apicultura e meliponicultura': 'Mel e apícolas',
  'Artesanato e utilidades': 'Artesanato',
  'Bebidas': 'Bebidas',
  'Bolos e confeitaria': 'Bolos',
  'Cafés': 'Cafés',
  'Carnes e aves': 'Carnes e aves',
  'Castanhas e sementes': 'Grãos',
  'Charcutaria': 'Charcutaria',
  'Chás e infusões': 'Bebidas',
  'Derivados da cana': 'Doces',
  'Doces e conservas': 'Doces',
  'Frutas': 'Hortifruti-Granjeiro',
  'Grãos farinhas e cereais': 'Grãos',
  'Hortifruti': 'Hortifruti-Granjeiro',
  'Laticínios': 'Laticínios',
  'Molhos e temperos': 'Conservas e temperos',
  'Ovos': 'Hortifruti-Granjeiro',
  'Panificação': 'Panificação',
  'Piscicultura e pescados': 'Piscicultura',
  'Plantas e mudas': 'Plantas e flores',
  'Polpas e frutas processadas': 'Bebidas',
  'Salgados e refeições': 'Panificação',
};
const fields = ['id','categoria','subcategoria','nome_base','nome_exibicao','sabor','variedade','forma','unidade_venda','conteudo_quantidade','conteudo_unidade','embalagem','aliases','confirmar_denominacao','observacao','nome_singular','nome_plural','nome_busca_plural','unidades_permitidas'];
const numbers = new Set(['conteudo_quantidade', 'confirmar_denominacao']);
const strings = [], ids = new Map();
function stringId(value) {
  if (value == null) return null;
  const text = String(value);
  if (!ids.has(text)) { ids.set(text, strings.length); strings.push(text); }
  return ids.get(text);
}
const rows = produtos.map(record => fields.map(field => numbers.has(field) ? record[field] ?? null : Array.isArray(record[field]) ? record[field].map(stringId) : stringId(record[field])));
const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
// A plural is an alias for its base only when the dictionary has one interpretation.
const plurals = new Map();
for (const p of produtos) {
  const alias = normalize(p.nome_plural), base = normalize(p.nome_base);
  const values = plurals.get(alias) || new Set(); values.add(base); plurals.set(alias, values);
}
const baseAliases = Object.fromEntries([...plurals].filter(([alias, values]) => values.size === 1 && alias !== [...values][0]).map(([alias, values]) => [alias, [...values][0]]));
Object.assign(baseAliases, {
  aipim:'mandioca de mesa', aipins:'mandioca de mesa', macaxeira:'mandioca de mesa', macaxeiras:'mandioca de mesa',
  mandioquinha:'batata baroa', mandioquinhas:'batata baroa', 'batata salsa':'batata baroa',
  pinha:'fruta do conde', pinhas:'fruta do conde', ata:'fruta do conde', atas:'fruta do conde',
  tapereba:'caja', taperebas:'caja', seriguela:'ciriguela', seriguelas:'ciriguela', siriguela:'ciriguela', siriguelas:'ciriguela',
  'queijo mussarela':'queijo mucarela', 'queijos mussarela':'queijo mucarela', 'queijos mussarelas':'queijo mucarela',
  'queijo mozzarella':'queijo mucarela', 'queijos mozzarellas':'queijo mucarela',
});
const rules = [
  'Use o catálogo somente como referência de nomes, sabores, variedades, apresentações, unidades, plurais e aliases.',
  'Sugestões não informam estoque, preço, custo, venda, desempenho, origem, composição ou certificação do produtor.',
  'Busque antes de sugerir novo cadastro. Ofereça “+ Insira seu produto” quando o produto ou a apresentação não estiver disponível.',
  'Reutilize apenas a mesma identidade comercial. Nomes parecidos e cadastros antigos incompletos exigem revisão; nunca mescle automaticamente.',
  'Preserve sabor, variedade, forma, conteúdo, embalagem, unidade, marca, produtor, origem e demais diferenças comerciais reais.',
  'Maço/maços e molho/molhos são equivalentes somente no campo de unidade regional de folhas e ervas; molho culinário permanece um produto.',
  'Não presuma peso fixo de maço, caixa, cacho, penca, peça ou saco. Não converta massa em volume nem fraccione estoque sem rendimento informado.',
  'Uma dúzia contém 12 unidades, mas bandeja e dúzia não são ofertas iguais sem a embalagem e a relação de conversão confirmadas.',
  'Mucia/múcia precisa de confirmação da denominação. Não associe automaticamente a morcela ou chouriço.',
  'Aprenda escolhas confirmadas localmente no contexto do produtor. Não compartilhe novos nomes nem altere outros cadastros automaticamente.',
  'O produtor confirma unidade e valores reais. Referências de vocabulário não certificam produtos ou disponibilidade.',
];
const policy = {
  version: metadados.versao, language: metadados.idioma, sourceDate: metadados.data,
  total: produtos.length, familyCount: metadados.quantidade_produtos_base,
  sourceSha256: createHash('sha256').update(original).digest('hex'),
  kind: 'read_only_product_suggestions', categories: metadados.categorias,
  categoryMap, units: unidades, baseAliases, rules, sources: metadados.fontes_de_apoio,
};
const out = path.join(root, 'src', 'data');
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'product-catalog-compact.json'), JSON.stringify({ version: policy.version, fields, strings, rows }));
await fs.writeFile(path.join(out, 'product-catalog-policy.json'), JSON.stringify(policy));
console.log(JSON.stringify({total:produtos.length, uniqueIds:new Set(produtos.map(p=>p.id)).size, strings:strings.length, bytes:(await fs.stat(path.join(out,'product-catalog-compact.json'))).size}));
