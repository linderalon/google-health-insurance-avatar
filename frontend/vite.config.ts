import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: HTTPS is required for WebRTC in production (non-localhost).
// For local development, browsers treat `localhost` as a Secure Context
// automatically — so HTTP works fine here and avoids self-signed cert warnings.
// Add basicSsl() and https:true only when testing on a non-localhost hostname.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
