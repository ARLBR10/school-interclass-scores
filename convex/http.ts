import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import { handle as mcpHandler, protectedResourceMetadata } from './mcpHttp'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({ path: '/mcp', method: 'GET', handler: mcpHandler })
http.route({ path: '/mcp', method: 'POST', handler: mcpHandler })
http.route({ path: '/mcp', method: 'DELETE', handler: mcpHandler })
http.route({ path: '/mcp', method: 'OPTIONS', handler: mcpHandler })

http.route({
  path: '/.well-known/oauth-protected-resource',
  method: 'GET',
  handler: protectedResourceMetadata,
})
http.route({
  path: '/.well-known/oauth-protected-resource',
  method: 'OPTIONS',
  handler: protectedResourceMetadata,
})
http.route({
  path: '/.well-known/oauth-protected-resource/mcp',
  method: 'GET',
  handler: protectedResourceMetadata,
})
http.route({
  path: '/.well-known/oauth-protected-resource/mcp',
  method: 'OPTIONS',
  handler: protectedResourceMetadata,
})
http.route({
  path: '/.well-known/oauth-protected-resource/api/mcp',
  method: 'GET',
  handler: protectedResourceMetadata,
})
http.route({
  path: '/.well-known/oauth-protected-resource/api/mcp',
  method: 'OPTIONS',
  handler: protectedResourceMetadata,
})

export default http
