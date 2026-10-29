"use client"

import * as React from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { AUTH_NETWORK_ERROR, describeAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const redirectTo = new URL("/auth/callback", window.location.origin)
      redirectTo.searchParams.set("next", "/update-password")

      const { error: resetError } = await createClient().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirectTo.toString() }
      )

      if (resetError) {
        setError(describeAuthError(resetError.message))
        return
      }

      setSent(true)
    } catch {
      setError(AUTH_NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="grid gap-3 text-center">
        <p className="text-sm font-medium">비밀번호 재설정 메일을 요청했습니다</p>
        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          해당 이메일로 계정이 있다면 재설정 링크가 전송됩니다. 받은 편지함과
          스팸함을 확인해 주세요.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setSent(false)}
          className="h-9 w-full rounded-xl text-sm"
        >
          다른 이메일로 다시 시도
        </Button>
      </div>
    )
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

      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="h-10 w-full rounded-xl text-sm"
      >
        {submitting ? "전송 중…" : "재설정 메일 보내기"}
      </Button>
    </form>
  )
}
