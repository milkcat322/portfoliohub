import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Logo } from "@/components/layout/logo"

export const metadata: Metadata = {
  title: "비밀번호 재설정 · PortfolioHub",
  description: "이메일로 비밀번호 재설정 링크를 받으세요.",
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />

      <AuthCard
        title="비밀번호를 재설정할게요"
        description="계정에 등록한 이메일을 입력하면 재설정 링크를 보내드립니다."
        footer={
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </main>
  )
}
