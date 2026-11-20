import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function patchBrowserFetchPolyfill() {
  const pattern = /\bthis\.fetch\s*=\s*(?:false|!1)\b/g;
  return {
    name: 'patch-browser-fetch-polyfill',
    transform(code: string, id: string) {
      if (!id.includes('node_modules') || !code.includes('this.fetch')) {
        return null;
      }
      if (!pattern.test(code)) {
        return null;
      }
      pattern.lastIndex = 0;
      return {
        code: code.replace(
          pattern,
          'Object.defineProperty(this,"fetch",{value:false,writable:true,configurable:true,enumerable:true})'
        ),
        map: null,
      };
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      patchBrowserFetchPolyfill(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    optimizeDeps: {
      rolldownOptions: {
        plugins: [patchBrowserFetchPolyfill()],
      },
    },
    resolve: {
      alias: [
        {
          find: /^wagmi\/connectors$/,
          replacement: path.resolve(__dirname, 'src/lib/wagmiConnectors.ts'),
        },
        {
          find: /^@wagmi\/connectors$/,
          replacement: path.resolve(__dirname, 'src/lib/wagmiConnectors.ts'),
        },
        {
          find: '@wagmi-walletconnect-raw',
          replacement: path.resolve(
            __dirname,
            'node_modules/@wagmi/connectors/dist/esm/walletConnect.js'
          ),
        },
        {
          find: '@wagmi-safe-raw',
          replacement: path.resolve(
            __dirname,
            'node_modules/@wagmi/connectors/dist/esm/safe.js'
          ),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '.'),
        },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
