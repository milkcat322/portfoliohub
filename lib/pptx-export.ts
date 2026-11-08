import type PptxGenJS from "pptxgenjs"

import type { Activity } from "@/lib/activity"
import type { ReportData } from "@/lib/report"

import { formatDate, formatPeriod, markdownToBlocks } from "@/lib/report"

const FONT = "Malgun Gothic"
const INK = "1D1D1F"
const MUTED = "6E6E73"
const ACCENT = "0071E3"
const LINE = "E5E5EA"
const CHART_COLORS = ["0071E3", "34C759", "FF9F0A", "FF375F", "AF52DE", "5AC8FA", "A2845E", "30B0C7", "8E8E93"]

// LAYOUT_WIDE is 13.33 × 7.5 inches.
const W = 13.33
const MARGIN = 0.7

type LoadedImage = { data: string; width: number; height: number }

/**
 * Downloads an image as a data URL with its pixel size. Returns null on any
 * failure (CORS, 404, decode) so a broken image never blocks the export.
 */
async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = reject
      image.src = data
    })
    return { data, ...size }
  } catch {
    return null
  }
}

/** Fits an image inside a box, keeping its aspect ratio, centred. */
function fit(image: LoadedImage, box: { x: number; y: number; w: number; h: number }) {
  const scale = Math.min(box.w / image.width, box.h / image.height)
  const w = image.width * scale
  const h = image.height * scale
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}

function addFooter(slide: PptxGenJS.Slide, report: ReportData, page: number) {
  slide.addText(
    [
      { text: report.owner ? `${report.owner} · 활동 포트폴리오` : "활동 포트폴리오" },
      { text: `   ${page}`, options: { color: INK } },
    ],
    { x: MARGIN, y: 7.0, w: W - MARGIN * 2, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: "right" }
  )
}

function addTitleSlide(pptx: PptxGenJS, report: ReportData) {
  const slide = pptx.addSlide()
  slide.background = { color: "F5F5F7" }
  slide.addText("PORTFOLIO", {
    x: MARGIN, y: 2.0, w: 8, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: ACCENT, charSpacing: 4,
  })
  slide.addText(`${report.owner ? `${report.owner}의 ` : ""}활동 포트폴리오`, {
    x: MARGIN, y: 2.5, w: W - MARGIN * 2, h: 1.2, fontFace: FONT, fontSize: 40, bold: true, color: INK,
  })
  const period =
    report.firstDate && report.lastDate
      ? `${formatDate(report.firstDate)} – ${formatDate(report.lastDate)} · `
      : ""
  slide.addText(`${period}활동 ${report.activities.length}개`, {
    x: MARGIN, y: 3.8, w: W - MARGIN * 2, h: 0.5, fontFace: FONT, fontSize: 16, color: MUTED,
  })
  slide.addText(`작성일 ${formatDate(report.generatedOn)}`, {
    x: MARGIN, y: 6.6, w: 6, h: 0.4, fontFace: FONT, fontSize: 11, color: MUTED,
  })
}

function addSummarySlide(pptx: PptxGenJS, report: ReportData, page: number) {
  const slide = pptx.addSlide()
  slide.addText("한눈에 보기", {
    x: MARGIN, y: 0.5, w: 8, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: INK,
  })

  const stats = [
    { label: "전체 활동", value: `${report.activities.length}` },
    { label: "카테고리", value: `${report.sections.length}` },
    { label: "태그", value: `${report.tags.length}` },
    { label: "즐겨찾기", value: `${report.activities.filter((a) => a.favorite).length}` },
  ]
  const statW = (W - MARGIN * 2 - 0.3 * 3) / 4
  stats.forEach((stat, index) => {
    const x = MARGIN + index * (statW + 0.3)
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: statW, h: 1.2, fill: { color: "F5F5F7" }, line: { color: "F5F5F7" }, rectRadius: 0.15,
    })
    slide.addText(stat.label, { x: x + 0.25, y: 1.6, w: statW - 0.5, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED })
    slide.addText(stat.value, { x: x + 0.25, y: 1.95, w: statW - 0.5, h: 0.65, fontFace: FONT, fontSize: 30, bold: true, color: INK })
  })

  if (report.sections.length > 0) {
    slide.addText("카테고리별 활동", { x: MARGIN, y: 3.05, w: 6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: INK })
    // Horizontal bar charts draw the first category at the bottom, so reverse
    // to read top-down in the same order as the rest of the report.
    const sections = [...report.sections].reverse()
    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "활동 수",
          labels: sections.map((section) => section.category),
          values: sections.map((section) => section.activities.length),
        },
      ],
      {
        x: MARGIN, y: 3.45, w: 6.6, h: 3.4,
        barDir: "bar",
        chartColors: [ACCENT],
        catAxisLabelFontFace: FONT,
        catAxisLabelFontSize: 11,
        catAxisLabelColor: INK,
        valAxisHidden: true,
        valGridLine: { style: "none" },
        showValue: true,
        dataLabelFontSize: 10,
        dataLabelColor: MUTED,
      }
    )
  }

  if (report.tags.length > 0) {
    slide.addText("주요 키워드", { x: 7.7, y: 3.05, w: 5, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: INK })
    // Two columns of six, so up to twelve keywords fit without shrinking.
    const columns = [report.tags.slice(0, 6), report.tags.slice(6, 12)]
    columns.forEach((column, index) => {
      if (column.length === 0) return
      slide.addText(
        column.flatMap(({ tag, count }) => [
          { text: `#${tag}`, options: { breakLine: true, color: INK, fontSize: 14 } },
          { text: `${count}개 활동`, options: { color: MUTED, fontSize: 10, breakLine: true } },
        ]),
        { x: 7.7 + index * 2.6, y: 3.5, w: 2.5, h: 3.4, fontFace: FONT, valign: "top", paraSpaceAfter: 2, fit: "shrink" }
      )
    })
  }

  addFooter(slide, report, page)
}

function addSectionSlide(pptx: PptxGenJS, report: ReportData, category: string, count: number, colorIndex: number, page: number) {
  const slide = pptx.addSlide()
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length]
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color }, line: { color } })
  slide.addText(category, { x: MARGIN, y: 2.8, w: W - MARGIN * 2, h: 1, fontFace: FONT, fontSize: 36, bold: true, color: INK })
  slide.addText(`${count}개 활동`, { x: MARGIN, y: 3.8, w: 6, h: 0.5, fontFace: FONT, fontSize: 16, color: MUTED })
  addFooter(slide, report, page)
}

function addActivitySlide(
  pptx: PptxGenJS,
  report: ReportData,
  activity: Activity,
  image: LoadedImage | null,
  colorIndex: number,
  page: number
) {
  const slide = pptx.addSlide()
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length]
  const textW = image ? 7.4 : W - MARGIN * 2

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color }, line: { color } })
  slide.addText(
    [
      { text: activity.category, options: { color, bold: true } },
      { text: `   ${formatPeriod(activity.start_date, activity.end_date)}`, options: { color: MUTED } },
      ...(activity.favorite ? [{ text: "   ★", options: { color: "FF9F0A" } }] : []),
    ],
    { x: MARGIN, y: 0.45, w: textW, h: 0.4, fontFace: FONT, fontSize: 12 }
  )
  slide.addText(activity.title, {
    x: MARGIN, y: 0.85, w: textW, h: 0.9, fontFace: FONT, fontSize: 26, bold: true, color: INK, fit: "shrink", valign: "top",
  })

  let y = 1.8
  if (activity.tags.length > 0) {
    slide.addText(activity.tags.map((tag) => `#${tag}`).join("   "), {
      x: MARGIN, y, w: textW, h: 0.4, fontFace: FONT, fontSize: 12, color: ACCENT,
    })
    y += 0.5
  }

  slide.addShape(pptx.ShapeType.line, { x: MARGIN, y: y + 0.05, w: textW, h: 0, line: { color: LINE, width: 1 } })
  y += 0.25

  const blocks = activity.description ? markdownToBlocks(activity.description) : []
  if (blocks.length > 0) {
    slide.addText(
      blocks.map((block) => ({
        text: block.text,
        options:
          block.kind === "heading"
            ? { bold: true, color: INK, fontSize: 15, breakLine: true, paraSpaceBefore: 6 }
            : block.kind === "bullet"
              ? { bullet: { indent: 14 }, indentLevel: block.level, color: "3A3A3C", fontSize: 13, breakLine: true }
              : { color: "3A3A3C", fontSize: 13, breakLine: true },
      })),
      { x: MARGIN, y, w: textW, h: 6.85 - y, fontFace: FONT, valign: "top", paraSpaceAfter: 4, fit: "shrink", lineSpacingMultiple: 1.1 }
    )
  } else {
    slide.addText("등록된 설명이 없습니다.", { x: MARGIN, y, w: textW, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED })
  }

  if (image) {
    slide.addImage({ data: image.data, ...fit(image, { x: 8.5, y: 0.6, w: 4.2, h: 6.1 }), altText: activity.title })
  }

  addFooter(slide, report, page)
}

/**
 * Builds a 16:9 deck — cover, summary, then a divider per category followed
 * by one slide per activity — and downloads it as a .pptx file.
 */
export async function exportReportToPptx(report: ReportData, options: { includeImages: boolean }) {
  const { default: PptxGen } = await import("pptxgenjs")
  const pptx = new PptxGen()
  pptx.layout = "LAYOUT_WIDE"
  pptx.title = `${report.owner || "나"}의 활동 포트폴리오`
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT }

  const images = new Map<string, LoadedImage | null>()
  if (options.includeImages) {
    await Promise.all(
      report.activities
        .filter((activity) => activity.image_url)
        .map(async (activity) => images.set(activity.id, await loadImage(activity.image_url!)))
    )
  }

  let page = 1
  addTitleSlide(pptx, report)
  addSummarySlide(pptx, report, ++page)

  report.sections.forEach((section, sectionIndex) => {
    addSectionSlide(pptx, report, section.category, section.activities.length, sectionIndex, ++page)
    for (const activity of section.activities) {
      addActivitySlide(pptx, report, activity, images.get(activity.id) ?? null, sectionIndex, ++page)
    }
  })

  const name = report.owner ? `${report.owner}_포트폴리오` : "포트폴리오"
  await pptx.writeFile({ fileName: `${name}_${report.generatedOn}.pptx` })
}
