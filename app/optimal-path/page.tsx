"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  LogOut,
  Loader2,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NavBar } from "@/components/ui/navbar";
import { useAuth } from "@/lib/auth-context";
import { generateSupplyChainData } from "@/lib/supply-chain-data";
import type { SupplyChainHub } from "@/lib/types";

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

// Mock API function - Replace this with your actual API call
async function fetchOptimalRoute(
  startHubId: string,
  endHubId: string,
): Promise<RouteResponse> {
  // TODO: Replace with actual API endpoint
  // const response = await fetch(`YOUR_API_URL?start=${startHubId}&end=${endHubId}`)
  // return response.json()

  // Mock implementation for demo
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const hubs = generateSupplyChainData();
  const hubMap = new Map(hubs.map((h) => [h.id, h]));

  const startHub = hubMap.get(startHubId);
  const endHub = hubMap.get(endHubId);

  if (!startHub || !endHub) {
    throw new Error("Invalid hub selection");
  }

  // Mock route generation - in reality, your API would return the optimal path
  const possibleIntermediates = hubs.filter(
    (h) => h.id !== startHubId && h.id !== endHubId,
  );

  // Pick 1-3 intermediate hubs based on "proximity" (simplified)
  const intermediates: SupplyChainHub[] = [];
  const numIntermediates = Math.min(
    Math.floor(Math.random() * 3) + 1,
    possibleIntermediates.length,
  );

  const shuffled = [...possibleIntermediates].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numIntermediates; i++) {
    intermediates.push(shuffled[i]);
  }

  // Build route
  const routeHubs = [startHub, ...intermediates, endHub];

  // Calculate mock distance
  let totalDistance = 0;
  for (let i = 0; i < routeHubs.length - 1; i++) {
    const h1 = routeHubs[i];
    const h2 = routeHubs[i + 1];
    const dx = h2.location.longitude - h1.location.longitude;
    const dy = h2.location.latitude - h1.location.latitude;
    totalDistance += Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
  }

  const avgRisk = Math.round(
    routeHubs.reduce((sum, h) => sum + h.riskScore, 0) / routeHubs.length,
  );

  return {
    route: routeHubs.map((h) => ({
      hub_id: h.id,
      name: h.name,
      latitude: h.location.latitude,
      longitude: h.location.longitude,
      risk_score: h.riskScore,
    })),
    total_distance_km: Math.round(totalDistance),
    average_risk_score: avgRisk,
  };
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

export default function OptimalPathPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

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

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push("/");
  };

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

  // Generate line segments for the route
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
      {/* Navigation */}
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

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Panel - Controls */}
        <div className="w-full border-b border-border/40 bg-card p-6 lg:w-96 lg:border-b-0 lg:border-r">
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
            {/* Start Hub Selection */}
            <div className="space-y-2">
              <Label htmlFor="start-hub">Starting Hub</Label>
              <Select value={startHub} onValueChange={setStartHub}>
                <SelectTrigger id="start-hub">
                  <SelectValue placeholder="Select starting hub" />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.id} value={hub.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: getRiskColor(hub.riskScore),
                          }}
                        />
                        {hub.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Hub Selection */}
            <div className="space-y-2">
              <Label htmlFor="end-hub">Destination Hub</Label>
              <Select value={endHub} onValueChange={setEndHub}>
                <SelectTrigger id="end-hub">
                  <SelectValue placeholder="Select destination hub" />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.id} value={hub.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: getRiskColor(hub.riskScore),
                          }}
                        />
                        {hub.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleCalculateRoute}
              disabled={isCalculating || !startHub || !endHub}
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

          {/* Route Results */}
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
                        {routeData.average_risk_score}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Route Steps */}
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Map */}
        <div className="relative flex-1 bg-slate-900">
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
                      hover: { outline: "none", fill: "#334155" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Route Lines */}
            {routeSegments.map((segment, index) => (
              <Line
                key={index}
                from={segment.from}
                to={segment.to}
                stroke={segment.color}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}

            {/* Hub Markers - show all hubs faded, route hubs highlighted */}
            {hubs.map((hub) => {
              const isInRoute = routeData?.route.some(
                (r) => r.hub_id === hub.id,
              );
              return (
                <Marker
                  key={hub.id}
                  coordinates={[hub.location.longitude, hub.location.latitude]}
                >
                  <circle
                    r={isInRoute ? 8 : 4}
                    fill={isInRoute ? getRiskColor(hub.riskScore) : "#475569"}
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

          {/* Legend */}
          <div className="absolute bottom-4 right-4 rounded-lg bg-card/90 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium">Risk Level</p>
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

          {/* Empty State */}
          {!routeData && !isCalculating && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-card/90 px-6 py-4 text-center backdrop-blur-sm">
                <Route className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select start and destination hubs to find the optimal path
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
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
