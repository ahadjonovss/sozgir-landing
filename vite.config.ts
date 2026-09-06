import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port muhitdan olinadi — tashqi vosita (masalan preview) bergan portda
// ishga tushsin; aks holda odatdagi 5173.
export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.PORT) || 5173 },
});
