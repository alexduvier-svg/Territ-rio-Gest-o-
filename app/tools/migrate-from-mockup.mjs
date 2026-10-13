// One-time migration: splits ../territorio-gestao-mockup.html into the app's source tree.
// After it runs, src/legacy/* is the source of truth; the mockup stays as a reference.
// Usage: node tools/migrate-from-mockup.mjs [--force]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mockup = resolve(root, '..', 'territorio-gestao-mockup.html');
const out = p => resolve(root, p);
const force = process.argv.includes('--force');

if (existsSync(out('src/legacy/erp-ui.js')) && !force) {
  console.error('src/legacy já existe. Use --force para regenerar a partir do mockup (descarta edições feitas em src/legacy).');
  process.exit(1);
}

const html = readFileSync(mockup, 'utf8');

function block(tagOpen, tagClose) {
  const start = html.indexOf(tagOpen);
  const end = html.indexOf(tagClose, start);
  if (start < 0 || end < 0) throw Error('Bloco não encontrado: ' + tagOpen);
  return html.slice(start + tagOpen.length, end);
}

function replaceOnce(src, find, repl, label) {
  const count = typeof find === 'string' ? src.split(find).length - 1 : (src.match(new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g')) || []).length;
  if (count !== 1) throw Error(`Edição "${label}": esperado 1 ocorrência, encontrado ${count}.`);
  return src.replace(find, repl);
}

function replaceExactly(src, find, repl, expected, label) {
  const count = src.split(find).length - 1;
  if (count !== expected) throw Error(`Edição "${label}": esperado ${expected} ocorrências, encontrado ${count}.`);
  return src.split(find).join(repl);
}

// --- CSS -------------------------------------------------------------------
let css = block('<style>', '</style>');
// Android WebView < 140 reports 0 for env(safe-area-inset-*); Capacitor's SystemBars injects --safe-area-inset-*.
css = css.replace(/env\(safe-area-inset-(top|right|bottom|left)\)/g, 'var(--safe-area-inset-$1,env(safe-area-inset-$1))');

// --- Scripts ---------------------------------------------------------------
const core = block('<script id="erp-core">', '</script>\n<script id="erp-ui">');
let ui = block('<script id="erp-ui">', '</script>\n</body>');

// Embedded photos → separate optimized files.
const photos = {};
ui = ui.replace(/const (PROFILE_PHOTO|CATALOG_PHOTOS)='data:image\/png;base64,([A-Za-z0-9+/=]+)';/g, (m, name, b64) => {
  photos[name] = Buffer.from(b64, 'base64');
  return `const ${name}=window.TERRITORIO_ASSETS.${name === 'PROFILE_PHOTO' ? 'profilePhoto' : 'catalogPhotos'};`;
});
if (Object.keys(photos).length !== 2) throw Error('Fotos embutidas não encontradas.');

// The exported catalog HTML inlines the app stylesheet; it now lives in <style id="legacy-css"> (see src/main.js).
ui = replaceOnce(ui, "document.querySelector('style')", "document.getElementById('legacy-css')", 'CSS do catálogo exportado');

// Storage: on Android the durable file store (src/native/storage.js) is the source of truth.
ui = replaceOnce(ui,
  "let loaded=null;try{loaded=JSON.parse(localStorage.getItem(STORE));",
  "let loaded=null;try{const nativeStore=window.TerritorioNative;loaded=JSON.parse(nativeStore&&nativeStore.isNative?nativeStore.initialJSON:localStorage.getItem(STORE));",
  'leitura inicial');
ui = replaceOnce(ui,
  "function persist(){try{localStorage.setItem(STORE,JSON.stringify(model.data));return true;}catch(e){return false;}}",
  "function persist(){try{const json=JSON.stringify(model.data),nativeStore=window.TerritorioNative;if(nativeStore&&nativeStore.isNative)return nativeStore.save(json);localStorage.setItem(STORE,json);return true;}catch(e){return false;}}",
  'persist');

// Human language: the "Gestão" tab reads as "Resumo" (internal page id is unchanged).
ui = replaceOnce(ui,
  "const escape=v=>",
  "const PAGE_LABELS={'Gestão':'Resumo'},pageLabel=p=>PAGE_LABELS[p]||p;\nconst escape=v=>",
  'rótulos de página');
ui = replaceOnce(ui, "'<span>'+p+'</span>'", "'<span>'+pageLabel(p)+'</span>'", 'rótulo da navegação');
ui = replaceOnce(ui, "(page==='Vender'?'Produtos':page)", "(page==='Vender'?'Produtos':pageLabel(page))", 'título da página');
ui = replaceExactly(ui, "'Ver na Gestão'", "'Ver no Resumo'", 2, 'botão do evento');
ui = replaceExactly(ui, 'continuam na Gestão', 'continuam no Resumo', 2, 'aviso de evento finalizado');
ui = replaceOnce(ui, 'resultado na Gestão', 'resultado no Resumo', 'aviso de evento encerrado');
ui = replaceOnce(ui, 'Estoque e Gestão atualizados', 'Estoque e Resumo atualizados', 'aviso de devolução');

// Hooks for the native shell (back button, keep-awake). Appended inside the UI closure.
const shellHooks = `
window.TerritorioShell={
 page:()=>page,
 // Android back: dismiss the top-most layer, like Esc does on the web. Returns false at the root.
 back(){
  const picker=document.getElementById('date-picker-dialog');
  if(picker&&picker.open){closeDatePicker();return true;}
  if(document.querySelector('#number-pad:not([hidden]),#dialog-number-pad:not([hidden])')){closeNumberPad();return true;}
  if(dialog.open){const cancel=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(cancel)&&dialog.open)dialog.close();return true;}
  const subBack=app.querySelector('.subheader [data-action]');
  if(subBack){subBack.click();return true;}
  if(page!=='Vender'){actions.nav({page:'Vender'});return true;}
  return false;
 }
};
`;
const tail = ui.lastIndexOf('})();');
if (tail < 0) throw Error('Fim do script de interface não encontrado.');
ui = ui.slice(0, tail) + shellHooks + ui.slice(tail);

// --- Shell markup ----------------------------------------------------------
const body = block('<body>\n', '<script id="erp-core">').trim();

// --- Write -----------------------------------------------------------------
for (const dir of ['src/legacy', 'src/assets']) mkdirSync(out(dir), { recursive: true });
writeFileSync(out('src/legacy/app.css'), css.trim() + '\n');
writeFileSync(out('src/legacy/erp-core.js'), '// Migrado de territorio-gestao-mockup.html (script erp-core).\n' + core.trim() + '\n');
writeFileSync(out('src/legacy/erp-ui.js'), '// Migrado de territorio-gestao-mockup.html (script erp-ui).\n' + ui.trim() + '\n');
writeFileSync(out('index.html'), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="format-detection" content="telephone=no">
<title>Território</title>
</head>
<body>
${body}
<script type="module" src="/src/main.js"></script>
</body>
</html>
`);

await sharp(photos.PROFILE_PHOTO).resize({ width: 256, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out('src/assets/profile.webp'));
// The catalog atlas is cropped by CSS offsets and drawn into PDFs; keep its pixel dimensions.
await sharp(photos.CATALOG_PHOTOS).webp({ quality: 84 }).toFile(out('src/assets/catalog.webp'));

console.log('Migração concluída.');
