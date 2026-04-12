import { NextResponse } from "next/server"

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

interface ApiErrorResponse {
  error?: string
}

interface CreateLocationResponse {
  hub_id: string
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

async function fetchRiskAnalysisWithRetry(hubId: string): Promise<RiskLocationResponse> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await apiRequest<RiskLocationResponse>(`/ese/v1/risk/location/${hubId}`)
    } catch (error) {
      if (!(error instanceof ApiRequestError)) {
        throw error
      }

      const shouldRetry =
        error.status === 404 ||
        (error.status === 400 && error.message.toLowerCase().includes("processed data"))

      if (!shouldRetry || attempt === 7) {
        throw error
      }

      await delay(2000)
    }
  }

  throw new Error("Risk analysis failed")
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

    await apiRequest<{ message: string }>(`/ese/v1/ingest/weather/${createResponse.hub_id}`, {
      method: "POST",
    })

    const riskResponse = await fetchRiskAnalysisWithRetry(createResponse.hub_id)

    return NextResponse.json({
      hub_id: createResponse.hub_id,
      risk: riskResponse,
    })
  } catch (error) {
    if (error instanceof ApiRequestError) {
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
