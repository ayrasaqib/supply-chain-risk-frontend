"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import {
  Route,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Loader2,
  Map as MapIcon,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NavBar } from "@/components/ui/navbar";
import { useAuth } from "@/lib/auth-context";
import {
  fetchDashboardSearchLocations,
  type DashboardLocation,
} from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface RouteHub {
  hub_id: string;
  name: string;
  latitude: number;
  longitude: number;
  risk_score: number | null;
}

interface RouteResponse {
  route: RouteHub[];
  total_distance_km: number;
  average_risk_score: number | null;
}

interface ApiErrorResponse {
  error?: string;
}

interface HubSearchOption extends DashboardLocation {
  id: string;
}

interface RouteViewport {
  center: [number, number];
  scale: number;
}

interface MapPosition {
  coordinates: [number, number];
  zoom: number;
}

async function fetchOptimalRoute(
  startHubId: string,
  endHubId: string,
): Promise<RouteResponse> {
  const response = await fetch(
    `/api/optimal-path?hub_id_1=${encodeURIComponent(startHubId)}&hub_id_2=${encodeURIComponent(endHubId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const rawBody = await response.text();
  let parsedBody: RouteResponse | ApiErrorResponse | null = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as RouteResponse | ApiErrorResponse;
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return parsedBody as RouteResponse;
}

function getRiskColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score < 30) return "#22c55e";
  if (score < 50) return "#eab308";
  if (score < 70) return "#f97316";
  return "#ef4444";
}

function getSegmentRiskColor(score1: number | null, score2: number | null): string {
  if (score1 === null || score2 === null) {
    return "#94a3b8";
  }

  return getRiskColor((score1 + score2) / 2);
}

function getRouteViewport(route: RouteHub[] | null): RouteViewport {
  if (!route || route.length === 0) {
    return {
      center: [20, 20],
      scale: 140,
    };
  }

  const longitudes = route.map((hub) => hub.longitude);
  const latitudes = route.map((hub) => hub.latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeSpan = maxLongitude - minLongitude;
  const latitudeSpan = maxLatitude - minLatitude;

  let scale = 140;

  if (longitudeSpan < 18 && latitudeSpan < 12) {
    scale = 480;
  } else if (longitudeSpan < 35 && latitudeSpan < 22) {
    scale = 320;
  } else if (longitudeSpan < 70 && latitudeSpan < 40) {
    scale = 230;
  } else if (longitudeSpan < 120 && latitudeSpan < 65) {
    scale = 175;
  }

  return {
    center: [
      (minLongitude + maxLongitude) / 2,
      (minLatitude + maxLatitude) / 2,
    ],
    scale,
  };
}

function HubSearchDropdown({
  hubs,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  hubs: HubSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedHub = hubs.find((hub) => hub.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedHub ? (
            <span className="truncate">{selectedHub.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search hub by name..." />
          <CommandList>
            <CommandEmpty>No hubs found.</CommandEmpty>
            <CommandGroup heading="Hubs">
              {hubs.map((hub) => (
                <CommandItem
                  key={hub.id}
                  value={`${hub.name} ${hub.country} ${hub.id}`}
                  onSelect={() => {
                    onChange(hub.id);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === hub.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{hub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {hub.country}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function OptimalPathPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [hubs, setHubs] = useState<HubSearchOption[]>([]);
  const [startHub, setStartHub] = useState<string>("");
  const [endHub, setEndHub] = useState<string>("");
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapPosition, setMapPosition] = useState<MapPosition>({
    coordinates: [20, 20],
    zoom: 1,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    setIsLoadingHubs(true);
    setError(null);

    void fetchDashboardSearchLocations()
      .then((locations) => {
        setHubs(
          locations.map((location) => ({
            ...location,
            id: location.hub_id,
          })),
        );
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load hub list.",
        );
      })
      .finally(() => {
        setIsLoadingHubs(false);
      });
  }, [user]);

  const handleCalculateRoute = async () => {
    if (!startHub || !endHub) {
      setError("Please select both start and end hubs");
      return;
    }

    if (startHub === endHub) {
      setError("Start and end hubs must be different");
      return;
    }

    setError(null);
    setIsCalculating(true);
    setRouteData(null);

    try {
      const result = await fetchOptimalRoute(startHub, endHub);
      setRouteData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to calculate route. Please try again.",
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const routeSegments = useMemo(() => {
    if (!routeData || routeData.route.length < 2) return [];

    const segments = [];
    for (let i = 0; i < routeData.route.length - 1; i++) {
      const from = routeData.route[i];
      const to = routeData.route[i + 1];
      segments.push({
        from: [from.longitude, from.latitude] as [number, number],
        to: [to.longitude, to.latitude] as [number, number],
        color: getSegmentRiskColor(from.risk_score, to.risk_score),
      });
    }
    return segments;
  }, [routeData]);

  const routeRiskScoresByHubId = useMemo(() => {
    const scores = new Map<string, number | null>();

    for (const hub of routeData?.route ?? []) {
      scores.set(hub.hub_id, hub.risk_score);
    }

    return scores;
  }, [routeData]);

  const routeHubIds = useMemo(
    () => new Set(routeData?.route.map((hub) => hub.hub_id) ?? []),
    [routeData],
  );

  const routeViewport = useMemo(
    () => getRouteViewport(routeData?.route ?? null),
    [routeData],
  );

  useEffect(() => {
    setMapPosition({
      coordinates: routeViewport.center,
      zoom: Math.max(routeViewport.scale / 140, 1),
    });
  }, [routeViewport]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar
        actions={[
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <MapIcon className="h-4 w-4" />,
          },
          {
            href: "/custom-location",
            label: "Custom Location",
            icon: <MapPin className="h-4 w-4" />,
          },
        ]}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="w-full border-b border-border/40 bg-card/50 p-6 backdrop-blur-sm lg:w-[30rem] lg:border-b-0 lg:border-r">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Route className="h-6 w-6 text-primary" />
              Optimal Path Finder
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find the best route through hubs balancing risk and distance
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-hub">Starting Hub</Label>
              <HubSearchDropdown
                hubs={hubs}
                value={startHub}
                onChange={(value) => {
                  setStartHub(value);
                  setError(null);
                }}
                placeholder="Select starting hub"
                disabled={isCalculating || isLoadingHubs}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-hub">Destination Hub</Label>
              <HubSearchDropdown
                hubs={hubs}
                value={endHub}
                onChange={(value) => {
                  setEndHub(value);
                  setError(null);
                }}
                placeholder="Select destination hub"
                disabled={isCalculating || isLoadingHubs}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleCalculateRoute}
              disabled={isCalculating || isLoadingHubs || !startHub || !endHub}
              className="w-full gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Route className="h-4 w-4" />
                  Find Optimal Path
                </>
              )}
            </Button>
          </div>

          {routeData && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Route Summary</CardTitle>
                  <CardDescription>
                    {routeData.route.length} hubs in optimal path
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Distance
                      </p>
                      <p className="text-xl font-semibold">
                        {routeData.total_distance_km.toLocaleString()} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg Risk Score
                      </p>
                      <p
                        className="text-xl font-semibold"
                        style={{
                          color: getRiskColor(routeData.average_risk_score),
                        }}
                      >
                        {routeData.average_risk_score ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Route Path</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {routeData.route.map((hub, index) => (
                    <div key={hub.hub_id}>
                      <div className="flex items-center gap-3 py-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor: getRiskColor(hub.risk_score),
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{hub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Risk Score: {hub.risk_score ?? "N/A"}
                          </p>
                        </div>
                      </div>
                      {index < routeData.route.length - 1 && (
                        <div className="ml-4 flex items-center gap-2 py-1">
                          <div className="h-4 w-px bg-border" />
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="relative flex-1 overflow-hidden bg-slate-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(2,6,23,0.72))]" />

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 140,
              center: [0, 20],
            }}
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              center={mapPosition.coordinates}
              zoom={mapPosition.zoom}
              minZoom={1}
              maxZoom={8}
              onMoveEnd={({ coordinates, zoom }) => {
                setMapPosition({
                  coordinates: coordinates as [number, number],
                  zoom,
                });
              }}
            >
              <rect x={-1000} y={-500} width={2000} height={1000} fill="#0f172a" />
              <Geographies geography={geoUrl}>
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

              {routeSegments.map((segment, index) => (
                <g key={index}>
                  <Line
                    from={segment.from}
                    to={segment.to}
                    stroke={segment.color}
                    strokeWidth={8}
                    strokeLinecap="round"
                    opacity={0.18}
                  />
                  <Line
                    from={segment.from}
                    to={segment.to}
                    stroke={segment.color}
                    strokeWidth={3.25}
                    strokeLinecap="round"
                  />
                  <Line
                    from={segment.from}
                    to={segment.to}
                    stroke="#f8fafc"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeDasharray="3 6"
                    opacity={0.35}
                  />
                </g>
              ))}

              {hubs.map((hub) => {
                const isInRoute = routeHubIds.has(hub.id);
                const routeIndex =
                  routeData?.route.findIndex((routeHub) => routeHub.hub_id === hub.id) ?? -1;
                const isEndpoint =
                  routeIndex === 0 ||
                  routeIndex === (routeData?.route.length ?? 0) - 1;

                return (
                  <Marker key={hub.id} coordinates={[hub.lon, hub.lat]}>
                    <circle
                      r={isInRoute ? (isEndpoint ? 9 : 7) : routeData ? 2.5 : 4}
                      fill={
                        isInRoute
                          ? getRiskColor(routeRiskScoresByHubId.get(hub.id) ?? null)
                          : "#475569"
                      }
                      stroke={isInRoute ? "#fff" : "#64748b"}
                      strokeWidth={isInRoute ? 2 : 1}
                      opacity={isInRoute ? 1 : routeData ? 0.18 : 0.5}
                    />
                    {isInRoute && routeIndex >= 0 && (
                      <text
                        textAnchor="middle"
                        y="4"
                        style={{
                          fontFamily: "system-ui",
                          fontSize: "9px",
                          fill: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        {routeIndex + 1}
                      </text>
                    )}
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {!routeData && !isCalculating && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-card/90 px-6 py-4 text-center backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">
                  Select start and destination hubs to find the optimal path
                </p>
              </div>
            </div>
          )}

          {isCalculating && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-lg bg-card p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Calculating optimal route...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
