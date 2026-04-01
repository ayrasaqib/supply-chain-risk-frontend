"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Globe } from "lucide-react"
import type { WeatherRisk, GeopoliticalRisk } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { getRiskLevel } from "@/lib/risk-calculator"

interface WeatherRiskCardProps {
  risk: WeatherRisk
}

interface GeopoliticalRiskCardProps {
  risk: GeopoliticalRisk
}

function getPrimaryWeatherDriver(risk: WeatherRisk): { driver: string; severity: string } {
  const factors = [
    { name: "Storm Activity", value: risk.stormProbability },
    { name: "Flood Conditions", value: risk.floodRisk },
    { name: "Temperature Extremes", value: Math.abs(risk.temperatureAnomaly) * 10 },
  ]
  const primary = factors.reduce((max, f) => (f.value > max.value ? f : max), factors[0])
  
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
  const primary = factors.reduce((max, f) => (f.value > max.value ? f : max), factors[0])
  
  let severity = "Low"
  if (primary.value > 60) severity = "Severe"
  else if (primary.value > 40) severity = "Elevated"
  else if (primary.value > 20) severity = "Moderate"
  
  return { driver: primary.name, severity }
}

export function WeatherRiskCard({ risk }: WeatherRiskCardProps) {
  const color = RISK_COLORS[getRiskLevel(risk.score)]
  const { driver, severity } = getPrimaryWeatherDriver(risk)

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
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Primary Driver</span>
          <p className="font-medium text-foreground">{driver}</p>
          <span className="text-xs" style={{ color }}>{severity}</span>
        </div>
        <p className="text-xs text-muted-foreground">{risk.forecast}</p>
      </CardContent>
    </Card>
  )
}

export function GeopoliticalRiskCard({ risk }: GeopoliticalRiskCardProps) {
  const color = RISK_COLORS[getRiskLevel(risk.score)]
  const { driver, severity } = getPrimaryGeopoliticalDriver(risk)

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
      <CardContent className="space-y-3">
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Primary Driver</span>
          <p className="font-medium text-foreground">{driver}</p>
          <span className="text-xs" style={{ color }}>{severity}</span>
        </div>
      </CardContent>
    </Card>
  )
}
