"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Loader2,
  MapPin,
  Route,
  Map as MapIcon,
} from "lucide-react"
import { RiskAnalysisForecast } from "@/components/risk-analysis-forecast"
import { RiskAnalysisOverview } from "@/components/risk-analysis-overview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import type { RiskEvent, RiskEventAttribute, RiskLocationResponse } from "@/lib/risk-api-types"
import type { RiskLevel } from "@/lib/types"
import { getRiskLevel } from "@/lib/risk-calculator";
import { NavBar } from "@/components/ui/navbar";

interface ForecastDay {
  date: Date;
  riskScore: number;
  riskLevel: RiskLevel;
  primaryDriver: string;
  worstInterval: string | null;
}

interface LocationAnalysis {
  hubId: string
  name: string
  location: { latitude: number; longitude: number }
  country: string
  type: string
  region: string
  graphUrl: string | null
  riskScore: number
  riskLevel: RiskLevel
  apiRiskFactors: {
    weather: {
      score: number;
      primaryDriver: string | null;
      primaryDriverLabel: string | null;
    };
    geopolitical: {
      score: number;
      articleCount: number | null;
      sentiment: {
        positive: number | null;
        neutral: number | null;
        negative: number | null;
      };
    };
  };
  weeklyForecast: ForecastDay[];
  alerts: string[];
  analyzedAt: Date;
  latestAssessmentDate: string | null;
  latestPrimaryDriver: string | null;
  latestWorstInterval: string | null;
  dataSource: string | null;
  datasetType: string | null;
  modelVersion: string | null;
  forecastOrigin: string | null;
  daysAssessed: number | null;
  peakDay: string | null;
  peakDayNumber: number | null;
}

interface ApiErrorResponse {
  error?: string;
}

interface AnalyzeLocationResponse {
  hub_id: string;
  risk: RiskLocationResponse;
  graph_url?: string | null;
}

function normalizeRiskScore(score: number | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  const scaledScore = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, Math.round(scaledScore)));
}

function getRegionFromCoordinates(latitude: number, longitude: number): string {
  if (
    latitude >= 20 &&
    latitude <= 55 &&
    longitude >= 100 &&
    longitude <= 150
  ) {
    return "East Asia";
  }
  if (latitude >= -10 && latitude < 20 && longitude >= 95 && longitude <= 140) {
    return "Southeast Asia";
  }
  if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    return "Europe";
  }
  if (
    latitude >= 15 &&
    latitude <= 75 &&
    longitude >= -170 &&
    longitude <= -50
  ) {
    return "North America";
  }
  if (latitude >= 10 && latitude <= 45 && longitude >= 30 && longitude <= 75) {
    return "Middle East";
  }
  if (latitude >= 5 && latitude <= 35 && longitude >= 65 && longitude <= 95) {
    return "Southeast Asia"
  }
  if (
    latitude >= -60 &&
    latitude <= 15 &&
    longitude >= -85 &&
    longitude <= -30
  ) {
    return "South America";
  }
  if (
    latitude >= -50 &&
    latitude <= -10 &&
    longitude >= 110 &&
    longitude <= 180
  ) {
    return "Oceania";
  }

  return "Africa";
}

function mapApiRiskLevel(
  apiLevel: string | undefined,
  score: number,
): RiskLevel {
  const normalized = apiLevel?.trim().toLowerCase();

  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (
    normalized === "elevated" ||
    normalized === "moderate" ||
    normalized === "medium"
  ) {
    return "elevated";
  }
  if (normalized === "low") return "low";

  return getRiskLevel(score);
}

function formatDateLabel(date: string | null) {
  if (!date) return "Unavailable";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function analyzeCustomLocation(
  name: string,
  lat: number,
  lon: number,
): Promise<AnalyzeLocationResponse> {
  const response = await fetch("/api/custom-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, lat, lon }),
  });

  const rawBody = await response.text();
  let parsedBody: AnalyzeLocationResponse | ApiErrorResponse | null = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as
        | AnalyzeLocationResponse
        | ApiErrorResponse;
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

  return parsedBody as AnalyzeLocationResponse;
}

function buildAlerts(
  forecast: ForecastDay[],
  peakDay: string | null,
): string[] {
  const alerts: string[] = [];
  const today = forecast[0];
  const highestRiskDay = [...forecast].sort(
    (a, b) => b.riskScore - a.riskScore,
  )[0];

  if (today && today.riskLevel === "critical") {
    alerts.push(`Critical risk today driven by ${today.primaryDriver}.`);
  } else if (today && today.riskLevel === "high") {
    alerts.push(`High risk today driven by ${today.primaryDriver}.`);
  }

  if (highestRiskDay && highestRiskDay.riskScore >= 70) {
    alerts.push(
      `Peak forecast risk reaches ${highestRiskDay.riskScore} on ${highestRiskDay.date.toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      )}.`,
    );
  }

  if (peakDay) {
    alerts.push(`7-day outlook peaks on ${formatDateLabel(peakDay)}.`);
  }

  return alerts.slice(0, 3);
}

function getFirstDefinedNumber(
  ...values: Array<number | undefined>
): number | undefined {
  return values.find(
    (value) => typeof value === "number" && !Number.isNaN(value),
  );
}

function getComponentScore(
  component:
    | number
    | {
        risk_score?: number;
        score?: number;
        risk?: number;
      }
    | undefined,
): number | undefined {
  if (!component) return undefined;
  if (typeof component === "number") return component;
  return getFirstDefinedNumber(
    component.risk_score,
    component.score,
    component.risk,
  );
}

function getMostCommonPrimaryDriver(forecast: ForecastDay[]): string | null {
  const counts = new Map<string, number>();

  for (const day of forecast) {
    const driver = day.primaryDriver?.trim();
    if (!driver) continue;
    counts.set(driver, (counts.get(driver) ?? 0) + 1);
  }

  let mostCommon: string | null = null;
  let highestCount = 0;

  for (const [driver, count] of counts.entries()) {
    if (count > highestCount) {
      mostCommon = driver;
      highestCount = count;
    }
  }

  return mostCommon;
}

function getGeopoliticalArticleStats(
  component: RiskEventAttribute["geopolitical_component"],
) {
  if (!component || typeof component === "number") {
    return {
      articleCount: null,
      sentiment: {
        positive: null,
        neutral: null,
        negative: null,
      },
    };
  }

  return {
    articleCount:
      getFirstDefinedNumber(
        component.article_count,
        component.articles_count,
      ) ?? null,
    sentiment: {
      positive:
        getFirstDefinedNumber(
          component.positive_count,
          component.positive_articles,
          component.sentiment_distribution?.positive,
        ) ?? null,
      neutral:
        getFirstDefinedNumber(
          component.neutral_count,
          component.neutral_articles,
          component.sentiment_distribution?.neutral,
        ) ?? null,
      negative:
        getFirstDefinedNumber(
          component.negative_count,
          component.negative_articles,
          component.sentiment_distribution?.negative,
        ) ?? null,
    },
  };
}

function getCountryScoreStats(attribute: RiskEventAttribute) {
  const countryScores = attribute.country_scores ?? [];
  const matchingCountry =
    countryScores.find(
      (score) => score.country && score.country === attribute.country,
    ) ?? countryScores[0];

  if (!matchingCountry) {
    return {
      articleCount: null,
      sentiment: {
        positive: null,
        neutral: null,
        negative: null,
      },
    };
  }

  return {
    articleCount:
      matchingCountry.timeframes?.["7d"]?.article_count ??
      matchingCountry.article_count ??
      null,
    sentiment: {
      positive:
        matchingCountry.timeframes?.["7d"]?.distribution?.positive ??
        matchingCountry.sentiment_distribution?.positive ??
        null,
      neutral:
        matchingCountry.timeframes?.["7d"]?.distribution?.neutral ??
        matchingCountry.sentiment_distribution?.neutral ??
        null,
      negative:
        matchingCountry.timeframes?.["7d"]?.distribution?.negative ??
        matchingCountry.sentiment_distribution?.negative ??
        null,
    },
  };
}

function resolveCountryName(
  latestAssessment: RiskEventAttribute,
  outlook: RiskEventAttribute,
  geopoliticalEvent?: RiskEvent
) {
  const countryCandidates = [
    geopoliticalEvent?.attribute?.country,
    latestAssessment.country,
    outlook.country,
  ]

  for (const candidate of countryCandidates) {
    const normalizedCountry = candidate?.trim()

    if (normalizedCountry) {
      return normalizedCountry
    }
  }

  return "Custom Location"
}

function mapRiskResponseToAnalysis(
  response: RiskLocationResponse,
  hubId: string,
  name: string,
  latitude: number,
  longitude: number,
  graphUrl: string | null,
): LocationAnalysis {
  const events = response.events ?? [];

  const dailyEvents = events
    .filter(
      (event) =>
        event.event_type === "daily_risk_assessment" && event.attribute?.date,
    )
    .sort(
      (left, right) => (left.attribute?.day ?? 0) - (right.attribute?.day ?? 0),
    );

  const outlookEvent = events.find((event) => event.event_type === "seven_day_outlook")
  const geopoliticalEvent = events.find((event) => event.event_type === "geopolitical_risk_assessment")
  const geopoliticalAttribute = geopoliticalEvent?.attribute

  const weeklyForecast: ForecastDay[] = dailyEvents.map((event) => {
    const attribute = event.attribute ?? {};
    const score = normalizeRiskScore(
      getFirstDefinedNumber(
        attribute.combined_risk_score,
        attribute.peak_risk_score,
        attribute.mean_risk_score,
      ),
    );

    return {
      date: new Date(attribute.date ?? ""),
      riskScore: score,
      riskLevel: mapApiRiskLevel(
        attribute.combined_risk_level ?? attribute.risk_level,
        score
      ),
      primaryDriver: attribute.primary_driver ?? "Unknown",
      worstInterval: attribute.worst_interval ?? null,
    };
  });

  const outlook = outlookEvent?.attribute ?? {};
  const latestAssessment = dailyEvents[0]?.attribute ?? {};
  const overallScore = normalizeRiskScore(
    getFirstDefinedNumber(
      getComponentScore(outlook.combined_component),
      outlook.combined_risk_score,
      outlook.outlook_risk_score,
      latestAssessment.combined_risk_score,
      latestAssessment.peak_risk_score,
      latestAssessment.mean_risk_score,
    ),
  );
  const overallRiskLevel = mapApiRiskLevel(
    outlook.combined_risk_level ??
      outlook.outlook_risk_level ??
      (typeof outlook.combined_component === "object"
        ? outlook.combined_component.risk_level
        : null) ??
      latestAssessment.combined_risk_level ??
      latestAssessment.risk_level,
    overallScore,
  );
  const weatherScore = normalizeRiskScore(
    getFirstDefinedNumber(
      getComponentScore(outlook.weather_component),
      outlook.outlook_weather_risk_score,
      outlook.weather_outlook_risk_score,
      latestAssessment.weather_risk_score,
      latestAssessment.weather_score,
      latestAssessment.weather_risk,
      ...(latestAssessment.snapshots ?? []).map((snapshot) =>
        getFirstDefinedNumber(
          snapshot.weather_risk_score,
          snapshot.weather_score,
          snapshot.weather_risk,
        ),
      ),
    ),
  );
  const geopoliticalScore = normalizeRiskScore(
    getFirstDefinedNumber(
      geopoliticalAttribute?.geopolitical_risk_score,
      getComponentScore(geopoliticalAttribute?.geopolitical_component),
      getComponentScore(outlook.geopolitical_component),
      outlook.outlook_geopolitical_risk_score,
      outlook.geopolitical_outlook_risk_score,
      latestAssessment.geopolitical_risk_score,
      latestAssessment.geopolitical_score,
      latestAssessment.geopolitical_risk,
      latestAssessment.geo_risk_score,
      ...(latestAssessment.snapshots ?? []).map((snapshot) =>
        getFirstDefinedNumber(
          snapshot.geopolitical_risk_score,
          snapshot.geopolitical_score,
          snapshot.geopolitical_risk,
          snapshot.geo_risk_score
        )
      )
    )
  )

  const resolvedLatitude = outlook.lat ?? latitude
  const resolvedLongitude = outlook.lon ?? longitude
  const weatherPrimaryDriver = getMostCommonPrimaryDriver(weeklyForecast)
  const geopoliticalComponentStats = getGeopoliticalArticleStats(outlook.geopolitical_component)
  const geopoliticalCountryStats = geopoliticalAttribute
    ? getCountryScoreStats(geopoliticalAttribute)
    : getCountryScoreStats(outlook)
  const country = resolveCountryName(latestAssessment, outlook, geopoliticalEvent)

  return {
    hubId,
    name,
    location: {
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
    },
    country,
    type: "dynamic",
    region: getRegionFromCoordinates(resolvedLatitude, resolvedLongitude),
    graphUrl,
    riskScore: overallScore,
    riskLevel: overallRiskLevel,
    apiRiskFactors: {
      weather: {
        score: weatherScore,
        primaryDriver: weatherPrimaryDriver,
        primaryDriverLabel: weatherPrimaryDriver ? "Most Common Driver" : null,
      },
      geopolitical: {
        score: geopoliticalScore,
        articleCount:
          geopoliticalCountryStats.articleCount ??
          geopoliticalComponentStats.articleCount,
        sentiment: {
          positive:
            geopoliticalCountryStats.sentiment.positive ??
            geopoliticalComponentStats.sentiment.positive,
          neutral:
            geopoliticalCountryStats.sentiment.neutral ??
            geopoliticalComponentStats.sentiment.neutral,
          negative:
            geopoliticalCountryStats.sentiment.negative ??
            geopoliticalComponentStats.sentiment.negative,
        },
      },
    },
    weeklyForecast,
    alerts: buildAlerts(weeklyForecast, outlook.peak_day ?? null),
    analyzedAt: new Date(),
    latestAssessmentDate: latestAssessment.date ?? null,
    latestPrimaryDriver: latestAssessment.primary_driver ?? null,
    latestWorstInterval: latestAssessment.worst_interval ?? null,
    dataSource: response.data_source ?? null,
    datasetType: response.dataset_type ?? null,
    modelVersion:
      outlook.model_version ?? latestAssessment.model_version ?? null,
    forecastOrigin: outlook.forecast_origin ?? null,
    daysAssessed:
      outlook.days_assessed ??
      (weeklyForecast.length > 0 ? weeklyForecast.length : null),
    peakDay: outlook.peak_day ?? null,
    peakDayNumber: outlook.peak_day_number ?? null,
  };
}

export default function CustomLocationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [formError, setFormError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hub, setHub] = useState<LocationAnalysis | null>(null);
  const isFormComplete =
    name.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleAnalyze = async () => {
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter a location name");
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setFormError("Latitude must be between -90 and 90");
      return;
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setFormError("Longitude must be between -180 and 180");
      return;
    }

    setIsAnalyzing(true);
    setHub(null);

    try {
      const analysisResponse = await analyzeCustomLocation(
        name.trim(),
        lat,
        lon,
      );
      const mappedHub = mapRiskResponseToAnalysis(
        analysisResponse.risk,
        analysisResponse.hub_id,
        name.trim(),
        lat,
        lon,
        analysisResponse.graph_url ?? null,
      );

      setHub(mappedHub);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to analyze location. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setHub(null);
    setName("");
    setLatitude("");
    setLongitude("");
    setFormError("");
  };

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
      {/* Navigation */}
      <NavBar
        actions={[
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <MapIcon className="h-4 w-4" />,
          },
          {
            href: "/optimal-path",
            label: "Optimal Path",
            icon: <Route className="h-4 w-4" />,
          },
        ]}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Analyze Custom Location
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Create a dynamic hub from a name and coordinates, then fetch
                  its latest risk analysis.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border/50 bg-card p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., New Warehouse Location"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isAnalyzing}
                    className="disabled:border-input disabled:bg-transparent disabled:text-foreground disabled:opacity-100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a descriptive name for this custom location
                  </p>
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
                      className="disabled:border-input disabled:bg-transparent disabled:text-foreground disabled:opacity-100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Range: -90 to 90
                    </p>
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
                      className="disabled:border-input disabled:bg-transparent disabled:text-foreground disabled:opacity-100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Range: -180 to 180
                    </p>
                  </div>
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !isFormComplete}
                    className="flex-1 gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        In Progress...
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
                  <li>
                    Use Google Maps or similar to find coordinates for any
                    location
                  </li>
                  <li>Positive latitude = North, Negative = South</li>
                  <li>Positive longitude = East, Negative = West</li>
                  <li>
                    Risk analysis considers weather patterns and geopolitical
                    factors.
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {!hub && !isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-muted-foreground">
                    No Location Analyzed
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Enter a name and coordinates to create a hub and fetch its
                    risk analysis.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-border/50 bg-card/30">
                  <Spinner className="h-10 w-10 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Creating the hub, ingesting forecast data, and waiting for
                    risk analysis...
                  </p>
                </div>
              )}

              {hub && !isAnalyzing && (
                <div className="rounded-lg border border-border/50 bg-card">
                  <div className="border-b border-border p-4">
                    <h2 className="text-lg font-bold">{hub.name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Dynamic location</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Analyzed{" "}
                        {hub.analyzedAt.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
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
                        <RiskAnalysisOverview
                          riskScore={hub.riskScore}
                          riskLevel={hub.riskLevel}
                          weatherRisk={hub.apiRiskFactors.weather}
                          geopoliticalRisk={hub.apiRiskFactors.geopolitical}
                          latestAssessmentDate={hub.latestAssessmentDate}
                          latestWorstInterval={hub.latestWorstInterval}
                          daysAssessed={hub.daysAssessed}
                          peakDay={hub.peakDay}
                          peakDayNumber={hub.peakDayNumber}
                          country={hub.country}
                          region={hub.region}
                          latitude={hub.location.latitude}
                          longitude={hub.location.longitude}
                          dataSource={hub.dataSource}
                          datasetType={hub.datasetType}
                          modelVersion={hub.modelVersion}
                        />
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="forecast" className="mt-0">
                      <ScrollArea className="h-[430px]">
                        <RiskAnalysisForecast
                          forecast={hub.weeklyForecast}
                        />
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
  );
}
