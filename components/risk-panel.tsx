"use client"

import { X, MapPin, Clock, AlertTriangle, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RiskScoreGauge } from "./risk-score-gauge"
import {
  WeatherRiskCard,
  GeopoliticalRiskCard,
} from "./risk-factor-card"
import type { SupplyChainHub, DailyRisk } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getRiskLevelLabel } from "@/lib/risk-calculator"

interface RiskPanelProps {
  hub: SupplyChainHub | null
  onClose: () => void
}

function DailyRiskRow({ daily, isToday }: { daily: DailyRisk; isToday: boolean }) {
  const color = RISK_COLORS[daily.riskLevel]
  const dayName = daily.date.toLocaleDateString("en-US", { weekday: "short" })
  const dateStr = daily.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        isToday
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-card/30"
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

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color }}>
            {getRiskLevelLabel(daily.riskLevel)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {daily.primaryDriver}
          </p>
        </div>
      </div>
    </div>
  )
}

function WeeklyTrend({ forecast }: { forecast: DailyRisk[] }) {
  if (forecast.length < 2) return null

  const firstScore = forecast[0].riskScore
  const lastScore = forecast[forecast.length - 1].riskScore
  const diff = lastScore - firstScore
  const avgScore = Math.round(forecast.reduce((sum, d) => sum + d.riskScore, 0) / forecast.length)
  const maxRisk = forecast.reduce((max, d) => d.riskScore > max.riskScore ? d : max, forecast[0])
  const minRisk = forecast.reduce((min, d) => d.riskScore < min.riskScore ? d : min, forecast[0])

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

export function RiskPanel({ hub, onClose }: RiskPanelProps) {
  if (!hub) return null

  const color = RISK_COLORS[hub.riskLevel]
  const formattedDate = hub.lastUpdated.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background shadow-2xl",
        "transform transition-transform duration-300 ease-out",
        hub ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">{hub.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {hub.country} • {hub.region}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated {formattedDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="flex h-[calc(100vh-100px)] flex-col">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            7-Day Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* Overall Risk Score */}
              <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Composite Risk Score
                </h3>
                <RiskScoreGauge score={hub.riskScore} size="lg" />
              </div>

              {/* Active Alerts */}
              {hub.alerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Active Alerts
                  </h3>
                  <div className="space-y-2">
                    {hub.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
                      >
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factor Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Risk Breakdown</h3>
                <WeatherRiskCard risk={hub.riskFactors.weather} />
                <GeopoliticalRiskCard risk={hub.riskFactors.geopolitical} />
              </div>

              {/* Hub Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Hub Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <p className="font-medium capitalize">{hub.type}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Coordinates</span>
                    <p className="font-mono text-xs">
                      {hub.location.latitude.toFixed(2)}, {hub.location.longitude.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Recommended Actions
                </h3>
                <div className="space-y-2 text-sm">
                  {hub.riskLevel === "critical" && (
                    <Badge
                      variant="destructive"
                      className="w-full justify-start px-3 py-2 text-xs font-normal"
                    >
                      Immediate action required - Consider alternative routing
                    </Badge>
                  )}
                  {hub.riskLevel === "high" && (
                    <Badge className="w-full justify-start bg-orange-500/20 px-3 py-2 text-xs font-normal text-orange-400 hover:bg-orange-500/30">
                      Activate contingency plans - Monitor situation closely
                    </Badge>
                  )}
                  {hub.riskLevel === "elevated" && (
                    <Badge className="w-full justify-start bg-amber-500/20 px-3 py-2 text-xs font-normal text-amber-400 hover:bg-amber-500/30">
                      Continue monitoring - Prepare backup options
                    </Badge>
                  )}
                  {hub.riskLevel === "low" && (
                    <Badge className="w-full justify-start bg-emerald-500/20 px-3 py-2 text-xs font-normal text-emerald-400 hover:bg-emerald-500/30">
                      Normal operations - Routine monitoring recommended
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="forecast" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {/* Weekly Summary */}
              <WeeklyTrend forecast={hub.weeklyForecast} />

              {/* Daily Breakdown */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Daily Breakdown</h3>
                <div className="space-y-2">
                  {hub.weeklyForecast.map((daily, index) => {
                    const dailyDate = new Date(daily.date)
                    dailyDate.setHours(0, 0, 0, 0)
                    const isToday = dailyDate.getTime() === today.getTime()
                    return (
                      <DailyRiskRow key={index} daily={daily} isToday={isToday} />
                    )
                  })}
                </div>
              </div>

              {/* Forecast Note */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Risk predictions are generated daily using meteorological data and 
                  geopolitical indicators. Forecasts beyond 3 days have increased uncertainty.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
