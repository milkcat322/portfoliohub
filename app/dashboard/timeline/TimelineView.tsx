"use client"

import * as React from "react"

import type { Activity } from "@/lib/activity"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatPeriod(startDate: string, endDate: string | null) {
  const formatDate = (value: string) => value.replaceAll("-", ".")
  const start = formatDate(startDate)

  if (!endDate) {
    return `${start} · 진행 중`
  }

  return endDate === startDate
    ? start
    : `${start} – ${formatDate(endDate)}`
}

export function TimelineView({ activities }: { activities: Activity[] }) {
  const [selected, setSelected] = React.useState<Activity | null>(null)

  const groupedActivities = React.useMemo(() => {
    const groups = new Map<string, Activity[]>()
    const sorted = [...activities].sort((left, right) =>
      right.start_date.localeCompare(left.start_date)
    )

    for (const activity of sorted) {
      const year = activity.start_date.slice(0, 4)
      const group = groups.get(year) ?? []
      group.push(activity)
      groups.set(year, group)
    }

    return [...groups.entries()]
  }, [activities])

  return (
    <>
      {groupedActivities.length > 0 ? (
        <div className="mt-10 space-y-10">
          {groupedActivities.map(([year, yearActivities]) => (
            <section key={year} aria-labelledby={`timeline-${year}`}>
              <h2
                id={`timeline-${year}`}
                className="font-heading text-xl font-semibold tracking-tight"
              >
                {year}
              </h2>
              <ol className="mt-5 ml-2 border-l border-border pl-6">
                {yearActivities.map((activity) => (
                  <li key={activity.id} className="relative pb-5 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute top-3 -left-[1.9375rem] size-3 rounded-full border-2 border-background bg-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setSelected(activity)}
                      className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-medium tracking-tight">
                          {activity.title}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatPeriod(activity.start_date, activity.end_date)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">{activity.category}</Badge>
                        {activity.favorite ? (
                          <span
                            className="text-xs text-amber-500"
                            aria-label="즐겨찾기"
                          >
                            ⭐
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            타임라인에 표시할 활동이 없습니다.
          </p>
        </div>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        {selected ? (
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selected.category}</Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatPeriod(selected.start_date, selected.end_date)}
                </span>
              </div>
              <DialogTitle className="text-lg tracking-tight">
                {selected.title}
              </DialogTitle>
              <DialogDescription className="whitespace-pre-line">
                {selected.description || "등록된 상세 설명이 없습니다."}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}
