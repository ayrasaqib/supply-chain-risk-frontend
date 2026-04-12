"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Route,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { GeopoliticalRiskCard, WeatherRiskCard } from "@/components/risk-factor-card"
import { RiskScoreGauge } from "@/components/risk-score-gauge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import {
  generateGeopoliticalRisk,
  generateWeatherRisk,
  getRiskLevel,
  getRiskLevelLabel,
} from "@/lib/risk-calculator"
import type { GeopoliticalRisk, RiskLevel, WeatherRisk } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ForecastDay {
  date: Date
  riskScore: number
  riskLevel: RiskLevel
  primaryDriver: string
  worstInterval: string | null
  snapshotCount: number
}

interface LocationAnalysis {
  hubId: string
  name: string
  location: { latitude: number; longitude: number }
  type: string
  region: string
  riskScore: number
  riskLevel: RiskLevel
  mockedRiskFactors: {
    weather: WeatherRisk
    geopolitical: GeopoliticalRisk
  }
  weeklyForecast: ForecastDay[]
  alerts: string[]
  analyzedAt: Date
  latestAssessmentDate: string | null
  latestPrimaryDriver: string | null
  latestWorstInterval: string | null
  dataSource: string | null
  datasetType: string | null
  modelVersion: string | null
  forecastOrigin: string | null
  daysAssessed: number | null
  peakDay: string | null
  peakDayNumber: number | null
}

interface ApiErrorResponse {
  error?: string
}

interface AnalyzeLocationResponse {
  hub_id: string
  risk: RiskLocationResponse
}

interface RiskEventAttribute {
  hub_id?: string
  hub_name?: string
  day?: number
  date?: string
  peak_risk_score?: number
  mean_risk_score?: number
  risk_level?: string
  primary_driver?: string
  worst_interval?: string
  snapshots?: Array<{
    forecast_timestamp?: string
    forecast_lead_hours?: number
    risk_score?: number
    risk_level?: string
    primary_driver?: string
  }>
  model_version?: string
  lat?: number
  lon?: number
  outlook_risk_score?: number
  outlook_risk_level?: string
  peak_day?: string
  peak_day_number?: number
  forecast_origin?: string
  days_assessed?: number
}

interface RiskEvent {
  event_type?: string
  attribute?: RiskEventAttribute
}

interface RiskLocationResponse {
  data_source?: string
  dataset_type?: string
  dataset_id?: string
  events?: RiskEvent[]
}

function normalizeRiskScore(score: number | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0
  const scaledScore = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(scaledScore)))
}

function alignMockScore(baseScore: number, targetScore: number) {
  const variance = Math.round((Math.random() - 0.5) * 12)
  return Math.max(0, Math.min(100, Math.round((baseScore + targetScore) / 2 + variance)))
}

function getRegionFromCoordinates(latitude: number, longitude: number): string {
  if (latitude >= 20 && latitude <= 55 && longitude >= 100 && longitude <= 150) {
    return "East Asia"
  }
  if (latitude >= -10 && latitude < 20 && longitude >= 95 && longitude <= 140) {
    return "Southeast Asia"
  }
  if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    return "Europe"
  }
  if (latitude >= 15 && latitude <= 75 && longitude >= -170 && longitude <= -50) {
    return "North America"
  }
  if (latitude >= 10 && latitude <= 45 && longitude >= 30 && longitude <= 75) {
    return "Middle East"
  }
  if (latitude >= 5 && latitude <= 35 && longitude >= 65 && longitude <= 95) {
    return "South Asia"
  }
  if (latitude >= -60 && latitude <= 15 && longitude >= -85 && longitude <= -30) {
    return "South America"
  }
  if (latitude >= -50 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
    return "Oceania"
  }

  return "Africa"
}

function mapApiRiskLevel(apiLevel: string | undefined, score: number): RiskLevel {
  const normalized = apiLevel?.trim().toLowerCase()

  if (normalized === "critical") return "critical"
  if (normalized === "high") return "high"
  if (normalized === "elevated" || normalized === "moderate" || normalized === "medium") {
    return "elevated"
  }
  if (normalized === "low") return "low"

  return getRiskLevel(score)
}

function formatDateLabel(date: string | null) {
  if (!date) return "Unavailable"

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTimeLabel(timestamp: string | null) {
  if (!timestamp) return "Unavailable"

  const parsedDate = new Date(timestamp)
  if (Number.isNaN(parsedDate.getTime())) return timestamp

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

async function analyzeCustomLocation(
  name: string,
  lat: number,
  lon: number
): Promise<AnalyzeLocationResponse> {
  const response = await fetch("/api/custom-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, lat, lon }),
  })

  const rawBody = await response.text()
  let parsedBody: AnalyzeLocationResponse | ApiErrorResponse | null = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as AnalyzeLocationResponse | ApiErrorResponse
    } catch {
      parsedBody = null
    }
  }

  if (!response.ok) {
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return parsedBody as AnalyzeLocationResponse
}

function buildAlerts(forecast: ForecastDay[], peakDay: string | null): string[] {
  const alerts: string[] = []
  const today = forecast[0]
  const highestRiskDay = [...forecast].sort((a, b) => b.riskScore - a.riskScore)[0]

  if (today && today.riskLevel === "critical") {
    alerts.push(`Critical risk today driven by ${today.primaryDriver}.`)
  } else if (today && today.riskLevel === "high") {
    alerts.push(`High risk today driven by ${today.primaryDriver}.`)
  }

  if (highestRiskDay && highestRiskDay.riskScore >= 70) {
    alerts.push(
      `Peak forecast risk reaches ${highestRiskDay.riskScore} on ${highestRiskDay.date.toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      )}.`
    )
  }

  if (peakDay) {
    alerts.push(`7-day outlook peaks on ${formatDateLabel(peakDay)}.`)
  }

  return alerts.slice(0, 3)
}

function buildMockedRiskFactors(
  latitude: number,
  longitude: number,
  riskScore: number
): {
  region: string
  weather: WeatherRisk
  geopolitical: GeopoliticalRisk
} {
  const region = getRegionFromCoordinates(latitude, longitude)
  const weather = generateWeatherRisk(region)
  const geopolitical = generateGeopoliticalRisk(region)

  weather.score = alignMockScore(weather.score, riskScore)
  geopolitical.score = alignMockScore(geopolitical.score, riskScore)

  return { region, weather, geopolitical }
}

function mapRiskResponseToAnalysis(
  response: RiskLocationResponse,
  hubId: string,
  name: string,
  latitude: number,
  longitude: number
): LocationAnalysis {
  const events = response.events ?? []

  const dailyEvents = events
    .filter((event) => event.event_type === "daily_risk_assessment" && event.attribute?.date)
    .sort((left, right) => (left.attribute?.day ?? 0) - (right.attribute?.day ?? 0))

  const outlookEvent = events.find((event) => event.event_type === "seven_day_outlook")

  const weeklyForecast: ForecastDay[] = dailyEvents.map((event) => {
    const attribute = event.attribute ?? {}
    const score = normalizeRiskScore(attribute.peak_risk_score ?? attribute.mean_risk_score)

    return {
      date: new Date(attribute.date ?? ""),
      riskScore: score,
      riskLevel: mapApiRiskLevel(attribute.risk_level, score),
      primaryDriver: attribute.primary_driver ?? "Unknown",
      worstInterval: attribute.worst_interval ?? null,
      snapshotCount: attribute.snapshots?.length ?? 0,
    }
  })

  const outlook = outlookEvent?.attribute ?? {}
  const latestAssessment = dailyEvents[0]?.attribute ?? {}
  const overallScore = normalizeRiskScore(
    outlook.outlook_risk_score ?? latestAssessment.peak_risk_score ?? latestAssessment.mean_risk_score
  )
  const overallRiskLevel = mapApiRiskLevel(
    outlook.outlook_risk_level ?? latestAssessment.risk_level,
    overallScore
  )
  const mockedRiskFactors = buildMockedRiskFactors(
    outlook.lat ?? latitude,
    outlook.lon ?? longitude,
    overallScore
  )

  return {
    hubId,
    name,
    location: {
      latitude: outlook.lat ?? latitude,
      longitude: outlook.lon ?? longitude,
    },
    type: "dynamic",
    region: mockedRiskFactors.region,
    riskScore: overallScore,
    riskLevel: overallRiskLevel,
    mockedRiskFactors: {
      weather: mockedRiskFactors.weather,
      geopolitical: mockedRiskFactors.geopolitical,
    },
    weeklyForecast,
    alerts: buildAlerts(weeklyForecast, outlook.peak_day ?? null),
    analyzedAt: new Date(),
    latestAssessmentDate: latestAssessment.date ?? null,
    latestPrimaryDriver: latestAssessment.primary_driver ?? null,
    latestWorstInterval: latestAssessment.worst_interval ?? null,
    dataSource: response.data_source ?? null,
    datasetType: response.dataset_type ?? null,
    modelVersion: outlook.model_version ?? latestAssessment.model_version ?? null,
    forecastOrigin: outlook.forecast_origin ?? null,
    daysAssessed:
      outlook.days_assessed ?? (weeklyForecast.length > 0 ? weeklyForecast.length : null),
    peakDay: outlook.peak_day ?? null,
    peakDayNumber: outlook.peak_day_number ?? null,
  }
}

function DailyRiskRow({ daily, isToday }: { daily: ForecastDay; isToday: boolean }) {
  const color = RISK_COLORS[daily.riskLevel]
  const dayName = daily.date.toLocaleDateString("en-US", { weekday: "short" })
  const dateStr = daily.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        isToday ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/30"
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
          <p className="truncate text-xs text-muted-foreground">{daily.primaryDriver}</p>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p>{daily.snapshotCount} snapshots</p>
          <p>{formatDateTimeLabel(daily.worstInterval)}</p>
        </div>
      </div>
    </div>
  )
}

function WeeklyTrend({ forecast }: { forecast: ForecastDay[] }) {
  if (forecast.length < 2) return null

  const firstScore = forecast[0].riskScore
  const lastScore = forecast[forecast.length - 1].riskScore
  const diff = lastScore - firstScore
  const avgScore = Math.round(forecast.reduce((sum, day) => sum + day.riskScore, 0) / forecast.length)
  const maxRisk = forecast.reduce((max, day) => (day.riskScore > max.riskScore ? day : max), forecast[0])

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

  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [formError, setFormError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hub, setHub] = useState<LocationAnalysis | null>(null)

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
    const lon = parseFloat(longitude)

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Latitude must be between -90 and 90")
      return
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setFormError("Longitude must be between -180 and 180")
      return
    }

    setIsAnalyzing(true)
    setHub(null)

    try {
      const analysisResponse = await analyzeCustomLocation(name.trim(), lat, lon)
      const mappedHub = mapRiskResponseToAnalysis(
        analysisResponse.risk,
        analysisResponse.hub_id,
        name.trim(),
        lat,
        lon
      )

      setHub(mappedHub)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to analyze location. Please try again."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setHub(null)
    setName("")
    setLatitude("")
    setLongitude("")
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
          <span className="hidden text-sm text-muted-foreground md:inline">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Analyze Custom Location</h1>
                <p className="mt-2 text-muted-foreground">
                  Create a dynamic hub from a name and coordinates, then fetch its latest risk outlook.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border/50 bg-card p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., New Warehouse Location"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
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
                      onChange={(event) => setLatitude(event.target.value)}
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
                      onChange={(event) => setLongitude(event.target.value)}
                      disabled={isAnalyzing}
                    />
                    <p className="text-xs text-muted-foreground">Range: -180 to 180</p>
                  </div>
                </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 gap-2">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Hub...
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

              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="text-sm font-medium">Tips</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Use Google Maps or similar to find coordinates for any location</li>
                  <li>Positive latitude = North, Negative = South</li>
                  <li>Positive longitude = East, Negative = West</li>
                  <li>Risk analysis considers weather patterns and geopolitical factors.</li>
                </ul>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {!hub && !isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-muted-foreground">No Location Analyzed</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Enter a name and coordinates to create a hub and fetch its risk details.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-border/50 bg-card/30">
                  <Spinner className="h-10 w-10 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Creating the hub, ingesting forecast data, and waiting for risk analysis...
                  </p>
                </div>
              )}

              {hub && !isAnalyzing && (
                <div className="rounded-lg border border-border/50 bg-card">
                  <div className="border-b border-border p-4">
                    <h2 className="text-lg font-bold">{hub.name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{hub.hubId} • Dynamic location</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Analyzed {hub.analyzedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
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
                      <ScrollArea className="h-[430px]">
                        <div className="space-y-6 p-4">
                          <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              7-Day Outlook Risk Score
                            </h3>
                            <RiskScoreGauge score={hub.riskScore} size="lg" />
                          </div>

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

                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Risk Breakdown</h3>
                            <WeatherRiskCard risk={hub.mockedRiskFactors.weather} />
                            <GeopoliticalRiskCard risk={hub.mockedRiskFactors.geopolitical} />
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Assessment Details</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Latest Assessment</span>
                                <p className="font-medium">{formatDateLabel(hub.latestAssessmentDate)}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Primary Driver</span>
                                <p className="font-medium">{hub.latestPrimaryDriver ?? "Unavailable"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Worst Interval</span>
                                <p className="font-medium">{formatDateTimeLabel(hub.latestWorstInterval)}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Peak Day</span>
                                <p className="font-medium">
                                  {hub.peakDay
                                    ? `${formatDateLabel(hub.peakDay)}${hub.peakDayNumber ? ` (Day ${hub.peakDayNumber})` : ""}`
                                    : "Unavailable"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Location Information</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Hub ID</span>
                                <p className="font-medium">{hub.hubId}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Type</span>
                                <p className="font-medium capitalize">{hub.type}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Region</span>
                                <p className="font-medium">{hub.region}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Coordinates</span>
                                <p className="font-mono text-xs">
                                  {hub.location.latitude.toFixed(4)}, {hub.location.longitude.toFixed(4)}
                                </p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Days Assessed</span>
                                <p className="font-medium">{hub.daysAssessed ?? "Unavailable"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Model Metadata</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Data Source</span>
                                <p className="font-medium">{hub.dataSource ?? "Unavailable"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Dataset Type</span>
                                <p className="font-medium">{hub.datasetType ?? "Unavailable"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Model Version</span>
                                <p className="font-medium">{hub.modelVersion ?? "Unavailable"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">Forecast Origin</span>
                                <p className="font-medium">{formatDateTimeLabel(hub.forecastOrigin)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Recommended Actions</h3>
                            <div className="space-y-2 text-sm">
                              {hub.riskLevel === "critical" && (
                                <Badge
                                  variant="destructive"
                                  className="w-full justify-start px-3 py-2 text-xs font-normal"
                                >
                                  Immediate action required. Consider an alternative location or route.
                                </Badge>
                              )}
                              {hub.riskLevel === "high" && (
                                <Badge className="w-full justify-start bg-orange-500/20 px-3 py-2 text-xs font-normal text-orange-400 hover:bg-orange-500/30">
                                  Activate contingency plans and monitor new risk runs closely.
                                </Badge>
                              )}
                              {hub.riskLevel === "elevated" && (
                                <Badge className="w-full justify-start bg-amber-500/20 px-3 py-2 text-xs font-normal text-amber-400 hover:bg-amber-500/30">
                                  Continue monitoring and prepare backup options if conditions worsen.
                                </Badge>
                              )}
                              {hub.riskLevel === "low" && (
                                <Badge className="w-full justify-start bg-emerald-500/20 px-3 py-2 text-xs font-normal text-emerald-400 hover:bg-emerald-500/30">
                                  Normal operations look acceptable. Keep routine monitoring in place.
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="forecast" className="mt-0">
                      <ScrollArea className="h-[430px]">
                        <div className="space-y-4 p-4">
                          {hub.weeklyForecast.length > 1 ? (
                            <WeeklyTrend forecast={hub.weeklyForecast} />
                          ) : (
                            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                              Forecast trend details will appear once multiple daily assessments are available.
                            </div>
                          )}

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Daily Breakdown</h3>
                            {hub.weeklyForecast.length > 0 ? (
                              <div className="space-y-2">
                                {hub.weeklyForecast.map((daily, index) => {
                                  const dailyDate = new Date(daily.date)
                                  dailyDate.setHours(0, 0, 0, 0)
                                  const isToday = dailyDate.getTime() === today.getTime()

                                  return <DailyRiskRow key={index} daily={daily} isToday={isToday} />
                                })}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                                No daily risk entries were returned by the API for this hub yet.
                              </div>
                            )}
                          </div>

                          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              These values come from the risk analytics API after weather ingestion completes for
                              the dynamic hub.
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
