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
      throw redirect({ to: getAuthRedirectTo(search) })
    }
  },
  component: AuthPage,
})

function getAuthRedirectTo(search: Record<string, unknown>) {
  return typeof search.redirectTo === 'string' && search.redirectTo.length > 0
    ? search.redirectTo
    : '/'
}

function AuthPage() {
  const { path } = Route.useParams()
  const search = Route.useSearch()
  const { data: session, isPending } = authClient.useSession()

  const shouldRedirectAuthenticatedUser =
    path === viewPaths.auth.signIn || path === viewPaths.auth.signUp
  const redirectTo = getAuthRedirectTo(search)

  useEffect(() => {
    if (!isPending && session && shouldRedirectAuthenticatedUser) {
      window.location.assign(redirectTo)
    }
  }, [isPending, redirectTo, session, shouldRedirectAuthenticatedUser])

  if (shouldRedirectAuthenticatedUser && (isPending || session)) {
    return null
  }

  return (
    <div className="flex justify-center my-auto p-4 md:p-6">
      <Auth path={path} />
    </div>
  )
}
