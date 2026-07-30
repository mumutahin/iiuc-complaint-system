import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    fs: {
      // Allow the dev server to read ../shared/*.js (outside this
      // project's own root). Without this, Vite's dev server refuses
      // to serve files outside its root for security reasons — this
      // has NO effect on `vite build`, which resolves the module graph
      // normally regardless of fs.allow.
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
