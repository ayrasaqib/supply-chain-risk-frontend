import { NextRequest, NextResponse } from "next/server"

const DEFAULT_API_BASE_URL = "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod"

function getApiBaseUrl() {
  return (
    process.env.SUPPLY_CHAIN_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SUPPLY_CHAIN_API_BASE_URL ??
    DEFAULT_API_BASE_URL
  )
}

function buildTargetUrl(pathSegments: string[], searchParams: URLSearchParams) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "")
  const path = pathSegments.join("/")
  const query = searchParams.toString()

  return `${baseUrl}/${path}${query ? `?${query}` : ""}`
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams)

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    })

    const body = await response.text()

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach upstream API."

    return NextResponse.json(
      {
        error: `Proxy request to ${targetUrl} failed: ${message}`,
      },
      { status: 502 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context)
}
