import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components, internal } from './_generated/api'
import { env, query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel, Doc } from './_generated/dataModel'
import authSchema from './betterAuth/schema'
import { oauthProvider } from '@better-auth/oauth-provider'
import { jwt } from 'better-auth/plugins'

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    basePath: '/api/auth',
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google:
        env?.GOOGLE_OAUTH_CLIENT_ID && env?.GOOGLE_OAUTH_CLIENT_SECRET
          ? {
              clientId: env?.GOOGLE_OAUTH_CLIENT_ID,
              clientSecret: env?.GOOGLE_OAUTH_CLIENT_SECRET,
            }
          : undefined,
    },
    plugins: [
      jwt({
        disableSettingJwtHeader: true,
        jwks: {
          keyPairConfig: {
            alg: 'RS256',
            modulusLength: 2048,
          },
        },
      }),
      // Keep the Convex plugin after jwt() so its /convex/* endpoints are not
      // shadowed by the generic JWT plugin endpoint keys.
      convex({
        authConfig,
        options: {
          basePath: '/api/auth',
        },
      }),
      oauthProvider({
        loginPage: `${siteUrl}/auth/sign-in`,
        consentPage: `${siteUrl}/auth/consent`,
        scopes: ['openid', 'profile', 'email', 'mcp:read', 'mcp:write'],
        validAudiences: [`${siteUrl}/api/mcp`],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultScopes: ['openid', 'profile', 'mcp:read'],
        clientRegistrationAllowedScopes: ['email', 'mcp:write'],
      }),
    ],
  } satisfies BetterAuthOptions
}

const siteUrl = env.SITE_URL

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  },
)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}

export type AuthUser = Awaited<ReturnType<typeof authComponent.getAuthUser>>

type UserInfoType = AuthUser & {
  member: Doc<'members'> | null
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<UserInfoType | null> => {
    const userInfo = await authComponent.getAuthUser(ctx).catch(() => {
      return null
    })

    if (!userInfo) {
      return null
    }

    const membershipInfo = await ctx.runQuery(internal.members.getByUserId, {
      userId: userInfo._id,
    })

    return {
      ...userInfo,
      member: membershipInfo,
    }
  },
})

export const getJwks = query({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'jwks',
      paginationOpts: {
        cursor: null,
        numItems: 100,
      },
    } as any)

    return result.page.map((key: any) => ({
      ...JSON.parse(key.publicKey),
      kid: key.id ?? key._id,
      alg: key.alg ?? 'RS256',
    }))
  },
})
