import Link from "next/link"
import { redirect } from "next/navigation"

import { StatisticsCharts } from "@/app/dashboard/statistics/StatisticsCharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getActivities } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export default async function StatisticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/dashboard/statistics")
  }

  const activities = await getActivities(supabase)
  const categories = new Map<string, number>()
  const years = new Map<string, number>()

  for (const activity of activities) {
    categories.set(
      activity.category,
      (categories.get(activity.category) ?? 0) + 1
    )
    const year = activity.start_date.slice(0, 4)
    years.set(year, (years.get(year) ?? 0) + 1)
  }

  const categoryData = [...categories.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count)
  const yearData = [...years.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((left, right) => left.year.localeCompare(right.year))
  const favoriteCount = activities.filter((activity) => activity.favorite).length

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
          활동 통계
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          지금까지 기록한 활동을 한눈에 살펴보세요.
        </p>
      </header>

      <section
        className="mt-8 grid gap-3 sm:grid-cols-3"
        aria-label="활동 요약"
      >
        <Card className="rounded-2xl ring-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              전체 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {activities.length}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                개
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl ring-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {categories.size}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                개
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl ring-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              즐겨찾기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {favoriteCount}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                개
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <StatisticsCharts categoryData={categoryData} yearData={yearData} />
    </main>
  )
}
