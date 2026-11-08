"use client"

import * as React from "react"

import { MAX_TAGS, MAX_TAG_LENGTH, normalizeTag } from "@/lib/activity"
import { cn } from "@/lib/utils"

type TagInputProps = {
  id: string
  value: string[]
  onChange: (tags: string[]) => void
  /** Tags already used on other activities, offered as suggestions. */
  suggestions?: string[]
  placeholder?: string
}

/**
 * Chip-style keyword input. Enter, comma or Tab commits the typed text as a
 * tag, Backspace on an empty field removes the last one.
 *
 * Suggestions come from the user's existing tags so the same keyword is
 * reused rather than retyped with a slightly different spelling — that is
 * what keeps the tag graph connected.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = "예: 인공지능, 리더십",
}: TagInputProps) {
  const [draft, setDraft] = React.useState("")
  const [notice, setNotice] = React.useState<string | null>(null)
  const listId = `${id}-suggestions`

  const lowerValue = React.useMemo(
    () => new Set(value.map((tag) => tag.toLowerCase())),
    [value]
  )

  const matches = React.useMemo(() => {
    const keyword = normalizeTag(draft).toLowerCase()
    return suggestions
      .filter(
        (tag) =>
          !lowerValue.has(tag.toLowerCase()) &&
          (!keyword || tag.toLowerCase().includes(keyword))
      )
      .slice(0, 8)
  }, [draft, lowerValue, suggestions])

  function addTags(raw: string) {
    const next = [...value]
    const seen = new Set(lowerValue)

    for (const part of raw.split(",")) {
      const tag = normalizeTag(part)
      if (!tag || seen.has(tag.toLowerCase())) continue

      if (tag.length > MAX_TAG_LENGTH) {
        setNotice(`태그는 ${MAX_TAG_LENGTH}자 이하로 입력해 주세요.`)
        return
      }
      if (next.length >= MAX_TAGS) {
        setNotice(`태그는 최대 ${MAX_TAGS}개까지 달 수 있습니다.`)
        break
      }

      seen.add(tag.toLowerCase())
      next.push(tag)
    }

    setDraft("")
    if (next.length !== value.length) {
      onChange(next)
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag))
    setNotice(null)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Korean IME fires keydown for the composing syllable too; committing
    // then would cut off the last character.
    if (event.nativeEvent.isComposing) return

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTags(draft)
    } else if (event.key === "Tab" && draft.trim()) {
      event.preventDefault()
      addTags(draft)
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="grid gap-2">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-input px-2 py-1.5 transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2.5 text-xs text-secondary-foreground"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`${tag} 태그 삭제`}
              className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          list={listId}
          onChange={(event) => {
            const next = event.target.value
            // A pasted "a, b, c" or a picked suggestion ending in a comma.
            if (next.includes(",")) {
              addTags(next)
            } else {
              setDraft(next)
              setNotice(null)
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) addTags(draft)
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <datalist id={listId}>
          {matches.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>

      {matches.length > 0 && !draft ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">기존 태그</span>
          {matches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTags(tag)}
              className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:text-foreground"
            >
              + {tag}
            </button>
          ))}
        </div>
      ) : null}

      <p className={cn("text-xs", notice ? "text-destructive" : "text-muted-foreground")}>
        {notice ?? "Enter 또는 쉼표로 추가 · 생기부에서 연결하고 싶은 키워드를 달아보세요."}
      </p>
    </div>
  )
}
