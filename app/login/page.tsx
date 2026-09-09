import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Logo } from "@/components/layout/logo"

export const metadata: Metadata = {
  title: "로그인 · PortfolioHub",
  description: "PortfolioHub에 로그인해 나의 활동 기록을 관리하세요.",
}

export default function LoginPage() {
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
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              회원가입
            </Link>
          </span>
        }
      >
        <LoginForm />

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
