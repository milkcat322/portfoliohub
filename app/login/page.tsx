import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Logo } from "@/components/layout/logo"
import { safeRedirectPath } from "@/lib/navigation"

export const metadata: Metadata = {
  title: "로그인 · PortfolioHub",
  description: "PortfolioHub에 로그인해 나의 활동 기록을 관리하세요.",
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { redirectTo: redirectValue, authError } = await searchParams
  const redirectTo = safeRedirectPath(redirectValue)

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />

      <AuthCard
        title="다시 만나서 반가워요"
        description="이메일로 로그인하고 나의 포트폴리오를 이어서 작성하세요."
        footer={
          <span>
            아직 계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              회원가입
            </Link>
          </span>
        }
      >
        {authError ? (
          <p role="alert" className="mb-4 text-[0.8125rem] text-destructive">
            {authError === "provider_denied"
              ? "Google 또는 GitHub 인증이 취소되었거나 거부되었습니다."
              : authError === "missing_code"
                ? "인증 서버에서 로그인 코드를 받지 못했습니다. Supabase Redirect URL 설정을 확인해 주세요."
                : "로그인 세션을 만들지 못했습니다. 다시 시도해 주세요. 계속되면 관리자에게 알려 주세요."}
          </p>
        ) : null}

        <LoginForm redirectTo={redirectTo} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <SocialAuthButtons redirectTo={redirectTo} />
      </AuthCard>
    </main>
  )
}
