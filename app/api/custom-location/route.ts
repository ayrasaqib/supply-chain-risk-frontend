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
  time_object?: {
    timestamp?: string
    timezone?: string
  }
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

function isTransientBackendError(error: ApiRequestError) {
  return error.status === 503 || error.status === 502 || error.status === 504
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
  const dailyAssessment = response.events?.find(
    (event) => event.event_type === "daily_risk_assessment" && event.attribute?.date
  )

  if (dailyAssessment?.attribute?.date) {
    return dailyAssessment.attribute.date
  }

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

    if (existingRiskResponse && isCurrentDayRiskAnalysis(existingRiskResponse)) {
      return NextResponse.json({
        hub_id: createResponse.hub_id,
        risk: existingRiskResponse,
      })
    }

    await ingestWeatherWithRetry(createResponse.hub_id)

    const riskResponse = await fetchRiskAnalysisWithRetry(createResponse.hub_id)

    return NextResponse.json({
      hub_id: createResponse.hub_id,
      risk: riskResponse,
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
