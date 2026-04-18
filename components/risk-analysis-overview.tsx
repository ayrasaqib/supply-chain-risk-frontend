"use client"

import { GeopoliticalRiskCard, WeatherRiskCard } from "./risk-factor-card"
import { RiskScoreGauge } from "./risk-score-gauge"
import { Badge } from "@/components/ui/badge"
import type {
  ApiGeopoliticalRiskFactor,
  ApiWeatherRiskFactor,
  GeopoliticalRisk,
  RiskLevel,
  WeatherRisk,
} from "@/lib/types"

interface RiskAnalysisOverviewProps {
  riskScore: number
  riskLevel: RiskLevel
  weatherRisk: WeatherRisk | ApiWeatherRiskFactor
  geopoliticalRisk: GeopoliticalRisk | ApiGeopoliticalRiskFactor
  latestAssessmentDate?: string | Date | null
  latestWorstInterval?: string | Date | null
  daysAssessed?: number | null
  peakDay?: string | Date | null
  peakDayNumber?: number | null
  region: string
  latitude: number
  longitude: number
  dataSource?: string | null
  datasetType?: string | null
  modelVersion?: string | null
}

function formatDateLabel(value?: string | Date | null) {
  if (!value) return "Unavailable"

  const parsedDate = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return String(value)

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTimeLabel(value?: string | Date | null) {
  if (!value) return "Unavailable"

  const parsedDate = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return String(value)

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function RiskAnalysisOverview({
  riskScore,
  riskLevel,
  weatherRisk,
  geopoliticalRisk,
  latestAssessmentDate,
  latestWorstInterval,
  daysAssessed,
  peakDay,
  peakDayNumber,
  region,
  latitude,
  longitude,
  dataSource,
  datasetType,
  modelVersion,
}: RiskAnalysisOverviewProps) {
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Combined Risk Score
        </h3>
        <RiskScoreGauge score={riskScore} size="lg" />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Risk Breakdown</h3>
        <WeatherRiskCard risk={weatherRisk} />
        <GeopoliticalRiskCard risk={geopoliticalRisk} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Assessment Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Latest Assessment</span>
            <p className="font-medium">{formatDateLabel(latestAssessmentDate)}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Worst Interval</span>
            <p className="font-medium">{formatDateTimeLabel(latestWorstInterval)}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Days Assessed</span>
            <p className="font-medium">{daysAssessed ?? "Unavailable"}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Peak Day</span>
            <p className="font-medium">
              {peakDay
                ? `${formatDateLabel(peakDay)}${peakDayNumber ? ` (Day ${peakDayNumber})` : ""}`
                : "Unavailable"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Location Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Region</span>
            <p className="font-medium">{region}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Coordinates</span>
            <p className="font-mono text-xs">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Model Metadata</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Data Source</span>
            <p className="font-medium">{dataSource ?? "Unavailable"}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Dataset Type</span>
            <p className="font-medium">{datasetType ?? "Unavailable"}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Model Version</span>
            <p className="font-medium">{modelVersion ?? "Unavailable"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Recommended Actions</h3>
        <div className="space-y-2 text-sm">
          {riskLevel === "critical" && (
            <Badge
              variant="destructive"
              className="w-full justify-start px-3 py-2 text-xs font-normal"
            >
              Immediate action required. Consider an alternative location or route.
            </Badge>
          )}
          {riskLevel === "high" && (
            <Badge className="w-full justify-start bg-orange-500/20 px-3 py-2 text-xs font-normal text-orange-400 hover:bg-orange-500/30">
              Activate contingency plans and monitor new risk runs closely.
            </Badge>
          )}
          {riskLevel === "elevated" && (
            <Badge className="w-full justify-start bg-amber-500/20 px-3 py-2 text-xs font-normal text-amber-400 hover:bg-amber-500/30">
              Continue monitoring and prepare backup options if conditions worsen.
            </Badge>
          )}
          {riskLevel === "low" && (
            <Badge className="w-full justify-start bg-emerald-500/20 px-3 py-2 text-xs font-normal text-emerald-400 hover:bg-emerald-500/30">
              Normal operations look acceptable. Keep routine monitoring in place.
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
