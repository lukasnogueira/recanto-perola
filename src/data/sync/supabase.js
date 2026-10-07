import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && anonKey)

let cliente = null

export function obterCliente() {
  if (!supabaseConfigurado) return null
  if (!cliente) {
    cliente = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return cliente
}

export async function garantirSessao(supabase) {
  const { data } = await supabase.auth.getSession()
  if (data?.session) return data.session
  const { data: anonima, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return anonima.session
}
