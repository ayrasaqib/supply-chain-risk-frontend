"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { MapPin, Route, LogOut } from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { DashboardHeader } from "@/components/dashboard-header"
import { RiskPanel } from "@/components/risk-panel"
import { HubSearch } from "@/components/hub-search"
import { MapControls } from "@/components/map-controls"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { fetchDashboardHubs, refreshDashboardHubs } from "@/lib/dashboard-api"
import { calculateRiskSummary } from "@/lib/supply-chain-data"
import type { HubViewMode } from "@/lib/map-config"
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

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, logout } = useAuth()
  
  const [hubs, setHubs] = useState<SupplyChainHub[]>([])
  const [summary, setSummary] = useState<RiskSummary | null>(null)
  const [selectedHub, setSelectedHub] = useState<SupplyChainHub | null>(null)
  const [viewMode, setViewMode] = useState<HubViewMode>("top")
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const applyDashboardData = useCallback((data: SupplyChainHub[]) => {
    setHubs(data)
    setSummary(calculateRiskSummary(data))
    setSelectedHub((current) => {
      if (!current) return null
      return data.find((hub) => hub.id === current.id) ?? null
    })
  }, [])

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchDashboardHubs()
      applyDashboardData(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.")
    } finally {
      setIsLoading(false)
    }
  }, [applyDashboardData])

  useEffect(() => {
    if (user) {
      void loadDashboardData()
    }
  }, [user, loadDashboardData])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      const data = await refreshDashboardHubs()
      applyDashboardData(data)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh dashboard data.")
    } finally {
      setIsRefreshing(false)
    }
  }, [applyDashboardData])

  // Handle hub selection
  const handleSelectHub = useCallback((hub: SupplyChainHub | null) => {
    setSelectedHub(hub)
  }, [])

  const handleSelectFromSearch = useCallback((hub: SupplyChainHub) => {
    setSelectedHub(hub)
    setSelectedRegion(hub.region)
  }, [])

  const handleViewModeChange = useCallback((mode: HubViewMode) => {
    setViewMode(mode)
    setSelectedRegion(null)
  }, [])

  const handleRegionChange = useCallback((region: string | null) => {
    setSelectedRegion(region)
  }, [])

  // Handle panel close
  const handleClosePanel = useCallback(() => {
    setSelectedHub(null)
    setSelectedRegion(null)
  }, [])

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const availableRegions = useMemo(
    () =>
      Array.from(new Set(hubs.map((hub) => hub.region)))
        .filter((region) => region !== "Global")
        .sort((left, right) => left.localeCompare(right)),
    [hubs]
  )

  const displayedHubs = useMemo(() => {
    if (selectedRegion) {
      return hubs.filter((hub) => hub.region === selectedRegion)
    }

    if (viewMode === "all") {
      return hubs
    }

    const topHubs = [...hubs]
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 15)

    if (selectedHub && !topHubs.some((hub) => hub.id === selectedHub.id)) {
      return [...topHubs, selectedHub]
    }

    return topHubs
  }, [hubs, selectedHub, selectedRegion, viewMode])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isLoading || !summary) {
    if (error && !summary) {
      return (
        <div className="flex h-screen items-center justify-center bg-background px-6">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => void loadDashboardData()}>Retry</Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Initializing IntelliSupply...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <nav className="flex h-16 items-center justify-between border-b border-border/40 bg-background px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo className="h-10 w-10" />
            <span className="text-base font-semibold tracking-tight">IntelliSupply</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/optimal-path">
            <Button variant="outline" size="sm" className="h-10 gap-2 px-4">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">Optimal Path</span>
            </Button>
          </Link>
          <Link href="/custom-location">
            <Button variant="outline" size="sm" className="h-10 gap-2 px-4">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Custom Location</span>
            </Button>
          </Link>
          <span className="hidden text-sm text-muted-foreground md:inline">
            {user.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="h-10 gap-2 px-4">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </nav>

      {/* Dashboard header with summary stats */}
      <DashboardHeader
        summary={summary}
        onRefresh={() => void handleRefresh()}
        isLoading={isRefreshing}
      />

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden">
        {error && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-amber-500/30 bg-background/95 px-4 py-2 text-xs text-amber-200 shadow-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Search controls */}
        <div className="absolute left-4 top-4 z-10">
          <HubSearch hubs={hubs} onSelectHub={handleSelectFromSearch} />
        </div>

        <div className="absolute left-4 top-16 z-10 max-w-[calc(100%-2rem)]">
          <MapControls
            viewMode={viewMode}
            selectedRegion={selectedRegion}
            regions={availableRegions}
            onViewModeChange={handleViewModeChange}
            onRegionChange={handleRegionChange}
          />
        </div>

        {/* Interactive map */}
        <SupplyChainMap
          hubs={displayedHubs}
          selectedHub={selectedHub}
          selectedRegion={selectedRegion}
          onSelectHub={handleSelectHub}
        />

        {/* Click hint overlay - only show when no hub is selected */}
        {!selectedHub && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 transform">
            <div className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm text-slate-200 shadow-lg backdrop-blur-md">
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
