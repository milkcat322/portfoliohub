import Link from "next/link"
import { redirect } from "next/navigation"

import { TimelineView } from "@/app/dashboard/timeline/TimelineView"
import { getActivities } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export default async function TimelinePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/dashboard/timeline")
  }

  const activities = await getActivities(supabase)

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 대시보드
      </Link>
      <header className="mt-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          활동 타임라인
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          시작일을 기준으로 활동을 연도별로 정리했습니다.
        </p>
      </header>
      <TimelineView activities={activities} />
    </main>
  )
}
