import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only. In production the client is deployed separately and talks to
    // the API directly via VITE_API_URL.
    proxy: { '/api': process.env.VITE_DEV_API || 'http://localhost:4000' },
  },
});
