import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { safeRedirectPath } from "@/lib/navigation"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error")
  const code = request.nextUrl.searchParams.get("code")
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next") ?? undefined)
  const loginUrl = new URL("/login", request.url)

  if (providerError) {
    loginUrl.searchParams.set("authError", "provider_denied")
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    loginUrl.searchParams.set("authError", "missing_code")
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.redirect(new URL(next, request.url))
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        }

        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value)
        }
      },
    }
  })

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }

    console.error("OAuth callback code exchange failed:", error.message)
  } catch (error) {
    console.error("OAuth callback failed unexpectedly:", error)
  }

  loginUrl.searchParams.set("authError", "code_exchange_failed")
  response.headers.set("Location", loginUrl.toString())
  return response
}
