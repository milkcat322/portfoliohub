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

export const SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
)

export const SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
