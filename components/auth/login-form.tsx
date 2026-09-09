"use client"

import * as React from "react"
import Link from "next/link"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"

/**
 * Email + password login form.
 *
 * Auth is not wired up yet: submitting only reports the collected values
 * through `onSubmit` so the eventual auth call can be dropped in from outside.
 */
function LoginForm({
  onSubmit,
}: {
  onSubmit?: (values: { email: string; password: string }) => void
}) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit?.({ email, password })
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

      <Button
        type="submit"
        size="lg"
        className="mt-1 h-10 w-full rounded-xl text-sm"
      >
        로그인
      </Button>
    </form>
  )
}

export { LoginForm }
