// vite.config.js - Vite settings. We only need the React plugin.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // relative paths so the built site works from any folder (e.g. username.github.io/repo)
  server: { port: 5173 }, // must match the origin allowed by CORS in backend/server.js
});
