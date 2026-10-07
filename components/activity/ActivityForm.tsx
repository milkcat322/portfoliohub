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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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
}

type ActivityFormState = {
  title: string
  category: string
  description: string
  start_date: string
  end_date: string
}

const EMPTY_STATE: ActivityFormState = {
  title: "",
  category: "",
  description: "",
  start_date: "",
  end_date: "",
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
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

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
      setError("카테고리를 입력해 주세요.")
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
      })

      setValues(EMPTY_STATE)
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
            <Input
              id="category"
              name="category"
              placeholder="대회"
              value={values.category}
              onChange={(event) => setField("category", event.target.value)}
              className={INPUT_CLASSES}
            />
          </Field>

          <Field id="description" label="설명" hint="선택">
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="어떤 활동이었는지, 무엇을 맡았는지 적어보세요."
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              className="min-h-24 rounded-xl bg-transparent px-3 py-2.5 text-sm md:text-sm"
            />
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
