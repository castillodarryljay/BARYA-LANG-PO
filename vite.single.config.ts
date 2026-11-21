import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

/**
 * Single-file build configuration (`npm run build:single`).
 * Outputs one completely self-contained `dist-single/index.html` with JS, CSS,
 * bundled fonts, story JSON, and pixel-art generators inlined so it works
 * directly via double-clicking (`file://`) with zero internet connection.
 */
const stubPwaRegisterPlugin = {
  name: 'stub-pwa-register-singlefile',
  resolveId(id: string) {
    if (id === 'virtual:pwa-register') return '\0virtual:pwa-register';
    return null;
  },
  load(id: string) {
    if (id === '\0virtual:pwa-register') {
      return `export function registerSW(opts) { if (opts && opts.onOfflineReady) opts.onOfflineReady(); return () => {}; }`;
    }
    return null;
  },
};

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [stubPwaRegisterPlugin, react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
