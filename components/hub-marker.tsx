"use client"

import { Marker } from "react-simple-maps"
import type { SupplyChainHub } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HubMarkerProps {
  hub: SupplyChainHub
  isSelected: boolean
  onSelect: (hub: SupplyChainHub) => void
}

export function HubMarker({ hub, isSelected, onSelect }: HubMarkerProps) {
  const color = RISK_COLORS[hub.riskLevel]
  const isCritical = hub.riskLevel === "critical"
  const isHighRisk = hub.riskLevel === "high" || hub.riskLevel === "critical"

  return (
    <Marker coordinates={[hub.location.longitude, hub.location.latitude]}>
      <g
        onClick={() => onSelect(hub)}
        className="cursor-pointer transition-transform hover:scale-110"
        style={{ transform: isSelected ? "scale(1.2)" : "scale(1)" }}
      >
        {/* Pulse animation for high-risk hubs */}
        {isHighRisk && (
          <circle
            r={12}
            fill={color}
            opacity={0.3}
            className={cn(isCritical ? "animate-ping" : "animate-pulse")}
          />
        )}

        {/* Glow effect */}
        <circle r={10} fill={color} opacity={0.2} />

        {/* Main marker */}
        <circle
          r={isSelected ? 8 : 6}
          fill={color}
          stroke={isSelected ? "#ffffff" : color}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-200"
        />

        {/* Inner highlight */}
        <circle r={3} fill="#ffffff" opacity={0.6} />
      </g>
    </Marker>
  )
}
