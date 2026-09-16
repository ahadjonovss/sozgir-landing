import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { prerender } from './vite/prerender.ts'

// https://vite.dev/config/
export default defineConfig({
  // `prerender` — build tugagach har manzilga o'z HTML fayli va
  // `sitemap.xml` yasaydi; sababi `vite/prerender.ts` da yozilgan.
  plugins: [react(), prerender()],
})
