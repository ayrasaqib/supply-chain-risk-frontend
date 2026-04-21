import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

const STATIC_HUB_COUNTRIES: Record<string, string> = {
  H001: "Singapore",
  H002: "China",
  H003: "Netherlands",
  H004: "Australia",
  H005: "United States",
  H006: "South Africa",
  H007: "United Arab Emirates",
  H008: "Brazil",
}

interface ApiErrorResponse {
  error?: string
}

interface RouteHub {
  hub_id?: string
  name?: string
  latitude?: number
  longitude?: number
  risk_score?: number
}

interface PathfindingResponse {
  route?: RouteHub[]
  total_distance_km?: number
  average_risk_score?: number
}

interface LocationListItem {
  hub_id: string
  name: string
}

interface ListLocationResponse {
  hubs?: LocationListItem[]
}

class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  const rawBody = await response.text()
  let parsedBody: T | ApiErrorResponse | null = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as T | ApiErrorResponse
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
        : rawBody || `Request failed with status ${response.status}`

    throw new ApiRequestError(message, response.status)
  }

  return parsedBody as T
}

async function listLocations() {
  const searchParams = new URLSearchParams({ type: "monitored" })
  const response = await apiRequest<ListLocationResponse>(
    `/ese/v1/location/list?${searchParams.toString()}`
  )

  return response.hubs ?? []
}

function toNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }

  return null
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function getStringProperty(source: Record<string, unknown>, key: string) {
  const value = source[key]
  return typeof value === "string" ? value : null
}

function getNumberProperty(source: Record<string, unknown>, key: string) {
  return toNumber(source[key])
}

function normalizeRiskScore(score: number | null) {
  if (score === null) {
    return null
  }

  const scaledScore = score >= 0 && score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(scaledScore)))
}

function extractPortwatchCountry(name: string) {
  const parts = name.split(",")
  const country = parts.at(-1)?.trim()
  return country || null
}

function getCountryForHub(location: LocationListItem) {
  const staticCountry = STATIC_HUB_COUNTRIES[location.hub_id]
  if (staticCountry) {
    return staticCountry
  }

  if (location.hub_id.startsWith("PW")) {
    return extractPortwatchCountry(location.name)
  }

  return null
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function calculateDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function filterRouteToUniqueCountries(
  route: NonNullable<ReturnType<typeof normalizeRouteHub>>[],
  countryByHubId: Map<string, string>,
  startHubId: string,
  endHubId: string
) {
  if (route.length <= 2) {
    return route
  }

  const startHub = route[0]
  const endHub = route[route.length - 1]

  if (!startHub || !endHub) {
    return route
  }

  const startCountry = countryByHubId.get(startHub.hub_id) ?? null
  const endCountry = countryByHubId.get(endHub.hub_id) ?? null
  const seenCountries = new Set<string>()

  if (startCountry) {
    seenCountries.add(startCountry)
  }

  const filteredRoute = [startHub]

  for (const hub of route.slice(1, -1)) {
    if (hub.hub_id === startHubId || hub.hub_id === endHubId) {
      continue
    }

    const country = countryByHubId.get(hub.hub_id) ?? null

    if (country && endCountry && country === endCountry && endHub.hub_id !== startHub.hub_id) {
      continue
    }

    if (country && seenCountries.has(country)) {
      continue
    }

    filteredRoute.push(hub)

    if (country) {
      seenCountries.add(country)
    }
  }

  if (endHub.hub_id !== startHub.hub_id) {
    filteredRoute.push(endHub)
  }

  return filteredRoute
}

function summarizeRoute(route: NonNullable<ReturnType<typeof normalizeRouteHub>>[]) {
  const totalDistanceKm = route.slice(1).reduce((distance, hub, index) => {
    const previousHub = route[index]
    if (!previousHub) {
      return distance
    }

    return (
      distance +
      calculateDistanceKm(
        {
          latitude: previousHub.latitude,
          longitude: previousHub.longitude,
        },
        {
          latitude: hub.latitude,
          longitude: hub.longitude,
        }
      )
    )
  }, 0)

  const scoredHubs = route.filter(
    (hub): hub is typeof hub & { risk_score: number } => hub.risk_score !== null
  )
  const averageRiskScore =
    scoredHubs.length > 0
      ? normalizeRiskScore(
          scoredHubs.reduce((sum, hub) => sum + hub.risk_score, 0) / scoredHubs.length
        )
      : null

  return {
    total_distance_km: Math.round(totalDistanceKm),
    average_risk_score: averageRiskScore,
  }
}

function normalizeRouteHub(hub: RouteHub) {
  const rawHub = hub as Record<string, unknown>
  const coordinatesValue = rawHub.coordinates
  const coordinates =
    Array.isArray(coordinatesValue) && coordinatesValue.length >= 2
      ? coordinatesValue
      : null

  const location = getObject(rawHub.location)
  const coordinatesObject = getObject(coordinatesValue)

  const latitude = toNumber(
    hub.latitude ??
      getNumberProperty(rawHub, "lat") ??
      getNumberProperty(location ?? {}, "latitude") ??
      getNumberProperty(location ?? {}, "lat") ??
      getNumberProperty(coordinatesObject ?? {}, "latitude") ??
      getNumberProperty(coordinatesObject ?? {}, "lat") ??
      coordinates?.[1]
  )
  const longitude = toNumber(
    hub.longitude ??
      getNumberProperty(rawHub, "lng") ??
      getNumberProperty(rawHub, "lon") ??
      getNumberProperty(location ?? {}, "longitude") ??
      getNumberProperty(location ?? {}, "lng") ??
      getNumberProperty(location ?? {}, "lon") ??
      getNumberProperty(coordinatesObject ?? {}, "longitude") ??
      getNumberProperty(coordinatesObject ?? {}, "lng") ??
      getNumberProperty(coordinatesObject ?? {}, "lon") ??
      coordinates?.[0]
  )
  const riskScore =
    normalizeRiskScore(
      toNumber(hub.risk_score) ??
        getNumberProperty(rawHub, "score") ??
        getNumberProperty(rawHub, "risk")
    )
  const hubId =
    hub.hub_id ?? getStringProperty(rawHub, "id") ?? getStringProperty(rawHub, "hubId")
  const hubName = hub.name ?? getStringProperty(rawHub, "hub_name")

  if (
    typeof hubId !== "string" ||
    typeof hubName !== "string" ||
    latitude === null ||
    longitude === null
  ) {
    return null
  }

  return {
    hub_id: hubId,
    name: hubName,
    latitude,
    longitude,
    risk_score: riskScore,
  }
}

function normalizePathfindingResponse(response: PathfindingResponse) {
  const rawResponse = response as Record<string, unknown>
  const routeCandidate =
    response.route ?? rawResponse.route_hubs ?? rawResponse.path ?? rawResponse.optimal_path
  const rawRoute = Array.isArray(routeCandidate) ? routeCandidate : null

  if (rawRoute === null) {
    return null
  }

  const route = rawRoute
    .map((hub) => normalizeRouteHub(hub as RouteHub))
    .filter((hub): hub is NonNullable<ReturnType<typeof normalizeRouteHub>> => hub !== null)
  const totalDistanceKm = toNumber(
    response.total_distance_km ??
      rawResponse.total_distance ??
      rawResponse.distance_km ??
      rawResponse.totalDistanceKm
  )
  const averageRiskScore = toNumber(
    response.average_risk_score ??
      rawResponse.average_risk ??
      rawResponse.avg_risk_score ??
      rawResponse.averageRiskScore
  )

  if (route.length !== rawRoute.length || totalDistanceKm === null) {
    return null
  }

  return {
    route,
    total_distance_km: totalDistanceKm,
    average_risk_score: normalizeRiskScore(averageRiskScore),
  }
}

export async function GET(request: NextRequest) {
  const hubId1 = request.nextUrl.searchParams.get("hub_id_1")?.trim()
  const hubId2 = request.nextUrl.searchParams.get("hub_id_2")?.trim()

  if (!hubId1 || !hubId2) {
    return NextResponse.json(
      { error: "hub_id_1 and hub_id_2 are required" },
      { status: 400 }
    )
  }

  try {
    const [response, locations] = await Promise.all([
      apiRequest<PathfindingResponse>(
        `/ese/v1/pathfinding/${encodeURIComponent(hubId1)}/${encodeURIComponent(hubId2)}`
      ),
      listLocations(),
    ])
    const normalizedResponse = normalizePathfindingResponse(response)
    const countryByHubId = new Map(
      locations
        .map((location) => [location.hub_id, getCountryForHub(location)] as const)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    )

    if (!normalizedResponse) {
      return NextResponse.json(
        {
          error:
            "Pathfinding response was not in the expected format. Expected route hubs with hub_id, name, latitude/longitude, and risk_score.",
        },
        { status: 502 }
      )
    }

    const filteredRoute = filterRouteToUniqueCountries(
      normalizedResponse.route,
      countryByHubId,
      hubId1,
      hubId2
    )
    const summarizedRoute = summarizeRoute(filteredRoute)

    return NextResponse.json({
      route: filteredRoute,
      total_distance_km: summarizedRoute.total_distance_km,
      average_risk_score: summarizedRoute.average_risk_score,
    })
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch optimal path." },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch optimal path." },
      { status: 500 }
    )
  }
}
