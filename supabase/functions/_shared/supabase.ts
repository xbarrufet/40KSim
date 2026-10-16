import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  client = createClient(url, key)
  return client
}
