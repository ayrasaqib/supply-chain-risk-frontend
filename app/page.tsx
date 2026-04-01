"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/components/dashboard-header"
import { RiskPanel } from "@/components/risk-panel"
import { Spinner } from "@/components/ui/spinner"
import { generateSupplyChainData, calculateRiskSummary } from "@/lib/supply-chain-data"
import type { SupplyChainHub, RiskSummary } from "@/lib/types"

// Dynamically import the map component to avoid SSR issues with react-simple-maps
const SupplyChainMap = dynamic(
  () => import("@/components/supply-chain-map").then((mod) => mod.SupplyChainMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    ),
  }
)

export default function SupplyChainDashboard() {
  const [hubs, setHubs] = useState<SupplyChainHub[]>([])
  const [summary, setSummary] = useState<RiskSummary | null>(null)
  const [selectedHub, setSelectedHub] = useState<SupplyChainHub | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initial data load
  useEffect(() => {
    const data = generateSupplyChainData()
    setHubs(data)
    setSummary(calculateRiskSummary(data))
    setIsLoading(false)
  }, [])

  // Handle data refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Simulate API call delay
    setTimeout(() => {
      const data = generateSupplyChainData()
      setHubs(data)
      setSummary(calculateRiskSummary(data))
      setIsRefreshing(false)
      // If a hub is selected, update its data
      if (selectedHub) {
        const updatedHub = data.find((h) => h.id === selectedHub.id)
        setSelectedHub(updatedHub || null)
      }
    }, 800)
  }, [selectedHub])

  // Handle hub selection
  const handleSelectHub = useCallback((hub: SupplyChainHub | null) => {
    setSelectedHub(hub)
  }, [])

  // Handle panel close
  const handleClosePanel = useCallback(() => {
    setSelectedHub(null)
  }, [])

  if (isLoading || !summary) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Initializing Supply Chain Risk Monitor...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Dashboard header with summary stats */}
      <DashboardHeader
        summary={summary}
        onRefresh={handleRefresh}
        isLoading={isRefreshing}
      />

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Interactive map */}
        <SupplyChainMap
          hubs={hubs}
          selectedHub={selectedHub}
          onSelectHub={handleSelectHub}
        />

        {/* Click hint overlay - only show when no hub is selected */}
        {!selectedHub && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 transform">
            <div className="rounded-full bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur-sm">
              Click a hub marker to view risk details
            </div>
          </div>
        )}

        {/* Risk detail panel */}
        <RiskPanel hub={selectedHub} onClose={handleClosePanel} />

        {/* Overlay when panel is open on mobile */}
        {selectedHub && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={handleClosePanel}
          />
        )}
      </main>
    </div>
  )
}
