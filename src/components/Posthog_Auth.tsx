import { createContext, useContext, useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { authClient } from '@/lib/auth-client'

export const PostHogReadyContext = createContext(false)

export type PostHogAuthSession = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    emailVerified?: boolean | null
  }
  session: {
    id: string
  }
}

export function AuthSync() {
  const isPostHogReady = useContext(PostHogReadyContext)
  const posthog = usePostHog()
  const { data: rawSession } = authClient.useSession()
  const session = rawSession as PostHogAuthSession | null | undefined
  const userId = session?.user.id
  const { data: userInfo } = useQuery({
    ...convexQuery(api.auth.getCurrentUser, {}),
    enabled: isPostHogReady && !!userId,
  })

  const member = userInfo?.member
  const playerAlias = member?.player?.alias?.join(', ') ?? null

  useEffect(() => {
    if (!isPostHogReady || !userId || userInfo === undefined) {
      return
    }

    const name = member?.name ?? session?.user.name ?? null
    const email = session?.user.email ?? null

    posthog.identify(userId, {
      $name: name,
      $email: email,
      'member.id': member?._id ?? null,
      'member.name': member?.name ?? null,
      'member.tuitionId': member?.tuitionId ?? null,
      'member.additionalRole': member?.additionalRole ?? null,
      'member.schoolClass': member?.schoolClass ?? null,
      'member.player.alias': playerAlias,
      'member.player.age': member?.player?.age ?? null,
      'member.player.height': member?.player?.height ?? null,
      'member.player.weight': member?.player?.weight ?? null,
      name,
      email,
      emailVerified: session?.user.emailVerified ?? null,
    })
  }, [
    isPostHogReady,
    member?._id,
    member?.additionalRole,
    member?.name,
    member?.player?.age,
    member?.player?.height,
    member?.player?.weight,
    member?.schoolClass,
    member?.tuitionId,
    playerAlias,
    posthog,
    session?.user.email,
    session?.user.name,
    session?.user.emailVerified,
    userId,
    userInfo,
  ])

  return null
}
