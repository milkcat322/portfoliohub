import Link from "next/link"
import { redirect } from "next/navigation"

import { TagGraphView } from "@/app/dashboard/graph/TagGraphView"
import { getActivities } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export default async function TagGraphPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const [userResult, activities, { tag }] = await Promise.all([
    supabase.auth.getUser(),
    getActivities(supabase),
    props.searchParams,
  ])
  const user = userResult.data.user

  if (!user) {
    redirect("/login?redirectTo=/dashboard/graph")
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 대시보드
      </Link>
      <header className="mt-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          태그 그래프
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          태그로 이어진 활동들을 한눈에 보고, 각 키워드를 어떻게 확장할지 생각해 보세요.
        </p>
      </header>
      <TagGraphView
        activities={activities}
        initialTag={typeof tag === "string" ? tag : null}
      />
    </main>
  )
}
