import type {
  RiskEvent as RiskEventResponse,
  RiskEventAttribute as RiskEventAttributeResponse,
  RiskLocationResponse,
} from "./risk-api-types"
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

const REGION_PRIORITY_ORDER = [
  "Africa",
  "East Asia",
  "Europe",
  "Middle East",
  "North America",
  "Oceania",
  "South America",
  "Southeast Asia",
  "Other",
] as const

const COUNTRY_TO_REGION: Record<string, string> = {
  albania: "Europe",
  algeria: "Europe",
  "american samoa": "Other",
  angola: "Africa",
  anguilla: "North America",
  "antigua and barbuda": "North America",
  argentina: "South America",
  aruba: "South America",
  australia: "Oceania",
  azerbaijan: "Middle East",
  bahrain: "Middle East",
  bangladesh: "Southeast Asia",
  barbados: "South America",
  belgium: "Europe",
  belize: "North America",
  benin: "Africa",
  brazil: "South America",
  "british virgin islands": "North America",
  "brunei darussalam": "Southeast Asia",
  bulgaria: "Europe",
  "cabo verde": "Other",
  cambodia: "Southeast Asia",
  cameroon: "Africa",
  canada: "North America",
  "cayman islands": "North America",
  chile: "South America",
  china: "East Asia",
  colombia: "South America",
  comoros: "Africa",
  "cook islands": "Other",
  "costa rica": "South America",
  "cote d'ivoire": "Africa",
  croatia: "Europe",
  cuba: "North America",
  curacao: "South America",
  cyprus: "Middle East",
  "democratic republic of the congo": "Africa",
  denmark: "Europe",
  djibouti: "Middle East",
  dominica: "North America",
  "dominican republic": "North America",
  ecuador: "South America",
  egypt: "Middle East",
  "el salvador": "Other",
  "equatorial guinea": "Africa",
  eritrea: "Middle East",
  estonia: "Europe",
  "faroe islands": "Europe",
  fiji: "Oceania",
  finland: "Europe",
  france: "Europe",
  "french guiana": "South America",
  "french polynesia": "Other",
  gabon: "Africa",
  georgia: "Middle East",
  germany: "Europe",
  ghana: "Africa",
  gibraltar: "Europe",
  "great britain": "Europe",
  greece: "Europe",
  grenada: "South America",
  guadeloupe: "North America",
  guam: "Other",
  guatemala: "Other",
  guinea: "Africa",
  "guinea-bissau": "Africa",
  guyana: "South America",
  haiti: "North America",
  honduras: "North America",
  "hong kong sar": "East Asia",
  "hong kong": "East Asia",
  iceland: "Other",
  india: "Southeast Asia",
  indonesia: "Southeast Asia",
  iran: "Middle East",
  iraq: "Middle East",
  ireland: "Europe",
  israel: "Middle East",
  italy: "Europe",
  jamaica: "North America",
  japan: "East Asia",
  jordan: "Middle East",
  kazakhstan: "Middle East",
  kenya: "Africa",
  kiribati: "Other",
  korea: "East Asia",
  kuwait: "Middle East",
  latvia: "Europe",
  lebanon: "Middle East",
  liberia: "Africa",
  libya: "Africa",
  lithuania: "Europe",
  "macao sar": "East Asia",
  "macao": "East Asia",
  madagascar: "Africa",
  malaysia: "Southeast Asia",
  maldives: "Southeast Asia",
  malta: "Europe",
  "marshall islands": "Other",
  martinique: "South America",
  mauritania: "Africa",
  mauritius: "Other",
  mayotte: "Africa",
  mexico: "North America",
  micronesia: "Other",
  moldova: "Europe",
  montenegro: "Europe",
  montserrat: "North America",
  morocco: "Africa",
  mozambique: "Africa",
  myanmar: "Southeast Asia",
  namibia: "Africa",
  nauru: "Other",
  "new caledonia": "Oceania",
  "new zealand": "Oceania",
  nicaragua: "Other",
  nigeria: "Africa",
  "northern mariana islands": "Other",
  norway: "Europe",
  oman: "Middle East",
  pakistan: "Middle East",
  palau: "Southeast Asia",
  panama: "South America",
  "papua new guinea": "Other",
  peru: "South America",
  philippines: "Southeast Asia",
  poland: "Europe",
  portugal: "Europe",
  "puerto rico": "North America",
  qatar: "Middle East",
  "republic of congo": "Africa",
  "republic of korea": "East Asia",
  reunion: "Other",
  romania: "Europe",
  "russian federation": "Europe",
  "saint eustatius and saba": "North America",
  "saint martin": "North America",
  "saint-barthelemy": "North America",
  samoa: "Other",
  "sao tome and principe": "Africa",
  "saudi arabia": "Middle East",
  senegal: "Africa",
  seychelles: "Other",
  "sierra leone": "Africa",
  "sint maarten": "North America",
  slovenia: "Europe",
  "solomon islands": "Other",
  somalia: "Africa",
  "south africa": "Africa",
  spain: "Europe",
  "sri lanka": "Southeast Asia",
  "st kitts and nevis": "North America",
  "st lucia": "South America",
  "st vincent and the grenadines": "South America",
  sudan: "Middle East",
  suriname: "South America",
  sweden: "Europe",
  syria: "Europe",
  "taiwan province of china": "East Asia",
  taiwan: "East Asia",
  tanzania: "Africa",
  thailand: "Southeast Asia",
  "the bahamas": "North America",
  "the gambia": "Africa",
  "the netherlands": "Europe",
  netherlands: "Europe",
  "timor-leste": "Southeast Asia",
  togo: "Africa",
  tonga: "Other",
  "trinidad and tobago": "South America",
  tunisia: "Africa",
  turkiye: "Europe",
  turkey: "Europe",
  turkmenistan: "Middle East",
  "turks and caicos islands": "North America",
  tuvalu: "Other",
  uk: "Europe",
  ukraine: "Europe",
  "united arab emirates": "Middle East",
  "united kingdom": "Europe",
  "united states": "North America",
  "united states virgin islands": "North America",
  us: "North America",
  usa: "North America",
  uruguay: "South America",
  vanuatu: "Oceania",
  venezuela: "South America",
  vietnam: "Southeast Asia",
  yemen: "Middle East",
}

export const DEFAULT_MONITORED_HUB_LIMIT = 70
export const DEFAULT_MONITORED_HUB_SOURCE_LIMIT = 250

interface LocationListItem {
  hub_id: string
  name: string
  lat: number
  lon: number
}

export type DashboardLocation = Pick<LocationListItem, "hub_id" | "name" | "lat" | "lon"> & {
  country: string
  region: string
}

export interface DashboardLocationsResult {
  hubs: SupplyChainHub[]
  locations: DashboardLocation[]
}

interface ListLocationResponse {
  hubs: LocationListItem[]
}

class DashboardApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "DashboardApiError"
    this.status = status
  }
}

function getFirstDefinedNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && !Number.isNaN(value))
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
    throw new DashboardApiError(errorText || `Request failed with status ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientBackendError(error: DashboardApiError) {
  return error.status === 502 || error.status === 503 || error.status === 504
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function scaleRiskScore(score?: number) {
  return clampScore((score ?? 0) * 100)
}

function normalizeRiskScore(score?: number) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0
  const scaledScore = score <= 1 ? score * 100 : score
  return clampScore(scaledScore)
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

function getSydneyDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function getRiskResponseDateKey(response: RiskLocationResponse): string | null {
  if (response.time_object?.timestamp) {
    const parsedTimestamp = new Date(response.time_object.timestamp)

    if (!Number.isNaN(parsedTimestamp.getTime())) {
      return getSydneyDateKey(parsedTimestamp)
    }
  }

  return null
}

function isCurrentDayRiskAnalysis(response: RiskLocationResponse) {
  const responseDateKey = getRiskResponseDateKey(response)
  const todayKey = getSydneyDateKey(new Date())

  return responseDateKey === todayKey
}

async function fetchRiskAnalysisWithRetry(hubId: string): Promise<RiskLocationResponse> {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const riskResponse = await fetchJson<RiskLocationResponse>(
        `/ese/v1/risk/location/${encodeURIComponent(hubId)}`
      )

      if (isCurrentDayRiskAnalysis(riskResponse)) {
        return riskResponse
      }

      if (attempt === 11) {
        throw new Error("Risk analysis is not available yet for the current date.")
      }

      await delay(2500)
      continue
    } catch (error) {
      if (!(error instanceof DashboardApiError)) {
        throw error
      }

      const isMissingProcessedData =
        error.status === 404 ||
        (error.status === 400 && error.message.toLowerCase().includes("processed data"))

      if ((!isMissingProcessedData && !isTransientBackendError(error)) || attempt === 11) {
        throw error
      }

      await delay(2500)
    }
  }

  throw new Error("Risk analysis failed")
}

function getComponentScore(
  component?:
    | number
    | {
        risk_score?: number
        score?: number
        risk?: number
      }
) {
  if (!component) return undefined
  if (typeof component === "number") return component
  return getFirstDefinedNumber(component.risk_score, component.score, component.risk)
}

function inferHubType(name: string): HubType {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("airport")) return "airport"
  if (lowerName.includes("distribution")) return "distribution-center"
  return "port"
}

function normalizeCountryName(country: string) {
  return country
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
}

function getRegionOrder(region: string) {
  const index = REGION_PRIORITY_ORDER.indexOf(region as (typeof REGION_PRIORITY_ORDER)[number])
  return index === -1 ? REGION_PRIORITY_ORDER.length : index
}

function compareByRiskThenId(left: Pick<SupplyChainHub, "riskScore" | "id">, right: Pick<SupplyChainHub, "riskScore" | "id">) {
  if (right.riskScore !== left.riskScore) {
    return right.riskScore - left.riskScore
  }

  return left.id.localeCompare(right.id)
}

function compareLocationById(left: Pick<LocationListItem, "hub_id">, right: Pick<LocationListItem, "hub_id">) {
  return left.hub_id.localeCompare(right.hub_id)
}

function extractPortwatchCountry(name: string) {
  const parts = name.split(",")
  const country = parts.at(-1)?.trim()
  return country || null
}

function stripPortwatchCountryFromName(hubId: string, name: string) {
  if (!hubId.startsWith("PW")) {
    return name
  }

  const parts = name.split(",")

  if (parts.length <= 1) {
    return name
  }

  return parts.slice(0, -1).join(",").trim()
}

function deriveMonitoredHubCountry(location: LocationListItem, staticMetadata?: { country: string; region: string; type: HubType }) {
  if (staticMetadata) {
    return staticMetadata.country
  }

  if (location.hub_id.startsWith("PW")) {
    return extractPortwatchCountry(location.name)
  }

  return null
}

function deriveMonitoredHubRegion(country: string | null, staticMetadata?: { country: string; region: string; type: HubType }) {
  if (staticMetadata) {
    return staticMetadata.region
  }

  if (!country) {
    return "Other"
  }

  return COUNTRY_TO_REGION[normalizeCountryName(country)] ?? "Other"
}

function getHubMetadata(location: LocationListItem) {
  const staticMetadata = STATIC_HUB_METADATA[location.hub_id]
  const country = deriveMonitoredHubCountry(location, staticMetadata)
  const region = deriveMonitoredHubRegion(country, staticMetadata)

  if (staticMetadata) {
    return staticMetadata
  }

  return {
    country: country ?? "Unknown",
    region,
    type: inferHubType(location.name),
  }
}

function toDashboardLocation(location: LocationListItem): DashboardLocation {
  const metadata = getHubMetadata(location)

  return {
    hub_id: location.hub_id,
    name: stripPortwatchCountryFromName(location.hub_id, location.name),
    lat: location.lat,
    lon: location.lon,
    country: metadata.country,
    region: metadata.region,
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
    name: stripPortwatchCountryFromName(location.hub_id, location.name),
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

function getMostCommonPrimaryDriver(forecast: DailyRisk[]) {
  const counts = new Map<string, number>()

  for (const day of forecast) {
    const driver = day.primaryDriver?.trim()
    if (!driver) continue
    counts.set(driver, (counts.get(driver) ?? 0) + 1)
  }

  let mostCommon: string | null = null
  let highestCount = 0

  for (const [driver, count] of counts.entries()) {
    if (count > highestCount) {
      mostCommon = driver
      highestCount = count
    }
  }

  return mostCommon
}

function getGeopoliticalArticleStats(component: RiskEventAttributeResponse["geopolitical_component"]) {
  if (!component || typeof component === "number") {
    return {
      articleCount: null,
      sentiment: {
        positive: null,
        neutral: null,
        negative: null,
      },
    }
  }

  return {
    articleCount: getFirstDefinedNumber(component.article_count, component.articles_count) ?? null,
    sentiment: {
      positive:
        getFirstDefinedNumber(
          component.positive_count,
          component.positive_articles,
          component.sentiment_distribution?.positive
        ) ?? null,
      neutral:
        getFirstDefinedNumber(
          component.neutral_count,
          component.neutral_articles,
          component.sentiment_distribution?.neutral
        ) ?? null,
      negative:
        getFirstDefinedNumber(
          component.negative_count,
          component.negative_articles,
          component.sentiment_distribution?.negative
        ) ?? null,
    },
  }
}

function getCountryScoreStats(attribute?: RiskEventAttributeResponse) {
  const countryScores = attribute?.country_scores ?? []
  const matchingCountry =
    countryScores.find((score) => score.country && score.country === attribute?.country) ??
    countryScores[0]

  if (!matchingCountry) {
    return {
      articleCount: null,
      sentiment: {
        positive: null,
        neutral: null,
        negative: null,
      },
    }
  }

  return {
    articleCount:
      matchingCountry.timeframes?.["7d"]?.article_count,
    sentiment: {
      positive:
        matchingCountry.timeframes?.["7d"]?.distribution?.positive,
      neutral:
        matchingCountry.timeframes?.["7d"]?.distribution?.neutral,
      negative:
        matchingCountry.timeframes?.["7d"]?.distribution?.negative,
    },
  }
}

function mapDailyForecast(event: RiskEventResponse): DailyRisk | null {
  if (event.event_type !== "daily_risk_assessment" || !event.attribute?.date) {
    return null
  }

  const riskScore = normalizeRiskScore(
    getFirstDefinedNumber(
      event.attribute.combined_risk_score,
      event.attribute.mean_risk_score
    )
  )

  return {
    date: parseDate(event.attribute.date) ?? new Date(),
    riskScore,
    riskLevel: normalizeRiskLevel(event.attribute.combined_risk_level, riskScore),
    primaryDriver: event.attribute.primary_driver ?? "Unknown",
  }
}

function mapRiskOverview(response: RiskLocationResponse): ApiRiskOverview | undefined {
  const dailyEvents = (response.events ?? [])
    .filter((event) => event.event_type === "daily_risk_assessment")
    .sort((left, right) => {
      return (left.attribute?.day ?? 0) - (right.attribute?.day ?? 0)
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
  const events = risk.events ?? []
  const dailyRiskEvents = events
    .filter((event) => event.event_type === "daily_risk_assessment")
    .sort((left, right) => {
      return (left.attribute?.day ?? 0) - (right.attribute?.day ?? 0)
    })
  const dailyForecast = dailyRiskEvents
    .map(mapDailyForecast)
    .filter((item): item is DailyRisk => item !== null)
    .slice(0, 7)

  const currentAssessment = dailyRiskEvents[0]?.attribute
  const outlook = events.find((event) => event.event_type === "seven_day_outlook")?.attribute
  const geopoliticalEvent = events.find(
    (event) => event.event_type === "geopolitical_risk_assessment"
  )?.attribute

  const riskScore = scaleRiskScore(
    currentAssessment?.combined_risk_score ??
      currentAssessment?.peak_risk_score ??
      currentAssessment?.mean_risk_score ??
      outlook?.combined_risk_score ??
      outlook?.outlook_risk_score
  )
  const fallbackRiskFactors = createFallbackRiskFactors(riskScore)
  const weatherScoreValue = getFirstDefinedNumber(
    getComponentScore(outlook?.weather_component),
    getComponentScore(currentAssessment?.weather_component),
    ...((currentAssessment?.snapshots ?? []).map((snapshot) => snapshot.risk_score))
  )
  const geopoliticalScoreValue = getFirstDefinedNumber(
    getComponentScore(outlook?.geopolitical_component),
    getComponentScore(currentAssessment?.geopolitical_component),
    currentAssessment?.geopolitical_risk_score
  )
  const weatherScore =
    weatherScoreValue !== undefined
      ? normalizeRiskScore(weatherScoreValue)
      : fallbackRiskFactors.weather.score
  const geopoliticalScore =
    geopoliticalScoreValue !== undefined
      ? normalizeRiskScore(geopoliticalScoreValue)
      : fallbackRiskFactors.geopolitical.score
  const weatherPrimaryDriver = getMostCommonPrimaryDriver(dailyForecast)
  const geopoliticalComponentStats = getGeopoliticalArticleStats(outlook?.geopolitical_component)
  const geopoliticalCountryStats = geopoliticalEvent?.country_scores?.length
    ? getCountryScoreStats(geopoliticalEvent)
    : getCountryScoreStats(outlook)
  const apiRisk = mapRiskOverview(risk)

  return {
    id: location.hub_id,
    name: stripPortwatchCountryFromName(
      location.hub_id,
      currentAssessment?.hub_name ?? location.name
    ),
    location: {
      latitude: location.lat,
      longitude: location.lon,
    },
    country: metadata.country,
    region: metadata.region,
    type: metadata.type,
    riskScore,
    riskLevel: normalizeRiskLevel(
      currentAssessment?.combined_risk_level ??
        currentAssessment?.risk_level ??
        outlook?.combined_risk_level ??
        outlook?.outlook_risk_level,
      riskScore
    ),
    riskFactors: fallbackRiskFactors,
    apiRiskFactors: {
      weather: {
        score: weatherScore,
        primaryDriver: weatherPrimaryDriver,
        primaryDriverLabel: weatherPrimaryDriver ? "Most Common Driver" : null,
      },
      geopolitical: {
        score: geopoliticalScore,
        articleCount:
          geopoliticalCountryStats.articleCount ?? geopoliticalComponentStats.articleCount,
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
    weeklyForecast: dailyForecast,
    lastUpdated: parseDate(risk.time_object?.timestamp) ?? new Date(),
    alerts: buildAlerts(currentAssessment, outlook),
    apiRisk,
    latestAssessmentDate: apiRisk?.currentDate,
    latestPrimaryDriver: currentAssessment?.primary_driver ?? null,
    latestWorstInterval: apiRisk?.worstInterval,
    daysAssessed: apiRisk?.daysAssessed ?? (dailyForecast.length > 0 ? dailyForecast.length : undefined),
    peakDay: apiRisk?.peakDay,
    peakDayNumber: apiRisk?.peakDayNumber,
    riskDataAvailable: true,
  }
}

function shortlistLocations(locations: LocationListItem[], limit: number) {
  if (limit <= 0 || locations.length <= limit) {
    return [...locations].sort(compareLocationById)
  }

  const grouped = new Map<string, LocationListItem[]>()

  for (const location of locations) {
    const region = getHubMetadata(location).region || "Other"
    const bucket = grouped.get(region)

    if (bucket) {
      bucket.push(location)
    } else {
      grouped.set(region, [location])
    }
  }

  for (const bucket of grouped.values()) {
    bucket.sort(compareLocationById)
  }

  const baseRegions = Array.from(grouped.keys())
    .filter((region) => region !== "Other")
    .sort((left, right) => {
      const regionOrder = getRegionOrder(left) - getRegionOrder(right)
      return regionOrder !== 0 ? regionOrder : left.localeCompare(right)
    })

  const selected: LocationListItem[] = []
  const selectedIds = new Set<string>()
  const nextIndexByRegion = new Map<string, number>()
  const baseQuota = baseRegions.length > 0 ? Math.floor(limit / baseRegions.length) : 0

  for (const region of grouped.keys()) {
    nextIndexByRegion.set(region, 0)
  }

  for (const region of baseRegions) {
    const bucket = grouped.get(region) ?? []
    const takeCount = Math.min(baseQuota, bucket.length)

    for (let index = 0; index < takeCount; index++) {
      const location = bucket[index]
      selected.push(location)
      selectedIds.add(location.hub_id)
    }

    nextIndexByRegion.set(region, takeCount)
  }

  while (selected.length < limit) {
    let nextLocation: LocationListItem | null = null
    let nextRegion: string | null = null

    for (const [region, bucket] of grouped.entries()) {
      const index = nextIndexByRegion.get(region) ?? 0
      const candidate = bucket[index]

      if (!candidate || selectedIds.has(candidate.hub_id)) {
        continue
      }

      if (!nextLocation || compareLocationById(candidate, nextLocation) < 0) {
        nextLocation = candidate
        nextRegion = region
      }
    }

    if (!nextLocation || !nextRegion) {
      break
    }

    selected.push(nextLocation)
    selectedIds.add(nextLocation.hub_id)
    nextIndexByRegion.set(nextRegion, (nextIndexByRegion.get(nextRegion) ?? 0) + 1)
  }

  return selected.sort(compareLocationById)
}

export async function listLocations(limit = DEFAULT_MONITORED_HUB_SOURCE_LIMIT) {
  const searchParams = new URLSearchParams({ type: "monitored" })

  if (limit > 0) {
    searchParams.set("limit", String(limit))
  }

  const response = await fetchJson<ListLocationResponse>(`/ese/v1/location/list?${searchParams.toString()}`)
  return response.hubs ?? []
}

export async function fetchDashboardSearchLocations(): Promise<DashboardLocation[]> {
  const locations = await listLocations(0)
  return locations.map(toDashboardLocation).sort((left, right) => left.name.localeCompare(right.name))
}

function mapRiskResults(
  locations: LocationListItem[],
  riskResults: PromiseSettledResult<{ location: LocationListItem; risk: RiskLocationResponse }>[]
) {
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

export async function fetchDashboardHubs(
  shortlistLimit = DEFAULT_MONITORED_HUB_LIMIT,
  sourceLimit = DEFAULT_MONITORED_HUB_SOURCE_LIMIT
): Promise<DashboardLocationsResult> {
  const sourceLocations = await listLocations(sourceLimit)
  const shortlistedLocations = shortlistLocations(sourceLocations, shortlistLimit)

  const riskResults = await Promise.allSettled(
    shortlistedLocations.map(async (location) => ({
      location,
      risk: await fetchJson<RiskLocationResponse>(
        `/ese/v1/risk/location/${encodeURIComponent(location.hub_id)}`
      ),
    }))
  )

  const mappedHubs = mapRiskResults(shortlistedLocations, riskResults).sort(compareByRiskThenId)

  return {
    hubs: mappedHubs,
    locations: shortlistedLocations.map(toDashboardLocation),
  }
}

export async function refreshDashboardHubs(
  locations: DashboardLocation[]
): Promise<SupplyChainHub[]> {
  await Promise.allSettled(
    locations.map((location) =>
      fetchJson<{ message?: string }>(
        `/ese/v1/ingest/weather/${encodeURIComponent(location.hub_id)}`,
        { method: "POST" }
      )
    )
  )

  const riskResults = await Promise.allSettled(
    locations.map(async (location) => ({
      location,
      risk: await fetchRiskAnalysisWithRetry(location.hub_id),
    }))
  )

  return mapRiskResults(locations, riskResults)
}

export async function refreshDashboardHub(location: DashboardLocation): Promise<SupplyChainHub> {
  await fetchJson<{ message?: string }>(
    `/ese/v1/ingest/weather/${encodeURIComponent(location.hub_id)}`,
    { method: "POST" }
  )

  const risk = await fetchRiskAnalysisWithRetry(location.hub_id)
  return mapLocationRisk(location, risk)
}
