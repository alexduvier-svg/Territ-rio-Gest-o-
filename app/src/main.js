import legacyCss from './legacy/app.css?raw';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import './shell.css';
import './layout-feira.css';
import './features/portfolio.css';
import './features/backup.css';
import './features/portfolio.js';
import './features/backup.js';
import './features/advisor/index.js';
import { MARKET_CATALOG } from './data/market-catalog.js';
import profilePhoto from './assets/profile.webp';
import catalogPhotosUrl from './assets/catalog.webp';
import './legacy/erp-core.js';
import { initStorage } from './native/storage.js';
import { installShell } from './native/shell.js';
import { SplashScreen } from '@capacitor/splash-screen';

// The legacy stylesheet goes in a real <style>: the catalog export copies it into the shared HTML file.
const style = document.createElement('style');
style.id = 'legacy-css';
style.textContent = legacyCss;
document.head.prepend(style);

// The catalog atlas is embedded in exported HTML/PDF files, which must work outside the app.
async function toDataURL(url) {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

try {
  const [catalogPhotos] = await Promise.all([toDataURL(catalogPhotosUrl), initStorage()]);
  window.TERRITORIO_ASSETS = { profilePhoto, catalogPhotos };
  window.TERRITORIO_MARKET = MARKET_CATALOG;
  await import('./legacy/erp-ui.js');
  installShell();
} catch (error) {
  // Never leave the seller stuck on the splash screen.
  console.error(error);
  SplashScreen.hide().catch(() => {});
  document.getElementById('app').innerHTML =
    '<section class="panel" style="margin-top:40px"><h2>Não foi possível abrir o Território</h2>' +
    '<p class="muted">Seus dados continuam guardados no aparelho. Feche e abra o app novamente.</p></section>';
}
