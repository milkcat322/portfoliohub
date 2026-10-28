import type { SupabaseClient } from "@supabase/supabase-js"

/** A row of the `activities` table. */
export type Activity = {
  id: string
  user_id: string
  title: string
  category: string
  description: string | null
  start_date: string
  end_date: string | null
  created_at: string
  favorite: boolean
  image_url: string | null
}

/**
 * Values accepted when creating or updating an activity.
 *
 * Field names match the table columns so form state can be passed straight
 * through. Dates are `date` columns, so they take `YYYY-MM-DD` strings — not
 * `Date` objects or ISO timestamps.
 *
 * `user_id` is deliberately absent: the column defaults to `auth.uid()` and
 * row level security enforces it, so the browser never gets to choose an owner.
 */
export type ActivityInput = {
  title: string
  category: string
  description?: string | null
  start_date: string
  /** Omit for an activity that is still ongoing. */
  end_date?: string | null
  image_url?: string | null
}

/** The exact column payload sent to Supabase. */
type ActivityRowValues = {
  title: string
  category: string
  description: string | null
  start_date: string
  end_date: string | null
  image_url: string | null
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function assertDate(label: string, value: string) {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${label}는 YYYY-MM-DD 형식이어야 합니다. (받은 값: ${value})`)
  }
}

/**
 * Trims and validates user input, shared by create and update so both reject
 * the same bad values.
 */
function toRowValues(input: ActivityInput): ActivityRowValues {
  const title = input.title.trim()
  const category = input.category.trim()
  const description = input.description?.trim() || null
  const endDate = input.end_date || null

  if (!title) {
    throw new Error("활동명을 입력해 주세요.")
  }

  if (!category) {
    throw new Error("카테고리를 입력해 주세요.")
  }

  assertDate("시작일", input.start_date)

  if (endDate) {
    assertDate("종료일", endDate)

    // Both are `YYYY-MM-DD`, so a plain string compare orders them correctly.
    if (endDate < input.start_date) {
      throw new Error("종료일은 시작일보다 빠를 수 없습니다.")
    }
  }

  return {
    title,
    category,
    description,
    start_date: input.start_date,
    end_date: endDate,
    image_url: input.image_url || null,
  }
}

/**
 * Loads the signed-in user's activities, newest first.
 *
 * No `user_id` filter is needed — the row level security policy already limits
 * the result to rows owned by the caller.
 *
 * Pass the browser client from a Client Component, or the per-request server
 * client from a Server Component.
 */
export async function getActivities(
  supabase: SupabaseClient
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("favorite", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Activity[]>()

  if (error) {
    throw new Error(`활동 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return data ?? []
}

/**
 * Updates whether an activity is pinned as a favorite.
 */
export async function setActivityFavorite(
  supabase: SupabaseClient,
  id: string,
  favorite: boolean
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .update({ favorite })
    .eq("id", id)
    .select()
    .returns<Activity[]>()

  if (error) {
    throw new Error(`즐겨찾기를 변경하지 못했습니다: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error("즐겨찾기를 변경할 활동을 찾지 못했습니다.")
  }

  return data[0]
}

/**
 * Uploads an activity image to the signed-in user's Storage folder.
 */
export async function uploadActivityImage(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  const extension = IMAGE_EXTENSIONS[file.type]
  if (!extension) {
    throw new Error("JPG, PNG, WebP 또는 GIF 이미지만 업로드할 수 있습니다.")
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("이미지는 5MB 이하만 업로드할 수 있습니다.")
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`로그인 정보를 확인하지 못했습니다: ${authError.message}`)
  }
  if (!user) {
    throw new Error("이미지를 업로드하려면 로그인해 주세요.")
  }

  const path = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from("portfolio-images")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`이미지를 업로드하지 못했습니다: ${error.message}`)
  }

  return supabase.storage.from("portfolio-images").getPublicUrl(path).data
    .publicUrl
}

/**
 * Inserts one activity and returns the stored row, including the generated
 * `id`, `user_id` and `created_at`.
 */
export async function registerActivity(
  supabase: SupabaseClient,
  input: ActivityInput
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert(toRowValues(input))
    .select()
    .single<Activity>()

  if (error) {
    throw new Error(`활동을 저장하지 못했습니다: ${error.message}`)
  }

  return data
}

/**
 * Overwrites one activity and returns the updated row.
 */
export async function updateActivity(
  supabase: SupabaseClient,
  id: string,
  input: ActivityInput
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .update(toRowValues(input))
    .eq("id", id)
    .select()
    .returns<Activity[]>()

  if (error) {
    throw new Error(`활동을 수정하지 못했습니다: ${error.message}`)
  }

  // An update that matches no row is not an error for PostgREST. That happens
  // when the id is stale or when a row level security policy hides it, so
  // check explicitly instead of reporting a silent success.
  if (!data || data.length === 0) {
    throw new Error(
      "수정할 활동을 찾지 못했습니다. 이미 삭제되었거나 권한이 없을 수 있습니다."
    )
  }

  return data[0]
}

/**
 * Deletes one activity.
 */
export async function deleteActivity(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .select()
    .returns<Activity[]>()

  if (error) {
    throw new Error(`활동을 삭제하지 못했습니다: ${error.message}`)
  }

  // Same as update: a delete matching nothing succeeds quietly, so confirm a
  // row actually went away.
  if (!data || data.length === 0) {
    throw new Error(
      "삭제할 활동을 찾지 못했습니다. 이미 삭제되었거나 권한이 없을 수 있습니다."
    )
  }
}
