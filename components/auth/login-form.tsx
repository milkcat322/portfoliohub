"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { AUTH_NETWORK_ERROR, describeAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

/**
 * Email + password login against Supabase.
 *
 * On success it refreshes the router so the Server Components re-render with
 * the new session cookie before navigating.
 */
function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(describeAuthError(signInError.message))
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError(AUTH_NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <AuthField
        id="email"
        label="이메일"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="name@school.kr"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <AuthField
        id="password"
        label="비밀번호"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        action={
          <Link
            href="/login"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        }
      />

      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-1 h-10 w-full rounded-xl text-sm"
      >
        {submitting ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  )
}

export { LoginForm }
