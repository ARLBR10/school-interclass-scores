import { oauthProviderResourceClient } from '@better-auth/oauth-provider/resource-client'
import { createAuthClient } from 'better-auth/client'

const siteUrl =
  process.env.VITE_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3000'
const issuer = `${siteUrl}/api/auth`

export const mcpResourceClient = createAuthClient({
  plugins: [oauthProviderResourceClient()],
})

export const mcpOAuthConfig = {
  audience: `${siteUrl}/api/mcp`,
  issuer,
  jwksUrl: `${issuer}/jwks`,
}
