"use client"

import { Marker } from "react-simple-maps"
import type { SupplyChainHub } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"

interface HubMarkerProps {
  hub: SupplyChainHub
  isSelected: boolean
  zoom: number
  onSelect: (hub: SupplyChainHub) => void
}

export function HubMarker({ hub, isSelected, zoom, onSelect }: HubMarkerProps) {
  const color = RISK_COLORS[hub.riskLevel]
  const zoomScale = 1 / Math.max(1, Math.sqrt(zoom))
  const baseRadius = Math.max(3.2, Math.min(6, 5.4 * zoomScale + 0.4))
  const markerRadius = isSelected ? Math.min(baseRadius + 1.1, 6.8) : baseRadius
  const glowRadius = Math.min(markerRadius + 1.8, 8.4)
  const pulseStartRadius = Math.min(markerRadius + 1.2, 8.2)
  const pulseEndRadius = Math.min(markerRadius + 4.6, 12)
  const pulseDuration = isSelected ? "1.6s" : "2.2s"

  return (
    <Marker coordinates={[hub.location.longitude, hub.location.latitude]}>
      <g
        onClick={() => onSelect(hub)}
        className="cursor-pointer transition-transform hover:scale-110"
        style={{ transform: isSelected ? "scale(1.2)" : "scale(1)" }}
      >
        {/* Expanding pulse ring keeps each hub visible without overpowering the map. */}
        <circle r={pulseStartRadius} fill={color} opacity={0.18}>
          <animate
            attributeName="r"
            values={`${pulseStartRadius};${pulseEndRadius};${pulseStartRadius}`}
            dur={pulseDuration}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={isSelected ? "0.32;0.08;0.32" : "0.18;0.04;0.18"}
            dur={pulseDuration}
            repeatCount="indefinite"
          />
        </circle>

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
