"use client"

import { Layers3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HubViewMode } from "@/lib/map-config"

interface MapControlsProps {
  viewMode: HubViewMode
  selectedRegion: string | null
  regions: string[]
  onViewModeChange: (mode: HubViewMode) => void
  onRegionChange: (region: string | null) => void
}

export function MapControls({
  viewMode,
  selectedRegion,
  regions,
  onViewModeChange,
  onRegionChange,
}: MapControlsProps) {
  return (
    <div className="flex w-[min(14rem,calc(100vw-2rem))] flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(
            "h-8 w-full justify-start border border-white/10 bg-white/8 text-slate-100 hover:bg-white/12",
            viewMode === "top" && !selectedRegion && "bg-white/18 text-white hover:bg-white/22"
          )}
          onClick={() => onViewModeChange("top")}
        >
          <Layers3 className="h-4 w-4" />
          Top 15
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(
            "h-8 px-2 text-[11px] border border-white/10 bg-white/8 text-slate-100 hover:bg-white/12",
            selectedRegion === null && "bg-white/18 text-white hover:bg-white/22"
          )}
          onClick={() => onRegionChange(null)}
        >
          Global
        </Button>
        {regions.map((region) => (
          <Button
            key={region}
            type="button"
            size="sm"
            variant="secondary"
            className={cn(
              "h-auto min-h-8 px-2 py-1 text-[11px] leading-tight border border-white/10 bg-white/8 text-slate-100 hover:bg-white/12",
              selectedRegion === region && "bg-white/18 text-white hover:bg-white/22 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            )}
            onClick={() => onRegionChange(region)}
          >
            {region}
          </Button>
        ))}
      </div>
    </div>
  )
}
