"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { MapPin, Route } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { RiskPanel } from "@/components/risk-panel"
import { HubSearch, type SearchHubOption } from "@/components/hub-search"
import { MapControls } from "@/components/map-controls"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { NavBar } from "@/components/ui/navbar"
import { useAuth } from "@/lib/auth-context"
import {
  DEFAULT_MONITORED_HUB_LIMIT,
  fetchDashboardHubs,
  fetchDashboardSearchLocations,
  refreshDashboardHub,
  refreshDashboardHubs,
  type DashboardLocation,
  type DashboardLocationsResult,
} from "@/lib/dashboard-api"
import { calculateRiskSummary } from "@/lib/supply-chain-data"
import type { HubViewMode } from "@/lib/map-config"
import type { SupplyChainHub, RiskSummary } from "@/lib/types"

const TOP_HUB_COUNT = 20
const PENDING_DASHBOARD_HUB_KEY = "dashboard-pending-hub-id"

// Dynamically import the map component to avoid SSR issues with react-simple-maps
const SupplyChainMap = dynamic(
  () =>
    import("@/components/supply-chain-map").then((mod) => mod.SupplyChainMap),
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
  },
);

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [hubs, setHubs] = useState<SupplyChainHub[]>([])
  const [summary, setSummary] = useState<RiskSummary | null>(null)
  const [selectedHub, setSelectedHub] = useState<SupplyChainHub | null>(null)
  const [viewMode, setViewMode] = useState<HubViewMode>("all")
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialLocationsRef = useRef<DashboardLocationsResult["locations"]>([])
  const [searchLocations, setSearchLocations] = useState<DashboardLocation[]>([])
  const [loadingHubId, setLoadingHubId] = useState<string | null>(null)
  const [hubLoadError, setHubLoadError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
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

  const refreshUnavailableHub = useCallback(
    async (hub: SupplyChainHub) => {
      const location = initialLocationsRef.current.find((item) => item.hub_id === hub.id)

      if (!location) {
        throw new Error("Unable to find the selected hub in the monitored location list.")
      }

      setLoadingHubId(hub.id)
      setHubLoadError(null)

      try {
        const refreshedHub = await refreshDashboardHub(location)

        setHubs((current) => {
          const next = current.map((item) => (item.id === refreshedHub.id ? refreshedHub : item))
          setSummary(calculateRiskSummary(next))
          return next
        })
        setError(null)
        setSelectedHub(refreshedHub)
      } catch (refreshError) {
        const message =
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to load risk analysis for this hub."

        setHubLoadError(message)
        setError(message)
      } finally {
        setLoadingHubId(null)
      }
    },
    []
  )

  const loadSearchHub = useCallback(async (location: DashboardLocation) => {
    setLoadingHubId(location.hub_id)
    setHubLoadError(null)

    try {
      const refreshedHub = await refreshDashboardHub(location)

      setHubs((current) => {
        const existingIndex = current.findIndex((item) => item.id === refreshedHub.id)
        const next =
          existingIndex === -1
            ? [...current, refreshedHub]
            : current.map((item) => (item.id === refreshedHub.id ? refreshedHub : item))

        setSummary(calculateRiskSummary(next))
        return next
      })
      setError(null)
      setSelectedRegion(refreshedHub.region)
      setSelectedHub(refreshedHub)
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to load risk analysis for this hub."

      setHubLoadError(message)
      setError(message)
    } finally {
      setLoadingHubId(null)
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [dashboardResult, searchResult] = await Promise.allSettled([
        fetchDashboardHubs(DEFAULT_MONITORED_HUB_LIMIT),
        fetchDashboardSearchLocations(),
      ])

      if (dashboardResult.status !== "fulfilled") {
        throw dashboardResult.reason
      }

      const data = dashboardResult.value
      initialLocationsRef.current = data.locations
      applyDashboardData(data.hubs)

      if (searchResult.status === "fulfilled") {
        setSearchLocations(searchResult.value)
      }
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
      if (initialLocationsRef.current.length === 0) {
        throw new Error("Dashboard locations are not loaded yet.")
      }

      const data = await refreshDashboardHubs(initialLocationsRef.current)
      applyDashboardData(data)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh dashboard data.")
    } finally {
      setIsRefreshing(false)
    }
  }, [applyDashboardData])

  // Handle hub selection
  const handleSelectHub = useCallback(
    (hub: SupplyChainHub | null) => {
      setHubLoadError(null)
      setSelectedHub(hub)

      if (hub?.riskDataAvailable === false && loadingHubId !== hub.id) {
        void refreshUnavailableHub(hub)
      }
    },
    [loadingHubId, refreshUnavailableHub]
  )

  const searchHubOptions = useMemo<SearchHubOption[]>(() => {
    const options = new Map<string, SearchHubOption>()

    for (const location of searchLocations) {
      options.set(location.hub_id, {
        id: location.hub_id,
        name: location.name,
        country: location.country,
        region: location.region,
        riskScore: null,
        riskLevel: null,
        riskDataAvailable: false,
      })
    }

    for (const hub of hubs) {
      options.set(hub.id, {
        id: hub.id,
        name: hub.name,
        country: hub.country,
        region: hub.region,
        riskScore: hub.riskDataAvailable === false ? null : hub.riskScore,
        riskLevel: hub.riskDataAvailable === false ? null : hub.riskLevel,
        riskDataAvailable: hub.riskDataAvailable !== false,
      })
    }

    return Array.from(options.values()).sort((left, right) => left.name.localeCompare(right.name))
  }, [hubs, searchLocations])

  const handleSelectFromSearch = useCallback(
    (hub: SearchHubOption) => {
      const existingHub = hubs.find((item) => item.id === hub.id)

      if (existingHub) {
        setSelectedRegion(existingHub.region)
        handleSelectHub(existingHub)
        return
      }

      const location = searchLocations.find((item) => item.hub_id === hub.id)

      if (!location) {
        setError("Unable to find the selected hub in the monitored location list.")
        return
      }

      void loadSearchHub(location)
    },
    [handleSelectHub, hubs, loadSearchHub, searchLocations]
  )

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) {
      return
    }

    const pendingHubId = window.localStorage.getItem(PENDING_DASHBOARD_HUB_KEY)
    if (!pendingHubId) {
      return
    }

    window.localStorage.removeItem(PENDING_DASHBOARD_HUB_KEY)

    const existingHub = hubs.find((hub) => hub.id === pendingHubId)
    if (existingHub) {
      setSelectedRegion(existingHub.region)
      handleSelectHub(existingHub)
      return
    }

    const location = searchLocations.find((item) => item.hub_id === pendingHubId)
    if (!location) {
      setError("Unable to find the selected hub in the monitored location list.")
      return
    }

    void loadSearchHub(location)
  }, [handleSelectHub, hubs, isLoading, loadSearchHub, searchLocations])

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
    setHubLoadError(null)
  }, [])

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
      .filter((hub) => hub.riskDataAvailable !== false)
      .sort((left, right) => {
        if (right.riskScore !== left.riskScore) {
          return right.riskScore - left.riskScore
        }

        return left.id.localeCompare(right.id)
      })
      .slice(0, TOP_HUB_COUNT)

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
    );
  }

  if (!user) {
    return null;
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
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <NavBar
        actions={[
          {
            href: "/custom-location",
            label: "Custom Location",
            icon: <MapPin className="h-4 w-4" />,
          },
          {
            href: "/optimal-path",
            label: "Optimal Path",
            icon: <Route className="h-4 w-4" />,
          },
        ]}
      />

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
          <HubSearch hubs={searchHubOptions} onSelectHub={handleSelectFromSearch} />
        </div>

        <div className="absolute left-4 top-16 z-10 max-w-[calc(100%-2rem)]">
          <MapControls
            viewMode={viewMode}
            selectedRegion={selectedRegion}
            regions={availableRegions}
            topHubCount={TOP_HUB_COUNT}
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
        <RiskPanel
          hub={selectedHub}
          onClose={handleClosePanel}
          isLoading={selectedHub?.id === loadingHubId}
          loadError={selectedHub?.id === loadingHubId ? null : hubLoadError}
        />

        {/* Overlay when panel is open on mobile */}
        {selectedHub && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={handleClosePanel}
          />
        )}
      </main>
    </div>
  );
}
