import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

interface ApiErrorResponse {
  error?: string
  message?: string
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
      (typeof parsedBody.error === "string" || typeof parsedBody.message === "string")
        ? parsedBody.error ?? parsedBody.message ?? `Request failed with status ${response.status}`
        : rawBody || `Request failed with status ${response.status}`

    throw new ApiRequestError(message, response.status)
  }

  return parsedBody as T
}

function getRequiredSearchParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.get(key)?.trim() ?? ""
}

export async function GET(request: NextRequest) {
  const email = getRequiredSearchParam(request, "email")

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 })
  }

  try {
    const response = await apiRequest<unknown>(`/ese/v1/watchlist/${encodeURIComponent(email)}`)
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Failed to fetch watchlist." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const email = getRequiredSearchParam(request, "email")
  const hubId = getRequiredSearchParam(request, "hub_id")

  if (!email || !hubId) {
    return NextResponse.json({ error: "email and hub_id are required" }, { status: 400 })
  }

  try {
    const response = await apiRequest<unknown>(
      `/ese/v1/watchlist/${encodeURIComponent(hubId)}/${encodeURIComponent(email)}`,
      { method: "POST" }
    )

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Failed to add watchlist subscription." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const email = getRequiredSearchParam(request, "email")
  const hubId = getRequiredSearchParam(request, "hub_id")

  if (!email || !hubId) {
    return NextResponse.json({ error: "email and hub_id are required" }, { status: 400 })
  }

  try {
    const response = await apiRequest<unknown>(
      `/ese/v1/watchlist/${encodeURIComponent(hubId)}/${encodeURIComponent(email)}`,
      { method: "DELETE" }
    )

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Failed to remove watchlist subscription." }, { status: 500 })
  }
}
