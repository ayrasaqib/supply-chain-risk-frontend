"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import {
  Route,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Loader2,
  Navigation,
  Milestone,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NavBar } from "@/components/ui/navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { generateSupplyChainData } from "@/lib/supply-chain-data";
import type { SupplyChainHub } from "@/lib/types";
import { cn } from "@/lib/utils";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Route hub type from API response
interface RouteHub {
  hub_id: string;
  name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
}

interface RouteResponse {
  route: RouteHub[];
  total_distance_km: number;
  average_risk_score: number;
}

interface RouteSegment {
  from: [number, number];
  to: [number, number];
  color: string;
}

interface ApiErrorResponse {
  error?: string;
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

// Get color based on risk score
function getRiskColor(score: number): string {
  if (score < 30) return "#22c55e"; // green
  if (score < 50) return "#eab308"; // yellow
  if (score < 70) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getSegmentRiskColor(score1: number, score2: number): string {
  const avg = (score1 + score2) / 2;
  return getRiskColor(avg);
}

function getRouteRecommendation(avgRiskScore: number): string {
  if (avgRiskScore >= 70) {
    return "This route carries critical exposure. Consider delaying movement or evaluating alternate endpoints.";
  }
  if (avgRiskScore >= 50) {
    return "This path is workable but high-risk. Plan contingencies around the highest-risk stopovers.";
  }
  if (avgRiskScore >= 30) {
    return "This route is moderately exposed. Monitor hub conditions before each handoff.";
  }
  return "This route is relatively stable for current conditions. Routine monitoring should be enough.";
}

function HubSearchDropdown({
  hubs,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  hubs: SupplyChainHub[];
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
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getRiskColor(selectedHub.riskScore) }}
              />
              <span className="truncate">{selectedHub.name}</span>
            </span>
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
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getRiskColor(hub.riskScore) }}
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

  const [hubs, setHubs] = useState<SupplyChainHub[]>([]);
  const [startHub, setStartHub] = useState<string>("");
  const [endHub, setEndHub] = useState<string>("");
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load hubs
  useEffect(() => {
    if (user) {
      const data = generateSupplyChainData();
      setHubs(data);
    }
  }, [user]);

  // Calculate route
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
      setError("Failed to calculate route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setStartHub("");
    setEndHub("");
    setRouteData(null);
    setError(null);
  };

  // Generate line segments for the route
  const routeSegments = useMemo<RouteSegment[]>(() => {
    if (!routeData || routeData.route.length < 2) return [];

    const segments: RouteSegment[] = [];
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar
        actions={[
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <MapPin className="h-4 w-4" />,
          },
          {
            href: "/custom-location",
            label: "Custom Location",
            icon: <MapPin className="h-4 w-4" />,
          },
        ]}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Optimal Path Finder
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Get an optimal route recommendation from hub-to-hub balancing distance and risk factors.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border/50 bg-card p-6">
                <div className="space-y-2">
                  <Label htmlFor="start-hub">Starting Hub</Label>
                  <HubSearchDropdown
                    hubs={hubs}
                    value={startHub}
                    onChange={(value) => {
                      setStartHub(value);
                      setError(null);
                    }}
                    disabled={isCalculating}
                    placeholder="Select starting hub"
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
                    disabled={isCalculating}
                    placeholder="Select destination hub"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCalculateRoute}
                    disabled={isCalculating || !startHub || !endHub}
                    className="flex-1 gap-2"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        In Progress...
                      </>
                    ) : (
                      <>
                        <Route className="h-4 w-4" />
                        Find Optimal Path
                      </>
                    )}
                  </Button>
                  {routeData && (
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="text-sm font-medium">Tips</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Choose different hubs for origin and destination.</li>
                  <li>Lower route risk scores mean more stable movement.</li>
                  <li>Intermediate hubs are suggested automatically.</li>
                </ul>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {!routeData && !isCalculating && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 text-center">
                  <Route className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-muted-foreground">
                    No Route Calculated
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
                    Select a starting hub and destination hub to generate an
                    optimal route recommendation.
                  </p>
                </div>
              )}

              {isCalculating && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-border/50 bg-card/30">
                  <Spinner className="h-10 w-10 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Calculating route segments, balancing risk, and preparing
                    the path visualization...
                  </p>
                </div>
              )}

              {routeData && !isCalculating && (
                <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
                  <div className="border-b border-border p-4">
                    <h2 className="text-lg font-bold">Recommended Route</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="h-3.5 w-3.5" />
                      <span>{routeData.route.length} hubs in optimal path</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Milestone className="h-3 w-3" />
                      <span>
                        {routeData.total_distance_km.toLocaleString()} km total
                        distance
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="h-[640px]">
                    <div className="space-y-6 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                          <p className="text-xs text-muted-foreground">
                            Total Distance
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-foreground">
                            {routeData.total_distance_km.toLocaleString()} km
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                          <p className="text-xs text-muted-foreground">
                            Avg Risk Score
                          </p>
                          <p
                            className="mt-1 text-2xl font-semibold"
                            style={{
                              color: getRiskColor(routeData.average_risk_score),
                            }}
                          >
                            {routeData.average_risk_score}
                          </p>
                        </div>
                      </div>

                      <Card className="border-border/50 bg-card/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Map View</CardTitle>
                          <CardDescription>
                            Highlighted markers show the selected route.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                            <div className="h-[320px] w-full">
                              <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{
                                  scale: 140,
                                  center: [20, 20],
                                }}
                                className="h-full w-full"
                                style={{ width: "100%", height: "100%" }}
                              >
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
                                          hover: {
                                            outline: "none",
                                            fill: "#334155",
                                          },
                                          pressed: { outline: "none" },
                                        }}
                                      />
                                    ))
                                  }
                                </Geographies>

                                {routeSegments.map((segment, index) => (
                                  <Line
                                    key={`${segment.from.join(",")}-${segment.to.join(",")}-${index}`}
                                    from={segment.from}
                                    to={segment.to}
                                    stroke={segment.color}
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                  />
                                ))}

                                {hubs.map((hub) => {
                                  const isInRoute = routeData.route.some(
                                    (routeHub) => routeHub.hub_id === hub.id,
                                  );

                                  return (
                                    <Marker
                                      key={hub.id}
                                      coordinates={[
                                        hub.location.longitude,
                                        hub.location.latitude,
                                      ]}
                                    >
                                      <circle
                                        r={isInRoute ? 8 : 4}
                                        fill={
                                          isInRoute
                                            ? getRiskColor(hub.riskScore)
                                            : "#475569"
                                        }
                                        stroke={isInRoute ? "#fff" : "#64748b"}
                                        strokeWidth={isInRoute ? 2 : 1}
                                        opacity={isInRoute ? 1 : 0.5}
                                      />
                                      {isInRoute && (
                                        <text
                                          textAnchor="middle"
                                          y={-14}
                                          style={{
                                            fontFamily: "system-ui",
                                            fontSize: "10px",
                                            fill: "#fff",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {hub.name}
                                        </text>
                                      )}
                                    </Marker>
                                  );
                                })}
                              </ComposableMap>
                            </div>

                            <div className="absolute bottom-3 right-3 rounded-lg bg-card/90 p-3 backdrop-blur-sm">
                              <p className="mb-2 text-xs font-medium">
                                Risk Level
                              </p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="h-3 w-3 rounded-full bg-green-500" />
                                  <span>Low (&lt;30)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                  <span>Elevated (30-49)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                                  <span>High (50-69)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="h-3 w-3 rounded-full bg-red-500" />
                                  <span>Critical (70+)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Route Path</h3>
                        <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                          {routeData.route.map((hub, index) => (
                            <div key={hub.hub_id}>
                              <div className="flex items-center gap-3 py-2">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                                  style={{
                                    backgroundColor: getRiskColor(
                                      hub.risk_score,
                                    ),
                                  }}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{hub.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Risk Score: {hub.risk_score}
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
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                          Recommendation
                        </h3>
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                          {getRouteRecommendation(routeData.average_risk_score)}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
