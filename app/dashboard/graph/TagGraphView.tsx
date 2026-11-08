"use client"

import * as React from "react"
import Link from "next/link"

import type { Activity } from "@/lib/activity"
import type { GraphLink, GraphNode } from "@/lib/tag-graph"

import { Markdown } from "@/components/activity/Markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { collectCategories, collectTags } from "@/lib/activity"
import {
  activityNodeId,
  buildTagGraph,
  getTagInsight,
  tagNodeId,
} from "@/lib/tag-graph"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS = [
  "#0071e3",
  "#34c759",
  "#ff9f0a",
  "#ff375f",
  "#af52de",
  "#5ac8fa",
  "#a2845e",
  "#30b0c7",
  "#8e8e93",
]

/* -------------------------------------------------------------------------- */
/* Force simulation                                                            */
/* -------------------------------------------------------------------------- */

type SimNode = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  /** Pinned position while being dragged. */
  fx: number | null
  fy: number | null
}

const CHARGE = 520
const LINK_STRENGTH = 0.25
const GRAVITY = 0.06
const VELOCITY_DECAY = 0.55
const ALPHA_DECAY = 0.0228
const ALPHA_MIN = 0.002

/**
 * A small d3-force style simulation: pairwise repulsion, springs along links
 * and a pull to the centre. O(n²) is fine for a personal portfolio, which
 * tops out at a few hundred nodes.
 */
function step(
  nodes: SimNode[],
  links: { source: SimNode; target: SimNode; distance: number }[],
  alpha: number
) {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      let dx = b.x - a.x
      let dy = b.y - a.y
      let d2 = dx * dx + dy * dy
      if (d2 < 1) {
        // Coincident nodes: nudge apart deterministically.
        dx = (i - j) * 0.5
        dy = (j - i) * 0.3
        d2 = 1
      }
      const force = (CHARGE * alpha) / d2
      a.vx -= dx * force
      a.vy -= dy * force
      b.vx += dx * force
      b.vy += dy * force
    }
  }

  for (const { source, target, distance } of links) {
    const dx = target.x + target.vx - source.x - source.vx
    const dy = target.y + target.vy - source.y - source.vy
    const length = Math.sqrt(dx * dx + dy * dy) || 1
    const pull = ((length - distance) / length) * alpha * LINK_STRENGTH
    target.vx -= dx * pull * 0.5
    target.vy -= dy * pull * 0.5
    source.vx += dx * pull * 0.5
    source.vy += dy * pull * 0.5
  }

  for (const node of nodes) {
    node.vx -= node.x * GRAVITY * alpha
    node.vy -= node.y * GRAVITY * alpha

    if (node.fx !== null && node.fy !== null) {
      node.x = node.fx
      node.y = node.fy
      node.vx = 0
      node.vy = 0
    } else {
      node.vx *= VELOCITY_DECAY
      node.vy *= VELOCITY_DECAY
      node.x += node.vx
      node.y += node.vy
    }
  }
}

/** Golden-angle spiral, so first paint is spread out and deterministic. */
function seedPosition(index: number) {
  const radius = 18 * Math.sqrt(index + 0.5)
  const angle = index * 2.399963
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

type Point = { x: number; y: number }
type SimLink = { source: SimNode; target: SimNode; distance: number }

/**
 * Owns the mutable simulation state and the animation loop. After every step
 * it hands React a fresh, immutable snapshot of positions, so rendering only
 * ever reads state — never mutable objects or refs.
 */
class ForceSimulation {
  private nodes = new Map<string, SimNode>()
  private links: SimLink[] = []
  private alpha = 1
  private alphaTarget = 0
  private frame: number | null = null

  constructor(private readonly publish: (positions: Map<string, Point>) => void) {}

  /** Replaces the graph, keeping positions of nodes that survive. */
  setGraph(
    nodeIds: string[],
    links: { source: string; target: string; distance: number }[]
  ) {
    const next = new Map<string, SimNode>()
    nodeIds.forEach((id, index) => {
      next.set(
        id,
        this.nodes.get(id) ?? { id, ...seedPosition(index), vx: 0, vy: 0, fx: null, fy: null }
      )
    })
    this.nodes = next
    this.links = links.flatMap((link) => {
      const source = next.get(link.source)
      const target = next.get(link.target)
      return source && target ? [{ source, target, distance: link.distance }] : []
    })
    this.reheat(0.8)
  }

  reheat(alpha = 0.6) {
    this.alpha = Math.max(this.alpha, alpha)
    if (this.frame === null && typeof window !== "undefined") {
      this.frame = requestAnimationFrame(this.loop)
    }
  }

  /** Pins a node under the pointer while it is dragged. */
  drag(id: string, point: Point) {
    const node = this.nodes.get(id)
    if (!node) return
    node.fx = point.x
    node.fy = point.y
    this.alphaTarget = 0.3
    this.reheat(0.3)
  }

  release(id: string) {
    const node = this.nodes.get(id)
    if (node) {
      node.fx = null
      node.fy = null
    }
    this.alphaTarget = 0
  }

  stop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.frame = null
  }

  private loop = () => {
    this.alpha += (this.alphaTarget - this.alpha) * ALPHA_DECAY
    step([...this.nodes.values()], this.links, this.alpha)

    const positions = new Map<string, Point>()
    for (const [id, node] of this.nodes) positions.set(id, { x: node.x, y: node.y })
    this.publish(positions)

    this.frame =
      this.alpha > ALPHA_MIN || this.alphaTarget > 0
        ? requestAnimationFrame(this.loop)
        : null
  }
}

/* -------------------------------------------------------------------------- */
/* View                                                                      */
/* -------------------------------------------------------------------------- */

type Transform = { x: number; y: number; k: number }

type Gesture =
  | { kind: "node"; id: string; startX: number; startY: number; moved: boolean }
  | { kind: "pan"; startX: number; startY: number; origin: Transform; moved: boolean }

function nodeRadius(node: GraphNode) {
  return node.kind === "tag" ? 7 + Math.sqrt(node.count) * 4 : 5
}

function formatDate(value: string) {
  return value.replaceAll("-", ".")
}

export function TagGraphView({
  activities,
  initialTag = null,
}: {
  activities: Activity[]
  initialTag?: string | null
}) {
  const [showActivities, setShowActivities] = React.useState(true)
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialTag ? tagNodeId(initialTag) : null
  )
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [transform, setTransform] = React.useState<Transform>({ x: 0, y: 0, k: 1 })
  const [size, setSize] = React.useState({ width: 800, height: 560 })
  const [positions, setPositions] = React.useState<Map<string, Point>>(
    () => new Map()
  )
  const [simulation] = React.useState(() => new ForceSimulation(setPositions))

  const containerRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const gestureRef = React.useRef<Gesture | null>(null)

  const graph = React.useMemo(
    () => buildTagGraph(activities, showActivities),
    [activities, showActivities]
  )
  const tags = React.useMemo(() => collectTags(activities), [activities])
  const categories = React.useMemo(() => collectCategories(activities), [activities])
  const colorOf = React.useCallback(
    (category: string) =>
      CATEGORY_COLORS[Math.max(0, categories.indexOf(category)) % CATEGORY_COLORS.length],
    [categories]
  )
  const usedCategories = React.useMemo(
    () =>
      categories.filter((category) =>
        activities.some(
          (activity) => activity.category === category && activity.tags.length > 0
        )
      ),
    [activities, categories]
  )

  // Feed the graph to the simulation. Nodes that survive a rebuild keep their
  // place, so toggling activity nodes does not scramble the layout.
  React.useEffect(() => {
    simulation.setGraph(
      graph.nodes.map((node) => node.id),
      graph.links.map((link) => ({
        source: link.source,
        target: link.target,
        distance: showActivities ? 70 : 110 - Math.min(link.weight, 4) * 10,
      }))
    )
  }, [graph, showActivities, simulation])

  React.useEffect(() => () => simulation.stop(), [simulation])

  // Track the container size so the SVG viewBox maps 1:1 to screen pixels.
  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const zoomAt = React.useCallback((factor: number, px = 0, py = 0) => {
    setTransform((current) => {
      const k = Math.min(4, Math.max(0.25, current.k * factor))
      const ratio = k / current.k
      return { k, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio }
    })
  }, [])

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  React.useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      const rect = svg!.getBoundingClientRect()
      zoomAt(
        Math.exp(-event.deltaY * 0.0015),
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2
      )
    }
    svg.addEventListener("wheel", handleWheel, { passive: false })
    return () => svg.removeEventListener("wheel", handleWheel)
  }, [zoomAt])

  function toGraphPoint(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - rect.width / 2 - transform.x) / transform.k,
      y: (clientY - rect.top - rect.height / 2 - transform.y) / transform.k,
    }
  }

  function handleNodePointerDown(event: React.PointerEvent, id: string) {
    event.stopPropagation()
    svgRef.current?.setPointerCapture(event.pointerId)
    gestureRef.current = {
      kind: "node",
      id,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
  }

  function handleBackgroundPointerDown(event: React.PointerEvent) {
    svgRef.current?.setPointerCapture(event.pointerId)
    gestureRef.current = {
      kind: "pan",
      startX: event.clientX,
      startY: event.clientY,
      origin: transform,
      moved: false,
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    const gesture = gestureRef.current
    if (!gesture) return

    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return
    gesture.moved = true

    if (gesture.kind === "pan") {
      setTransform({ ...gesture.origin, x: gesture.origin.x + dx, y: gesture.origin.y + dy })
      return
    }

    simulation.drag(gesture.id, toGraphPoint(event.clientX, event.clientY))
  }

  function handlePointerUp() {
    const gesture = gestureRef.current
    gestureRef.current = null
    if (!gesture) return

    if (gesture.kind === "node") {
      simulation.release(gesture.id)
      if (!gesture.moved) {
        setSelectedId((current) => (current === gesture.id ? null : gesture.id))
      }
    } else if (!gesture.moved) {
      setSelectedId(null)
    }
  }

  // Highlight the hovered (or else selected) node and its direct neighbours.
  const focusId = hoveredId ?? selectedId
  const neighbours = React.useMemo(() => {
    if (!focusId) return null
    const set = new Set([focusId])
    for (const link of graph.links) {
      if (link.source === focusId) set.add(link.target)
      if (link.target === focusId) set.add(link.source)
    }
    return set
  }, [focusId, graph.links])

  const isLinkLit = (link: GraphLink) =>
    !focusId || link.source === focusId || link.target === focusId

  const selectedNode = graph.nodes.find((node) => node.id === selectedId) ?? null
  const selectedTag =
    selectedNode?.kind === "tag"
      ? selectedNode.label
      : selectedId?.startsWith("tag:")
        ? selectedId.slice(4)
        : null
  const insight = React.useMemo(
    () => (selectedTag ? getTagInsight(activities, selectedTag) : null),
    [activities, selectedTag]
  )
  const selectedActivity =
    selectedNode?.kind === "activity"
      ? selectedNode.activity
      : selectedId?.startsWith("activity:")
        ? activities.find((activity) => activityNodeId(activity.id) === selectedId) ?? null
        : null

  if (tags.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          아직 태그가 달린 활동이 없습니다.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm underline underline-offset-2"
        >
          활동에 태그 달러 가기 →
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="태그 그래프" className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <NativeSelect
            aria-label="태그 선택"
            value={selectedTag ?? ""}
            onChange={(event) =>
              setSelectedId(event.target.value ? tagNodeId(event.target.value) : null)
            }
            wrapperClassName="w-44"
            className="h-8 rounded-full text-xs"
          >
            <option value="">태그 선택…</option>
            {tags.map(({ tag, count }) => (
              <option key={tag} value={tag}>
                {`#${tag} (${count})`}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            size="sm"
            variant={showActivities ? "secondary" : "ghost"}
            aria-pressed={showActivities}
            onClick={() => setShowActivities((value) => !value)}
            className="rounded-full"
          >
            활동 노드 {showActivities ? "표시 중" : "숨김"}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" size="icon-sm" variant="outline" aria-label="확대" onClick={() => zoomAt(1.25)}>
              +
            </Button>
            <Button type="button" size="icon-sm" variant="outline" aria-label="축소" onClick={() => zoomAt(0.8)}>
              −
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setTransform({ x: 0, y: 0, k: 1 })
                simulation.reheat(1)
              }}
            >
              다시 배치
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-muted/30 sm:h-[560px]"
        >
          <svg
            ref={svgRef}
            role="img"
            aria-label={`태그 ${tags.length}개와 활동의 연결 그래프`}
            width={size.width}
            height={size.height}
            viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
            className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={handleBackgroundPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
              <g>
                {graph.links.map((link) => {
                  const source = positions.get(link.source)
                  const target = positions.get(link.target)
                  if (!source || !target) return null
                  const lit = isLinkLit(link)
                  return (
                    <line
                      key={`${link.source}->${link.target}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={focusId && lit ? "var(--foreground)" : "var(--muted-foreground)"}
                      strokeOpacity={focusId ? (lit ? 0.7 : 0.08) : 0.35}
                      strokeWidth={(showActivities ? 1 : Math.min(1 + link.weight * 0.8, 4)) / transform.k}
                    />
                  )
                })}
              </g>
              <g>
                {graph.nodes.map((node) => {
                  const sim = positions.get(node.id)
                  if (!sim) return null
                  const radius = nodeRadius(node)
                  const dimmed = neighbours !== null && !neighbours.has(node.id)
                  const selected = node.id === selectedId
                  const showLabel =
                    node.kind === "tag" ||
                    transform.k >= 1.4 ||
                    (neighbours?.has(node.id) ?? false)

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${sim.x} ${sim.y})`}
                      opacity={dimmed ? 0.15 : 1}
                      className="cursor-pointer transition-opacity"
                      onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                      onPointerEnter={() => setHoveredId(node.id)}
                      onPointerLeave={() => setHoveredId(null)}
                    >
                      <circle
                        r={radius}
                        fill={
                          node.kind === "tag"
                            ? "var(--foreground)"
                            : colorOf(node.activity.category)
                        }
                        stroke={selected ? "var(--ring)" : "var(--background)"}
                        strokeWidth={selected ? 4 : 1.5}
                      />
                      {showLabel ? (
                        <text
                          y={radius + 12 / transform.k + 2}
                          textAnchor="middle"
                          fontSize={(node.kind === "tag" ? 12 : 10.5) / transform.k}
                          fontWeight={node.kind === "tag" ? 600 : 400}
                          fill={node.kind === "tag" ? "var(--foreground)" : "var(--muted-foreground)"}
                          stroke="var(--background)"
                          strokeWidth={3 / transform.k}
                          paintOrder="stroke"
                          className="pointer-events-none"
                        >
                          {node.kind === "tag"
                            ? `#${node.label}`
                            : node.label.length > 16
                              ? `${node.label.slice(0, 15)}…`
                              : node.label}
                        </text>
                      ) : null}
                    </g>
                  )
                })}
              </g>
            </g>
          </svg>

          <p className="pointer-events-none absolute bottom-3 left-3 text-[0.6875rem] text-muted-foreground">
            드래그로 이동 · 휠로 확대 · 노드를 눌러 자세히 보기
          </p>
        </div>

        {showActivities ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="범례">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-foreground" /> 태그
            </li>
            {usedCategories.map((category) => (
              <li key={category} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: colorOf(category) }} />
                {category}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            같은 활동에 함께 달린 태그끼리 연결됩니다. 선이 굵을수록 함께 쓰인 활동이 많습니다.
          </p>
        )}
      </section>

      <aside className="rounded-2xl border border-border bg-card p-5 lg:max-h-[620px] lg:overflow-y-auto">
        {insight && selectedTag ? (
          <TagPanel
            tag={selectedTag}
            insight={insight}
            colorOf={colorOf}
            onSelect={setSelectedId}
          />
        ) : selectedActivity ? (
          <ActivityPanel activity={selectedActivity} onSelectTag={(tag) => setSelectedId(tagNodeId(tag))} />
        ) : (
          <div className="text-sm text-muted-foreground">
            <h2 className="font-heading text-base font-medium text-foreground">
              태그를 선택해 보세요
            </h2>
            <p className="mt-2 leading-relaxed">
              태그 노드를 누르면 그 키워드와 연결된 활동, 함께 쓰인 태그, 그리고 생기부에서
              주제를 확장할 수 있는 아이디어를 보여드립니다.
            </p>
            <h3 className="mt-5 text-xs font-medium text-foreground">많이 쓴 태그</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 12).map(({ tag, count }) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(tagNodeId(tag))}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs hover:text-foreground"
                  >
                    #{tag} <span className="tabular-nums">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}

function TagPanel({
  tag,
  insight,
  colorOf,
  onSelect,
}: {
  tag: string
  insight: NonNullable<ReturnType<typeof getTagInsight>>
  colorOf: (category: string) => string
  onSelect: (id: string) => void
}) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground">태그</p>
      <h2 className="font-heading text-lg font-semibold tracking-tight">#{tag}</h2>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        활동 {insight.activities.length}개 · {formatDate(insight.firstDate)} – {formatDate(insight.lastDate)}
      </p>
      <Link
        href={`/dashboard?tag=${encodeURIComponent(tag)}`}
        className="mt-2 inline-block text-xs underline underline-offset-2"
      >
        대시보드에서 이 태그로 보기 →
      </Link>

      <h3 className="mt-5 text-xs font-medium">연결된 활동</h3>
      <ol className="mt-2 space-y-1.5">
        {insight.activities.map((activity) => (
          <li key={activity.id}>
            <button
              type="button"
              onClick={() => onSelect(activityNodeId(activity.id))}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
            >
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ background: colorOf(activity.category) }}
              />
              <span className="min-w-0">
                <span className="block truncate">{activity.title}</span>
                <span className="text-xs text-muted-foreground">
                  {activity.category} · {formatDate(activity.start_date)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {insight.related.length > 0 ? (
        <>
          <h3 className="mt-5 text-xs font-medium">함께 쓰인 태그</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {insight.related.slice(0, 10).map((related) => (
              <li key={related.tag}>
                <button
                  type="button"
                  onClick={() => onSelect(tagNodeId(related.tag))}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  #{related.tag} <span className="tabular-nums">×{related.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className="mt-5 text-xs font-medium">확장 아이디어</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        다룬 영역: {insight.coveredCategories.join(", ")}
      </p>
      <ul className="mt-2 space-y-2">
        {insight.ideas.map((idea) => (
          <li
            key={idea}
            className="rounded-xl border border-dashed border-border px-3 py-2 text-[0.8125rem] leading-relaxed"
          >
            {idea}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActivityPanel({
  activity,
  onSelectTag,
}: {
  activity: Activity
  onSelectTag: (tag: string) => void
}) {
  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{activity.category}</Badge>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(activity.start_date)}
          {activity.end_date ? ` – ${formatDate(activity.end_date)}` : " · 진행 중"}
        </span>
      </div>
      <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">
        {activity.title}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {activity.tags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              onClick={() => onSelectTag(tag)}
              className={cn("rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground")}
            >
              #{tag}
            </button>
          </li>
        ))}
      </ul>
      {activity.description ? (
        <Markdown className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {activity.description}
        </Markdown>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">등록된 설명이 없습니다.</p>
      )}
    </div>
  )
}
