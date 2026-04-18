"use client"

import { useState, useCallback, useEffect, useMemo, memo } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps"
import { HubMarker } from "./hub-marker"
import { MapLegend } from "./map-legend"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut } from "lucide-react"
import type { RiskLevel, SupplyChainHub } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { DEFAULT_MAP_POSITION, REGION_MAP_PRESETS } from "@/lib/map-config"
import { cn } from "@/lib/utils"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface MapGeography {
  rsmKey: string
}

interface GeographiesRenderProps {
  geographies: MapGeography[]
}

interface SupplyChainMapProps {
  hubs: SupplyChainHub[]
  selectedHub: SupplyChainHub | null
  selectedRegion: string | null
  onSelectHub: (hub: SupplyChainHub | null) => void
}

interface Position {
  coordinates: [number, number]
  zoom: number
}

interface ClusterMarkerData {
  id: string
  coordinates: [number, number]
  count: number
  riskLevel: RiskLevel
  averageRisk: number
}

type MarkerItem =
  | { type: "hub"; hub: SupplyChainHub }
  | { type: "cluster"; cluster: ClusterMarkerData }

function getHighestRiskLevel(hubs: SupplyChainHub[]): RiskLevel {
  if (hubs.some((hub) => hub.riskLevel === "critical")) return "critical"
  if (hubs.some((hub) => hub.riskLevel === "high")) return "high"
  if (hubs.some((hub) => hub.riskLevel === "elevated")) return "elevated"
  return "low"
}

function getClusterCellSize(zoom: number) {
  if (zoom < 1.4) {
    return { latitude: 24, longitude: 28 }
  }

  if (zoom < 2.2) {
    return { latitude: 14, longitude: 18 }
  }

  if (zoom < 3.2) {
    return { latitude: 8, longitude: 10 }
  }

  return { latitude: 4, longitude: 5 }
}

function buildMarkerItems(hubs: SupplyChainHub[], shouldCluster: boolean, zoom: number): MarkerItem[] {
  if (!shouldCluster) {
    return hubs.map((hub) => ({ type: "hub", hub }))
  }

  const cellSize = getClusterCellSize(zoom)
  const buckets = new Map<string, SupplyChainHub[]>()

  for (const hub of hubs) {
    const latBucket = Math.floor((hub.location.latitude + 90) / cellSize.latitude)
    const lonBucket = Math.floor((hub.location.longitude + 180) / cellSize.longitude)
    const key = `${latBucket}:${lonBucket}`
    const bucket = buckets.get(key)

    if (bucket) {
      bucket.push(hub)
    } else {
      buckets.set(key, [hub])
    }
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    if (bucket.length === 1) {
      return { type: "hub", hub: bucket[0] }
    }

    const coordinates = bucket.reduce<[number, number]>(
      (accumulator, hub) => [
        accumulator[0] + hub.location.longitude / bucket.length,
        accumulator[1] + hub.location.latitude / bucket.length,
      ],
      [0, 0]
    )

    const averageRisk = Math.round(
      bucket.reduce((sum, hub) => sum + hub.riskScore, 0) / bucket.length
    )

    return {
      type: "cluster",
      cluster: {
        id: key,
        coordinates,
        count: bucket.length,
        riskLevel: getHighestRiskLevel(bucket),
        averageRisk,
      },
    }
  })
}

const MemoizedGeographies = memo(function MemoizedGeographies() {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }: GeographiesRenderProps) =>
        geographies.map((geo: MapGeography) => (
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

export function SupplyChainMap({
  hubs,
  selectedHub,
  selectedRegion,
  onSelectHub,
}: SupplyChainMapProps) {
  const [position, setPosition] = useState<Position>({
    coordinates: DEFAULT_MAP_POSITION.center,
    zoom: DEFAULT_MAP_POSITION.zoom,
  })

  const shouldCluster = !selectedRegion && hubs.length > 20
  const markerItems = useMemo(
    () => buildMarkerItems(hubs, shouldCluster, position.zoom),
    [hubs, position.zoom, shouldCluster]
  )

  const handleZoomIn = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 8) }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }))
  }, [])

  const handleMoveEnd = useCallback((newPosition: Position) => {
    setPosition(newPosition)
  }, [])

  const handleClusterSelect = useCallback((cluster: ClusterMarkerData) => {
    setPosition({
      coordinates: cluster.coordinates,
      zoom: 3.2,
    })
  }, [])

  useEffect(() => {
    if (!selectedRegion) {
      setPosition({
        coordinates: DEFAULT_MAP_POSITION.center,
        zoom: DEFAULT_MAP_POSITION.zoom,
      })
      return
    }

    const preset = REGION_MAP_PRESETS[selectedRegion]
    if (!preset) return

    setPosition({
      coordinates: preset.center,
      zoom: preset.zoom,
    })
  }, [selectedRegion])

  useEffect(() => {
    if (!selectedHub) return
    if (!hubs.some((hub) => hub.id === selectedHub.id)) return

    setPosition((currentPosition) => ({
      coordinates: [selectedHub.location.longitude, selectedHub.location.latitude],
      zoom: selectedRegion
        ? Math.max(REGION_MAP_PRESETS[selectedRegion]?.zoom ?? 3, 4)
        : Math.max(currentPosition.zoom, 2.4),
    }))
  }, [hubs, selectedHub, selectedRegion])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-900">
      {/* Zoom controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 border border-white/10 bg-slate-950/45 text-slate-100 backdrop-blur-md hover:bg-slate-950/55 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
          <span className="sr-only">Zoom in</span>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 border border-white/10 bg-slate-950/45 text-slate-100 backdrop-blur-md hover:bg-slate-950/55 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
          <span className="sr-only">Zoom out</span>
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
          {markerItems.map((item) =>
            item.type === "hub" ? (
              <HubMarker
                key={item.hub.id}
                hub={item.hub}
                isSelected={selectedHub?.id === item.hub.id}
                zoom={position.zoom}
                onSelect={onSelectHub}
              />
            ) : (
              <Marker key={item.cluster.id} coordinates={item.cluster.coordinates}>
                <g
                  onClick={() => handleClusterSelect(item.cluster)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle
                    r={Math.max(10, Math.min(22, 8 + item.cluster.count * 1.7))}
                    fill={RISK_COLORS[item.cluster.riskLevel]}
                    opacity={0.22}
                    className="animate-pulse"
                  />
                  <circle
                    r={Math.max(8, Math.min(18, 6 + item.cluster.count * 1.2))}
                    fill="#0f172a"
                    stroke={RISK_COLORS[item.cluster.riskLevel]}
                    strokeWidth={1.5}
                  />
                  <text
                    textAnchor="middle"
                    y="4"
                    className={cn(
                      "select-none text-[10px] font-semibold fill-slate-100",
                      item.cluster.count >= 10 && "text-[9px]"
                    )}
                  >
                    {item.cluster.count}
                  </text>
                  <title>{`${item.cluster.count} hubs • avg risk ${item.cluster.averageRisk}`}</title>
                </g>
              </Marker>
            )
          )}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
