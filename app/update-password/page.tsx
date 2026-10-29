import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-card"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { Logo } from "@/components/layout/logo"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "새 비밀번호 설정 · PortfolioHub",
  description: "계정에 사용할 새 비밀번호를 설정하세요.",
}

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?authError=code_exchange_failed")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />

      <AuthCard
        title="새 비밀번호 설정"
        description="계정에서 사용할 새 비밀번호를 입력해 주세요."
        footer={
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        }
      >
        <UpdatePasswordForm />
      </AuthCard>
    </main>
  )
}
