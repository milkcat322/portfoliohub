"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { Markdown } from "@/components/activity/Markdown"
import { TagInput } from "@/components/activity/TagInput"
import { ACTIVITY_CATEGORIES } from "@/lib/activity"
import { cn } from "@/lib/utils"

/** Sentinel `<option>` value that switches the dropdown to a text field. */
const CUSTOM_CATEGORY = "__custom__"

const MARKDOWN_PLACEHOLDER = `## 활동 개요
어떤 활동이었는지 적어보세요.

## 나의 역할
- 맡은 일
- **핵심 성과**

## 배운 점`

/**
 * What the form hands to its parent.
 *
 * Keys match the `activities` table columns and blank optional fields come
 * through as `null`, so this can be passed straight to `registerActivity`
 * once the parent is ready to save.
 */
export type ActivityFormValues = {
  title: string
  category: string
  description: string | null
  start_date: string
  end_date: string | null
  tags: string[]
  imageFile: File | null
}

type ActivityFormState = {
  title: string
  category: string
  description: string
  start_date: string
  end_date: string
  tags: string[]
}

const EMPTY_STATE: ActivityFormState = {
  title: "",
  category: "",
  description: "",
  start_date: "",
  end_date: "",
  tags: [],
}

const INPUT_CLASSES = "h-10 rounded-xl bg-transparent px-3 text-sm md:text-sm"

/** Label + control pair, so every row of the form lines up the same way. */
function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[0.8125rem]">
          {label}
        </Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

type ActivityFormProps = {
  /** Receives the entered values. May be async; the form waits for it. */
  onSubmit?: (values: ActivityFormValues) => void | Promise<void>
  /** Prefilled values, e.g. when reusing the form to edit an activity. */
  defaultValues?: Partial<ActivityFormState>
  /** Existing image shown while editing; a newly selected file replaces it. */
  existingImageUrl?: string | null
  /** Dropdown entries; defaults to the preset 생기부 categories. */
  categoryOptions?: readonly string[]
  /** Tags already in use, suggested while typing. */
  tagSuggestions?: string[]
  /** Shown as a secondary button; omit to hide it. */
  onCancel?: () => void
  title?: string
  description?: string
  submitLabel?: string
  className?: string
}

/**
 * Card-style form for creating an activity.
 *
 * Nothing is persisted here — the values are handed to `onSubmit` and the
 * parent decides what to do with them. The fields reset only after `onSubmit`
 * resolves, so a failed save keeps whatever the user typed.
 */
export function ActivityForm({
  onSubmit,
  defaultValues,
  existingImageUrl,
  categoryOptions = ACTIVITY_CATEGORIES,
  tagSuggestions = [],
  onCancel,
  title: heading = "활동 등록",
  description: headingDescription = "대회, 동아리, 프로젝트, 봉사 등 기록하고 싶은 활동을 남겨보세요.",
  submitLabel = "등록",
  className,
}: ActivityFormProps) {
  const [values, setValues] = React.useState<ActivityFormState>({
    ...EMPTY_STATE,
    ...defaultValues,
  })
  // A category that is not one of the options (e.g. typed before the dropdown
  // existed) opens straight into the text field so it is not silently lost.
  const [customCategory, setCustomCategory] = React.useState(
    () =>
      Boolean(defaultValues?.category) &&
      !categoryOptions.includes(defaultValues?.category ?? "")
  )
  const [previewing, setPreviewing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const imageInputRef = React.useRef<HTMLInputElement>(null)

  function setField<K extends keyof ActivityFormState>(
    key: K,
    value: ActivityFormState[K]
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = values.title.trim()
    const category = values.category.trim()
    const description = values.description.trim()

    if (!title) {
      setError("활동명을 입력해 주세요.")
      return
    }

    if (!category) {
      setError("카테고리를 선택해 주세요.")
      return
    }

    if (!values.start_date) {
      setError("시작일을 선택해 주세요.")
      return
    }

    // Both are `YYYY-MM-DD`, so a plain string compare orders them correctly.
    if (values.end_date && values.end_date < values.start_date) {
      setError("종료일은 시작일보다 빠를 수 없습니다.")
      return
    }

    setSubmitting(true)

    try {
      await onSubmit?.({
        title,
        category,
        description: description || null,
        start_date: values.start_date,
        end_date: values.end_date || null,
        tags: values.tags,
        imageFile,
      })

      setValues(EMPTY_STATE)
      setCustomCategory(false)
      setPreviewing(false)
      setImageFile(null)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
      setError(null)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "활동을 등록하지 못했습니다."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      className={cn(
        "w-full max-w-lg gap-6 rounded-2xl py-7 shadow-sm ring-border",
        className
      )}
    >
      <CardHeader className="gap-1.5 px-7">
        <CardTitle className="text-lg tracking-tight">{heading}</CardTitle>
        <CardDescription className="text-[0.8125rem]">
          {headingDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-7">
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Field id="title" label="활동명">
            <Input
              id="title"
              name="title"
              placeholder="교내 프로그래밍 대회"
              value={values.title}
              onChange={(event) => setField("title", event.target.value)}
              className={INPUT_CLASSES}
            />
          </Field>

          <Field id="category" label="카테고리">
            {customCategory ? (
              <div className="flex gap-2">
                <Input
                  id="category"
                  name="category"
                  placeholder="새 카테고리 이름"
                  autoFocus
                  value={values.category}
                  onChange={(event) => setField("category", event.target.value)}
                  className={INPUT_CLASSES}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCustomCategory(false)
                    setField("category", "")
                  }}
                  className="h-10 shrink-0 rounded-xl px-3 text-sm"
                >
                  목록에서 선택
                </Button>
              </div>
            ) : (
              <NativeSelect
                id="category"
                name="category"
                value={values.category}
                onChange={(event) => {
                  if (event.target.value === CUSTOM_CATEGORY) {
                    setCustomCategory(true)
                    setField("category", "")
                  } else {
                    setField("category", event.target.value)
                  }
                }}
                className={cn(!values.category && "text-muted-foreground")}
              >
                <option value="" disabled>
                  카테고리를 선택하세요
                </option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value={CUSTOM_CATEGORY}>+ 직접 추가…</option>
              </NativeSelect>
            )}
          </Field>

          <Field id="tags" label="태그" hint="선택 · 여러 개 가능">
            <TagInput
              id="tags"
              value={values.tags}
              onChange={(tags) => setField("tags", tags)}
              suggestions={tagSuggestions}
            />
          </Field>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="description" className="text-[0.8125rem]">
                설명
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  선택 · 마크다운 지원
                </span>
              </Label>
              <div
                role="tablist"
                aria-label="설명 편집 모드"
                className="flex rounded-lg bg-muted p-0.5 text-xs"
              >
                {[
                  { key: false, label: "작성" },
                  { key: true, label: "미리보기" },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={previewing === tab.key}
                    onClick={() => setPreviewing(tab.key)}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition-colors",
                      previewing === tab.key
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {previewing ? (
              <div className="min-h-40 rounded-xl border border-input px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                {values.description.trim() ? (
                  <Markdown>{values.description}</Markdown>
                ) : (
                  <p>미리 볼 내용이 없습니다.</p>
                )}
              </div>
            ) : (
              <Textarea
                id="description"
                name="description"
                rows={8}
                placeholder={MARKDOWN_PLACEHOLDER}
                value={values.description}
                onChange={(event) => setField("description", event.target.value)}
                className="min-h-40 rounded-xl bg-transparent px-3 py-2.5 font-mono text-[0.8125rem] leading-relaxed md:text-[0.8125rem]"
              />
            )}
            <p className="text-xs text-muted-foreground">
              <code>## 제목</code> · <code>- 목록</code> · <code>**굵게**</code> ·{" "}
              <code>[링크](https://…)</code> · <code>- [ ] 체크리스트</code>
            </p>
          </div>

          <Field id="image" label="활동 이미지" hint="선택 · 5MB 이하">
            <Input
              ref={imageInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] ?? null)
                setError(null)
              }}
              className="h-auto rounded-xl bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
            />
            <p className="text-xs text-muted-foreground">
              {imageFile
                ? `${imageFile.name} · ${(imageFile.size / 1024 / 1024).toFixed(1)}MB`
                : existingImageUrl
                  ? "새 이미지를 선택하면 기존 이미지가 교체됩니다."
                  : "JPG, PNG, WebP, GIF"}
            </p>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="start_date" label="시작일">
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={values.start_date}
                onChange={(event) => setField("start_date", event.target.value)}
                className={INPUT_CLASSES}
              />
            </Field>

            <Field id="end_date" label="종료일" hint="진행 중이면 비워두세요">
              <Input
                id="end_date"
                name="end_date"
                type="date"
                // Lets the browser block an end date before the start date.
                min={values.start_date || undefined}
                value={values.end_date}
                onChange={(event) => setField("end_date", event.target.value)}
                className={INPUT_CLASSES}
              />
            </Field>
          </div>

          {error ? (
            <p role="alert" className="text-[0.8125rem] text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onCancel}
                disabled={submitting}
                className="h-10 w-full rounded-xl text-sm sm:w-auto sm:px-5"
              >
                취소
              </Button>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-10 w-full flex-1 rounded-xl text-sm"
            >
              {submitting ? "저장 중…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
