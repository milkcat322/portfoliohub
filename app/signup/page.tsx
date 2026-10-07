import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { SignupForm } from "@/components/auth/signup-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Logo } from "@/components/layout/logo"
import { safeRedirectPath } from "@/lib/navigation"

export const metadata: Metadata = {
  title: "회원가입 · PortfolioHub",
  description: "PortfolioHub 계정을 만들고 나의 활동을 기록해 보세요.",
}

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const redirectTo = safeRedirectPath((await searchParams).redirectTo)

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />

      <AuthCard
        title="PortfolioHub 시작하기"
        description="이메일로 계정을 만들고 활동 기록을 시작하세요."
        footer={
          <span>
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              로그인
            </Link>
          </span>
        }
      >
        <SignupForm redirectTo={redirectTo} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <SocialAuthButtons />
      </AuthCard>
    </main>
  )
}
