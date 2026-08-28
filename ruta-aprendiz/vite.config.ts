import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match where the bundle is hosted under the Next.js /public dir
// so index.html references /ruta-aprendiz/assets/* correctly.
export default defineConfig({
  base: '/ruta-aprendiz/',
  plugins: [react()],
  server: { port: 5173, host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
