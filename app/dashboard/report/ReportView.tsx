"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download04Icon,
  PresentationBarChart01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"

import type { Activity } from "@/lib/activity"

import { Markdown } from "@/components/activity/Markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { collectCategories } from "@/lib/activity"
import {
  buildReport,
  downloadText,
  formatDate,
  formatPeriod,
  reportToMarkdown,
} from "@/lib/report"
import { cn } from "@/lib/utils"

export function ReportView({
  activities,
  defaultOwner,
}: {
  activities: Activity[]
  defaultOwner: string
}) {
  const [owner, setOwner] = React.useState(defaultOwner)
  const [favoritesOnly, setFavoritesOnly] = React.useState(false)
  const [categories, setCategories] = React.useState<string[]>([])
  const [includeImages, setIncludeImages] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const allCategories = React.useMemo(
    () =>
      collectCategories(activities).filter((category) =>
        activities.some((activity) => activity.category === category)
      ),
    [activities]
  )

  const report = React.useMemo(
    () => buildReport(activities, { owner, favoritesOnly, categories }),
    [activities, categories, favoritesOnly, owner]
  )

  function toggleCategory(category: string) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    )
  }

  async function handlePptx() {
    setExporting(true)
    setError(null)
    try {
      const { exportReportToPptx } = await import("@/lib/pptx-export")
      await exportReportToPptx(report, { includeImages })
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? `PPT를 만들지 못했습니다: ${exportError.message}`
          : "PPT를 만들지 못했습니다."
      )
    } finally {
      setExporting(false)
    }
  }

  function handleMarkdown() {
    const name = report.owner ? `${report.owner}_포트폴리오` : "포트폴리오"
    downloadText(
      `${name}_${report.generatedOn}.md`,
      reportToMarkdown(report),
      "text/markdown;charset=utf-8"
    )
  }

  const empty = report.activities.length === 0

  return (
    <>
      <section
        aria-label="내보내기 설정"
        className="mt-8 grid gap-5 rounded-2xl border border-border p-5 print:hidden"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="report-owner" className="text-[0.8125rem]">
              표지에 들어갈 이름
            </Label>
            <Input
              id="report-owner"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="홍길동"
              className="h-10 rounded-xl bg-transparent px-3 text-sm md:text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(event) => setFavoritesOnly(event.target.checked)}
                className="size-4 accent-foreground"
              />
              즐겨찾기만
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(event) => setIncludeImages(event.target.checked)}
                className="size-4 accent-foreground"
              />
              이미지 포함
            </label>
          </div>
        </div>

        {allCategories.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-[0.8125rem] font-medium">
              포함할 카테고리
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                선택하지 않으면 전체
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((category) => {
                const active = categories.includes(category)
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={empty}
            className="h-10 rounded-xl px-4"
          >
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={1.8} />
            보고서 PDF 저장
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePptx}
            disabled={empty || exporting}
            className="h-10 rounded-xl px-4"
          >
            <HugeiconsIcon icon={PresentationBarChart01Icon} strokeWidth={1.8} />
            {exporting ? "PPT 만드는 중…" : "PPT 다운로드"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleMarkdown}
            disabled={empty}
            className="h-10 rounded-xl px-4"
          >
            <HugeiconsIcon icon={Download04Icon} strokeWidth={1.8} />
            Markdown
          </Button>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          PDF는 인쇄 창에서 대상을 ‘PDF로 저장’으로 선택하세요. PPT는 표지·요약·카테고리별
          활동 슬라이드로 구성됩니다.
        </p>
        {error ? (
          <p role="alert" className="text-[0.8125rem] text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      {/* The printable document. On screen it is framed like a page. */}
      <article
        aria-label="포트폴리오 보고서 미리보기"
        className="mt-6 rounded-2xl border border-border bg-white px-6 py-10 text-neutral-900 sm:px-12 print:mt-0 print:rounded-none print:border-0 print:p-0"
      >
        {empty ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            보고서에 포함할 활동이 없습니다.
          </p>
        ) : (
          <>
            <header className="border-b border-neutral-200 pb-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#0071e3]">PORTFOLIO</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                {report.owner ? `${report.owner}의 ` : ""}활동 포트폴리오
              </h2>
              <p className="mt-2 text-sm text-neutral-500 tabular-nums">
                {report.firstDate && report.lastDate
                  ? `${formatDate(report.firstDate)} – ${formatDate(report.lastDate)} · `
                  : ""}
                작성일 {formatDate(report.generatedOn)}
              </p>
            </header>

            <section aria-label="요약" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "전체 활동", value: report.activities.length },
                { label: "카테고리", value: report.sections.length },
                { label: "태그", value: report.tags.length },
                {
                  label: "즐겨찾기",
                  value: report.activities.filter((activity) => activity.favorite).length,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-neutral-100 px-4 py-3">
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
                </div>
              ))}
            </section>

            <section aria-label="카테고리와 키워드" className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">카테고리별 활동</h3>
                <ul className="mt-3 space-y-2">
                  {report.sections.map((section) => (
                    <li key={section.category} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-xs">
                      <span className="truncate">{section.category}</span>
                      <span className="h-2 rounded-full bg-neutral-100">
                        <span
                          className="block h-2 rounded-full bg-[#0071e3] print:[print-color-adjust:exact]"
                          style={{
                            width: `${(section.activities.length / report.activities.length) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="text-right tabular-nums text-neutral-500">
                        {section.activities.length}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {report.tags.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold">주요 키워드</h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {report.tags.slice(0, 16).map(({ tag, count }) => (
                      <li
                        key={tag}
                        className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs"
                      >
                        #{tag} <span className="text-neutral-500 tabular-nums">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {report.sections.map((section) => (
              <section key={section.category} className="mt-10">
                <h3 className="border-b border-neutral-900 pb-2 text-lg font-bold tracking-tight break-after-avoid">
                  {section.category}
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    {section.activities.length}개
                  </span>
                </h3>
                <ol className="divide-y divide-neutral-200">
                  {section.activities.map((activity) => (
                    <li key={activity.id} className="py-5 break-inside-avoid">
                      <div className="flex gap-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h4 className="text-base font-semibold tracking-tight">
                              {activity.favorite ? "★ " : ""}
                              {activity.title}
                            </h4>
                            <span className="text-xs text-neutral-500 tabular-nums">
                              {formatPeriod(activity.start_date, activity.end_date)}
                            </span>
                          </div>
                          {activity.tags.length > 0 ? (
                            <p className="mt-1.5 text-xs text-[#0071e3]">
                              {activity.tags.map((tag) => `#${tag}`).join("  ")}
                            </p>
                          ) : null}
                          {activity.description ? (
                            <Markdown className="mt-3 text-[0.8125rem] leading-relaxed text-neutral-700 [&_h3]:text-neutral-900 [&_h4]:text-neutral-900 [&_h5]:text-neutral-900 [&_strong]:text-neutral-900">
                              {activity.description}
                            </Markdown>
                          ) : null}
                        </div>
                        {includeImages && activity.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- printed as-is; next/image adds nothing here
                          <img
                            src={activity.image_url}
                            alt=""
                            className="hidden h-28 w-36 shrink-0 rounded-lg object-cover sm:block print:block"
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </>
        )}
      </article>
    </>
  )
}
