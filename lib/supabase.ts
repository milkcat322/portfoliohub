import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Reads a required public env var.
 *
 * The `process.env.NEXT_PUBLIC_*` reference has to be passed in as a full
 * static literal by the caller — Next.js inlines those at build time and does
 * not inline dynamic lookups like `process.env[name]`.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} 환경 변수가 없습니다. .env.local에 값을 추가한 뒤 개발 서버를 다시 시작하세요.`
    )
  }

  return value
}

const supabaseUrl = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
)

const supabaseAnonKey = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Shared Supabase client for the browser.
 *
 * The anon key is public by design — row level security on the Supabase side is
 * what actually protects the data, so never rely on hiding this key.
 *
 * The session lives in browser storage, which means this client is only
 * authenticated inside Client Components. Server Components, Route Handlers and
 * Proxy need a cookie-based client from `@supabase/ssr` instead; add that when
 * auth is wired up.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
)
