import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Supabase client for Server Components, Route Handlers and Server Functions.
 *
 * A fresh client must be created per request — never cache or share one, or one
 * visitor's session can leak into another's response.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot write cookies. That is fine: proxy.ts
          // refreshes the session on every request, so the new tokens are
          // already on their way to the browser.
        }
      },
    },
  })
}
