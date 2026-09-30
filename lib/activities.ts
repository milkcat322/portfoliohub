import { supabase } from "@/lib/supabase"

/** A row of the `activities` table. */
export type Activity = {
  id: string
  title: string
  category: string
  description: string | null
  start_date: string
  end_date: string | null
  created_at: string
}

/**
 * Values accepted by {@link registerActivity}.
 *
 * Field names match the table columns so form state can be passed straight
 * through. Dates are `date` columns, so they take `YYYY-MM-DD` strings — not
 * `Date` objects or ISO timestamps.
 */
export type ActivityInput = {
  title: string
  category: string
  description?: string | null
  start_date: string
  /** Omit for an activity that is still ongoing. */
  end_date?: string | null
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function assertDate(label: string, value: string) {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${label}는 YYYY-MM-DD 형식이어야 합니다. (받은 값: ${value})`)
  }
}

/**
 * Inserts one activity and returns the stored row, including the generated
 * `id` and `created_at`.
 *
 * Throws on validation failure or when Supabase rejects the insert, so callers
 * should wrap this in try/catch.
 *
 * The shared client keeps its session in browser storage, so call this from a
 * Client Component.
 */
export async function registerActivity(
  input: ActivityInput
): Promise<Activity> {
  const title = input.title.trim()
  const category = input.category.trim()
  const description = input.description?.trim() || null
  const endDate = input.end_date || null

  if (!title) {
    throw new Error("제목을 입력해 주세요.")
  }

  if (!category) {
    throw new Error("분류를 선택해 주세요.")
  }

  assertDate("시작일", input.start_date)

  if (endDate) {
    assertDate("종료일", endDate)

    if (endDate < input.start_date) {
      throw new Error("종료일은 시작일보다 빠를 수 없습니다.")
    }
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      title,
      category,
      description,
      start_date: input.start_date,
      end_date: endDate,
    })
    .select()
    .single<Activity>()

  if (error) {
    throw new Error(`활동을 저장하지 못했습니다: ${error.message}`)
  }

  return data
}

/**
 * Loads every activity, newest first.
 *
 * Reads go through the anon key and are not cached by Next.js, so a Server
 * Component calling this renders the list fresh on each request.
 */
export async function getActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Activity[]>()

  if (error) {
    throw new Error(`활동 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return data ?? []
}
