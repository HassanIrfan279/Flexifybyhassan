import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = resolve(__dirname, '..');

export default defineConfig({
  root: __dirname,
  publicDir: false,
  resolve: {
    alias: [
      { find: 'wxt/browser', replacement: resolve(__dirname, 'mock-browser.ts') },
      { find: 'wxt/utils/storage', replacement: resolve(__dirname, 'mock-storage.ts') },
      { find: '@', replacement: resolve(root, 'src') },
    ],
  },
  server: {
    port: 5199,
    fs: { allow: [root] },
    // Flex's own stylesheets and icon fonts, served same-origin so fonts aren't blocked by CORS.
    proxy: { '/Assets': { target: 'https://flexstudent.nu.edu.pk', changeOrigin: true, secure: true } },
  },
  plugins: [
    svelte(),
    {
      name: 'serve-fixtures',
      configureServer(server) {
        server.middlewares.use('/icon.svg', async (_req, res) => {
          const { readFile } = await import('node:fs/promises');
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(await readFile(resolve(root, 'assets/icon.svg')));
        });
        server.middlewares.use('/fixtures', async (req, res) => {
          const { readFile } = await import('node:fs/promises');
          const file = resolve(root, 'fixtures', (req.url ?? '').replace(/^\//, '').split('?')[0]!);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await readFile(file));
        });
      },
    },
  ],
});
