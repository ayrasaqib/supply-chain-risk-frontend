"use client"

import { useState, useCallback, memo } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps"
import { HubMarker } from "./hub-marker"
import { MapLegend } from "./map-legend"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { SupplyChainHub } from "@/lib/types"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface SupplyChainMapProps {
  hubs: SupplyChainHub[]
  selectedHub: SupplyChainHub | null
  onSelectHub: (hub: SupplyChainHub | null) => void
}

interface Position {
  coordinates: [number, number]
  zoom: number
}

const MemoizedGeographies = memo(function MemoizedGeographies() {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth={0.5}
            style={{
              default: { outline: "none" },
              hover: { outline: "none", fill: "#334155" },
              pressed: { outline: "none" },
            }}
          />
        ))
      }
    </Geographies>
  )
})

export function SupplyChainMap({ hubs, selectedHub, onSelectHub }: SupplyChainMapProps) {
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 20],
    zoom: 1,
  })

  const handleZoomIn = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 8) }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }))
  }, [])

  const handleReset = useCallback(() => {
    setPosition({ coordinates: [0, 20], zoom: 1 })
    onSelectHub(null)
  }, [onSelectHub])

  const handleMoveEnd = useCallback((newPosition: Position) => {
    setPosition(newPosition)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-900">
      {/* Zoom controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
          <span className="sr-only">Zoom in</span>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
          <span className="sr-only">Zoom out</span>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="sr-only">Reset view</span>
        </Button>
      </div>

      {/* Map legend */}
      <MapLegend />

      {/* Main map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
        className="h-full w-full"
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
        >
          {/* Ocean background */}
          <rect x={-1000} y={-500} width={2000} height={1000} fill="#0f172a" />

          {/* Countries */}
          <MemoizedGeographies />

          {/* Hub markers */}
          {hubs.map((hub) => (
            <HubMarker
              key={hub.id}
              hub={hub}
              isSelected={selectedHub?.id === hub.id}
              onSelect={onSelectHub}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
