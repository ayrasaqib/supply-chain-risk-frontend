"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Globe } from "lucide-react"
import type { GeopoliticalRisk, WeatherRisk } from "@/lib/types"
import { getRiskLevel } from "@/lib/risk-calculator"
import { RISK_COLORS } from "@/lib/types"

interface ApiWeatherRiskCardData {
  score: number
  primaryDriver?: string | null
  primaryDriverLabel?: string | null
  forecast?: string | null
}

interface ApiGeopoliticalRiskCardData {
  score: number
  articleCount?: number | null
  sentiment?: {
    positive?: number | null
    neutral?: number | null
    negative?: number | null
  }
}

interface WeatherRiskCardProps {
  risk: WeatherRisk | ApiWeatherRiskCardData
  showPrimaryDriver?: boolean
}

interface GeopoliticalRiskCardProps {
  risk: GeopoliticalRisk | ApiGeopoliticalRiskCardData
}

function getPrimaryWeatherDriver(risk: WeatherRisk): { driver: string; severity: string } {
  const factors = [
    { name: "Storm Activity", value: risk.stormProbability },
    { name: "Flood Conditions", value: risk.floodRisk },
    { name: "Temperature Extremes", value: Math.abs(risk.temperatureAnomaly) * 10 },
  ]
  const primary = factors.reduce((max, factor) => (factor.value > max.value ? factor : max), factors[0])

  let severity = "Low"
  if (primary.value > 60) severity = "Severe"
  else if (primary.value > 40) severity = "Elevated"
  else if (primary.value > 20) severity = "Moderate"

  return { driver: primary.name, severity }
}

function getPrimaryGeopoliticalDriver(risk: GeopoliticalRisk): { driver: string; severity: string } {
  const factors = [
    { name: "Trade Restrictions", value: risk.tradeRestrictions },
    { name: "Regional Instability", value: 100 - risk.regionalStability },
    { name: "Regulatory Changes", value: risk.regulatoryChanges },
  ]
  const primary = factors.reduce((max, factor) => (factor.value > max.value ? factor : max), factors[0])

  let severity = "Low"
  if (primary.value > 60) severity = "Severe"
  else if (primary.value > 40) severity = "Elevated"
  else if (primary.value > 20) severity = "Moderate"

  return { driver: primary.name, severity }
}

function isLegacyWeatherRisk(risk: WeatherRisk | ApiWeatherRiskCardData): risk is WeatherRisk {
  return "stormProbability" in risk
}

function isLegacyGeopoliticalRisk(
  risk: GeopoliticalRisk | ApiGeopoliticalRiskCardData
): risk is GeopoliticalRisk {
  return "tradeRestrictions" in risk
}

export function WeatherRiskCard({ risk, showPrimaryDriver = true }: WeatherRiskCardProps) {
  const color = RISK_COLORS[getRiskLevel(risk.score)]
  const isLegacy = isLegacyWeatherRisk(risk)
  const legacyDetails = isLegacy ? getPrimaryWeatherDriver(risk) : null
  const driver = legacyDetails?.driver ?? (!isLegacy ? risk.primaryDriver : null) ?? "Weather conditions"
  const driverLabel = !isLegacy ? risk.primaryDriverLabel ?? "Primary Driver" : "Primary Driver"
  const severity = legacyDetails?.severity
  const forecast = "forecast" in risk ? risk.forecast : null

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <CloudRain className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <span>Weather Risk</span>
            <span className="text-lg font-bold" style={{ color }}>
              {risk.score}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showPrimaryDriver && (
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">{driverLabel}</span>
            <p className="font-medium text-foreground">{driver}</p>
            {severity && (
              <span className="text-xs" style={{ color }}>
                {severity}
              </span>
            )}
          </div>
        )}
        {forecast && <p className="text-xs text-muted-foreground">{forecast}</p>}
      </CardContent>
    </Card>
  )
}

export function GeopoliticalRiskCard({ risk }: GeopoliticalRiskCardProps) {
  const color = RISK_COLORS[getRiskLevel(risk.score)]
  const legacyDetails = isLegacyGeopoliticalRisk(risk) ? getPrimaryGeopoliticalDriver(risk) : null
  const articleCount = !isLegacyGeopoliticalRisk(risk) ? risk.articleCount : null
  const sentiment = !isLegacyGeopoliticalRisk(risk) ? risk.sentiment : null

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
            <Globe className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <span>Geopolitical Risk</span>
            <span className="text-lg font-bold" style={{ color }}>
              {risk.score}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      {legacyDetails ? (
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Primary Driver</span>
            <p className="font-medium text-foreground">{legacyDetails.driver}</p>
            <span className="text-xs" style={{ color }}>
              {legacyDetails.severity}
            </span>
          </div>
        </CardContent>
      ) : articleCount !== null || sentiment ? (
        <CardContent className="space-y-3">
          {articleCount !== null && articleCount !== undefined && (
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Article Count</span>
              <p className="font-medium text-foreground">{articleCount}</p>
            </div>
          )}
          {sentiment && (
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Sentiment Distribution</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-300">Positive</p>
                  <p className="text-sm font-semibold text-emerald-100">{sentiment.positive ?? 0}</p>
                </div>
                <div className="rounded-md border border-slate-400/20 bg-slate-400/10 px-2 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">Neutral</p>
                  <p className="text-sm font-semibold text-slate-100">{sentiment.neutral ?? 0}</p>
                </div>
                <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-rose-300">Negative</p>
                  <p className="text-sm font-semibold text-rose-100">{sentiment.negative ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}
