import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'

import { api } from '../../../convex/_generated/api'
import { mcpOAuthConfig, mcpResourceClient } from '@/lib/oauth-resource-server'

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)

const handler = withMcpAuth(
  createMcpHandler(
    (server) => {
      server.registerTool(
        'viewer',
        {
          title: 'Usuário autenticado',
          description: 'Retorna os dados do usuário autenticado no Convex.',
          inputSchema: {},
        },
        async (_input, extra) => {
          convex.setAuth(extra.authInfo!.token)
          const viewer = await convex.query(api.mcp.viewer, {})

          return {
            content: [{ type: 'text', text: JSON.stringify(viewer, null, 2) }],
          }
        },
      )

      server.registerTool(
        'ping',
        {
          title: 'Ping autenticado',
          description: 'Executa uma mutation autenticada de exemplo no Convex.',
          inputSchema: {
            message: z.string().min(1).describe('Mensagem para registrar.'),
          },
        },
        async ({ message }, extra) => {
          convex.setAuth(extra.authInfo!.token)
          const result = await convex.mutation(api.mcp.ping, { message })

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          }
        },
      )
    },
    {
      serverInfo: {
        name: 'interclasse-aacsa',
        version: '0.1.0',
      },
      capabilities: { tools: {} },
    },
    {
      basePath: '/api',
      disableSse: true,
      maxDuration: 60,
    },
  ),
  verifyMcpToken,
  {
    required: true,
    requiredScopes: ['mcp:read'],
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
    resourceUrl: mcpOAuthConfig.audience,
  },
)

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      DELETE: ({ request }) => handler(request),
    },
  },
})

async function verifyMcpToken(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined

  try {
    const payload = await mcpResourceClient.verifyAccessToken(bearerToken, {
      verifyOptions: {
        issuer: mcpOAuthConfig.issuer,
        audience: mcpOAuthConfig.audience,
      },
      jwksUrl: mcpOAuthConfig.jwksUrl,
      scopes: ['mcp:read'],
    })

    const scope = typeof payload.scope === 'string' ? payload.scope : ''
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : undefined

    return {
      token: bearerToken,
      clientId: String(payload.azp ?? payload.client_id ?? 'unknown'),
      scopes: scope.split(' ').filter(Boolean),
      expiresAt,
      resource: new URL(mcpOAuthConfig.audience),
      extra: { userId: payload.sub },
    }
  } catch {
    return undefined
  }
}
