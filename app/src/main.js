import legacyCss from './legacy/app.css?raw';
import './fonts.css';
import './shell.css';
import './layout-feira.css';
import './fit.css';
import './motion.css';
import './polish.css';
import './glass.css';
import './selling-grid.css';
import './interface-refinements.css';
import { installFluidMotion, getMotionDiagnostics } from './features/motion/index.js';
import { installNavIconMotion } from './features/motion/nav-icons.js';
import { installSectionMotion } from './features/motion/sections.js';
import './features/motion/sections.css';
import { installInterface } from './features/interface.js';
import { installMultiSell } from './features/multisell.js';
import { arrangeSalesProducts, installSalesOrganization } from './features/sales-order.js';
import './features/sales-order.css';
import './features/multisell.css';
import { version } from '../package.json';
import './features/portfolio.css';
import './features/backup.css';
import './features/portfolio.js';
import './features/backup.js';
import './features/advisor/index.js';
import { MARKET_CATALOG } from './data/market-catalog.js';
import * as ProductCatalog from './features/product-catalog.js';
import * as StockOrder from './features/stock-order.js';
import { catalogReference, isCatalogQuestion } from './features/advisor/catalog-vocabulary.js';
import { CATALOG_KNOWLEDGE } from './data/catalog-knowledge.js';
import { INTERFACE_GUIDELINES } from './data/interface-guidelines.js';
import { VOICE_GUIDELINES } from './data/voice-guidelines.js';
import * as SalesPresentation from './features/sales-presentation.js';
import { installGlassTouch } from './features/glass-touch.js';
import { installLocalCatalog } from './features/local-catalog/index.js';
import './features/local-catalog/catalog.css';
import './glass-system.css';
import { installAgent } from './features/agent/index.js';
import { installWorkflows } from './features/workflows/index.js';
import './features/workflows/workflows.css';
import { installWeather, eventWeather } from './features/weather/index.js';
import './features/weather/weather.css';
import { installStore } from './features/store/index.js';
import './features/store/store.css';

import { ENGAGEMENT_GUIDELINES } from './data/engagement-guidelines.js';
import './features/product-stock.css';
import * as Finance from './features/finance/finance.js';
import { runAudit } from './features/finance/audit.js';
import { API } from './features/server.js';
import * as FairReport from './features/fair-report.js';
import * as FairSurplus from './features/fair-surplus.js';
import * as EventPreparation from './features/event-preparation.js';
import './features/event-preparation.css';
import './features/client-surfaces.css';
import './features/day-summary.css';
import './features/privacy.css';
import * as DaySummary from './features/day-summary.js';
import * as ProductPeriodReports from './features/product-period-reports.js';
import './features/product-period-reports.css';
import './features/fair-surplus-ui.js';
import './dialog-system.css';
import profilePhoto from './assets/profile.webp';
import appLogo from './assets/logo.png';
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
  window.TERRITORIO_ASSETS = { profilePhoto, catalogPhotos, appLogo };
  window.TERRITORIO_MARKET = MARKET_CATALOG;
  window.TerritorioProductCatalog = ProductCatalog;
  window.TerritorioStockOrder = StockOrder;
  window.TerritorioSalesPresentation = SalesPresentation;
  window.TerritorioArrangeSales = arrangeSalesProducts;
  window.TerritorioWeather = {eventWeather};
  window.TerritorioCatalogReference = {catalogReference,isCatalogQuestion};
  window.TerritorioCatalogKnowledge = CATALOG_KNOWLEDGE;
  window.TerritorioInterfaceGuidelines = INTERFACE_GUIDELINES;
  window.TerritorioEngagementGuidelines = ENGAGEMENT_GUIDELINES;
  window.TerritorioVoiceGuidelines = VOICE_GUIDELINES;
  window.TerritorioFinance = { ...Finance, runAudit };
  window.TerritorioFairReport = FairReport;
  window.TerritorioFairSurplus = FairSurplus;
  window.TerritorioEventPreparation = EventPreparation;
  window.TerritorioDaySummary = DaySummary;
  window.TerritorioProductPeriodReports = ProductPeriodReports;
  window.TERRITORIO_VERSION = version;
  window.TERRITORIO_API = API;
  await import('./legacy/erp-ui.js');
  const savedModel = window.ERPPreview?.model?.();
  if (savedModel?.productNamesNormalized || savedModel?.productMemoryInitialized || savedModel?.catalogKnowledgeInstalled || savedModel?.interfaceGuidelinesInstalled || savedModel?.stockCatalogGuidelinesInstalled || savedModel?.engagementGuidelinesInstalled || savedModel?.voiceGuidelinesInstalled) {
    window.ERPPreview.persist?.();
    if (window.TerritorioNative?.isNative) await window.TerritorioNative.durable?.();
  }
  installAgent();

  installFluidMotion();
  window.TerritorioMotion = Object.freeze({diagnostics:getMotionDiagnostics});
  installNavIconMotion();
  installInterface();
  installSectionMotion();
  installSalesOrganization();
  installMultiSell();
  installWorkflows();
  installWeather();
  installStore();
  installLocalCatalog();
  installGlassTouch();
  installShell();
} catch (error) {
  // Never leave the seller stuck on the splash screen.
  console.error(error);
  SplashScreen.hide().catch(() => {});
  document.getElementById('app').innerHTML =
    '<section class="panel" style="margin-top:40px"><h2>Não foi possível abrir o AGRO Gestão</h2>' +
    '<p class="muted">Seus dados continuam guardados no aparelho. Feche e abra o app novamente.</p></section>';
}
