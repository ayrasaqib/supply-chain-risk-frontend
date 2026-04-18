"use client"

import { Marker } from "react-simple-maps"
import type { SupplyChainHub } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HubMarkerProps {
  hub: SupplyChainHub
  isSelected: boolean
  zoom: number
  onSelect: (hub: SupplyChainHub) => void
}

export function HubMarker({ hub, isSelected, zoom, onSelect }: HubMarkerProps) {
  const color = RISK_COLORS[hub.riskLevel]
  const isCritical = hub.riskLevel === "critical"
  const isHighRisk = hub.riskLevel === "high" || hub.riskLevel === "critical"
  const zoomScale = 1 / Math.max(1, Math.sqrt(zoom))
  const baseRadius = Math.max(3.2, Math.min(6, 5.4 * zoomScale + 0.4))
  const markerRadius = isSelected ? Math.min(baseRadius + 1.1, 6.8) : baseRadius
  const glowRadius = Math.min(markerRadius + 1.8, 8.4)
  const pulseRadius = Math.min(markerRadius + 3.4, 10.5)

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
            r={pulseRadius}
            fill={color}
            opacity={0.3}
            className={cn(isCritical ? "animate-ping" : "animate-pulse")}
          />
        )}

        {/* Glow effect */}
        <circle r={glowRadius} fill={color} opacity={0.2} />

        {/* Main marker */}
        <circle
          r={markerRadius}
          fill={color}
          stroke={isSelected ? "#ffffff" : color}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-200"
        />

        {/* Inner highlight */}
        <circle r={Math.max(2.5, markerRadius * 0.45)} fill="#ffffff" opacity={0.6} />
      </g>
    </Marker>
  )
}
