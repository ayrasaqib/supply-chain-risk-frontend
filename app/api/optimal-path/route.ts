import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

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

function isValidRouteHub(hub: RouteHub) {
  return (
    typeof hub.hub_id === "string" &&
    typeof hub.name === "string" &&
    typeof hub.latitude === "number" &&
    typeof hub.longitude === "number" &&
    typeof hub.risk_score === "number"
  )
}

function isValidPathfindingResponse(response: PathfindingResponse) {
  return (
    Array.isArray(response.route) &&
    response.route.every(isValidRouteHub) &&
    typeof response.total_distance_km === "number" &&
    typeof response.average_risk_score === "number"
  )
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
    const response = await apiRequest<PathfindingResponse>(
      `/ese/v1/pathfinding/${encodeURIComponent(hubId1)}/${encodeURIComponent(hubId2)}`
    )

    if (!isValidPathfindingResponse(response)) {
      return NextResponse.json(
        { error: "Pathfinding response was not in the expected format." },
        { status: 502 }
      )
    }

    return NextResponse.json(response)
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
