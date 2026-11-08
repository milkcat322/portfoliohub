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
import { ActivityImagePreview } from "@/components/activity/ActivityImagePreview"
import { Markdown } from "@/components/activity/Markdown"

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
  /** Omit to show a read-only favorite indicator. */
  onToggleFavorite?: (activity: Activity) => void
  /** Makes tag chips clickable, e.g. to filter the list by that tag. */
  onTagClick?: (tag: string) => void
  /** Highlights the tag currently used as a filter. */
  activeTag?: string | null
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
  onToggleFavorite,
  onTagClick,
  activeTag = null,
  className,
}: ActivityCardProps) {
  const hasActions = Boolean(onEdit || onDelete || onToggleFavorite)

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

          {hasActions || activity.favorite ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${activity.title} 즐겨찾기 ${activity.favorite ? "해제" : "추가"}`}
                aria-pressed={activity.favorite}
                title={activity.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                disabled={!onToggleFavorite}
                onClick={() => onToggleFavorite?.(activity)}
                className={cn(
                  "rounded-lg",
                  activity.favorite
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span aria-hidden="true">{activity.favorite ? "⭐" : "☆"}</span>
              </Button>

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

        {activity.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="태그">
            {activity.tags.map((tag) => (
              <li key={tag}>
                {onTagClick ? (
                  <button
                    type="button"
                    onClick={() => onTagClick(tag)}
                    aria-pressed={activeTag === tag}
                    title={`#${tag} 태그로 거르기`}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs transition-colors",
                      activeTag === tag
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    #{tag}
                  </button>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    #{tag}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {activity.description ? (
          <CardDescription className="mt-1 text-[0.8125rem] leading-relaxed">
            <Markdown>{activity.description}</Markdown>
          </CardDescription>
        ) : null}
      </CardHeader>
      {activity.image_url ? (
        <div className="px-5 pb-5">
          <ActivityImagePreview
            imageUrl={activity.image_url}
            title={activity.title}
          />
        </div>
      ) : null}
    </Card>
  )
}
