// QA isolada: dados sintéticos e API interceptada; nunca toca no aparelho ou no preview do usuário.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const app = path.resolve(__dirname, '../app');
const node = 'C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe';
const STORE = 'territorio-gestao-prototipo-v1';
const EVENT = 'e-surplus-test';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const at = hh => today + 'T' + hh + ':00-03:00';
const production = process.argv.includes('--production');
const report = { cases: [], errors: [], apiRequests: 0, source: production ? 'isolated-production-dist-5179' : 'isolated-vite-5179' };

function seed({ noLoad = false, allOut = false, theme = 'light' } = {}) {
  const products = [
    { id: 't-banana', name: 'Banana Prata', baseName: 'Banana Prata', category: 'Hortifruti-Granjeiro', unit: 'Dúzia', stock: 20, price: 1000, cost: 500, min: 2, stockGroup: 'general' },
    { id: 't-queijo', name: 'Queijo Minas', baseName: 'Queijo Minas', category: 'Laticínios', unit: 'Unidade', stock: 10, price: 2000, cost: 1000, min: 2, stockGroup: 'general' },
    { id: 't-cafe', name: 'Café Especial', baseName: 'Café', category: 'Cafés', type: 'Especial', format: 'Moído', unit: 'Pacote', weight: 250, stock: 8, price: 5000, cost: 2500, min: 2, stockGroup: 'general' },
  ];
  const product = id => products.find(p => p.id === id);
  const sale = (id, time, entries, method) => {
    const items = entries.map(([id, qty]) => { const p = product(id); return { productId: id, name: p.name, unit: p.unit, description: '', qty, price: p.price, cost: p.cost, total: qty * p.price, costTotal: qty * p.cost }; });
    const total = items.reduce((sum, i) => sum + i.total, 0);
    return { id, date: at(time), scope: EVENT, status: 'completed', items, subtotal: total, total, discount: 0, cost: total / 2, payments: [{ method, amount: total }] };
  };
  const sales = [sale('t-sale-1', '09:10', [['t-banana', 3]], 'Dinheiro'), sale('t-sale-2', '10:15', [['t-banana', 4]], 'Dinheiro'), sale('t-sale-3', '11:20', [['t-queijo', 3], ['t-cafe', 2]], 'Pix')];
  return {
    schema: 1, inventoryRevision: 20, products, sales, movements: [], clients: [], expenses: [], profiles: {},
    settings: { onboarding: 'real', startedAt: at('08:00'), producerName: 'QA local', financialVisible: true, appearance: theme, layout: 'feira', fairReports: {} },
    events: [{ id: EVENT, name: 'Feira de teste local', start: today, end: today, from: '00:00', until: '23:59', status: 'active', fairId: 'feira-inventario', fairName: 'Feira do Inventário', fairServer: 'https://surplus-e2e.invalid', fairConsentAt: at('08:00') }],
    eventLoads: noLoad ? [] : [{ eventId: EVENT, createdAt: at('08:00'), updatedAt: at('10:00'), items: products.map(p => ({ productId: p.id, name: p.name, unit: p.unit, description: '', qty: p.id === 't-banana' ? (allOut ? 7 : 12) : p.id === 't-queijo' ? (allOut ? 3 : 5) : 2, ...(p.id === 't-banana' && !allOut ? { restocks: [{ at: at('10:00'), qty: 2 }] } : {}) })) }],
  };
}

async function main() {
  let browser, server;
  let serverLog = '';
  const external = process.env.SURPLUS_E2E_URL;
  const url = external || 'http://127.0.0.1:5179';
  try {
    if (!external) {
      server = cp.spawn(node, [app + '/node_modules/vite/bin/vite.js', ...(production ? ['preview'] : []), '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { cwd: app, windowsHide: true, stdio: 'pipe' });
      server.stdout.on('data', d => serverLog += d);
      server.stderr.on('data', d => serverLog += d);
      for (let i = 0; i < 100 && !serverLog.includes('Local:'); i++) await new Promise(r => setTimeout(r, 100));
      if (!serverLog.includes('Local:')) throw Error('Vite isolado não iniciou: ' + serverLog);
    }
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    async function fixture(options = {}) {
      const data = seed(options), payloads = [], network = { apiOnline: true };
      const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
      await context.addInitScript(({ data, key }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data)); }, { data, key: STORE });
      await context.route('**/*', async route => {
        const request = route.request(), href = request.url();
        if (href.includes('/api/fairs/')) {
          if (!network.apiOnline) return route.abort('internetdisconnected');
          if (request.method() === 'POST' && href.endsWith('/reports')) { payloads.push(request.postDataJSON()); report.apiRequests++; }
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(href.endsWith('/info') ? { fair: { id: 'feira-inventario', name: 'Feira do Inventário', active: true } } : { ok: true, receivedAt: new Date().toISOString() }) });
        }
        return href.startsWith(url) || href.startsWith('data:') ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(String(e)));
      await page.goto(url);
      await page.waitForFunction(() => typeof window.ERPPreview?.fairSurplusState === 'function', { timeout: 30000 });
      const act = (action, args = {}) => page.evaluate(({ action, args }) => window.ERPPreview.actions[action](args), { action, args });
      const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.ERPPreview.model().data)));
      const open = async () => { await act('fair-finish', { id: EVENT }); await page.waitForTimeout(450); };
      const click = async action => { await page.locator('#dialog [data-action="' + action + '"]').click(); await page.waitForTimeout(120); };
      const edit = async (index, value) => {
        const input = page.locator('#surplus-count-' + index);
        await input.click();
        const pad = page.locator('#dialog-number-pad:not([hidden])');
        await pad.waitFor({ state: 'visible' });
        await pad.locator('[data-action="number-key"][data-token="clear"]').click();
        for (const token of String(value).replace('.', ',')) await pad.locator('[data-action="number-key"][data-token="' + token + '"]').click();
        assert.equal(await input.inputValue(), String(value).replace('.', ','));
        await pad.locator('[data-action="number-pad-close"]').click();
      };
      const savedReport = async () => page.evaluate(eventId => window.ERPPreview.fairReportFor ? window.ERPPreview.fairReportFor(eventId) : null, EVENT);
      const sync = async () => page.evaluate(() => window.ERPPreview.syncFairReports?.());
      const finishReasons = async reasons => {
        await click('surplus-save');
        for (const reason of reasons) {
          const button = page.locator('#dialog [data-action="surplus-reason"][data-reason="' + reason + '"]');
          await button.waitFor({ state: 'visible' });
          await button.click(); await page.waitForTimeout(100);
        }
        const save = page.locator('#dialog[open] [data-action="surplus-save"]');
        if (await save.isVisible()) await save.click();
        await page.waitForTimeout(250);
      };
      return { context, page, data, payloads, network, act, state, open, click, edit, savedReport, sync, finishReasons };
    }
    async function run(name, fn, options) {
      const f = await fixture(options);
      try { await fn(f); report.cases.push({ name, passed: true }); console.log('PASS ' + name); }
      catch (error) { await f.page.screenshot({ path: path.join(__dirname, 'surplus-failure-' + name + '.png') }).catch(() => {}); report.cases.push({ name, passed: false, error: String(error), dialog: await f.page.locator('#dialog').innerText().catch(() => '') }); throw error; }
      finally { await f.context.close(); }
    }

    for (const theme of ['light', 'dark']) await run('confere-' + theme, async f => {
      await f.open();
      const text = await f.page.locator('#dialog').innerText();
      assert.match(text, /Pelo app, sobrou:/);
      assert.match(text, /Banana Prata/);
      assert.match(text, /Queijo Minas/);
      assert.doesNotMatch(text, /Café Especial/);
      assert.equal(await f.page.locator('#dialog [data-action="surplus-confirm"]').count(), 1);
      assert.equal(await f.page.locator('#dialog .dialog-close').count(), 0);
      const geometry = await f.page.locator('#dialog').evaluate(d => ({ overflow: d.scrollWidth > d.clientWidth + 1, footerBottom: d.querySelector('.checkout-footer')?.getBoundingClientRect().bottom, height: innerHeight }));
      assert(!geometry.overflow); assert(geometry.footerBottom <= geometry.height + 1);
      await f.page.screenshot({ path: path.join(__dirname, 'surplus-' + theme + '.png') });
      await f.click('surplus-confirm');
      const saved = await f.state(), e = saved.events[0];
      assert.equal(e.surplusCheck.conferido, true);
      assert.equal(e.surplusCheck.corrigido, false);
      assert.equal(e.surplusCheck.itens.length, 2);
      assert.equal(saved.sales.length, 3);
      assert.equal(saved.movements.length, 0);
      assert.deepEqual(saved.products.map(p => p.stock), [20, 10, 8]);
      assert.equal(e.surplusCheckMetrics.confereDireto, true);
      assert.equal(e.surplusCheckMetrics.diferencaTotal, 0);
      assert(e.surplusCheckMetrics.tempoConferenciaMs >= 0);
      assert(e.fairClosedAt);
      await f.sync();
      assert(f.payloads.length > 0, 'Relatório deve chegar à API interceptada');
      assert.deepEqual(f.payloads.at(-1).check, e.surplusCheck);
    }, { theme });

    await run('finalizar-sem-conferir', async f => {
      await f.open();
      assert.match(await f.page.locator('#dialog').innerText(), /Pelo app, sobrou:/);
      const skip = f.page.locator('#dialog [data-action="surplus-skip"]');
      assert.equal(await skip.innerText(), 'Finalizar e enviar relatório');
      await skip.click(); await f.page.waitForTimeout(200);
      const saved = await f.state(), e = saved.events[0];
      assert.deepEqual(e.surplusCheck, { conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
      assert.deepEqual(saved.settings.fairReports[EVENT].counts, {});
      assert.equal(saved.sales.length, 3); assert.equal(saved.movements.length, 0);
      assert.deepEqual(saved.products.map(p => p.stock), [20, 10, 8]);
      assert.equal(e.surplusCheckMetrics.confereDireto, false);
      await f.sync(); assert.deepEqual(f.payloads.at(-1).check, e.surplusCheck);
    });

    await run('corrigir-venda-perda', async f => {
      await f.open(); await f.click('surplus-correct');
      await f.edit(0, 3); await f.edit(1, 1);
      await f.page.screenshot({ path: path.join(__dirname, 'surplus-correction.png') });
      await f.finishReasons(['sale', 'loss']);
      const saved = await f.state(), e = saved.events[0], generated = saved.sales.filter(s => s.unregistered === true), losses = saved.movements.filter(m => m.kind === 'loss');
      assert.equal(generated.length, 1);
      assert.equal(generated[0].status, 'completed');
      assert.equal(generated[0].payments[0].method, 'Dinheiro');
      assert.equal(generated[0].items[0].qty, 2); assert.equal(generated[0].total, 2000);
      assert.equal(generated[0].date, e.fairClosedAt);
      assert.equal(losses.length, 1); assert.equal(losses[0].eventId, EVENT); assert.equal(losses[0].qty, 1);
      assert.deepEqual(saved.products.map(p => p.stock), [18, 9, 8]);
      assert.deepEqual(e.surplusCheck.vendasNaoRegistradas, { qtd: 2, valor: 2000 });
      assert.deepEqual(e.surplusCheck.perdas, { qtd: 1 });
      assert.equal(e.surplusCheckMetrics.confereDireto, false);
      assert.equal(e.surplusCheckMetrics.diferencaTotal, 3);
      assert.equal(e.surplusCheckMetrics.diferencaLiquida, -3);
      const r = await f.savedReport(); assert(r); assert.equal(r.totals.left, 4); assert.equal(r.totals.sales, 4);
      await f.sync(); assert.deepEqual(f.payloads.at(-1).check, e.surplusCheck);
      const count = saved.sales.length;
      await f.act('surplus-save'); await f.act('surplus-confirm');
      assert.equal((await f.state()).sales.length, count, 'Ações repetidas após fechamento não duplicam venda');
    });

    await run('ajuste-carga-duplo-toque', async f => {
      await f.open(); await f.click('surplus-correct'); await f.edit(0, 7);
      await f.page.evaluate(() => Promise.allSettled([window.ERPPreview.actions['surplus-save']({}), window.ERPPreview.actions['surplus-save']({})]));
      await f.page.waitForTimeout(200);
      const saved = await f.state(), load = saved.eventLoads[0], banana = load.items.find(i => i.productId === 't-banana');
      assert.equal(banana.qty, 14, 'Ajuste aplicado uma vez'); assert.equal(banana.restocks[0].qty, 2);
      assert.equal(banana.adjustments.length, 1); assert.equal(banana.adjustments[0].qty, 2);
      assert.equal(saved.products[0].stock, 20, 'Mais carga levada não cria estoque'); assert.equal(saved.sales.length, 3);
      assert.equal(saved.events[0].surplusCheck.itens[0].motivo, 'ajuste_carga');
      const r = await f.savedReport(); assert.equal(r.products.find(p => p.id === 't-banana').restocked, 2);
      assert.equal(r.products.find(p => p.id === 't-banana').left, 7);
    });

    for (const option of ['noLoad', 'allOut']) await run(option, async f => {
      await f.open(); const text = await f.page.locator('#dialog').innerText();
      assert.doesNotMatch(text, /Pelo app, sobrou:/);
      assert.equal(await f.page.locator('#dialog [data-action="surplus-confirm"]').count(), 0);
      const finish = f.page.locator('#dialog button').filter({ hasText: 'Finalizar e enviar relatório' });
      assert.equal(await finish.count(), 1); await finish.click(); await f.page.waitForTimeout(200);
      const saved = await f.state(); assert.equal(saved.events[0].surplusCheck.conferido, false);
      assert.equal(saved.sales.length, 3); assert.equal(saved.movements.length, 0);
    }, { [option]: true });

    await run('offline-reload-atualizacao', async f => {
      await f.open(); await f.context.setOffline(true); await f.click('surplus-confirm');
      const saved = await f.state(), originalCheck = structuredClone(saved.events[0].surplusCheck);
      assert.equal(saved.settings.fairReports[EVENT].pending, true);
      const stored = await f.page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORE);
      assert.deepEqual(stored.events[0].surplusCheck, originalCheck);
      f.network.apiOnline = false; await f.context.setOffline(false); await f.page.reload();
      await f.page.waitForFunction(() => typeof window.ERPPreview?.fairSurplusState === 'function');
      assert.deepEqual((await f.state()).events[0].surplusCheck, originalCheck);
      f.network.apiOnline = true; await f.sync();
      assert.equal(f.payloads.at(-1).totals.left, 7);
      const initialRevenue = f.payloads.at(-1).totals.revenue;
      await f.page.evaluate(eventId => {
        window.ERPPreview.model().complete({ scope: eventId, items: [{ productId: 't-banana', rawQty: '1' }], payment: 'Pix', discountMode: 'R$', discountValue: '0' });
        if (window.ERPPreview.persist) window.ERPPreview.persist();
      }, EVENT);
      await f.sync();
      assert.equal(f.payloads.at(-1).totals.revenue, initialRevenue + 1000);
      assert.equal(f.payloads.at(-1).totals.left, 6);
      assert.deepEqual(f.payloads.at(-1).check, originalCheck);
      assert.equal((await f.state()).settings.fairReports[EVENT].pending, false);
    });

    await run('snapshot-desatualizado', async f => {
      await f.open();
      await f.page.evaluate(eventId => { window.ERPPreview.model().complete({ scope: eventId, items: [{ productId: 't-banana', rawQty: '1' }], payment: 'Pix', discountMode: 'R$', discountValue: '0' }); }, EVENT);
      await f.click('surplus-confirm');
      const saved = await f.state();
      assert.equal(saved.sales.length, 4); assert.equal(saved.sales.filter(s => s.unregistered).length, 0);
      assert(!saved.events[0].fairClosedAt, 'Não finaliza uma conferência com base desatualizada');
      assert(!saved.events[0].surplusCheck?.conferido);
      assert.equal(saved.products[0].stock, 19);
      assert.match(await f.page.locator('#dialog').innerText(), /sobrou|atualizad|mudaram/i);
    });
    assert.deepEqual(report.errors, []);
  } finally {
    fs.writeFileSync(path.join(__dirname, 'surplus-e2e.json'), JSON.stringify(report, null, 2));
    await browser?.close(); server?.kill();
  }
  console.log(JSON.stringify({ cases: report.cases.length, passed: report.cases.filter(c => c.passed).length, apiRequests: report.apiRequests, errors: report.errors }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
