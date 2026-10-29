"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { AUTH_NETWORK_ERROR, describeAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"

const MIN_PASSWORD_LENGTH = 6

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`)
      return
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.")
      return
    }

    setSubmitting(true)

    try {
      const { error: updateError } = await createClient().auth.updateUser({
        password,
      })

      if (updateError) {
        setError(describeAuthError(updateError.message))
        return
      }

      router.replace("/dashboard")
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
        id="password"
        label="새 비밀번호"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <AuthField
        id="password-confirm"
        label="새 비밀번호 확인"
        type="password"
        name="passwordConfirm"
        autoComplete="new-password"
        placeholder="••••••••"
        value={passwordConfirm}
        onChange={(event) => setPasswordConfirm(event.target.value)}
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
        {submitting ? "변경 중…" : "비밀번호 변경"}
      </Button>
    </form>
  )
}
