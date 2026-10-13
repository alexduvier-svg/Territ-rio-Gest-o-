// Orientação ao produtor: monta o HTML do painel do Resumo e dos detalhes. Os botões usam
// data-action; as ações estão registradas em src/legacy (bloco "Orientação").
import { buildGuidance, guidanceText } from './engine.js';
import { AREAS, TOPICS, CHECKLISTS, AI_GUIDE } from './knowledge.js';
import './advisor.css';

const LEVEL_NAMES = { urgente: 'Urgente', atencao: 'Atenção', oportunidade: 'Oportunidade', bom: 'Indo bem' };
const GROUP_NAMES = { urgente: 'Resolver primeiro', atencao: 'Pede atenção', oportunidade: 'Para vender mais', bom: 'O que está indo bem' };

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = obj => Object.entries(obj || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
const button = (action, label, cls, attrs) => `<button type="button" data-action="${action}" class="${cls || ''}"${data(attrs)}>${label}</button>`;

let last = null;

function panel(input) {
  const g = buildGuidance(input);
  last = g;
  const actions = g.actions.length
    ? `<h3 class="advisor-label">Faça agora</h3><ol class="advisor-actions">${g.actions.map(d => `<li>${button('advisor-detail',
      `<span class="advisor-dot ${d.level}" aria-label="${LEVEL_NAMES[d.level]}"></span><span class="advisor-text"><strong>${esc(d.title)}</strong><span>${esc(d.todo)}</span></span><span class="advisor-why" aria-hidden="true">›</span><span class="sr-only">Ver por quê</span>`,
      'advisor-action', { id: d.id })}</li>`).join('')}</ol>`
    : '';
  const others = g.all.length - g.actions.length;
  return `<section class="panel advisor" aria-labelledby="advisor-title">
<div class="advisor-head"><h2 id="advisor-title">Orientação</h2><span class="advisor-period">${esc(g.periodLabel)}</span></div>
<p class="advisor-situation">${esc(g.situation)}</p>
${actions}
<div class="advisor-links">${g.all.length ? button('advisor-all', `Diagnóstico completo${others > 0 ? ` (+${others})` : ''}`, 'advisor-link') : ''}${button('advisor-guide', 'Guia da banca', 'advisor-link')}</div>
</section>`;
}

function find(id) {
  return last?.all.find(d => d.id === id) || null;
}

function topicHowTo(ids) {
  const parts = ids.slice(0, 2).map(id => TOPICS[id]).filter(t => t && t.how.length);
  if (!parts.length) return '';
  return `<h3 class="advisor-label">Como fazer na banca</h3>${parts.map(t => `<p class="advisor-topic-name">${esc(t.title)}</p><ul class="advisor-list">${t.how.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`).join('')}`;
}

function detail(id) {
  const d = find(id);
  if (!d) return '<p class="dialog-text">Este ponto não está mais na orientação atual.</p>';
  const formulas = d.topics.map(t => TOPICS[t]).filter(t => t.formula).map(t => `<li><strong>${esc(t.title)}:</strong> ${esc(t.formula)}</li>`).join('');
  const numbers = d.numbers.length || formulas
    ? `<details class="advisor-numbers"><summary>Ver os números</summary>${d.numbers.length ? `<dl>${d.numbers.map(n => `<div><dt>${esc(n.label)}</dt><dd>${esc(n.value)}${n.detail ? `<small>${esc(n.detail)}</small>` : ''}</dd></div>`).join('')}</dl>` : ''}${formulas ? `<p class="advisor-topic-name">Como o app calcula</p><ul class="advisor-list">${formulas}</ul>` : ''}</details>`
    : '';
  const learn = d.topics.length ? `<div class="advisor-chips">${d.topics.map(t => button('advisor-topic', esc(TOPICS[t].title), 'chip', { id: t })).join('')}</div>` : '';
  return `<p class="advisor-badge ${d.level}">${LEVEL_NAMES[d.level]}</p>
<h3 class="advisor-label">O que aconteceu</h3><p class="dialog-text">${esc(d.happened)}</p>
<h3 class="advisor-label">O que fazer</h3><p class="advisor-todo">${esc(d.todo)}</p>
${d.steps.length ? `<ul class="advisor-list">${d.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
${d.why ? `<h3 class="advisor-label">Por que importa</h3><p class="dialog-text">${esc(d.why)}</p>` : ''}
${topicHowTo(d.topics)}
${numbers}
${learn}`;
}

// Botão de ação do item (abrir Estoque, Catálogo, checklist, aviso de WhatsApp).
function detailAction(id) {
  const d = find(id);
  return d?.cta ? button('advisor-go', esc(d.cta.label), 'primary modal-action', { target: d.cta.action, ...(d.cta.data || {}) }) : '';
}

function all() {
  if (!last) return '';
  return Object.keys(GROUP_NAMES).map(level => {
    const items = last.all.filter(d => d.level === level);
    if (!items.length) return '';
    return `<h3 class="advisor-label">${GROUP_NAMES[level]}</h3><div class="advisor-group">${items.map(d => button('advisor-detail',
      `<span class="advisor-dot ${d.level}"></span><span class="advisor-text"><strong>${esc(d.title)}</strong><span>${esc(d.todo)}</span></span>`,
      'advisor-action', { id: d.id })).join('')}</div>`;
  }).join('');
}

function guide() {
  const byArea = Object.entries(AREAS).map(([area, name]) => {
    const topics = Object.entries(TOPICS).filter(([, t]) => t.area === area);
    return `<h3 class="advisor-label">${esc(name)}</h3><div class="advisor-group">${topics.map(([id, t]) => button('advisor-topic',
      `<span class="advisor-text"><strong>${esc(t.title)}</strong><span>${esc(t.what)}</span></span>`, 'advisor-action', { id })).join('')}</div>`;
  }).join('');
  const lists = `<h3 class="advisor-label">Checklists</h3><div class="advisor-group">${Object.entries(CHECKLISTS).map(([id, c]) => button('advisor-checklist',
    `<span class="advisor-text"><strong>${esc(c.title)}</strong><span>${esc(c.intro)}</span></span>`, 'advisor-action', { id })).join('')}</div>`;
  return `<p class="dialog-text">O material de apoio da feira, em linguagem simples. Toque em um tema.</p>${lists}${byArea}`;
}

function topic(id) {
  const t = TOPICS[id];
  if (!t) return '';
  return `<p class="advisor-badge info">${esc(AREAS[t.area])}</p><p class="advisor-todo">${esc(t.what)}</p>
${t.formula ? `<p class="dialog-text"><strong>Como se calcula:</strong> ${esc(t.formula)}</p>` : ''}
${t.how.length ? `<h3 class="advisor-label">Como fazer</h3><ul class="advisor-list">${t.how.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${t.improves.length ? `<p class="small muted">Ajuda em: ${esc(t.improves.join(', '))}.</p>` : ''}`;
}

function checklist(id) {
  const c = CHECKLISTS[id];
  if (!c) return '';
  return `<p class="dialog-text">${esc(c.intro)}</p><div class="advisor-checklist">${c.items.map((text, i) => `<label class="advisor-check"><input type="checkbox" id="check-${id}-${i}"><span>${esc(text)}</span></label>`).join('')}</div>`;
}

window.TerritorioAdvisor = {
  panel,
  detail,
  detailAction,
  title: id => find(id)?.title || 'Orientação',
  all,
  guide,
  topic,
  topicTitle: id => TOPICS[id]?.title || 'Guia da banca',
  checklist,
  checklistTitle: id => CHECKLISTS[id]?.title || 'Checklist',
  text: input => guidanceText(buildGuidance(input)),
  summary: input => {
    const g = buildGuidance(input);
    return { situation: g.situation, actions: g.actions.map(d => ({ title: d.title, todo: d.todo })), others: g.all.filter(d => !g.actions.includes(d)).map(d => ({ title: d.title, todo: d.todo })) };
  },
  aiGuide: AI_GUIDE,
};
