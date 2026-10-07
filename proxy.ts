import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/** Routes that require a signed-in user, including anything nested under them. */
const PROTECTED_PREFIXES = ["/dashboard"]

/** Routes that make no sense once signed in. */
const AUTH_ONLY_PATHS = ["/login", "/signup"]

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Carries any refreshed auth cookies over onto a redirect response. */
function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url)

  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie)
  }

  return redirect
}

/**
 * Refreshes the Supabase session on every request and gates the protected
 * routes.
 *
 * This is an optimistic check only — it keeps signed-out visitors out of the
 * dashboard UI. The real guarantee comes from row level security in the
 * database plus the `getUser()` check inside the dashboard page.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }

        response = NextResponse.next({ request })

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }

        // Responses that set auth cookies must not be cached by a CDN, or one
        // visitor's token could be served to another.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value)
        }
      },
    },
  })

  let signedIn = false

  try {
    // Has to run before the response is finalised, otherwise refreshed tokens
    // never reach the Set-Cookie headers written in `setAll` above.
    const { data } = await supabase.auth.getClaims()
    signedIn = Boolean(data?.claims?.sub)
  } catch {
    // Supabase unreachable — treat the visitor as signed out rather than
    // failing the whole request.
  }

  const { pathname } = request.nextUrl

  if (!signedIn && isProtected(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("redirectTo", pathname)
    return redirectWithCookies(url, response)
  }

  if (signedIn && AUTH_ONLY_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static files. Auth cookies have
     * to be refreshed on normal page requests, not on asset fetches.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
