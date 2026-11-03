// vite.config.js - Vite settings. We only need the React plugin.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // relative paths so the built site works from any folder (e.g. username.github.io/repo)
  // strictPort: never silently move to another port, because the Worker only accepts
  // requests from http://localhost:5173 (ALLOWED_ORIGINS in admin-worker/wrangler.toml).
  server: { port: 5173, strictPort: true },
});
