"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"

import type { Activity } from "@/lib/activity"
import type { ActivityFormValues } from "@/components/activity/ActivityForm"

import { ActivityForm } from "@/components/activity/ActivityForm"
import { ActivityList } from "@/components/activity/ActivityList"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import {
  collectCategories,
  collectTags,
  deleteActivity,
  getActivities,
  registerActivity,
  setActivityFavorite,
  uploadActivityImage,
  updateActivity,
} from "@/lib/activity"
import { createClient } from "@/lib/supabase/client"

function toFormDefaults(activity: Activity) {
  return {
    title: activity.title,
    category: activity.category,
    description: activity.description ?? "",
    start_date: activity.start_date,
    end_date: activity.end_date ?? "",
    tags: activity.tags,
  }
}

const NAV_LINKS = [
  { href: "/dashboard/statistics", label: "통계" },
  { href: "/dashboard/timeline", label: "타임라인" },
  { href: "/dashboard/graph", label: "태그 그래프" },
  { href: "/dashboard/report", label: "보고서 · PPT 내보내기" },
] as const

export type DashboardViewProps = {
  /** Rows loaded on the server so the first paint already has the list. */
  initialActivities: Activity[]
  initialError?: string | null
  /** Pre-applied filters from `?tag=` / `?category=`. */
  initialTag?: string | null
  initialCategory?: string | null
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
  initialTag = null,
  initialCategory = null,
}: DashboardViewProps) {
  const [activities, setActivities] =
    React.useState<Activity[]>(initialActivities)
  const [error, setError] = React.useState<string | null>(initialError)
  const [query, setQuery] = React.useState("")
  const [favoritesOnly, setFavoritesOnly] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState(
    initialCategory ?? ""
  )
  const [tagFilter, setTagFilter] = React.useState<string | null>(initialTag)

  const categoryOptions = React.useMemo(
    () => collectCategories(activities),
    [activities]
  )
  // Only categories that actually have activities are worth filtering by.
  const usedCategories = React.useMemo(
    () =>
      categoryOptions.filter((category) =>
        activities.some((activity) => activity.category === category)
      ),
    [activities, categoryOptions]
  )
  const tagSuggestions = React.useMemo(
    () => collectTags(activities).map(({ tag }) => tag),
    [activities]
  )
  const [editing, setEditing] = React.useState<Activity | null>(null)

  const formRef = React.useRef<HTMLDivElement>(null)

  // The browser client reads the session from cookies, so every query below
  // runs as the signed-in user and row level security scopes it to their rows.
  const supabase = React.useMemo(() => createClient(), [])

  async function refresh() {
    setActivities(await getActivities(supabase))
  }

  /**
   * Saves the form. Errors are deliberately re-thrown: `ActivityForm` catches
   * them, shows the message and keeps whatever was typed.
   */
  async function handleSubmit(values: ActivityFormValues) {
    setError(null)
    const { imageFile, ...activityValues } = values
    const imageUrl = imageFile
      ? await uploadActivityImage(supabase, imageFile)
      : editing?.image_url ?? null
    const input = { ...activityValues, image_url: imageUrl }

    if (editing) {
      await updateActivity(supabase, editing.id, input)
    } else {
      await registerActivity(supabase, input)
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
      await deleteActivity(supabase, activity.id)
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

  async function handleToggleFavorite(activity: Activity) {
    try {
      await setActivityFavorite(supabase, activity.id, !activity.favorite)
      setError(null)
      await refresh()
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "즐겨찾기를 변경하지 못했습니다."
      )
    }
  }

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return activities.filter(
      (activity) =>
        (!favoritesOnly || activity.favorite) &&
        (!categoryFilter || activity.category === categoryFilter) &&
        (!tagFilter || activity.tags.includes(tagFilter)) &&
        (!keyword ||
          activity.title.toLowerCase().includes(keyword) ||
          activity.tags.some((tag) => tag.toLowerCase().includes(keyword)))
    )
  }, [activities, categoryFilter, favoritesOnly, query, tagFilter])

  const isFiltered =
    Boolean(query.trim()) || favoritesOnly || Boolean(categoryFilter) || Boolean(tagFilter)

  function toggleTagFilter(tag: string) {
    setTagFilter((current) => (current === tag ? null : tag))
  }

  return (
    <>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="포트폴리오 메뉴">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

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
          placeholder="활동명 또는 태그로 검색"
          aria-label="활동명 또는 태그로 검색"
          className="h-11 rounded-full bg-transparent pr-4 pl-10 text-sm md:text-sm"
        />
      </div>

      <div ref={formRef} className="mt-6 scroll-mt-6">
        <ActivityForm
          // Remounting on target change reloads `defaultValues` into the form.
          key={editing?.id ?? "new"}
          defaultValues={editing ? toFormDefaults(editing) : undefined}
          existingImageUrl={editing?.image_url}
          categoryOptions={categoryOptions}
          tagSuggestions={tagSuggestions}
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-base font-medium tracking-tight">
            활동 목록
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <NativeSelect
              aria-label="카테고리별로 보기"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              wrapperClassName="w-40"
              className="h-8 rounded-full text-xs"
            >
              <option value="">전체 카테고리</option>
              {usedCategories.map((category) => (
                <option key={category} value={category}>
                  {`${category} (${
                    activities.filter((item) => item.category === category).length
                  })`}
                </option>
              ))}
            </NativeSelect>
            <Button
              type="button"
              size="sm"
              variant={favoritesOnly ? "secondary" : "ghost"}
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((value) => !value)}
              className="rounded-full"
            >
              ⭐ 즐겨찾기만
            </Button>
            <p className="text-xs text-muted-foreground tabular-nums">
              {isFiltered
                ? `${filtered.length} / ${activities.length}개`
                : `${activities.length}개`}
            </p>
          </div>
        </div>

        {tagFilter ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">태그 필터</span>
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs text-background"
              aria-label={`#${tagFilter} 태그 필터 해제`}
            >
              #{tagFilter} <span aria-hidden="true">×</span>
            </button>
            <Link
              href={`/dashboard/graph?tag=${encodeURIComponent(tagFilter)}`}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              그래프에서 연결 보기 →
            </Link>
          </div>
        ) : null}

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
          onToggleFavorite={handleToggleFavorite}
          onTagClick={toggleTagFilter}
          activeTag={tagFilter}
          emptyMessage={
            activities.length === 0
              ? "등록된 활동이 없습니다."
              : query.trim()
                ? `'${query.trim()}'에 해당하는 활동이 없습니다.`
                : "조건에 맞는 활동이 없습니다."
          }
        />
      </section>
    </>
  )
}
