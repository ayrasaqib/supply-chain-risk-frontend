"use client"

import { RISK_COLORS } from "@/lib/types"
import { getRiskLevelLabel } from "@/lib/risk-calculator"
import type { RiskLevel } from "@/lib/types"

const levels: RiskLevel[] = ["low", "elevated", "high", "critical"]

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border/50 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Risk Level
      </h4>
      <div className="flex flex-col gap-1.5">
        {levels.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: RISK_COLORS[level] }}
            />
            <span className="text-xs text-foreground">{getRiskLevelLabel(level)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
