import { oauthProviderResourceClient } from '@better-auth/oauth-provider/resource-client'
import { createAuthClient } from 'better-auth/client'

const issuer = `${process.env.VITE_SITE_URL ?? process.env.SITE_URL}/api/auth`

export const mcpResourceClient = createAuthClient({
  plugins: [oauthProviderResourceClient()],
})

export const mcpOAuthConfig = {
  audience: `${process.env.VITE_SITE_URL ?? process.env.SITE_URL}/api/mcp`,
  issuer,
  jwksUrl: `${issuer}/jwks`,
}
