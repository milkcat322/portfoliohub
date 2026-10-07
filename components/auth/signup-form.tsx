"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthField } from "@/components/auth/auth-field"
import { Button, buttonVariants } from "@/components/ui/button"
import { AUTH_NETWORK_ERROR, describeAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/** Supabase rejects anything shorter than this by default. */
const MIN_PASSWORD_LENGTH = 6

/**
 * Email + password signup.
 *
 * When the project has email confirmation switched on, `signUp` returns no
 * session — the user has to click the link in their inbox first. That case is
 * reported instead of pretending the signup failed.
 */
export function SignupForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [sentTo, setSentTo] = React.useState<string | null>(null)
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
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        setError(describeAuthError(signUpError.message))
        return
      }

      if (!data.session) {
        // The project has email confirmation on, so signing up does not sign
        // the user in. Without an obvious hand-off the screen looks unchanged
        // and the signup feels like it did nothing.
        setSentTo(email.trim())
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

  // Replacing the form outright makes the outcome impossible to miss, which a
  // small line of helper text underneath it was not.
  if (sentTo) {
    return (
      <div role="status" className="grid gap-3 text-center">
        <p className="text-sm font-medium">가입 확인 메일을 보냈습니다</p>
        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{sentTo}</span> 으로 보낸
          메일의 링크를 눌러 인증을 완료한 뒤 로그인해 주세요. 메일이 보이지
          않으면 스팸함도 확인해 보세요.
        </p>

        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-2 h-10 w-full rounded-xl text-sm"
          )}
        >
          로그인하러 가기
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setSentTo(null)}
          className="h-9 w-full rounded-xl text-sm"
        >
          다른 이메일로 가입하기
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

      <AuthField
        id="password"
        label="비밀번호"
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
        label="비밀번호 확인"
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
        className="mt-1 h-10 w-full rounded-xl text-sm"
      >
        {submitting ? "가입 중…" : "회원가입"}
      </Button>
    </form>
  )
}
