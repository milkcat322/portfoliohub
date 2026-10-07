import type { Activity } from "@/lib/activity"

import { ActivityCard } from "@/components/activity/ActivityCard"
import { cn } from "@/lib/utils"

export type ActivityListProps = {
  activities: Activity[]
  /** Passed through to each card; omit to hide the edit button. */
  onEdit?: (activity: Activity) => void
  /** Passed through to each card; omit to hide the delete button. */
  onDelete?: (activity: Activity) => void
  /** Shown instead of the grid when `activities` is empty. */
  emptyMessage?: string
  className?: string
}

/**
 * Renders a list of activities as {@link ActivityCard}s.
 *
 * Purely presentational — the caller owns the data, so the same list works
 * with Supabase rows, filtered results, or fixtures.
 */
export function ActivityList({
  activities,
  onEdit,
  onDelete,
  emptyMessage = "등록된 활동이 없습니다.",
  className,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
