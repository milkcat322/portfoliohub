import { createBrowserClient } from "@supabase/ssr"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Supabase client for Client Components.
 *
 * Unlike plain `@supabase/supabase-js`, this stores the session in cookies, so
 * the server can read it too. `createBrowserClient` is a singleton, so calling
 * this repeatedly returns the same instance.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
