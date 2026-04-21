"use client"

import { X, MapPin, Clock, Calendar } from "lucide-react"
import { RiskAnalysisForecast } from "./risk-analysis-forecast"
import { RiskAnalysisOverview } from "./risk-analysis-overview"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SupplyChainHub } from "@/lib/types"

interface RiskPanelProps {
  hub: SupplyChainHub | null
  onClose: () => void
  isLoading?: boolean
  loadError?: string | null
}

export function RiskPanel({ hub, onClose, isLoading = false, loadError = null }: RiskPanelProps) {
  if (!hub) return null

  const headerLocation = hub.country === "Custom Location" ? `${hub.id} • ${hub.region}` : `${hub.country} • ${hub.region}`
  const formattedDate = hub.lastUpdated.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={`fixed right-0 top-0 z-50 h-full w-full max-w-full border-l border-border bg-background shadow-2xl transform transition-transform duration-300 ease-out md:max-w-[38rem] lg:max-w-[42rem] ${hub ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">{hub.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{headerLocation}</span>
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
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 bg-slate-900/70 p-1 text-slate-400">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="gap-1.5 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            7-Day Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            {isLoading && hub.riskDataAvailable === false ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
                <Spinner className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Loading risk analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Running ingestion and risk analysis for this hub.
                  </p>
                </div>
              </div>
            ) : (
              <RiskAnalysisOverview
                riskScore={hub.riskScore}
                riskLevel={hub.riskLevel}
                weatherRisk={hub.apiRiskFactors?.weather ?? hub.riskFactors.weather}
                geopoliticalRisk={hub.apiRiskFactors?.geopolitical ?? hub.riskFactors.geopolitical}
                latestAssessmentDate={hub.latestAssessmentDate ?? hub.apiRisk?.currentDate ?? hub.weeklyForecast[0]?.date}
                latestWorstInterval={hub.latestWorstInterval ?? hub.apiRisk?.worstInterval}
                daysAssessed={hub.daysAssessed ?? (hub.weeklyForecast.length > 0 ? hub.weeklyForecast.length : undefined)}
                peakDay={hub.peakDay}
                peakDayNumber={hub.peakDayNumber}
                country={hub.country}
                region={hub.region}
                latitude={hub.location.latitude}
                longitude={hub.location.longitude}
                dataSource={hub.apiRisk?.dataSource}
                datasetType={hub.apiRisk?.datasetType}
                modelVersion={hub.apiRisk?.modelVersion}
              />
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="forecast" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <RiskAnalysisForecast
              forecast={hub.weeklyForecast}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {loadError && hub.riskDataAvailable === false && (
        <div className="border-t border-border px-4 py-3 text-sm text-amber-300">
          {loadError}
        </div>
      )}
    </div>
  )
}
