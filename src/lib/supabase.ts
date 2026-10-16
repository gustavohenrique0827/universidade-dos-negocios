import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Modo demonstração: dados fictícios em memória, sem backend. Só vale quando VITE_DEMO=true
 * E não há chaves do Supabase. Assim que as chaves existem, o site passa sozinho ao modo real.
 */
export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true' && !(url && anon)

function criar(): SupabaseClient {
  if (MODO_DEMO) return createDemoClient() as unknown as SupabaseClient
  if (!url || !anon) throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  return createClient(url, anon)
}

export const supabase = criar()
