import { connection } from "next/server"

import { ActivityCard } from "@/components/activities/activity-card"
import { getActivities } from "@/lib/activities"
import { cn } from "@/lib/utils"

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm font-medium">아직 등록된 활동이 없습니다</p>
      <p className="mt-1 text-[0.8125rem] text-muted-foreground">
        첫 활동을 기록하면 이곳에 최신순으로 쌓입니다.
      </p>
    </div>
  )
}

/**
 * Server Component that loads every activity (newest first) and renders each
 * one as an {@link ActivityCard}.
 *
 * It awaits Supabase during render, so wrap it in `<Suspense>` — or give the
 * route a `loading.tsx` — to stream the rest of the page while it loads.
 */
async function ActivityList({ className }: { className?: string }) {
  // Without this the query runs during `next build` and the result is baked
  // into static HTML, so newly registered activities would never show up.
  await connection()

  const activities = await getActivities()

  if (activities.length === 0) {
    return <EmptyState />
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

export { ActivityList }
