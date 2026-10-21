// Política central de adaptação (docs/adaptacao, diretriz de 21/10/2026). Um só serviço decide, com
// saídas independentes, o modo de layout pela janela disponível, os efeitos, a carga de trabalho e o
// orçamento de memória. Nunca pela marca ou pelo processador: pela área útil, pela escala do texto, pelo
// que o sistema informa e pelo desempenho medido pelo próprio app (installFrameBudget, motion/index.js).
// Telas não decidem nada disso por conta própria: leem html[data-window|data-height|data-effects|
// data-workload] ou window.TerritorioAdaptation.policy().

// Janela (px de CSS ≈ dp no Android). As classes 600/840 dp e a altura de 480 dp são do Android; a
// subfaixa abaixo de 360 dp é decisão do produto.
export function layoutModeFor(width) {
  if (!(width > 0)) return 'compact';
  if (width < 360) return 'narrow';
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  return 'expanded';
}

export function computePolicy({ width, height, fontScale = 1, lite = false, frameBudgetLite = false, reduceEffects = false,
  reduceMotion = false, saveData = false } = {}) {
  let layoutMode = layoutModeFor(width);
  // Texto ampliado numa janela compacta ocupa o espaço de uma janela estreita.
  if (layoutMode === 'compact' && fontScale >= 1.3 && width < 400) layoutMode = 'narrow';
  const heightMode = height > 0 && height < 480 ? 'compact' : 'regular';
  const effectsMode = reduceEffects || reduceMotion ? 'reduced' : lite ? 'light' : 'full';
  const workloadMode = lite || saveData ? 'light' : 'standard';
  const reasons = [];
  if (reduceEffects) reasons.push('user-reduce-effects');
  if (reduceMotion) reasons.push('system-reduce-motion');
  if (frameBudgetLite) reasons.push('measured-frames');
  else if (lite) reasons.push('hardware-or-system');
  if (saveData) reasons.push('save-data');
  if (layoutMode === 'narrow') reasons.push('narrow-window');
  if (heightMode === 'compact') reasons.push('short-window');
  return {
    layoutMode, heightMode, effectsMode, workloadMode,
    // Metas iniciais propostas pela diretriz, a calibrar: cache de imagens e tarefas pesadas simultâneas.
    imageCacheBudget: workloadMode === 'light' ? 12 : 32,
    heavyTaskConcurrency: workloadMode === 'light' ? 1 : 2,
    reasonCode: reasons.length ? reasons.join('+') : 'full',
  };
}

// Leitura do ambiente real e publicação da política. Recalcula em mudança de janela (rotação, tela
// dividida) e de efeitos; enquanto se digita, a altura que o teclado tira não muda o modo da tela.
export function installAdaptation() {
  const root = document.documentElement;
  let tallest = innerHeight, current = null, frame = 0;
  const motion = () => window.TerritorioMotion?.diagnostics?.() || {};
  const typing = () => !!document.activeElement?.matches?.('input, textarea, [contenteditable="true"]');
  const read = () => {
    if (!typing()) tallest = innerHeight; else tallest = Math.max(tallest, innerHeight);
    const fontScale = (parseFloat(getComputedStyle(root).fontSize) || 16) / 16 * (root.classList.contains('large-text') || root.dataset.largeText === 'true' ? 1.15 : 1);
    return computePolicy({
      width: innerWidth, height: tallest, fontScale,
      lite: root.classList.contains('lite'), frameBudgetLite: /lite/.test(motion().frameBudget?.state || '') && !/hardware/.test(motion().frameBudget?.state || ''),
      reduceEffects: root.dataset.reduceEffects === 'true', reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      saveData: !!(navigator.connection && navigator.connection.saveData),
    });
  };
  const apply = () => {
    frame = 0;
    const next = read();
    if (current && JSON.stringify(current) === JSON.stringify(next)) return;
    current = next;
    root.dataset.window = next.layoutMode;
    root.dataset.height = next.heightMode;
    root.dataset.effects = next.effectsMode;
    root.dataset.workload = next.workloadMode;
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(apply); };
  addEventListener('resize', queue, { passive: true });
  new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['class', 'data-reduce-effects', 'data-large-text'] });
  apply();
  window.TerritorioAdaptation = Object.freeze({ policy: () => current || read() });
  return () => current;
}
