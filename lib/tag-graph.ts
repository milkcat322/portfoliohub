import type { Activity } from "@/lib/activity"

import { collectTags } from "@/lib/activity"

export type GraphNode =
  | { id: string; kind: "tag"; label: string; count: number }
  | { id: string; kind: "activity"; label: string; activity: Activity }

export type GraphLink = {
  source: string
  target: string
  /** Number of activities shared, for tag–tag links. Always 1 otherwise. */
  weight: number
}

export const tagNodeId = (tag: string) => `tag:${tag}`
export const activityNodeId = (id: string) => `activity:${id}`

/**
 * Builds the graph shown on the tag graph page.
 *
 * With `showActivities` the graph is bipartite like Obsidian's: every tag and
 * every tagged activity is a node, linked when the activity carries the tag.
 * Without it, only tags remain and two tags are linked when they appear on
 * the same activity — handy once there are too many activities to read.
 */
export function buildTagGraph(activities: Activity[], showActivities: boolean) {
  const nodes: GraphNode[] = collectTags(activities).map(({ tag, count }) => ({
    id: tagNodeId(tag),
    kind: "tag",
    label: tag,
    count,
  }))
  const links: GraphLink[] = []

  if (showActivities) {
    for (const activity of activities) {
      if (activity.tags.length === 0) continue

      const id = activityNodeId(activity.id)
      nodes.push({ id, kind: "activity", label: activity.title, activity })
      for (const tag of activity.tags) {
        links.push({ source: id, target: tagNodeId(tag), weight: 1 })
      }
    }
  } else {
    const weights = new Map<string, number>()
    for (const activity of activities) {
      const tags = [...activity.tags].sort()
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const key = `${tags[i]}\u0000${tags[j]}`
          weights.set(key, (weights.get(key) ?? 0) + 1)
        }
      }
    }
    for (const [key, weight] of weights) {
      const [a, b] = key.split("\u0000")
      links.push({ source: tagNodeId(a), target: tagNodeId(b), weight })
    }
  }

  return { nodes, links }
}

/** Tags that share an activity with `tag`, most shared first. */
export function relatedTags(activities: Activity[], tag: string) {
  const counts = new Map<string, number>()

  for (const activity of activities) {
    if (!activity.tags.includes(tag)) continue
    for (const other of activity.tags) {
      if (other !== tag) counts.set(other, (counts.get(other) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ tag: name, count }))
    .sort((left, right) => right.count - left.count)
}

/**
 * One way the tag could grow into a 생기부 area it has not touched yet.
 * Written as a prompt for the student, not a finished sentence for the record.
 */
const CATEGORY_IDEAS: Record<string, (tag: string) => string> = {
  자율활동: (tag) => `학급·학생회 활동에서 '${tag}' 주제로 캠페인이나 발표를 기획해 보세요.`,
  동아리활동: (tag) => `동아리에서 '${tag}'을(를) 주제로 공동 탐구나 프로젝트를 진행해 보세요.`,
  봉사활동: (tag) => `'${tag}' 관련 역량을 살린 재능기부·멘토링 봉사를 찾아보세요.`,
  진로활동: (tag) => `'${tag}'와(과) 연결되는 학과·직업을 탐색하거나 전문가 인터뷰를 해보세요.`,
  "교과 세특": (tag) => `관련 교과 수업에서 '${tag}'을(를) 주제로 보고서나 발표를 준비해 보세요.`,
  "수상·대회": (tag) => `'${tag}' 관련 대회에 도전해 지금까지의 결과물을 검증해 보세요.`,
  독서: (tag) => `'${tag}' 관련 도서를 읽고 느낀 점과 후속 질문을 기록해 보세요.`,
  프로젝트: (tag) => `'${tag}'을(를) 직접 만들어 보거나 해결하는 개인 프로젝트로 심화해 보세요.`,
}

export type TagInsight = {
  activities: Activity[]
  related: { tag: string; count: number }[]
  coveredCategories: string[]
  /** Period covered, as `YYYY-MM-DD` strings. */
  firstDate: string
  lastDate: string
  ideas: string[]
}

/**
 * Summarizes one tag for the side panel: where it already shows up, and
 * concrete next steps to extend it so the 생기부 tells a connected story.
 */
export function getTagInsight(activities: Activity[], tag: string): TagInsight | null {
  const tagged = activities
    .filter((activity) => activity.tags.includes(tag))
    .sort((left, right) => left.start_date.localeCompare(right.start_date))

  if (tagged.length === 0) return null

  const related = relatedTags(activities, tag)
  const coveredCategories = [...new Set(tagged.map((activity) => activity.category))]
  const lastDate = tagged
    .map((activity) => activity.end_date ?? activity.start_date)
    .sort()
    .at(-1)!
  const ideas: string[] = []

  if (tagged.length === 1) {
    ideas.push(
      `아직 '${tagged[0].title}' 한 활동에만 등장합니다. 후속 활동을 이어가면 관심의 지속성을 보여줄 수 있어요.`
    )
  }

  const missing = Object.keys(CATEGORY_IDEAS).filter(
    (category) => !coveredCategories.includes(category)
  )
  for (const category of missing.slice(0, 3)) {
    ideas.push(`[${category}] ${CATEGORY_IDEAS[category](tag)}`)
  }

  if (related[0]) {
    ideas.push(
      `'#${related[0].tag}'와(과) 함께 쓰인 적이 많습니다. 두 주제를 융합한 탐구 질문을 세워 보세요.`
    )
  }

  const monthsSince = monthsBetween(lastDate, todayString())
  if (monthsSince >= 6) {
    ideas.push(
      `마지막 활동 후 ${monthsSince}개월이 지났습니다. 최근 근황을 담은 활동으로 흐름을 이어가 보세요.`
    )
  }

  return {
    activities: tagged,
    related,
    coveredCategories,
    firstDate: tagged[0].start_date,
    lastDate,
    ideas,
  }
}

function todayString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function monthsBetween(from: string, to: string) {
  const [fy, fm] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)
  return Math.max(0, (ty - fy) * 12 + (tm - fm))
}
