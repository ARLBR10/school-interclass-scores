import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../../../convex/_generated/api'
import { handler } from '@/lib/auth-server'
import { mcpOAuthConfig } from '@/lib/oauth-resource-server'

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (new URL(request.url).pathname === '/api/auth/jwks') {
          const keys = await convex.query(api.auth.getJwks)
          return withCors(Response.json({ keys }))
        }

        const fixedRequest = withAuthRequestFixes(request)
        const response = await handler(fixedRequest)

        return withCors(await withBrowserRedirect(fixedRequest, response))
      },
      POST: async ({ request }) => {
        const fixedRequest = await withAuthPostRequestFixes(request)

        return withCors(await handler(fixedRequest))
      },
      OPTIONS: () => corsPreflight(),
    },
  },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

function withCors(response: Response) {
  const headers = new Headers(response.headers)

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function withAuthRequestFixes(request: Request) {
  const url = new URL(request.url)

  if (
    url.pathname === '/api/auth/oauth2/authorize' &&
    !url.searchParams.has('scope')
  ) {
    url.searchParams.set('scope', 'openid profile mcp:read')
  }

  if (
    url.pathname === '/api/auth/oauth2/authorize' &&
    !url.searchParams.has('resource')
  ) {
    url.searchParams.set('resource', mcpOAuthConfig.audience)
  }

  if (url.href !== request.url) {
    return new Request(url, request)
  }

  return request
}

async function withAuthPostRequestFixes(request: Request) {
  const url = new URL(request.url)

  if (url.pathname !== '/api/auth/oauth2/token') {
    return request
  }

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return withJsonTokenResource(request)
  }

  return withFormTokenResource(request)
}

async function withFormTokenResource(request: Request) {
  const body = new URLSearchParams(await request.clone().text())

  if (body.has('resource')) {
    return request
  }

  body.set('resource', mcpOAuthConfig.audience)

  const headers = new Headers(request.headers)
  headers.set('content-type', 'application/x-www-form-urlencoded')
  headers.delete('content-length')

  return new Request(request.url, {
    body: body.toString(),
    headers,
    method: request.method,
    signal: request.signal,
  })
}

async function withJsonTokenResource(request: Request) {
  const body = await request
    .clone()
    .json()
    .catch(() => null)

  if (!isRecord(body) || typeof body.resource === 'string') {
    return request
  }

  const headers = new Headers(request.headers)
  headers.set('content-type', 'application/json')
  headers.delete('content-length')

  return new Request(request.url, {
    body: JSON.stringify({ ...body, resource: mcpOAuthConfig.audience }),
    headers,
    method: request.method,
    signal: request.signal,
  })
}

async function withBrowserRedirect(request: Request, response: Response) {
  const url = new URL(request.url)

  if (url.pathname !== '/api/auth/oauth2/authorize') {
    return response
  }

  const location = response.headers.get('location')

  if (location && !isRedirectStatus(response.status)) {
    return redirectResponse(response, location)
  }

  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return response
  }

  const payload = await response
    .clone()
    .json()
    .catch(() => null)

  if (!isRedirectPayload(payload)) {
    return response
  }

  return redirectResponse(response, payload.url)
}

function redirectResponse(response: Response, location: string) {
  const headers = new Headers(response.headers)

  headers.set('location', location)
  headers.delete('content-type')
  headers.delete('content-length')

  return new Response(null, {
    status: 302,
    statusText: 'Found',
    headers,
  })
}

function isRedirectStatus(status: number) {
  return status >= 300 && status < 400
}

function isRedirectPayload(
  payload: unknown,
): payload is { redirect: true; url: string } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'redirect' in payload &&
    'url' in payload &&
    payload.redirect === true &&
    typeof payload.url === 'string'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
