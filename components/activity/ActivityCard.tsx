import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"

import type { Activity } from "@/lib/activity"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Formats a `date` column (`YYYY-MM-DD`) for display.
 *
 * Done with string splitting rather than `new Date()` on purpose: parsing a
 * bare date string treats it as UTC, which shifts the day backwards for
 * viewers behind UTC.
 */
function formatDate(value: string) {
  const [year, month, day] = value.split("-")
  return `${year}.${month}.${day}`
}

function formatPeriod(startDate: string, endDate: string | null) {
  const start = formatDate(startDate)

  if (!endDate) {
    return `${start} — 진행 중`
  }

  if (endDate === startDate) {
    return start
  }

  return `${start} – ${formatDate(endDate)}`
}

export type ActivityCardProps = {
  activity: Activity
  /** Omit to hide the edit button. */
  onEdit?: (activity: Activity) => void
  /** Omit to hide the delete button. */
  onDelete?: (activity: Activity) => void
  className?: string
}

/**
 * Presentational tile for one activity.
 *
 * Takes the row shape straight from the `activities` table, so a Supabase row
 * can be handed over without mapping. The action buttons appear only when the
 * matching handler is supplied, which keeps the card usable in read-only
 * places too.
 */
export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  className,
}: ActivityCardProps) {
  const hasActions = Boolean(onEdit || onDelete)

  return (
    <Card
      className={cn(
        "h-full gap-0 rounded-2xl py-5 ring-border transition-shadow hover:shadow-sm",
        className
      )}
    >
      <CardHeader className="gap-2 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <CardTitle className="text-[0.9375rem] tracking-tight text-balance">
              {activity.title}
            </CardTitle>
            <Badge variant="secondary" className="w-fit">
              {activity.category}
            </Badge>
          </div>

          {hasActions ? (
            <div className="flex shrink-0 items-center gap-0.5">
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${activity.title} 수정`}
                  title="수정"
                  onClick={() => onEdit(activity)}
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} />
                </Button>
              ) : null}

              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${activity.title} 삭제`}
                  title="삭제"
                  onClick={() => onDelete(activity)}
                  className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground tabular-nums">
          {formatPeriod(activity.start_date, activity.end_date)}
        </p>

        {activity.description ? (
          <CardDescription className="mt-1 text-[0.8125rem] leading-relaxed whitespace-pre-line">
            {activity.description}
          </CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  )
}
