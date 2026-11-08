import Link from "next/link"
import { redirect } from "next/navigation"

import { ReportView } from "@/app/dashboard/report/ReportView"
import { getActivities } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export default async function ReportPage() {
  const supabase = await createClient()
  const [userResult, activities] = await Promise.all([
    supabase.auth.getUser(),
    getActivities(supabase),
  ])
  const user = userResult.data.user

  if (!user) {
    redirect("/login?redirectTo=/dashboard/report")
  }

  // OAuth providers fill `full_name` or `name`; fall back to blank so the
  // student types the name they want on the cover.
  const metadata = user.user_metadata as { full_name?: string; name?: string }
  const defaultOwner = metadata.full_name ?? metadata.name ?? ""

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16 print:max-w-none print:p-0">
      <div className="print:hidden">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 대시보드
        </Link>
        <header className="mt-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            포트폴리오 내보내기
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            활동을 요약한 보고서를 PDF로 저장하거나 발표용 PPT로 내려받을 수 있습니다.
          </p>
        </header>
      </div>
      <ReportView activities={activities} defaultOwner={defaultOwner} />
    </main>
  )
}
