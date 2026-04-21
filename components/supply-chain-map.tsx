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
  enableClustering?: boolean
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

interface ClusterBucket {
  id: string
  hubs: SupplyChainHub[]
  coordinates: [number, number]
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

function getClusterDistanceThresholdKm(zoom: number) {
  if (zoom < 1.4) {
    return 1800
  }

  if (zoom < 2.2) {
    return 1000
  }

  if (zoom < 3.2) {
    return 550
  }

  return 260
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getUniqueHubs(hubs: SupplyChainHub[]) {
  return Array.from(new Map(hubs.map((hub) => [hub.id, hub])).values())
}

function getClusterCoordinates(hubs: SupplyChainHub[]): [number, number] {
  return hubs.reduce<[number, number]>(
    (accumulator, hub) => [
      accumulator[0] + hub.location.longitude / hubs.length,
      accumulator[1] + hub.location.latitude / hubs.length,
    ],
    [0, 0]
  )
}

function buildMarkerItems(hubs: SupplyChainHub[], shouldCluster: boolean, zoom: number): MarkerItem[] {
  const uniqueHubs = getUniqueHubs(hubs)

  if (!shouldCluster) {
    return uniqueHubs.map((hub) => ({ type: "hub", hub }))
  }

  const thresholdKm = getClusterDistanceThresholdKm(zoom)
  const buckets: ClusterBucket[] = []

  for (const hub of uniqueHubs) {
    const matchingBucket = buckets.find((bucket) => {
      const [longitude, latitude] = bucket.coordinates

      return (
        getDistanceKm(
          {
            latitude: hub.location.latitude,
            longitude: hub.location.longitude,
          },
          {
            latitude,
            longitude,
          }
        ) <= thresholdKm
      )
    })

    if (matchingBucket) {
      matchingBucket.hubs.push(hub)
      matchingBucket.coordinates = getClusterCoordinates(matchingBucket.hubs)
    } else {
      buckets.push({
        id: hub.id,
        hubs: [hub],
        coordinates: [hub.location.longitude, hub.location.latitude],
      })
    }
  }

  return buckets.map((bucket, index) => {
    if (bucket.hubs.length === 1) {
      return { type: "hub", hub: bucket.hubs[0] }
    }

    const averageRisk = Math.round(
      bucket.hubs.reduce((sum, hub) => sum + hub.riskScore, 0) / bucket.hubs.length
    )

    return {
      type: "cluster",
      cluster: {
        id: `${bucket.id}:${index}`,
        coordinates: bucket.coordinates,
        count: bucket.hubs.length,
        riskLevel: getHighestRiskLevel(bucket.hubs),
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
  enableClustering = true,
}: SupplyChainMapProps) {
  const [position, setPosition] = useState<Position>({
    coordinates: DEFAULT_MAP_POSITION.center,
    zoom: DEFAULT_MAP_POSITION.zoom,
  })

  const shouldCluster = enableClustering && !selectedRegion && hubs.length > 20
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
    if (!selectedHub) {
      if (selectedRegion) {
        const preset = REGION_MAP_PRESETS[selectedRegion]
        if (!preset) return

        setPosition({
          coordinates: preset.center,
          zoom: preset.zoom,
        })
        return
      }

      setPosition({
        coordinates: DEFAULT_MAP_POSITION.center,
        zoom: DEFAULT_MAP_POSITION.zoom,
      })
      return
    }

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
