import { NextResponse, type NextRequest } from "next/server"

import { safeRedirectPath } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next") ?? undefined)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("authError", "callback_failed")
  return NextResponse.redirect(loginUrl)
}
