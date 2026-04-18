import { getRegionFromCoordinates } from "./supply-chain-data"
import type {
  ApiRiskOverview,
  DailyRisk,
  HubType,
  RiskFactors,
  RiskLevel,
  SupplyChainHub,
} from "./types"

const STATIC_HUB_METADATA: Record<string, { country: string; region: string; type: HubType }> = {
  H001: { country: "Singapore", region: "Southeast Asia", type: "port" },
  H002: { country: "China", region: "East Asia", type: "port" },
  H003: { country: "Netherlands", region: "Europe", type: "port" },
  H004: { country: "Australia", region: "Oceania", type: "port" },
  H005: { country: "United States", region: "North America", type: "port" },
  H006: { country: "South Africa", region: "Africa", type: "port" },
  H007: { country: "United Arab Emirates", region: "Middle East", type: "port" },
  H008: { country: "Brazil", region: "South America", type: "port" },
}

interface LocationListItem {
  hub_id: string
  name: string
  lat: number
  lon: number
}

interface ListLocationResponse {
  hubs: LocationListItem[]
}

interface RiskSnapshotResponse {
  forecast_timestamp?: string
  risk_score?: number
  risk_level?: string
  primary_driver?: string
}

interface RiskEventAttributeResponse {
  hub_id?: string
  hub_name?: string
  date?: string
  peak_risk_score?: number
  mean_risk_score?: number
  risk_level?: string
  primary_driver?: string
  worst_interval?: string
  snapshots?: RiskSnapshotResponse[]
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

interface RiskEventResponse {
  event_type?: string
  attribute?: RiskEventAttributeResponse
}

interface RiskLocationResponse {
  data_source?: string
  dataset_type?: string
  time_object?: {
    timestamp?: string
  }
  events?: RiskEventResponse[]
}

function buildUrl(path: string) {
  return `/api/supply-chain${path}`
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function scaleRiskScore(score?: number) {
  return clampScore((score ?? 0) * 100)
}

function normalizeRiskLevel(level?: string, fallbackScore = 0): RiskLevel {
  switch (level?.trim().toLowerCase()) {
    case "low":
      return "low"
    case "elevated":
      return "elevated"
    case "high":
      return "high"
    case "critical":
      return "critical"
    default:
      if (fallbackScore <= 25) return "low"
      if (fallbackScore <= 50) return "elevated"
      if (fallbackScore <= 75) return "high"
      return "critical"
  }
}

function parseDate(value?: string) {
  if (!value) return undefined
  if (value.includes("T")) return new Date(value)
  return new Date(value.replace(" ", "T") + "Z")
}

function inferHubType(name: string): HubType {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("airport")) return "airport"
  if (lowerName.includes("distribution")) return "distribution-center"
  return "port"
}

function getHubMetadata(location: LocationListItem) {
  const staticMetadata = STATIC_HUB_METADATA[location.hub_id]

  if (staticMetadata) {
    return staticMetadata
  }

  return {
    country: "Custom Location",
    region: getRegionFromCoordinates(location.lat, location.lon),
    type: inferHubType(location.name),
  }
}

function createFallbackRiskFactors(score: number): RiskFactors {
  const safeScore = clampScore(score)

  return {
    weather: {
      score: safeScore,
      stormProbability: safeScore,
      floodRisk: Math.max(0, safeScore - 10),
      temperatureAnomaly: Number((safeScore / 20).toFixed(1)),
      forecast: "Loaded from risk analytics API.",
    },
    logistics: {
      score: safeScore,
      portCongestion: safeScore,
      shippingDelays: safeScore,
      capacityUtilization: Math.min(100, safeScore + 15),
      vesselTraffic: Math.max(0, safeScore - 5),
    },
    geopolitical: {
      score: safeScore,
      tradeRestrictions: Math.max(0, safeScore - 10),
      regionalStability: Math.max(0, 100 - safeScore),
      regulatoryChanges: safeScore,
    },
  }
}

function createUnavailableHub(location: LocationListItem): SupplyChainHub {
  const metadata = getHubMetadata(location)

  return {
    id: location.hub_id,
    name: location.name,
    location: {
      latitude: location.lat,
      longitude: location.lon,
    },
    country: metadata.country,
    region: metadata.region,
    type: metadata.type,
    riskScore: 0,
    riskLevel: "low",
    riskFactors: createFallbackRiskFactors(0),
    weeklyForecast: [],
    lastUpdated: new Date(),
    alerts: ["Risk data is not available for this hub yet."],
    riskDataAvailable: false,
  }
}

function buildAlerts(
  currentAssessment: RiskEventAttributeResponse | undefined,
  outlook: RiskEventAttributeResponse | undefined
) {
  const alerts: string[] = []
  const currentScore = scaleRiskScore(currentAssessment?.peak_risk_score)

  if (currentAssessment?.primary_driver) {
    alerts.push(`Latest driver: ${currentAssessment.primary_driver}`)
  }

  if (currentScore >= 75) {
    alerts.push(`Immediate attention recommended for ${currentAssessment?.date ?? "today"}.`)
  }

  if (outlook?.peak_day) {
    const peakDay = parseDate(outlook.peak_day)
    if (peakDay) {
      alerts.push(
        `Peak outlook risk is forecast for ${peakDay.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}.`
      )
    }
  }

  return alerts
}

function mapDailyForecast(event: RiskEventResponse): DailyRisk | null {
  if (event.event_type !== "daily_risk_assessment" || !event.attribute?.date) {
    return null
  }

  const riskScore = scaleRiskScore(
    event.attribute.peak_risk_score ?? event.attribute.mean_risk_score
  )

  return {
    date: parseDate(event.attribute.date) ?? new Date(),
    riskScore,
    riskLevel: normalizeRiskLevel(event.attribute.risk_level, riskScore),
    primaryDriver: event.attribute.primary_driver ?? "Unknown",
  }
}

function mapRiskOverview(response: RiskLocationResponse): ApiRiskOverview | undefined {
  const dailyEvents = (response.events ?? [])
    .filter((event) => event.event_type === "daily_risk_assessment")
    .sort((left, right) => {
      const leftDate = parseDate(left.attribute?.date)?.getTime() ?? 0
      const rightDate = parseDate(right.attribute?.date)?.getTime() ?? 0
      return leftDate - rightDate
    })
  const firstDaily = dailyEvents[0]?.attribute
  const outlook = response.events?.find((event) => event.event_type === "seven_day_outlook")?.attribute

  if (!firstDaily && !outlook) {
    return undefined
  }

  return {
    dataSource: response.data_source ?? "Risk analytics API",
    datasetType: response.dataset_type ?? "Supply Chain Risk",
    modelVersion: firstDaily?.model_version ?? outlook?.model_version,
    forecastOrigin: parseDate(outlook?.forecast_origin),
    peakDay: parseDate(outlook?.peak_day),
    peakDayNumber: outlook?.peak_day_number,
    daysAssessed: outlook?.days_assessed,
    currentDate: parseDate(firstDaily?.date),
    worstInterval: parseDate(firstDaily?.worst_interval),
    snapshotCount: firstDaily?.snapshots?.length ?? 0,
  }
}

function mapLocationRisk(location: LocationListItem, risk: RiskLocationResponse): SupplyChainHub {
  const metadata = getHubMetadata(location)
  const dailyRiskEvents = (risk.events ?? [])
    .filter((event) => event.event_type === "daily_risk_assessment")
    .sort((left, right) => {
      const leftDate = parseDate(left.attribute?.date)?.getTime() ?? 0
      const rightDate = parseDate(right.attribute?.date)?.getTime() ?? 0
      return leftDate - rightDate
    })
  const dailyForecast = dailyRiskEvents
    .map(mapDailyForecast)
    .filter((item): item is DailyRisk => item !== null)
    .slice(0, 7)

  const currentAssessment = dailyRiskEvents[0]?.attribute
  const outlook = risk.events?.find((event) => event.event_type === "seven_day_outlook")?.attribute

  const riskScore = scaleRiskScore(
    currentAssessment?.peak_risk_score ??
      currentAssessment?.mean_risk_score ??
      outlook?.outlook_risk_score
  )

  return {
    id: location.hub_id,
    name: currentAssessment?.hub_name ?? location.name,
    location: {
      latitude: location.lat,
      longitude: location.lon,
    },
    country: metadata.country,
    region: metadata.region,
    type: metadata.type,
    riskScore,
    riskLevel: normalizeRiskLevel(
      currentAssessment?.risk_level ?? outlook?.outlook_risk_level,
      riskScore
    ),
    riskFactors: createFallbackRiskFactors(riskScore),
    weeklyForecast: dailyForecast,
    lastUpdated: parseDate(risk.time_object?.timestamp) ?? new Date(),
    alerts: buildAlerts(currentAssessment, outlook),
    apiRisk: mapRiskOverview(risk),
    riskDataAvailable: true,
  }
}

export async function listLocations() {
  const response = await fetchJson<ListLocationResponse>("/ese/v1/location/list?type=scheduled")
  return response.hubs ?? []
}

export async function fetchDashboardHubs() {
  const locations = await listLocations()

  const riskResults = await Promise.allSettled(
    locations.map(async (location) => ({
      location,
      risk: await fetchJson<RiskLocationResponse>(
        `/ese/v1/risk/location/${encodeURIComponent(location.hub_id)}`
      ),
    }))
  )

  return riskResults.map((result, index) => {
    const location = locations[index]
    if (!location) {
      throw new Error("Location list changed while mapping dashboard data.")
    }

    if (result.status === "fulfilled") {
      return mapLocationRisk(location, result.value.risk)
    }

    return createUnavailableHub(location)
  })
}

export async function refreshDashboardHubs() {
  const locations = await listLocations()

  await Promise.allSettled(
    locations.map((location) =>
      fetchJson<{ message?: string }>(
        `/ese/v1/ingest/weather/${encodeURIComponent(location.hub_id)}`,
        { method: "POST" }
      )
    )
  )

  return fetchDashboardHubs()
}
