import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for server-only code with no user session (webhooks,
// admin-triggered payouts). Bypasses RLS -- never import this from
// client-facing code or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
