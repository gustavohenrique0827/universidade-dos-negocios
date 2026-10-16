import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

function criar(): SupabaseClient {
  if (import.meta.env.VITE_DEMO === 'true') return createDemoClient() as unknown as SupabaseClient
  if (!url || !anon) throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  return createClient(url, anon)
}

export const supabase = criar()
