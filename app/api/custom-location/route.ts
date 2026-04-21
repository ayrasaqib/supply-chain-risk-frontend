import { NextResponse } from "next/server"
import type { RiskEvent, RiskLocationResponse } from "@/lib/risk-api-types"

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

const VISUALISE_API_BASE_URL =
  process.env.VISUALISE_API_BASE_URL ??
  "https://a683sqnr5m.execute-api.ap-southeast-2.amazonaws.com"

interface ApiErrorResponse {
  error?: string
}

interface CreateLocationResponse {
  hub_id: string
}

interface VisualiseDatasetEvent {
  time_object?: {
    timestamp?: string
    timezone?: string
    duration?: number
    duration_unit?: string
  }
  event_type?: string
  attribute?: Record<string, unknown>
}

interface VisualiseResponse {
  url?: string
}

class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientBackendError(error: ApiRequestError) {
  return error.status === 503 || error.status === 502 || error.status === 504
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
        : `Request failed with status ${response.status}`

    throw new ApiRequestError(message, response.status)
  }

  return parsedBody as T
}

async function visualiseApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${VISUALISE_API_BASE_URL}${path}`, {
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

async function fetchRiskAnalysisWithRetry(hubId: string): Promise<RiskLocationResponse> {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      return await apiRequest<RiskLocationResponse>(`/ese/v1/risk/location/${hubId}`)
    } catch (error) {
      if (!(error instanceof ApiRequestError)) {
        throw error
      }

      const shouldRetry =
        error.status === 404 ||
        (error.status === 400 && error.message.toLowerCase().includes("processed data")) ||
        isTransientBackendError(error)

      if (!shouldRetry || attempt === 11) {
        throw error
      }

      await delay(2500)
    }
  }

  throw new Error("Risk analysis failed")
}

async function ingestWeatherWithRetry(hubId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await apiRequest<{ message: string }>(`/ese/v1/ingest/weather/${hubId}`, {
        method: "POST",
      })
    } catch (error) {
      if (!(error instanceof ApiRequestError)) {
        throw error
      }

      if (!isTransientBackendError(error) || attempt === 4) {
        throw error
      }

      await delay(2000)
    }
  }
}

async function fetchExistingRiskAnalysis(hubId: string): Promise<RiskLocationResponse | null> {
  try {
    return await apiRequest<RiskLocationResponse>(`/ese/v1/risk/location/${hubId}`)
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      throw error
    }

    const isMissingProcessedData =
      error.status === 404 ||
      (error.status === 400 && error.message.toLowerCase().includes("processed data"))

    if (isMissingProcessedData) {
      return null
    }

    throw error
  }
}

function normalizeVisualiseTimestamp(timestamp: string | undefined) {
  if (!timestamp) return ""
  const normalized = timestamp.replace("T", " ").replace("Z", "")
  return normalized.includes(".") ? normalized : `${normalized}.0000000`
}

function buildVisualiseEvents(events: RiskEvent[] | undefined): VisualiseDatasetEvent[] {
  return (events ?? [])
    .filter((event) => event.event_type === "daily_risk_assessment")
    .map((event) => ({
      time_object: {
        timestamp: normalizeVisualiseTimestamp(event.time_object?.timestamp),
        timezone: event.time_object?.timezone,
        duration: event.time_object?.duration,
        duration_unit: event.time_object?.duration_unit,
      },
      event_type: event.event_type,
      attribute: {
        ...(event.attribute as Record<string, unknown> | undefined),
        combined_risk_percentage: Math.round(
          Number((event.attribute?.combined_risk_score ?? event.attribute?.peak_risk_score ?? 0)) * 100
        ),
      },
    }))
}

async function fetchCombinedRiskGraphUrl(riskResponse: RiskLocationResponse): Promise<string | null> {
  const events = buildVisualiseEvents(riskResponse.events)

  if (events.length === 0) {
    return null
  }

  try {
    const visualiseResponse = await visualiseApiRequest<VisualiseResponse>("/visualise", {
      method: "POST",
      body: JSON.stringify({
        title: "Combined Risk Score Trend",
        yAxisTitle: "Risk Score (%)",
        returnURL: true,
        datasets: [
          {
            datasetName: "Combined Risk Score (%)",
            attributeName: "combined_risk_percentage",
            events,
          },
        ],
      }),
    })

    return visualiseResponse.url ?? null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      lat?: number
      lon?: number
    }

    if (
      typeof body.name !== "string" ||
      typeof body.lat !== "number" ||
      typeof body.lon !== "number"
    ) {
      return NextResponse.json(
        { error: "Request body must include name, lat, and lon." },
        { status: 400 }
      )
    }

    const createResponse = await apiRequest<CreateLocationResponse>("/ese/v1/location", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        lat: body.lat,
        lon: body.lon,
      }),
    })

    const existingRiskResponse = await fetchExistingRiskAnalysis(createResponse.hub_id)

    if (existingRiskResponse) {
      const graphUrl = await fetchCombinedRiskGraphUrl(existingRiskResponse)

      return NextResponse.json({
        hub_id: createResponse.hub_id,
        risk: existingRiskResponse,
        graph_url: graphUrl,
      })
    }

    await ingestWeatherWithRetry(createResponse.hub_id)

    const riskResponse = await fetchRiskAnalysisWithRetry(createResponse.hub_id)
    const graphUrl = await fetchCombinedRiskGraphUrl(riskResponse)

    return NextResponse.json({
      hub_id: createResponse.hub_id,
      risk: riskResponse,
      graph_url: graphUrl,
    })
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (isTransientBackendError(error)) {
        return NextResponse.json(
          {
            error:
              "The risk analysis service is temporarily unavailable right now. Please try again in a moment.",
          },
          { status: error.status }
        )
      }

      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze custom location.",
      },
      { status: 500 }
    )
  }
}
