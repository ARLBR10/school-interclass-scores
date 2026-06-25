import { convexQuery } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { redirect, useLocation, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'

import { api } from '../../convex/_generated/api'
import { authClient } from './auth-client'

type AdminRouteContext = {
  queryClient: QueryClient
}

export async function requireAdminMember({
  context,
  location,
}: {
  context: AdminRouteContext
  location: { href: string }
}) {
  if (typeof window === 'undefined') {
    return
  }

  const userInfo = await context.queryClient.ensureQueryData(
    convexQuery(api.auth.getCurrentUser, {}),
  )

  if (!userInfo) {
    throw redirect({
      to: '/auth/$path',
      params: { path: 'sign-in' },
      search: { redirectTo: location.href },
    })
  }

  if (userInfo?.member?.additionalRole !== 'admin') {
    throw redirect({ to: '/' })
  }

  return { userInfo }
}

export async function requireJudgeMember({
  context,
  location,
}: {
  context: AdminRouteContext
  location: { href: string }
}) {
  if (typeof window === 'undefined') {
    return
  }

  const userInfo = await context.queryClient.ensureQueryData(
    convexQuery(api.auth.getCurrentUser, {}),
  )

  if (!userInfo) {
    throw redirect({
      to: '/auth/$path',
      params: { path: 'sign-in' },
      search: { redirectTo: location.href },
    })
  }

  const role = userInfo?.member?.additionalRole

  if (role !== 'admin' && role !== 'judge') {
    throw redirect({ to: '/' })
  }

  return { userInfo }
}

export function useRequireAdminMember() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const userInfo = useQuery(api.auth.getCurrentUser, session ? {} : 'skip')
  const isUserInfoPending = !!session && userInfo === undefined
  const isAdmin = userInfo?.member?.additionalRole === 'admin'

  useEffect(() => {
    if (isSessionPending) {
      return
    }

    if (!session) {
      navigate({
        to: '/auth/$path',
        params: { path: 'sign-in' },
        search: { redirectTo: location.href },
        replace: true,
      })
      return
    }

    if (!isUserInfoPending && !isAdmin) {
      navigate({ to: '/', replace: true })
    }
  }, [
    isAdmin,
    isSessionPending,
    isUserInfoPending,
    location.href,
    navigate,
    session,
  ])

  return isAdmin
}

export function useRequireJudgeMember() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const userInfo = useQuery(api.auth.getCurrentUser, session ? {} : 'skip')
  const isUserInfoPending = !!session && userInfo === undefined
  const role = userInfo?.member?.additionalRole
  const canJudge = role === 'admin' || role === 'judge'

  useEffect(() => {
    if (isSessionPending) {
      return
    }

    if (!session) {
      navigate({
        to: '/auth/$path',
        params: { path: 'sign-in' },
        search: { redirectTo: location.href },
        replace: true,
      })
      return
    }

    if (!isUserInfoPending && !canJudge) {
      navigate({ to: '/', replace: true })
    }
  }, [
    canJudge,
    isSessionPending,
    isUserInfoPending,
    location.href,
    navigate,
    session,
  ])

  return canJudge
}
