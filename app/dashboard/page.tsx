import { redirect } from "next/navigation"

import type { Activity } from "@/lib/activity"

import { DashboardView } from "@/app/dashboard/DashboardView"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { getActivities } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  // Reading cookies already opts this route into dynamic rendering, so the
  // list is never baked into a static build.
  const supabase = await createClient()

  // proxy.ts does an optimistic cookie check; this verifies the session with
  // the auth server before anything is rendered.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/dashboard")
  }

  let activities: Activity[] = []
  let loadError: string | null = null

  try {
    activities = await getActivities(supabase)
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "활동 목록을 불러오지 못했습니다."
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            내 포트폴리오
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.email}님의 활동을 등록하고 관리할 수 있습니다.
          </p>
        </div>

        <SignOutButton className="h-9 w-full shrink-0 rounded-full px-4 text-sm sm:w-auto" />
      </header>

      <DashboardView initialActivities={activities} initialError={loadError} />
    </main>
  )
}
