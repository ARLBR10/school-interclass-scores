import { viewPaths } from '@better-auth-ui/core'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Auth } from '@/components/auth/auth'
import { magicLinkPlugin } from '@/lib/auth/magic-link-plugin'
import { authClient } from '@/lib/auth-client'

const validAuthPathSegments = new Set([
  ...Object.values(viewPaths.auth),
  magicLinkPlugin().viewPaths.auth.magicLink,
])

export const Route = createFileRoute('/auth/$path')({
  validateSearch(search): AuthSearch {
    return {
      ...search,
      credentials: getAllowCredentials(search),
      redirectTo:
        typeof search.redirectTo === 'string' && search.redirectTo.length > 0
          ? search.redirectTo
          : undefined,
    }
  },
  beforeLoad({ context, params: { path }, search }) {
    if (!validAuthPathSegments.has(path)) {
      throw redirect({ to: '/' })
    }

    if (context.isAuthenticated && path === viewPaths.auth.signOut) {
      throw redirect({ to: '/' })
    }

    if (
      context.isAuthenticated &&
      (path === viewPaths.auth.signIn || path === viewPaths.auth.signUp)
    ) {
      if (isOAuthRedirectSearch(search)) return

      throw redirect({ to: getAuthRedirectTo(search) })
    }
  },
  component: AuthPage,
})

type AuthSearch = {
  [key: string]: unknown
  credentials?: boolean
  redirectTo?: string
}

function isOAuthRedirectSearch(search: AuthSearch) {
  return (
    typeof search.client_id === 'string' &&
    typeof search.response_type === 'string' &&
    typeof search.sig === 'string'
  )
}

function getAuthRedirectTo(search: AuthSearch) {
  return search.redirectTo ?? '/'
}

function getAllowCredentials(search: Record<string, unknown>) {
  return search.credentials === true || search.credentials === 'true'
}

function AuthPage() {
  const { path } = Route.useParams()
  const search = Route.useSearch()
  const { data: session, isPending } = authClient.useSession()
  const allowCredentials = search.credentials === true

  const shouldRedirectAuthenticatedUser =
    (path === viewPaths.auth.signIn || path === viewPaths.auth.signUp) &&
    !isOAuthRedirectSearch(search)
  const shouldContinueOAuth =
    (path === viewPaths.auth.signIn || path === viewPaths.auth.signUp) &&
    isOAuthRedirectSearch(search)
  const redirectTo = getAuthRedirectTo(search)

  useEffect(() => {
    if (!isPending && session && shouldContinueOAuth) {
      const params = getOAuthAuthorizeParams(search)
      window.location.assign(`/api/auth/oauth2/authorize?${params}`)
      return
    }

    if (!isPending && session && shouldRedirectAuthenticatedUser) {
      window.location.assign(redirectTo)
    }
  }, [
    isPending,
    redirectTo,
    search,
    session,
    shouldContinueOAuth,
    shouldRedirectAuthenticatedUser,
  ])

  if (
    (shouldRedirectAuthenticatedUser || shouldContinueOAuth) &&
    (isPending || session)
  ) {
    return null
  }

  return (
    <div className="flex justify-center my-auto p-4 md:p-6">
      <Auth path={path} allowCredentials={allowCredentials} />
    </div>
  )
}

function getOAuthAuthorizeParams(search: AuthSearch) {
  const params = new URLSearchParams()
  const allowedParams = [
    'response_type',
    'client_id',
    'redirect_uri',
    'scope',
    'state',
    'code_challenge',
    'code_challenge_method',
    'resource',
    'prompt',
  ]

  for (const key of allowedParams) {
    const value = search[key]

    if (typeof value === 'string') {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') params.append(key, item)
      }
    }
  }

  return params.toString()
}
