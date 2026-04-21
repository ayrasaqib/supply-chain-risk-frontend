"use client"

import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getRiskLevelLabel } from "@/lib/risk-calculator"

interface ForecastEntry {
  date: Date
  riskScore: number
  riskLevel: "low" | "elevated" | "high" | "critical"
  primaryDriver: string
}

interface RiskAnalysisForecastProps {
  forecast: ForecastEntry[]
}

function DailyRiskRow({ daily, isToday }: { daily: ForecastEntry; isToday: boolean }) {
  const color = RISK_COLORS[daily.riskLevel]
  const dayName = daily.date.toLocaleDateString("en-US", { weekday: "short" })
  const dateStr = daily.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        isToday ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/30"
      )}
    >
      <div className="w-16 shrink-0">
        <p className={cn("text-sm font-medium", isToday && "text-primary")}>
          {isToday ? "Today" : dayName}
        </p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {daily.riskScore}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium" style={{ color }}>
            {getRiskLevelLabel(daily.riskLevel)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Weather primary driver: {daily.primaryDriver}
          </p>
        </div>
      </div>
    </div>
  )
}

function WeeklyTrend({ forecast }: { forecast: ForecastEntry[] }) {
  if (forecast.length < 2) return null

  const firstScore = forecast[0].riskScore
  const lastScore = forecast[forecast.length - 1].riskScore
  const diff = lastScore - firstScore
  const avgScore = Math.round(forecast.reduce((sum, day) => sum + day.riskScore, 0) / forecast.length)
  const maxRisk = forecast.reduce((max, day) => (day.riskScore > max.riskScore ? day : max), forecast[0])

  let TrendIcon = Minus
  let trendColor = "text-muted-foreground"
  let trendText = "Stable"

  if (diff > 10) {
    TrendIcon = TrendingUp
    trendColor = "text-red-500"
    trendText = "Increasing"
  } else if (diff < -10) {
    TrendIcon = TrendingDown
    trendColor = "text-emerald-500"
    trendText = "Decreasing"
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">7-Day Avg</p>
        <p className="text-lg font-bold text-foreground">{avgScore}</p>
      </div>
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">Peak Risk</p>
        <p className="text-lg font-bold" style={{ color: RISK_COLORS[maxRisk.riskLevel] }}>
          {maxRisk.riskScore}
        </p>
        <p className="text-xs text-muted-foreground">
          {maxRisk.date.toLocaleDateString("en-US", { weekday: "short" })}
        </p>
      </div>
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">Trend</p>
        <div className={cn("flex items-center justify-center gap-1", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{trendText}</span>
        </div>
      </div>
    </div>
  )
}

function CombinedRiskTrendChart({ forecast }: { forecast: ForecastEntry[] }) {
  const chartData = forecast.map((day) => ({
    day: day.date.toLocaleDateString("en-US", { weekday: "short" }),
    fullDate: day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    riskScore: day.riskScore,
  }))

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Combined Risk Score Trend</h3>
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-3">
        <ChartContainer
          config={{
            riskScore: {
              label: "Combined Risk Score",
              color: "#f97316",
            },
          }}
          className="h-[260px] min-h-[260px] w-full"
        >
          <LineChart data={chartData} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#94a3b8"
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#94a3b8"
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(249, 115, 22, 0.3)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelKey="fullDate"
                  formatter={(value) => [`${value}%`, "Combined Risk Score"]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="riskScore"
              stroke="var(--color-riskScore)"
              strokeWidth={3}
              dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#fdba74", stroke: "#f97316", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  )
}

export function RiskAnalysisForecast({ forecast }: RiskAnalysisForecastProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-4 p-4">
      <WeeklyTrend forecast={forecast} />

      {forecast.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Daily Breakdown</h3>
          <div className="space-y-2">
            {forecast.map((daily, index) => {
              const dailyDate = new Date(daily.date)
              dailyDate.setHours(0, 0, 0, 0)
              const isToday = dailyDate.getTime() === today.getTime()

              return <DailyRiskRow key={index} daily={daily} isToday={isToday} />
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
          No daily risk entries were returned by the API for this hub yet.
        </div>
      )}

      {forecast.length > 0 && <CombinedRiskTrendChart forecast={forecast} />}
    </div>
  )
}
