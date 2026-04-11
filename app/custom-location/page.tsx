"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  MapPin, 
  Loader2, 
  AlertTriangle,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Route,
  LogOut
} from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { RiskScoreGauge } from "@/components/risk-score-gauge"
import { WeatherRiskCard, GeopoliticalRiskCard } from "@/components/risk-factor-card"
import { useAuth } from "@/lib/auth-context"
import { generateCustomHubData } from "@/lib/supply-chain-data"
import { getRiskLevelLabel } from "@/lib/risk-calculator"
import type { SupplyChainHub, HubType, DailyRisk } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"

function DailyRiskRow({ daily, isToday }: { daily: DailyRisk; isToday: boolean }) {
  const color = RISK_COLORS[daily.riskLevel]
  const dayName = daily.date.toLocaleDateString("en-US", { weekday: "short" })
  const dateStr = daily.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        isToday
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-card/30"
      )}
    >
      <div className="w-16 shrink-0">
        <p className={cn("text-sm font-medium", isToday && "text-primary")}>
          {isToday ? "Today" : dayName}
        </p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {daily.riskScore}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium" style={{ color }}>
            {getRiskLevelLabel(daily.riskLevel)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {daily.primaryDriver}
          </p>
        </div>
      </div>
    </div>
  )
}

function WeeklyTrend({ forecast }: { forecast: DailyRisk[] }) {
  if (forecast.length < 2) return null

  const firstScore = forecast[0].riskScore
  const lastScore = forecast[forecast.length - 1].riskScore
  const diff = lastScore - firstScore
  const avgScore = Math.round(forecast.reduce((sum, d) => sum + d.riskScore, 0) / forecast.length)
  const maxRisk = forecast.reduce((max, d) => d.riskScore > max.riskScore ? d : max, forecast[0])

  let TrendIcon = Minus
  let trendColor = "text-muted-foreground"
  let trendText = "Stable"

  if (diff > 10) {
    TrendIcon = TrendingUp
    trendColor = "text-red-500"
    trendText = "Increasing"
  } else if (diff < -10) {
    TrendIcon = TrendingDown
    trendColor = "text-emerald-500"
    trendText = "Decreasing"
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">7-Day Avg</p>
        <p className="text-lg font-bold text-foreground">{avgScore}</p>
      </div>
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">Peak Risk</p>
        <p className="text-lg font-bold" style={{ color: RISK_COLORS[maxRisk.riskLevel] }}>
          {maxRisk.riskScore}
        </p>
        <p className="text-xs text-muted-foreground">
          {maxRisk.date.toLocaleDateString("en-US", { weekday: "short" })}
        </p>
      </div>
      <div className="rounded-lg border border-border/50 bg-card/30 p-3">
        <p className="text-xs text-muted-foreground">Trend</p>
        <div className={cn("flex items-center justify-center gap-1", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{trendText}</span>
        </div>
      </div>
    </div>
  )
}

export default function CustomLocationPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, logout } = useAuth()
  
  // Form state
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [hubType, setHubType] = useState<HubType>("port")
  const [formError, setFormError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Result state
  const [hub, setHub] = useState<SupplyChainHub | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleAnalyze = async () => {
    setFormError("")
    
    if (!name.trim()) {
      setFormError("Please enter a location name")
      return
    }
    
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Latitude must be between -90 and 90")
      return
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError("Longitude must be between -180 and 180")
      return
    }

    setIsAnalyzing(true)
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const customHub = generateCustomHubData(name.trim(), lat, lng, hubType)
    setHub(customHub)
    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setHub(null)
    setName("")
    setLatitude("")
    setLongitude("")
    setHubType("port")
    setFormError("")
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav className="flex h-14 items-center justify-between border-b border-border/40 bg-background px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo />
            <span className="font-semibold tracking-tight">IntelliSupply</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          <Link href="/optimal-path">
            <Button variant="outline" size="sm" className="gap-2">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">Optimal Path</span>
            </Button>
          </Link>
          <span className="hidden text-sm text-muted-foreground md:inline">
            {user.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Analyze Custom Location</h1>
                <p className="mt-2 text-muted-foreground">
                  Enter coordinates to analyze risk factors for any location worldwide.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border/50 bg-card p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., New Warehouse Location"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 40.7128"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      disabled={isAnalyzing}
                    />
                    <p className="text-xs text-muted-foreground">Range: -90 to 90</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., -74.0060"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      disabled={isAnalyzing}
                    />
                    <p className="text-xs text-muted-foreground">Range: -180 to 180</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hub-type">Location Type</Label>
                  <Select value={hubType} onValueChange={(v) => setHubType(v as HubType)} disabled={isAnalyzing}>
                    <SelectTrigger id="hub-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="port">Port</SelectItem>
                      <SelectItem value="airport">Airport</SelectItem>
                      <SelectItem value="distribution-center">Distribution Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 gap-2">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Analyze Location
                      </>
                    )}
                  </Button>
                  {hub && (
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="text-sm font-medium">Tips</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Use Google Maps or similar to find coordinates for any location</li>
                  <li>Positive latitude = North, Negative = South</li>
                  <li>Positive longitude = East, Negative = West</li>
                  <li>Risk analysis considers weather patterns, geopolitical factors, and regional infrastructure</li>
                </ul>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {!hub && !isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-muted-foreground">No Location Analyzed</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Enter coordinates and click Analyze to see risk details
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-border/50 bg-card/30">
                  <Spinner className="h-10 w-10 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Analyzing location risks...</p>
                </div>
              )}

              {hub && !isAnalyzing && (
                <div className="rounded-lg border border-border/50 bg-card">
                  {/* Result Header */}
                  <div className="border-b border-border p-4">
                    <h2 className="text-lg font-bold">{hub.name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{hub.country} - {hub.region}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Analyzed just now</span>
                    </div>
                  </div>

                  <Tabs defaultValue="overview" className="flex flex-col">
                    <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="forecast" className="gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        7-Day Forecast
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-6 p-4">
                          {/* Risk Score */}
                          <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Composite Risk Score
                            </h3>
                            <RiskScoreGauge score={hub.riskScore} size="lg" />
                          </div>

                          {/* Active Alerts */}
                          {hub.alerts.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="flex items-center gap-2 text-sm font-semibold">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Active Alerts
                              </h3>
                              <div className="space-y-2">
                                {hub.alerts.map((alert, index) => (
                                  <div
                                    key={index}
                                    className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
                                  >
                                    {alert}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Risk Breakdown */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Risk Breakdown</h3>
                            <WeatherRiskCard risk={hub.riskFactors.weather} />
                            <GeopoliticalRiskCard risk={hub.riskFactors.geopolitical} />
                          </div>

                          {/* Location Info */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Location Information</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Type</span>
                                <p className="font-medium capitalize">{hub.type.replace("-", " ")}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Coordinates</span>
                                <p className="font-mono text-xs">
                                  {hub.location.latitude.toFixed(4)}, {hub.location.longitude.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Recommended Actions</h3>
                            <div className="space-y-2 text-sm">
                              {hub.riskLevel === "critical" && (
                                <Badge
                                  variant="destructive"
                                  className="w-full justify-start px-3 py-2 text-xs font-normal"
                                >
                                  Immediate action required - Consider alternative routing
                                </Badge>
                              )}
                              {hub.riskLevel === "high" && (
                                <Badge className="w-full justify-start bg-orange-500/20 px-3 py-2 text-xs font-normal text-orange-400 hover:bg-orange-500/30">
                                  Activate contingency plans - Monitor situation closely
                                </Badge>
                              )}
                              {hub.riskLevel === "elevated" && (
                                <Badge className="w-full justify-start bg-amber-500/20 px-3 py-2 text-xs font-normal text-amber-400 hover:bg-amber-500/30">
                                  Continue monitoring - Prepare backup options
                                </Badge>
                              )}
                              {hub.riskLevel === "low" && (
                                <Badge className="w-full justify-start bg-emerald-500/20 px-3 py-2 text-xs font-normal text-emerald-400 hover:bg-emerald-500/30">
                                  Normal operations - Routine monitoring recommended
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="forecast" className="mt-0">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4 p-4">
                          <WeeklyTrend forecast={hub.weeklyForecast} />

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Daily Breakdown</h3>
                            <div className="space-y-2">
                              {hub.weeklyForecast.map((daily, index) => {
                                const dailyDate = new Date(daily.date)
                                dailyDate.setHours(0, 0, 0, 0)
                                const isToday = dailyDate.getTime() === today.getTime()
                                return (
                                  <DailyRiskRow key={index} daily={daily} isToday={isToday} />
                                )
                              })}
                            </div>
                          </div>

                          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Risk predictions are generated using meteorological data and 
                              geopolitical indicators. Forecasts beyond 3 days have increased uncertainty.
                            </p>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
