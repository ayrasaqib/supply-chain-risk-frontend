"use client"

import { Activity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { RiskSummary } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"

interface DashboardHeaderProps {
  summary: RiskSummary
  onRefresh: () => void
  isLoading?: boolean
}

export function DashboardHeader({ summary, onRefresh, isLoading }: DashboardHeaderProps) {
  const formattedDate = summary.lastUpdated.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        {/* Title and status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Supply Chain Risk Monitor</h1>
            <p className="text-xs text-muted-foreground">
              Monitoring {summary.totalHubs} global supply chain hubs
            </p>
          </div>
        </div>

        {/* Hub risk counts */}
        <div className="flex flex-wrap items-center gap-2">
          <HubCount label="Low" count={summary.lowRisk} color={RISK_COLORS.low} />
          <HubCount label="Elevated" count={summary.elevatedRisk} color={RISK_COLORS.elevated} />
          <HubCount label="High" count={summary.highRisk} color={RISK_COLORS.high} />
          <HubCount label="Critical" count={summary.criticalRisk} color={RISK_COLORS.critical} />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Average risk indicator */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Avg Risk</span>
            <span className="text-lg font-bold text-foreground">{summary.averageRisk}</span>
          </div>

          {/* Last updated */}
          <div className="hidden text-xs text-muted-foreground lg:block">
            Updated: {formattedDate}
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

function HubCount({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 px-2 py-1"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}15` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium" style={{ color }}>
        {count} {label}
      </span>
    </Badge>
  )
}
