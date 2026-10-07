import { connection } from "next/server"

import type { Activity } from "@/lib/activity"

import { DashboardView } from "@/app/dashboard/DashboardView"
import { getActivities } from "@/lib/activity"

export default async function DashboardPage() {
  // Without this the query runs during `next build` and the result is baked
  // into static HTML, so newly registered activities would never show up.
  await connection()

  let activities: Activity[] = []
  let loadError: string | null = null

  try {
    activities = await getActivities()
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "활동 목록을 불러오지 못했습니다."
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          내 포트폴리오
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          활동을 등록하고 관리할 수 있습니다.
        </p>
      </header>

      <DashboardView initialActivities={activities} initialError={loadError} />
    </main>
  )
}
