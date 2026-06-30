import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { env, httpAction, type ActionCtx } from './_generated/server'

type JsonRpcRequest = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: unknown
}

type ToolName = 'members' | 'teams' | 'matches'

const DEBUG_MCP = true

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'mcp-session-id, www-authenticate',
  'Access-Control-Max-Age': '86400',
}

const authIssuer = `${env.SITE_URL}/api/auth`

export const handle = httpAction(async (ctx, request) => {
  const authorization = request.headers.get('authorization')

  debugLog('[mcp convex] incoming request', {
    method: request.method,
    url: request.url,
    hasAuthorization: Boolean(authorization),
    authorizationPrefix: authorization?.slice(0, 16),
    contentType: request.headers.get('content-type'),
    accept: request.headers.get('accept'),
    userAgent: request.headers.get('user-agent'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
  })

  if (request.method === 'OPTIONS') {
    debugLog('[mcp convex] cors preflight')
    return corsPreflight()
  }

  if (request.method !== 'POST') {
    debugLog('[mcp convex] method not allowed', { method: request.method })
    return withCors(
      jsonResponse(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Method not allowed.' },
          id: null,
        },
        { status: 405 },
      ),
    )
  }

  const auth = await verifyMcpToken(ctx, request)
  if (!auth.ok) {
    debugLog('[mcp convex] auth rejected', {
      status: auth.response.status,
      wwwAuthenticate: auth.response.headers.get('www-authenticate'),
    })
    return withCors(auth.response)
  }

  debugLog('[mcp convex] auth accepted', {
    subject: auth.payload.sub,
    issuer: auth.payload.iss,
    audience: auth.payload.aud,
    scope: auth.payload.scope,
    expiresAt: auth.payload.exp,
  })

  let payload: JsonRpcRequest | JsonRpcRequest[]
  try {
    payload = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
    debugLog('[mcp convex] json-rpc payload', payload)
  } catch {
    debugLog('[mcp convex] invalid json payload')
    return withCors(jsonRpcError(null, -32700, 'Parse error.'))
  }

  if (Array.isArray(payload)) {
    const responses = (
      await Promise.all(payload.map((item) => handleJsonRpc(ctx, item)))
    ).filter((response) => response !== undefined)

    if (responses.length === 0) {
      debugLog('[mcp convex] batch notification response', { status: 202 })
      return withCors(new Response(null, { status: 202 }))
    }
    debugLog('[mcp convex] batch json-rpc response', responses)
    return withCors(jsonResponse(responses))
  }

  const response = await handleJsonRpc(ctx, payload)
  if (!response) {
    debugLog('[mcp convex] notification response', { status: 202 })
    return withCors(new Response(null, { status: 202 }))
  }
  debugLog('[mcp convex] json-rpc response', response)
  return withCors(jsonResponse(response))
})

async function handleJsonRpc(ctx: ActionCtx, request: JsonRpcRequest) {
  const id = request.id ?? null
  const isNotification = !('id' in request)

  try {
    if (request.jsonrpc !== undefined && request.jsonrpc !== '2.0') {
      return jsonRpcErrorPayload(id, -32600, 'Invalid Request.')
    }

    if (!request.method) {
      return jsonRpcErrorPayload(id, -32600, 'Invalid Request.')
    }

    if (request.method.startsWith('notifications/')) return undefined

    const result = await dispatchMethod(ctx, request.method, request.params)
    if (isNotification) return undefined

    return { jsonrpc: '2.0', id, result }
  } catch (error) {
    if (isNotification) return undefined
    return jsonRpcErrorPayload(
      id,
      -32603,
      error instanceof Error ? error.message : 'Internal error.',
    )
  }
}

async function dispatchMethod(ctx: ActionCtx, method: string, params: unknown) {
  if (method === 'initialize') {
    const requestedVersion = getObject(params)?.protocolVersion

    return {
      protocolVersion:
        typeof requestedVersion === 'string' ? requestedVersion : '2025-03-26',
      capabilities: { tools: {} },
      serverInfo: { name: 'interclasse-aacsa', version: '0.1.0' },
    }
  }

  if (method === 'ping') return {}

  if (method === 'tools/list') return { tools: getTools() }

  if (method === 'tools/call') {
    const toolCall = getObject(params)
    if (!toolCall) throw new Error('Informe os parâmetros da ferramenta.')

    const name = toolCall?.name
    if (!isToolName(name)) throw new Error('Ferramenta MCP desconhecida.')

    const result = await callTool(ctx, name, toolCall.arguments)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }

  throw new Error(`Método MCP não suportado: ${method}.`)
}

async function callTool(ctx: ActionCtx, name: ToolName, input: unknown) {
  const args = getObject(input)
  if (!args) throw new Error('Informe os argumentos da ferramenta.')

  if (name === 'members') {
    return await ctx.runMutation(api.mcp.members, {
      ...args,
      id: args.id as Id<'members'> | undefined,
    } as any)
  }

  if (name === 'teams') {
    const fields = getObject(args.fields)
    return await ctx.runMutation(api.mcp.teams, {
      ...args,
      id: args.id as Id<'teams'> | undefined,
      fields: fields
        ? {
            ...fields,
            members: Array.isArray(fields.members)
              ? fields.members.map((id) => id as Id<'members'>)
              : fields.members,
          }
        : undefined,
    } as any)
  }

  const fields = getObject(args.fields)
  return await ctx.runMutation(api.mcp.matches, {
    ...args,
    id: args.id as Id<'matches'> | undefined,
    fields: fields
      ? {
          ...fields,
          teams: Array.isArray(fields.teams)
            ? fields.teams.map((id) => id as Id<'teams'>)
            : fields.teams,
          events: Array.isArray(fields.events)
            ? fields.events.map((event) => normalizeMatchEvent(event))
            : fields.events,
        }
      : undefined,
  } as any)
}

function normalizeMatchEvent(event: unknown) {
  const matchEvent = getObject(event)
  if (!matchEvent) return event

  if (
    matchEvent.type === 'StartedMatch' ||
    matchEvent.type === 'FinishedMatch'
  ) {
    return matchEvent
  }

  if (matchEvent.type === 'SwitchPlayers') {
    return {
      ...matchEvent,
      team: matchEvent.team as Id<'teams'>,
      members: Array.isArray(matchEvent.members)
        ? matchEvent.members.map((id) => id as Id<'members'>)
        : matchEvent.members,
    }
  }

  return {
    ...matchEvent,
    team: matchEvent.team as Id<'teams'>,
    member: matchEvent.member as Id<'members'> | undefined,
  }
}

async function verifyMcpToken(ctx: ActionCtx, request: Request) {
  const bearerToken = getBearerToken(request)
  if (!bearerToken) {
    debugLog('[mcp convex] missing bearer token')
    return { ok: false, response: unauthorizedResponse(request) } as const
  }

  try {
    const payload = await verifyJwt(
      ctx,
      bearerToken,
      getMcpResourceUrl(request),
    )
    const scope = typeof payload.scope === 'string' ? payload.scope : ''
    const scopes = scope.split(' ').filter(Boolean)

    if (!scopes.includes('mcp:read')) {
      debugLog('[mcp convex] missing required scope', {
        requiredScope: 'mcp:read',
        scopes,
      })
      return {
        ok: false,
        response: unauthorizedResponse(request, 'insufficient_scope'),
      } as const
    }

    return { ok: true, payload } as const
  } catch (error) {
    debugLog('[mcp convex] token verification failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      ok: false,
      response: unauthorizedResponse(request, 'invalid_token'),
    } as const
  }
}

async function verifyJwt(
  ctx: ActionCtx,
  token: string,
  expectedAudience: string,
) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid token.')
  }

  const header = JSON.parse(base64UrlDecodeToString(encodedHeader)) as {
    alg?: string
    kid?: string
  }
  debugLog('[mcp convex] jwt header', header)
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid token.')

  const payload = JSON.parse(base64UrlDecodeToString(encodedPayload)) as {
    aud?: string | string[]
    iss?: string
    exp?: number
    scope?: string
    sub?: string
  }
  debugLog('[mcp convex] jwt payload claims', {
    issuer: payload.iss,
    audience: payload.aud,
    subject: payload.sub,
    scope: payload.scope,
    expiresAt: payload.exp,
    expectedIssuer: authIssuer,
    expectedAudience,
  })

  const now = Math.floor(Date.now() / 1000)
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (payload.iss !== authIssuer) throw new Error('Invalid issuer.')
  if (!audiences.includes(expectedAudience))
    throw new Error('Invalid audience.')
  if (typeof payload.exp === 'number' && payload.exp <= now) {
    throw new Error('Expired token.')
  }

  const key = await findJwk(ctx, header.kid)
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    base64UrlDecode(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  )
  if (!isValid) throw new Error('Invalid signature.')

  debugLog('[mcp convex] jwt signature valid', { kid: header.kid })

  return payload
}

async function findJwk(ctx: ActionCtx, kid: string) {
  debugLog('[mcp convex] reading jwks from convex', { kid })
  const keys = (await ctx.runQuery(api.auth.getJwks, {})) as JsonWebKey[]
  debugLog('[mcp convex] jwks keys', {
    count: keys.length,
    kids: keys.map((item) => (item as JsonWebKey & { kid?: string }).kid),
  })
  const key = keys.find(
    (item) => (item as JsonWebKey & { kid?: string }).kid === kid,
  )
  if (!key) throw new Error('Unknown key.')
  return key
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

function unauthorizedResponse(request: Request, error = 'invalid_request') {
  const resourceMetadataUrl = new URL(
    '/.well-known/oauth-protected-resource/mcp',
    request.url,
  )

  return new Response(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl}", error="${error}"`,
    },
  })
}

export const protectedResourceMetadata = httpAction(async (_, request) => {
  if (request.method === 'OPTIONS') return corsPreflight()

  const resource = getMcpResourceUrl(request)

  debugLog('[mcp convex] protected resource metadata request', {
    method: request.method,
    url: request.url,
    resource,
    authorizationServer: authIssuer,
  })

  if (request.method !== 'GET') {
    return withCors(new Response('Method not allowed.', { status: 405 }))
  }

  return withCors(
    jsonResponse({
      resource,
      authorization_servers: [authIssuer],
      scopes_supported: ['mcp:read'],
      bearer_methods_supported: ['header'],
      resource_name: 'interclasse-aacsa MCP',
    }),
  )
})

function getMcpResourceUrl(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'

  if (forwardedHost && forwardedHost !== requestUrl.host) {
    return `${forwardedProto}://${forwardedHost}/api/mcp`
  }

  return new URL('/mcp', requestUrl.origin).toString()
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
) {
  return jsonResponse(jsonRpcErrorPayload(id, code, message))
}

function jsonRpcErrorPayload(
  id: string | number | null,
  code: number,
  message: string,
) {
  return { jsonrpc: '2.0', error: { code, message }, id }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

function withCors(response: Response) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders))
    headers.set(key, value)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function getObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined
  return value as Record<string, unknown>
}

function isToolName(value: unknown): value is ToolName {
  return value === 'members' || value === 'teams' || value === 'matches'
}

function debugLog(message: string, details?: unknown) {
  if (!DEBUG_MCP) return

  if (details === undefined) {
    console.log(message)
    return
  }

  console.log(message, details)
}

function base64UrlDecodeToString(value: string) {
  return new TextDecoder().decode(base64UrlDecode(value))
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function getTools() {
  return [
    {
      name: 'members',
      title: 'Administrar membros',
      description:
        'Lista, consulta, cria, atualiza ou remove membros. Disponível apenas para administradores.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: actionSchema,
          id: {
            type: 'string',
            description: 'ID do membro para get/update/delete.',
          },
          fields: {
            type: 'object',
            description: 'Campos usados em create/update.',
            additionalProperties: false,
            properties: {
              userId: nullableString,
              name: { type: 'string' },
              tuitionId: nullableString,
              additionalRole: {
                anyOf: [{ enum: ['press', 'judge'] }, { type: 'null' }],
              },
              schoolClass: nullableString,
              player: { anyOf: [playerSchema, { type: 'null' }] },
            },
          },
        },
        required: ['action'],
      },
    },
    {
      name: 'teams',
      title: 'Administrar times',
      description:
        'Lista, consulta, cria, atualiza ou remove times. Disponível apenas para administradores.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: actionSchema,
          id: {
            type: 'string',
            description: 'ID do time para get/update/delete.',
          },
          fields: {
            type: 'object',
            description: 'Campos usados em create/update.',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              sport: { type: 'string' },
              color: nullableString,
              type: { enum: ['Feminine', 'Masculine'] },
              members: nullableStringArray,
              players: nullableStringArray,
            },
          },
        },
        required: ['action'],
      },
    },
    {
      name: 'matches',
      title: 'Administrar partidas',
      description:
        'Lista, consulta, cria, atualiza ou remove partidas. Disponível apenas para administradores.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: actionSchema,
          id: {
            type: 'string',
            description: 'ID da partida para get/update/delete.',
          },
          fields: {
            type: 'object',
            description: 'Campos usados em create/update.',
            additionalProperties: false,
            properties: {
              teams: stringArray,
              scheduledData: { anyOf: [{ type: 'number' }, { type: 'null' }] },
              status: {
                enum: ['Scheduled', 'Started', 'Canceled', 'Finished'],
              },
              events: { type: 'array', items: matchEventSchema },
            },
          },
        },
        required: ['action'],
      },
    },
  ]
}

const actionSchema = {
  enum: ['list', 'get', 'create', 'update', 'delete'],
  description: 'Operação a executar.',
}
const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const stringArray = { type: 'array', items: { type: 'string' } }
const nullableStringArray = { anyOf: [stringArray, { type: 'null' }] }
const playerSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    alias: stringArray,
    height: { type: 'string' },
    weight: { type: 'string' },
    age: { type: 'number' },
    photo: { type: 'string' },
    socialMedias: {
      type: 'object',
      additionalProperties: false,
      properties: { Instagram: { type: 'string' } },
    },
  },
}
const matchEventSchema = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { enum: ['AddScore', 'RemScore'] },
        time: { type: 'number' },
        team: { type: 'string' },
        score: { type: 'number' },
        member: { type: 'string' },
        player: { type: 'string' },
      },
      required: ['type', 'time', 'team', 'score'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { const: 'KickedPlayer' },
        time: { type: 'number' },
        team: { type: 'string' },
        member: { type: 'string' },
        player: { type: 'string' },
      },
      required: ['type', 'time', 'team'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { enum: ['StartedMatch', 'FinishedMatch'] },
        time: { type: 'number' },
      },
      required: ['type', 'time'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { const: 'SwitchPlayers' },
        time: { type: 'number' },
        team: { type: 'string' },
        members: stringArray,
        players: stringArray,
      },
      required: ['type', 'time', 'team'],
    },
  ],
}
