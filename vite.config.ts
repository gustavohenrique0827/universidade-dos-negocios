import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && env.VITE_DEMO !== 'true' && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('Build interrompido: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example).')
  }
  return { plugins: [react(), tailwindcss()] }
})
