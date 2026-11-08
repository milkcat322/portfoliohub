import type { Activity } from "@/lib/activity"

import { collectCategories, collectTags } from "@/lib/activity"

export type ReportOptions = {
  /** Shown on the cover, e.g. the student's name. */
  owner: string
  favoritesOnly: boolean
  /** Categories to include; empty means all. */
  categories: string[]
}

export type ReportData = {
  owner: string
  generatedOn: string
  activities: Activity[]
  /** Activities grouped by category, in dropdown order, oldest first inside. */
  sections: { category: string; activities: Activity[] }[]
  tags: { tag: string; count: number }[]
  firstDate: string | null
  lastDate: string | null
}

export function formatDate(value: string) {
  return value.replaceAll("-", ".")
}

export function formatPeriod(startDate: string, endDate: string | null) {
  if (!endDate) return `${formatDate(startDate)} – 진행 중`
  if (endDate === startDate) return formatDate(startDate)
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function today() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

export function buildReport(all: Activity[], options: ReportOptions): ReportData {
  const activities = all
    .filter((activity) => !options.favoritesOnly || activity.favorite)
    .filter(
      (activity) =>
        options.categories.length === 0 ||
        options.categories.includes(activity.category)
    )
    .sort((left, right) => left.start_date.localeCompare(right.start_date))

  const sections = collectCategories(activities)
    .map((category) => ({
      category,
      activities: activities.filter((activity) => activity.category === category),
    }))
    .filter((section) => section.activities.length > 0)

  const ends = activities.map((activity) => activity.end_date ?? activity.start_date).sort()

  return {
    owner: options.owner.trim(),
    generatedOn: today(),
    activities,
    sections,
    tags: collectTags(activities),
    firstDate: activities[0]?.start_date ?? null,
    lastDate: ends.at(-1) ?? null,
  }
}

/** Removes inline Markdown so text reads cleanly where it cannot be rendered. */
export function stripInlineMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
}

export type PlainBlock = {
  text: string
  kind: "heading" | "bullet" | "paragraph"
  /** Nesting depth for bullets, 0-based. */
  level: number
}

/**
 * Turns a Markdown description into flat blocks — enough structure for a
 * slide (headings, bullets, paragraphs) without a full Markdown renderer.
 */
export function markdownToBlocks(markdown: string): PlainBlock[] {
  const blocks: PlainBlock[] = []
  let inCode = false

  for (const rawLine of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(rawLine)) {
      inCode = !inCode
      continue
    }
    if (inCode) {
      if (rawLine.trim()) blocks.push({ text: rawLine.trim(), kind: "paragraph", level: 0 })
      continue
    }

    const line = rawLine.replace(/\s+$/, "")
    // Blank lines and horizontal rules (---, ***, ___).
    if (!line.trim() || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) continue
    // Table separator rows like |---|---|
    if (/^\s*\|?\s*:?-{3,}/.test(line)) continue

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push({ text: stripInlineMarkdown(heading[1]), kind: "heading", level: 0 })
      continue
    }

    const bullet = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(?:\[( |x|X)\]\s+)?(.*)$/)
    if (bullet) {
      const check = bullet[2] ? (bullet[2] === " " ? "☐ " : "☑ ") : ""
      blocks.push({
        text: check + stripInlineMarkdown(bullet[3]),
        kind: "bullet",
        level: Math.min(Math.floor(bullet[1].replace(/\t/g, "  ").length / 2), 3),
      })
      continue
    }

    const text = stripInlineMarkdown(
      line.replace(/^\s*>\s?/, "").replace(/^\s*\|(.*)\|\s*$/, (_, cells: string) =>
        cells.split("|").map((cell) => cell.trim()).join(" · ")
      )
    ).trim()
    if (text) blocks.push({ text, kind: "paragraph", level: 0 })
  }

  return blocks
}

/** The whole report as a Markdown document, e.g. for Notion or Obsidian. */
export function reportToMarkdown(report: ReportData) {
  const lines: string[] = [
    `# ${report.owner ? `${report.owner}의 ` : ""}활동 포트폴리오`,
    "",
    `- 작성일: ${formatDate(report.generatedOn)}`,
    `- 활동 수: ${report.activities.length}개`,
  ]
  if (report.firstDate && report.lastDate) {
    lines.push(`- 기간: ${formatDate(report.firstDate)} – ${formatDate(report.lastDate)}`)
  }
  if (report.tags.length > 0) {
    lines.push(
      `- 주요 키워드: ${report.tags.slice(0, 10).map(({ tag }) => `#${tag}`).join(" ")}`
    )
  }

  for (const section of report.sections) {
    lines.push("", `## ${section.category} (${section.activities.length})`)
    for (const activity of section.activities) {
      lines.push("", `### ${activity.title}`, "")
      lines.push(`*${formatPeriod(activity.start_date, activity.end_date)}*`)
      if (activity.tags.length > 0) {
        lines.push("", activity.tags.map((tag) => `#${tag.replace(/\s+/g, "_")}`).join(" "))
      }
      if (activity.description) {
        // Demote headings so they nest under the activity title.
        lines.push("", activity.description.replace(/^(#{1,4})\s/gm, "$1### ").replace(/^#{7,}/gm, "######"))
      }
    }
  }

  return `${lines.join("\n")}\n`
}

export function downloadText(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
