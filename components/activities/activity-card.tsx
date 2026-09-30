import type { Activity } from "@/lib/activities"

import { Badge } from "@/components/ui/badge"
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
    return `${start} —`
  }

  if (endDate === startDate) {
    return start
  }

  return `${start} – ${formatDate(endDate)}`
}

/** Presentational tile for one activity. */
function ActivityCard({
  activity,
  className,
}: {
  activity: Activity
  className?: string
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl py-5 ring-border transition-shadow hover:shadow-sm",
        className
      )}
    >
      <CardHeader className="gap-2 px-5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[0.9375rem] tracking-tight text-balance">
            {activity.title}
          </CardTitle>
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {activity.category}
          </Badge>
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

export { ActivityCard }
