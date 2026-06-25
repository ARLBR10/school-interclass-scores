import { convexQuery } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'

import { api } from '../../convex/_generated/api'

type AdminRouteContext = {
  queryClient: QueryClient
}

export async function requireAdminMember({
  context,
}: {
  context: AdminRouteContext
}) {
  const userInfo = await context.queryClient.ensureQueryData(
    convexQuery(api.auth.getCurrentUser, {}),
  )

  if (!userInfo) {
    throw redirect({ to: '/auth/$path', params: { path: 'sign-in' } })
  }

  if (userInfo?.member?.additionalRole !== 'admin') {
    throw redirect({ to: '/' })
  }

  return { userInfo }
}
