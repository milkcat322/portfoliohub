"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import type { Activity } from "@/lib/activity"
import type { ActivityFormValues } from "@/components/activity/ActivityForm"

import { ActivityForm } from "@/components/activity/ActivityForm"
import { ActivityList } from "@/components/activity/ActivityList"
import { Input } from "@/components/ui/input"
import {
  deleteActivity,
  getActivities,
  registerActivity,
  updateActivity,
} from "@/lib/activity"

function toFormDefaults(activity: Activity) {
  return {
    title: activity.title,
    category: activity.category,
    description: activity.description ?? "",
    start_date: activity.start_date,
    end_date: activity.end_date ?? "",
  }
}

export type DashboardViewProps = {
  /** Rows loaded on the server so the first paint already has the list. */
  initialActivities: Activity[]
  initialError?: string | null
}

/**
 * Interactive half of the dashboard: search, create, edit and delete.
 *
 * The list arrives from the server and is re-fetched after each mutation, so
 * there is no fetch-on-mount effect.
 */
export function DashboardView({
  initialActivities,
  initialError = null,
}: DashboardViewProps) {
  const [activities, setActivities] =
    React.useState<Activity[]>(initialActivities)
  const [error, setError] = React.useState<string | null>(initialError)
  const [query, setQuery] = React.useState("")
  const [editing, setEditing] = React.useState<Activity | null>(null)

  const formRef = React.useRef<HTMLDivElement>(null)

  async function refresh() {
    setActivities(await getActivities())
  }

  /**
   * Saves the form. Errors are deliberately re-thrown: `ActivityForm` catches
   * them, shows the message and keeps whatever was typed.
   */
  async function handleSubmit(values: ActivityFormValues) {
    setError(null)

    if (editing) {
      await updateActivity(editing.id, values)
    } else {
      await registerActivity(values)
    }

    await refresh()
    setEditing(null)
  }

  function handleEdit(activity: Activity) {
    setError(null)
    setEditing(activity)
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function handleDelete(activity: Activity) {
    if (!window.confirm(`'${activity.title}' 활동을 삭제할까요?`)) {
      return
    }

    try {
      await deleteActivity(activity.id)
      setError(null)

      // Drop out of edit mode if the row being edited is the one deleted.
      if (editing?.id === activity.id) {
        setEditing(null)
      }

      await refresh()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "활동을 삭제하지 못했습니다."
      )
    }
  }

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) {
      return activities
    }

    return activities.filter((activity) =>
      activity.title.toLowerCase().includes(keyword)
    )
  }, [activities, query])

  return (
    <>
      <div className="relative mt-8">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="활동명으로 검색"
          aria-label="활동명으로 검색"
          className="h-11 rounded-full bg-transparent pr-4 pl-10 text-sm md:text-sm"
        />
      </div>

      <div ref={formRef} className="mt-6 scroll-mt-6">
        <ActivityForm
          // Remounting on target change reloads `defaultValues` into the form.
          key={editing?.id ?? "new"}
          defaultValues={editing ? toFormDefaults(editing) : undefined}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
          title={editing ? "활동 수정" : "활동 등록"}
          description={
            editing
              ? `'${editing.title}' 활동을 수정합니다.`
              : "대회, 동아리, 프로젝트, 봉사 등 기록하고 싶은 활동을 남겨보세요."
          }
          submitLabel={editing ? "수정 완료" : "등록"}
          className="max-w-none"
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-base font-medium tracking-tight">
            활동 목록
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {query.trim()
              ? `${filtered.length} / ${activities.length}개`
              : `${activities.length}개`}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-[0.8125rem] text-destructive"
          >
            {error}
          </p>
        ) : null}

        <ActivityList
          activities={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={
            query.trim()
              ? `'${query.trim()}'에 해당하는 활동이 없습니다.`
              : "등록된 활동이 없습니다."
          }
        />
      </section>
    </>
  )
}
