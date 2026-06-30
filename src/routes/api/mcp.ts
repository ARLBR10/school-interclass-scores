import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { mcpOAuthConfig, mcpResourceClient } from '@/lib/oauth-resource-server'

let mcpHandler: ((request: Request) => Response | Promise<Response>) | undefined

const actionSchema = z
  .enum(['list', 'get', 'create', 'update', 'delete'])
  .describe('Operação a executar.')

const playerSchema = z.object({
  alias: z.array(z.string()).optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  age: z.number().optional(),
  photo: z.string().optional(),
  socialMedias: z
    .object({
      Instagram: z.string().optional(),
    })
    .optional(),
})

const matchEventSchema = z.union([
  z.object({
    type: z.literal('AddScore'),
    time: z.number(),
    team: z.string(),
    score: z.number(),
    member: z.string().optional(),
    player: z.string().optional(),
  }),
  z.object({
    type: z.literal('RemScore'),
    time: z.number(),
    team: z.string(),
    score: z.number(),
    member: z.string().optional(),
    player: z.string().optional(),
  }),
  z.object({
    type: z.literal('KickedPlayer'),
    time: z.number(),
    team: z.string(),
    member: z.string().optional(),
    player: z.string().optional(),
  }),
  z.object({
    type: z.literal('StartedMatch'),
    time: z.number(),
  }),
  z.object({
    type: z.literal('FinishedMatch'),
    time: z.number(),
  }),
  z.object({
    type: z.literal('SwitchPlayers'),
    time: z.number(),
    team: z.string(),
    members: z.array(z.string()).optional(),
    players: z.array(z.string()).optional(),
  }),
])

function getMcpHandler() {
  if (mcpHandler) return mcpHandler

  const handler = withMcpAuth(
    createMcpHandler(
      (server) => {
        server.registerTool(
          'members',
          {
            title: 'Administrar membros',
            description:
              'Lista, consulta, cria, atualiza ou remove membros. Disponível apenas para administradores.',
            inputSchema: {
              action: actionSchema,
              id: z
                .string()
                .optional()
                .describe('ID do membro para get/update/delete.'),
              fields: z
                .object({
                  userId: z.string().nullable().optional(),
                  name: z.string().optional(),
                  tuitionId: z.string().nullable().optional(),
                  additionalRole: z
                    .enum(['press', 'judge'])
                    .nullable()
                    .optional(),
                  schoolClass: z.string().nullable().optional(),
                  player: playerSchema.nullable().optional(),
                })
                .optional()
                .describe('Campos usados em create/update.'),
            },
          },
          async (input, extra) => {
            const convex = createConvexClient(extra.authInfo!.token)
            const result = await convex.mutation(api.mcp.members, {
              ...input,
              id: input.id as Id<'members'> | undefined,
            })

            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
            }
          },
        )

        server.registerTool(
          'teams',
          {
            title: 'Administrar times',
            description:
              'Lista, consulta, cria, atualiza ou remove times. Disponível apenas para administradores.',
            inputSchema: {
              action: actionSchema,
              id: z
                .string()
                .optional()
                .describe('ID do time para get/update/delete.'),
              fields: z
                .object({
                  name: z.string().optional(),
                  sport: z.string().optional(),
                  color: z.string().nullable().optional(),
                  type: z.enum(['Feminine', 'Masculine']).optional(),
                  members: z.array(z.string()).nullable().optional(),
                  players: z.array(z.string()).nullable().optional(),
                })
                .optional()
                .describe('Campos usados em create/update.'),
            },
          },
          async (input, extra) => {
            const convex = createConvexClient(extra.authInfo!.token)
            const result = await convex.mutation(api.mcp.teams, {
              ...input,
              id: input.id as Id<'teams'> | undefined,
              fields: input.fields
                ? {
                    ...input.fields,
                    members:
                      input.fields.members === undefined ||
                      input.fields.members === null
                        ? input.fields.members
                        : input.fields.members.map((id) => id as Id<'members'>),
                  }
                : undefined,
            })

            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
            }
          },
        )

        server.registerTool(
          'matches',
          {
            title: 'Administrar partidas',
            description:
              'Lista, consulta, cria, atualiza ou remove partidas. Disponível apenas para administradores.',
            inputSchema: {
              action: actionSchema,
              id: z
                .string()
                .optional()
                .describe('ID da partida para get/update/delete.'),
              fields: z
                .object({
                  teams: z.array(z.string()).optional(),
                  scheduledData: z.number().nullable().optional(),
                  status: z
                    .enum(['Scheduled', 'Started', 'Canceled', 'Finished'])
                    .optional(),
                  events: z.array(matchEventSchema).optional(),
                })
                .optional()
                .describe('Campos usados em create/update.'),
            },
          },
          async (input, extra) => {
            const convex = createConvexClient(extra.authInfo!.token)
            const result = await convex.mutation(api.mcp.matches, {
              ...input,
              id: input.id as Id<'matches'> | undefined,
              fields: input.fields
                ? {
                    ...input.fields,
                    teams: input.fields.teams?.map((id) => id as Id<'teams'>),
                    events: input.fields.events?.map((event) => {
                      if (event.type === 'SwitchPlayers') {
                        return {
                          ...event,
                          team: event.team as Id<'teams'>,
                          members: event.members?.map(
                            (id) => id as Id<'members'>,
                          ),
                        }
                      }

                      if (
                        event.type === 'StartedMatch' ||
                        event.type === 'FinishedMatch'
                      ) {
                        return event
                      }

                      return {
                        ...event,
                        team: event.team as Id<'teams'>,
                        member: event.member as Id<'members'> | undefined,
                      }
                    }),
                  }
                : undefined,
            })

            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
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

  mcpHandler = handler
  return handler
}

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: async ({ request }) => withCors(await getMcpHandler()(request)),
      POST: async ({ request }) => withCors(await getMcpHandler()(request)),
      DELETE: async ({ request }) => withCors(await getMcpHandler()(request)),
      OPTIONS: () => corsPreflight(),
    },
  },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'mcp-session-id, www-authenticate',
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

function createConvexClient(token: string) {
  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
  convex.setAuth(token)
  return convex
}

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
