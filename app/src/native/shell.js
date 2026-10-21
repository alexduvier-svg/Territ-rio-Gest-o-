// Native behaviour around the legacy UI. Everything here works by observing the DOM or the small
// window.TerritorioShell hook, so src/legacy stays close to the original mockup.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AppLauncher } from '@capacitor/app-launcher';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { settle } from './storage.js';
import { notificationChanges, notificationTime } from '../features/day-summary.js';

// Taps that deserve a light tick. Haptics are used sparingly, like on iOS.
const TICK_ACTIONS = new Set(['nav', 'sell-product', 'quick-category', 'remove-cart-item', 'remove-item']);

function showToast(text) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3800);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function safeFileName(name) {
  return String(name || 'arquivo').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120);
}

// Files leave the app through the Android share sheet: Drive, WhatsApp, e-mail, Files…
async function shareFiles(files, { title, text } = {}) {
  const uris = [];
  for (const file of files) {
    const { uri } = await Filesystem.writeFile({
      path: 'compartilhar/' + safeFileName(file.name),
      data: await blobToBase64(file),
      directory: Directory.Cache,
      recursive: true,
    });
    uris.push(uri);
  }
  await Share.share({ title, text, files: uris, dialogTitle: title || 'Compartilhar' });
}

function isCancel(error) {
  return /cancel/i.test(String(error && (error.message || error)));
}

function installBackButton() {
  App.addListener('backButton', () => {
    if (window.TerritorioSelection?.cancel()) return; // voltar sai do modo de seleção de produtos
    if (window.TerritorioShell && window.TerritorioShell.back()) return;
    // At the root, go to the background instead of closing: the seller returns to the same screen.
    App.minimizeApp();
  });
}

function installLinksAndDownloads() {
  document.addEventListener('click', event => {
    const a = event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    if (a.hasAttribute('download')) {
      event.preventDefault();
      const name = a.getAttribute('download') || 'arquivo';
      // Start reading the blob immediately: the UI revokes the object URL shortly after clicking.
      fetch(a.href)
        .then(response => response.blob())
        .then(blob => shareFiles([new File([blob], name, { type: blob.type })], { title: name }))
        .catch(error => { if (!isCancel(error)) showToast('Não foi possível salvar o arquivo.'); });
      return;
    }
    if (/^https?:/i.test(a.href) && new URL(a.href).origin !== location.origin) {
      event.preventDefault();
      AppLauncher.openUrl({ url: a.href }).catch(() => showToast('Não foi possível abrir o link.'));
    }
  }, true);

  // The Android WebView has no Web Share API; the UI already uses it when available.
  const share = async (data = {}) => {
    try {
      if (data.files && data.files.length) return await shareFiles(data.files, data);
      await Share.share({ title: data.title, text: data.text, url: data.url, dialogTitle: data.title || 'Compartilhar' });
    } catch (error) {
      if (isCancel(error)) throw new DOMException('Compartilhamento cancelado', 'AbortError');
      throw error;
    }
  };
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: data => !!data, configurable: true });
}

function installHaptics() {
  window.TerritorioHaptics = { tick: () => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}) };
  document.addEventListener('click', event => {
    const target = event.target.closest && event.target.closest('[data-action]');
    if (target && !target.disabled && TICK_ACTIONS.has(target.dataset.action)) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  }, true);

  const toast = document.getElementById('toast');
  if (!toast) return;
  new MutationObserver(() => {
    if (toast.hidden) return;
    const text = toast.textContent || '';
    if (/^(Venda Finalizada|QR lido pelo cliente)/.test(text)) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    else if (/^(Não foi possível|Informe |Use )/.test(text)) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  }).observe(toast, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
}

function installSystemSleep() {
  // The phone's normal screen timeout applies on every page, including an active
  // fair or an unfinished sale. Release a wake flag left by a previous app version.
  const allowSleep = () => KeepAwake.allowSleep().catch(() => {});
  App.addListener('resume', allowSleep);
  App.addListener('pause', allowSleep);
  allowSleep();
}

function installSystemBars() {
  const root = document.documentElement;
  const sync = () => {
    const light = root.getAttribute('data-theme') === 'light';
    SystemBars.setStyle({ style: light ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
}

function installLifecycle() {
  // Make sure the last sale is on disk before Android may kill the app in the background.
  App.addListener('pause', () => {
    settle();
    window.dispatchEvent(new Event('territorio:pause'));
  });
  // Link da feira (agrogestao://feira/<id>?s=<servidor>), vindo do QR do organizador: com o app aberto ou fechado.
  const openLink = url => { if (url && /^agrogestao:\/\/feira\//i.test(url)) setTimeout(() => window.TerritorioShell?.joinFairLink?.(url), 600); };
  App.addListener('appUrlOpen', event => openLink(event?.url));
  App.getLaunchUrl().then(launch => openLink(launch?.url)).catch(() => {});
  // A tela some antes do "pause" do Android: começa a esvaziar a fila o quanto antes.
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  window.addEventListener('territorio:storage-error', () => {
    showToast('Não foi possível salvar no aparelho. Libere espaço e faça um backup.');
  });
}

// Avisa fora do app (barra de notificações, tela bloqueada e Always On Display, conforme os ajustes do
// celular) quando um produto chega a 30% do seu próprio nível de estoque. Cada produto avisa uma vez;
// depois de reposto acima de 30%, volta a poder avisar.
// Dois tipos de aviso (decisão do produtor, 21/10/2026): "Estoque" aparece na barra e no resumo da tela
// apagada sem acender a tela (acabando, ou esgotado na Loja: é para planejar); "Estoque — Feira" acende a
// tela, só quando um produto acaba durante uma feira em andamento. Cada pessoa pode mudar isso nos ajustes
// de notificação do app no celular. O Android não deixa o app mudar um tipo já criado, por isso os ids são
// novos e o tipo antigo ("estoque", que acendia a tela sempre) é retirado.
const LOW_STOCK = 0.3;
const STOCK_CHANNEL = 'estoque-v2', STOCK_FAIR_CHANNEL = 'estoque-feira';
const sellingAtFair = () => { const scope = window.TerritorioWorkflowBridge?.scope?.(); return !!scope && scope !== 'loja'; };
const ALERTED_KEY = 'territorio-stock-alerted';

function notificationId(productId) {
  let h = 7;
  for (const ch of productId) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 2000000000;
}

async function checkStock() {
  const levels = window.TerritorioShell?.stockLevels?.();
  if (!levels) return;
  let alerted = [];
  try { alerted = JSON.parse(localStorage.getItem(ALERTED_KEY) || '[]'); } catch { /* recomeça */ }
  const low = levels.filter(l => l.ratio !== null && l.ratio <= LOW_STOCK);
  const lowIds = new Set(low.map(l => l.id));
  alerted = alerted.filter(id => lowIds.has(id)); // reposto acima de 30%: pode avisar de novo
  const fresh = low.filter(l => !alerted.includes(l.id));
  if (fresh.length) {
    try {
      const status = await LocalNotifications.checkPermissions();
      const granted = status.display === 'granted' || (await LocalNotifications.requestPermissions()).display === 'granted';
      if (granted) {
        await LocalNotifications.schedule({
          notifications: fresh.map(l => ({
            id: notificationId(l.id),
            channelId: l.stock <= 0 && sellingAtFair() ? STOCK_FAIR_CHANNEL : STOCK_CHANNEL,
            title: l.stock <= 0 ? `${l.name} acabou` : `Estoque baixo: ${l.name}`,
            body: l.stock <= 0
              ? `${l.detail ? l.detail + ' · ' : ''}Toque para repor.`
              : `Restam ${l.stock.toLocaleString('pt-BR')} ${l.unit} (${Math.round(l.ratio * 100)}% do seu nível). Toque para repor.`,
            extra: { productId: l.id },
            smallIcon: 'ic_stat_territorio',
            iconColor: '#7FA653',
            autoCancel: true,
            foreground: true,
            isExactNotification: false,
          })),
        });
        alerted.push(...fresh.map(l => l.id));
      }
    } catch (error) {
      console.warn('Aviso de estoque não enviado', error);
    }
  }
  localStorage.setItem(ALERTED_KEY, JSON.stringify(alerted));
}

function installStockAlerts() {
  LocalNotifications.deleteChannel({ id: 'estoque' }).catch(() => {});
  LocalNotifications.createChannel({
    id: STOCK_CHANNEL,
    name: 'Estoque',
    description: 'Produto acabando ou esgotado na Loja. Aparece na barra e na tela apagada, sem acender a tela.',
    importance: 3,
    visibility: 1,
    vibration: false,
    lights: true,
    lightColor: '#7FA653',
  }).catch(() => {});
  LocalNotifications.createChannel({
    id: STOCK_FAIR_CHANNEL,
    name: 'Estoque — Feira',
    description: 'Produto esgotado durante uma feira em andamento. Acende a tela.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#C62F26',
  }).catch(() => {});
  LocalNotifications.addListener('localNotificationActionPerformed', action => {
    const id = action.notification?.extra?.productId;
    if (id) setTimeout(() => window.TerritorioShell?.openRestock?.([id]), 400);
  });
  let timer;
  window.addEventListener('territorio:saved', () => {
    clearTimeout(timer);
    timer = setTimeout(checkStock, 1200);
  });
  setTimeout(checkStock, 3000);
}

// Custos esquecidos: se há produto sem custo E dia de feira sem custos extras, ao sair do app fica uma
// notificação fixa ("Fazer agora" abre Custos; "Depois" adia até amanhã). Some ao abrir o app.
const FIN_NOTICE_ID = 990200;
const FIN_NOTIFIED_KEY = 'territorio-fin-notified';
function installFinanceReminder() {
  LocalNotifications.createChannel({
    id: 'financas',
    name: 'Custos para lançar',
    description: 'Quando faltam custos para o lucro ficar certo.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#7FA653',
  }).catch(() => {});
  LocalNotifications.registerActionTypes({
    types: [{ id: 'FIN_COSTS', actions: [{ id: 'now', title: 'Fazer agora', foreground: true }, { id: 'later', title: 'Depois' }] }],
  }).catch(() => {});
  LocalNotifications.addListener('localNotificationActionPerformed', action => {
    if (action.notification?.extra?.kind !== 'fin') return;
    if (action.actionId === 'later') return window.TerritorioShell?.financeSnooze?.();
    setTimeout(() => window.TerritorioShell?.openCosts?.(), 400);
  });
  const clear = () => LocalNotifications.cancel({ notifications: [{ id: FIN_NOTICE_ID }] }).catch(() => {});
  App.addListener('resume', clear);
  clear();
  window.addEventListener('territorio:pause', async () => {
    const shell = window.TerritorioShell;
    const gaps = shell?.financeGaps?.();
    const today = new Date().toISOString().slice(0, 10);
    if (!gaps?.any || shell.financeSnoozed?.() || localStorage.getItem(FIN_NOTIFIED_KEY) === today) return;
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') return;
      await LocalNotifications.schedule({
        notifications: [{
          id: FIN_NOTICE_ID,
          channelId: 'financas',
          title: 'Faltam custos para o lucro ficar certo',
          body: `${gaps.noCost} ${gaps.noCost === 1 ? 'produto sem custo' : 'produtos sem custo'} e ${gaps.missing} ${gaps.missing === 1 ? 'dia de feira' : 'dias de feira'} sem custos lançados.`,
          actionTypeId: 'FIN_COSTS',
          extra: { kind: 'fin' },
          smallIcon: 'ic_stat_territorio',
          iconColor: '#7FA653',
          ongoing: true,
          autoCancel: true,
          schedule: { at: new Date(Date.now() + 20 * 60 * 1000), allowWhileIdle: true },
          isExactNotification: false,
        }],
      });
      localStorage.setItem(FIN_NOTIFIED_KEY, today);
    } catch (error) {
      console.warn('Aviso de custos não enviado', error);
    }
  });
}

// Finalizar feira oficial: aviso 10 min antes do fim, 20h do mesmo dia, 12h do dia seguinte e depois 12h por
// até 7 dias (src/features/fair-report.js → fairNoticeTimes). Fica na barra até tocar; some ao finalizar.
function fairNoticeId(eventId, slot = 0) {
  let h = 17;
  for (const ch of 'fair:' + eventId + ':' + slot) h = (h * 33 + ch.charCodeAt(0)) | 0;
  return 1000000 + (Math.abs(h) % 900000000);
}
let schedulingFairNotices = false;
let rescheduleFairNotices = false;
let eventPermissionAsked = false;
async function scheduleFairNotices() {
  if (schedulingFairNotices) { rescheduleFairNotices = true; return; }
  schedulingFairNotices = true;
  const list = window.TerritorioShell?.fairEndings?.() || [];
  try {
    const now = Date.now();
    const wanted = new Map();
    for (const f of list) {
      if (f.closed) continue;
      f.times.forEach((at, i) => {
        if (at <= now) return;
        const id = fairNoticeId(f.id, i);
        wanted.set(id, {
          id, at, channelId: 'financas',
          title: i === 0 ? `${f.name} termina em 10 minutos` : f.official ? `Finalize a ${f.name}` : `Finalize o evento ${f.name}`,
          body: f.official ? (i === 0 ? 'Quando parar de vender, finalize a feira. O relatório vai sozinho.' : 'Confira o que sobrou: leva um minuto. O relatório vai sozinho.') : (i === 0 ? 'Quando parar de vender, finalize o evento e confira o que sobrou.' : 'Confira o que sobrou: leva um minuto.'),
          actionTypeId: 'FAIR_FINISH', extra: { kind: 'fair', eventId: f.id, reminderAt: at }, ongoing: true,
        });
      });
    }
    // One hour before each event day; no late or retroactive fallback.
    const starts = window.TerritorioShell?.eventStarts?.({ includePast: true }) || [];
    const allStarts = new Map(starts.map(st => [fairNoticeId('start:' + st.id), st]));
    for (const [id, st] of allStarts) if (st.at > now) wanted.set(id, {
      id, at: st.at, channelId: 'eventos', title: st.title, body: st.body,
      extra: { kind: 'event-start', eventId: st.eventId, reminderAt: st.at, startAt: st.startAt },
    });
    const { notifications } = await LocalNotifications.getPending();
    const changes = notificationChanges(wanted, notifications);
    if (changes.cancel.length) await LocalNotifications.cancel({ notifications: changes.cancel });
    // An edited, removed, or finished event must not leave an obsolete reminder
    // in the notification shade. A matching reminder already delivered can stay.
    const delivered = (await LocalNotifications.getDeliveredNotifications()).notifications || [];
    const obsoleteStarts = delivered.filter(n => n.extra?.kind === 'event-start' && (!allStarts.has(n.id) || notificationTime(n) !== allStarts.get(n.id).at || n.title !== allStarts.get(n.id).title || n.body !== allStarts.get(n.id).body));
    if (obsoleteStarts.length) await LocalNotifications.removeDeliveredNotifications({ notifications: obsoleteStarts }).catch(() => {});
    // Feira finalizada: tira da barra os avisos que já apareceram.
    const closedIds = list.filter(f => f.closed).flatMap(f => f.times.map((_, i) => fairNoticeId(f.id, i)));
    if (closedIds.length) await LocalNotifications.removeDeliveredNotifications({ notifications: closedIds.map(id => ({ id, title: '', body: '' })) }).catch(() => {});
    let status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt' && !eventPermissionAsked && changes.schedule.some(n => n.extra.kind === 'event-start')) {
      eventPermissionAsked = true;
      status = await LocalNotifications.requestPermissions();
    }
    if (status.display !== 'granted' || !changes.schedule.length) return;
    await LocalNotifications.schedule({
      notifications: changes.schedule.filter(n => n.at > Date.now()).map(({ at, ...n }) => ({
        ...n, smallIcon: 'ic_stat_territorio', iconColor: '#7FA653', autoCancel: true,
        schedule: { at: new Date(at), allowWhileIdle: true }, isExactNotification: false,
      })),
    });
  } catch (error) {
    console.warn('Aviso da feira não agendado', error);
  } finally {
    schedulingFairNotices = false;
    if (rescheduleFairNotices) { rescheduleFairNotices = false; void scheduleFairNotices(); }
  }
}
function installFairReminder() {
  LocalNotifications.createChannel({ id: 'eventos', name: 'Seus eventos', description: 'Lembrete uma hora antes de cada dia do evento.', importance: 4, visibility: 1, vibration: true, lights: true, lightColor: '#7FA653' }).catch(() => {});
  LocalNotifications.registerActionTypes({
    types: [{ id: 'FAIR_FINISH', actions: [{ id: 'finish', title: 'Finalizar feira', foreground: true }, { id: 'later', title: 'Depois' }] }],
  }).catch(() => {});
  LocalNotifications.addListener('localNotificationActionPerformed', async action => {
    const extra = action.notification?.extra;
    if (extra?.kind === 'event-start') { setTimeout(() => window.TerritorioShell?.openEvent?.(extra.eventId), 400); return; }
    if (extra?.kind !== 'fair') return;
    // "Depois": sai da barra; o próximo aviso já está agendado no horário seguinte.
    if (action.actionId === 'later') {
      window.TerritorioShell?.snoozeFairReport?.(extra.eventId);
      await LocalNotifications.removeDeliveredNotifications({ notifications: [{ id: action.notification.id, title: '', body: '' }] }).catch(() => {});
      return;
    }
    setTimeout(() => window.TerritorioShell?.openFairFinish?.(extra.eventId), 400);
  });
  let timer;
  window.addEventListener('territorio:saved', () => { clearTimeout(timer); timer = setTimeout(scheduleFairNotices, 1500); });
  App.addListener('resume', () => { clearTimeout(timer); timer = setTimeout(scheduleFairNotices, 500); });
  setTimeout(scheduleFairNotices, 4000);
}

// Android schedules private invitations only. The JS report is calculated from
// local records on opening, never claimed ready while the WebView is stopped.
let schedulingProductPeriods = false;
let productPeriodsAgain = false;
let productPeriodPermissionAsked = false;
function productPeriodNoticeId(periodId) {
  let h = 5381;
  for (const ch of periodId) h = Math.imul(h, 33) ^ ch.charCodeAt(0);
  return 2000000000 + ((h >>> 0) % 147483647);
}
async function scheduleProductPeriods() {
  if (schedulingProductPeriods) { productPeriodsAgain = true; return; }
  schedulingProductPeriods = true;
  try {
    const shell = window.TerritorioShell;
    if (!shell?.productPeriodNotices) return;
    let source = shell.productPeriodNotices();
    const delivered = (await LocalNotifications.getDeliveredNotifications()).notifications || [];
    // If a planned invitation already arrived, reopening must not send it again.
    for (const n of delivered.filter(n => n.extra?.kind === 'product-period' && source.validIds.includes(n.extra.periodId))) {
      await shell.markProductPeriodNotified?.(n.extra.periodKind, n.extra.periodId);
    }
    source = shell.productPeriodNotices();
    const valid = new Set(source.validIds);
    const obsolete = delivered.filter(n => n.extra?.kind === 'product-period' && !valid.has(n.extra.periodId));
    if (obsolete.length) await LocalNotifications.removeDeliveredNotifications({ notifications: obsolete }).catch(() => {});
    const { notifications: pending } = await LocalNotifications.getPending();
    const wanted = new Map(source.notices.map(n => [productPeriodNoticeId(n.id), n]));
    const cancel = pending.filter(n => n.extra?.kind === 'product-period' && (!wanted.has(n.id) || Number(n.extra.reminderAt) !== wanted.get(n.id).at && !wanted.get(n.id).due)).map(n => ({ id: n.id }));
    if (cancel.length) await LocalNotifications.cancel({ notifications: cancel });
    const cancelled = new Set(cancel.map(n => n.id));
    const remaining = new Set(pending.filter(n => !cancelled.has(n.id)).map(n => n.id));
    // Permission is requested by the app's existing notification setup, outside
    // the sale flow. A denied permission never blocks the in-app summary.
    let status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt' && !productPeriodPermissionAsked && source.notices.length && shell.idle?.()) {
      productPeriodPermissionAsked = true;
      status = await LocalNotifications.requestPermissions();
    }
    if (status.display !== 'granted') return;
    // Recheck after native permission/delivery calls: a reset or an edited first
    // sale during an awaited call cannot create a new obsolete invitation.
    const eligible = new Set(shell.productPeriodNotices().notices.map(n => n.id));
    const next = [...wanted].filter(([id, n]) => !remaining.has(id) && eligible.has(n.id));
    if (!next.length) return;
    await LocalNotifications.schedule({ notifications: next.map(([id, n]) => ({
      id, channelId: 'resumos-produtos', title: n.kind === 'weekly' ? 'Seu resumo semanal de produtos' : 'Seu resumo mensal de produtos',
      body: 'Veja giro, valor vendido e contribuição bruta nos seus registros. Toque para conferir.',
      extra: { kind: 'product-period', periodKind: n.kind, periodId: n.id, reminderAt: n.at },
      schedule: { at: new Date(n.at), allowWhileIdle: false }, isExactNotification: false,
      smallIcon: 'ic_stat_territorio', iconColor: '#7FA653', autoCancel: true, foreground: false,
    })) });
    for (const [, n] of next) if (n.due) await shell.markProductPeriodNotified?.(n.kind, n.id);
  } catch (error) {
    console.warn('Convite para resumo de produtos não agendado', error);
  } finally {
    schedulingProductPeriods = false;
    if (productPeriodsAgain) { productPeriodsAgain = false; void scheduleProductPeriods(); }
  }
}
function installProductPeriodReminders() {
  LocalNotifications.createChannel({ id: 'resumos-produtos', name: 'Resumos dos produtos', description: 'Convites semanais e mensais para conferir seus próprios registros.', importance: 3, visibility: 0, vibration: false, lights: false }).catch(() => {});
  LocalNotifications.addListener('localNotificationActionPerformed', action => {
    const extra = action.notification?.extra;
    if (extra?.kind !== 'product-period') return;
    setTimeout(() => window.TerritorioShell?.openProductPeriod?.(extra.periodKind, extra.periodId), 500);
  });
  let timer;
  const queue = () => { clearTimeout(timer); timer = setTimeout(scheduleProductPeriods, 1600); };
  window.addEventListener('territorio:saved', queue);
  window.addEventListener('territorio:product-source-saved', queue);
  App.addListener('resume', () => { window.dispatchEvent(new Event('territorio:resume')); queue(); });
  setTimeout(scheduleProductPeriods, 5000);
}

export function installShell() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native');
  installBackButton();
  installLinksAndDownloads();
  installHaptics();
  installSystemSleep();
  installSystemBars();
  installLifecycle();
  installStockAlerts();
  installFinanceReminder();
  installFairReminder();
  installProductPeriodReminders();
  requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {}));
}
