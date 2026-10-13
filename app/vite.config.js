import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    // Top-level await in src/main.js; Android System WebView is evergreen.
    target: 'es2022',
    // Inline nothing: the catalog atlas is read back as a data URL at start-up.
    assetsInlineLimit: 0,
  },
});
