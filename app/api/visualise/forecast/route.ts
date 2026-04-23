import { NextRequest, NextResponse } from "next/server"

const VISUALISE_API_BASE_URL =
  process.env.VISUALISE_API_BASE_URL ??
  "https://a683sqnr5m.execute-api.ap-southeast-2.amazonaws.com"

interface ApiErrorResponse {
  error?: string
}

interface ForecastPoint {
  date?: string
  riskScore?: number
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

function normalizeTimestamp(value: string) {
  if (!value) return ""
  const normalized = value.replace("T", " ").replace("Z", "")
  const [dateTimePart, ...fractionParts] = normalized.split(".")

  if (!dateTimePart) {
    return ""
  }

  if (fractionParts.length === 0) {
    return `${dateTimePart}.0000000`
  }

  const mergedFraction = fractionParts.join("")
  const digitsOnly = mergedFraction.replace(/\D/g, "")
  const paddedFraction = (digitsOnly || "0000000").slice(0, 7).padEnd(7, "0")

  return `${dateTimePart}.${paddedFraction}`
}

function buildForecastEvents(forecast: ForecastPoint[]): VisualiseDatasetEvent[] {
  return forecast.reduce<VisualiseDatasetEvent[]>((events, point) => {
    if (typeof point.riskScore !== "number" || typeof point.date !== "string") {
      return events
    }

    const timestamp = normalizeTimestamp(point.date)
    if (!timestamp) {
      return events
    }

    events.push({
      time_object: {
        timestamp: timestamp,
        timezone: "UTC",
        duration: 1,
        duration_unit: "day",
      },
      event_type: "daily_risk_assessment",
      attribute: {
        combined_risk_percentage: point.riskScore,
      },
    })

    return events
  }, [])
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { forecast?: ForecastPoint[] }
    const forecast = Array.isArray(body.forecast) ? body.forecast : []
    const events = buildForecastEvents(forecast)

    if (events.length === 0) {
      return NextResponse.json({ url: null })
    }

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

    return NextResponse.json({ url: visualiseResponse.url ?? null })
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate forecast visualisation.",
      },
      { status: 500 }
    )
  }
}
