import { createFileRoute } from '@tanstack/react-router'

const DEBUG_MCP_PROXY = true

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: ({ request }) => proxyMcpRequest(request),
      POST: ({ request }) => proxyMcpRequest(request),
      DELETE: ({ request }) => proxyMcpRequest(request),
      OPTIONS: ({ request }) => proxyMcpRequest(request),
    },
  },
})

async function proxyMcpRequest(request: Request) {
  const convexMcpUrl = new URL('/mcp', getConvexSiteUrl())
  const headers = new Headers(request.headers)
  const authorization = request.headers.get('authorization')

  debugLog('[mcp proxy] incoming request', {
    method: request.method,
    url: request.url,
    targetUrl: convexMcpUrl.toString(),
    hasAuthorization: Boolean(authorization),
    authorizationPrefix: authorization?.slice(0, 16),
    contentType: request.headers.get('content-type'),
    accept: request.headers.get('accept'),
    userAgent: request.headers.get('user-agent'),
  })

  headers.delete('host')
  headers.delete('content-length')
  headers.delete('connection')
  headers.delete('accept-encoding')
  headers.set('x-forwarded-host', new URL(request.url).host)
  headers.set('x-forwarded-proto', new URL(request.url).protocol.slice(0, -1))

  const response = await fetch(convexMcpUrl, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? null
        : request.body,
    // Required when forwarding the streaming request body in Node runtimes.
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  debugLog('[mcp proxy] upstream response', {
    status: response.status,
    statusText: response.statusText,
    wwwAuthenticate: response.headers.get('www-authenticate'),
    contentType: response.headers.get('content-type'),
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

function getConvexSiteUrl() {
  const explicitUrl = process.env.VITE_CONVEX_SITE_URL
  if (explicitUrl) return explicitUrl

  const convexUrl = process.env.VITE_CONVEX_URL
  if (!convexUrl) throw new Error('VITE_CONVEX_SITE_URL is not set')

  return convexUrl.replace('.convex.cloud', '.convex.site')
}

function debugLog(message: string, details?: unknown) {
  if (!DEBUG_MCP_PROXY) return

  if (details === undefined) {
    console.log(message)
    return
  }

  console.log(message, details)
}
