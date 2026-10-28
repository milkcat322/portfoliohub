"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type CategoryStatistic = {
  category: string
  count: number
}

export type YearStatistic = {
  year: string
  count: number
}

type StatisticsChartsProps = {
  categoryData: CategoryStatistic[]
  yearData: YearStatistic[]
}

const CHART_COLORS = [
  "#1d1d1f",
  "#6e6e73",
  "#a1a1a6",
  "#c7c7cc",
  "#0071e3",
  "#34c759",
  "#ff9f0a",
  "#ff375f",
]

export function StatisticsCharts({
  categoryData,
  yearData,
}: StatisticsChartsProps) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl py-6 ring-border">
        <CardHeader className="px-6">
          <CardTitle className="text-base tracking-tight">
            카테고리별 활동 비율
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {categoryData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {categoryData.map((item, index) => (
                      <Cell
                        key={item.category}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}개`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              표시할 활동이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl py-6 ring-border">
        <CardHeader className="px-6">
          <CardTitle className="text-base tracking-tight">
            연도별 활동 수
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {yearData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearData}
                  margin={{ top: 8, right: 12, bottom: 4, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value}개`, "활동"]} />
                  <Bar
                    dataKey="count"
                    name="활동"
                    fill="#1d1d1f"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              표시할 활동이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
