import { createFileRoute } from '@tanstack/react-router'

import { handler } from '@/lib/auth-server'

export const Route = createFileRoute('/.well-known/oauth-authorization-server')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        url.pathname = '/api/auth/.well-known/oauth-authorization-server'

        return withCors(await handler(new Request(url, request)))
      },
      OPTIONS: () => corsPreflight(),
    },
  },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
