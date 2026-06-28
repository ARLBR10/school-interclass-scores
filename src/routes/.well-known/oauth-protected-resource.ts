import { createFileRoute } from '@tanstack/react-router'
import { protectedResourceHandler } from 'mcp-handler'

import { mcpOAuthConfig } from '@/lib/oauth-resource-server'

const handler = protectedResourceHandler({
  authServerUrls: [mcpOAuthConfig.issuer],
  resourceUrl: mcpOAuthConfig.audience,
})

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
})
