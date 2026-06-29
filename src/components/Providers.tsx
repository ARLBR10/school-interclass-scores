import { TooltipProvider } from '@/components/ui/tooltip'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { authClient } from '@/lib/auth-client'
import { AuthLang_PT_BR } from '@/lib/auth/auth-lang-pt-br'
import { useEffect, useRef, useState } from 'react'
import {
  Link,
  useNavigate,
  //useParams
} from '@tanstack/react-router'
import { ThemeProvider, useTheme } from 'next-themes'
// import { apiKeyPlugin } from "@/lib/auth/api-key-plugin";
// import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
// import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";
// import { multiSessionPlugin } from "@/lib/auth/multi-session-plugin";
// import { organizationPlugin } from "@/lib/auth/organization-plugin";
// import { passkeyPlugin } from "@/lib/auth/passkey-plugin";
// import { usernamePlugin } from "@/lib/auth/username-plugin";
import { themePlugin } from '@/lib/auth/theme-plugin'
import { AuthProvider } from './auth/auth-provider'
import { Toaster } from './ui/sonner'

import { PostHogProvider } from '@posthog/react'
import posthog from 'posthog-js'
import { AuthSync, PostHogReadyContext } from './Posthog_Auth'
import type { PostHogAuthSession } from './Posthog_Auth'

function AuthLink({ href, ...props }: React.ComponentProps<'a'>) {
  return <Link to={href} {...props} />
}

function ConvexBetterAuthComponent({
  children,
  context,
}: {
  context: any // @todo
  children: React.ReactNode
}) {
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      {children}
    </ConvexBetterAuthProvider>
  )
}

function ThemeProviderComponent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

function BetterAuthUIProviderComponent({
  children,
}: {
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  //const { slug } = useParams({ strict: false });

  return (
    <AuthProvider
      authClient={authClient as any}
      redirectTo="/settings/account"
      socialProviders={['google']}
      emailAndPassword={{ requireEmailVerification: false }}
      localization={AuthLang_PT_BR}
      navigate={navigate}
      plugins={[
        // usernamePlugin({
        //   usernamePrefix: "@",
        //   localization: { usernamePlaceholder: "username" },
        // }),
        // magicLinkPlugin(),
        // passkeyPlugin(),
        // apiKeyPlugin({ organization: true }),
        // multiSessionPlugin(),
        // deleteUserPlugin(),
        // organizationPlugin({
        //   slugPrefix: "@",
        //   slug: slug ?? null,
        // }),
        themePlugin({ useTheme }),
      ]}
      Link={AuthLink}
    >
      {children}
    </AuthProvider>
  )
}

function PostHogComponent({ children }: { children: React.ReactNode }) {
  const { data: rawSession, isPending } = authClient.useSession()
  const session = rawSession as PostHogAuthSession | null | undefined
  const hasInitialized = useRef(false)
  const previousUserId = useRef<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const userId = session?.user.id
  const authSessionId = session?.session.id

  useEffect(() => {
    if (isPending || hasInitialized.current) {
      return
    }

    const posthogKey = import.meta.env.VITE_POSTHOG_KEY

    if (!posthogKey) {
      return
    }

    posthog.init(posthogKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      defaults: '2026-01-30',
    })

    hasInitialized.current = true
    setIsReady(true)
  }, [isPending])

  useEffect(() => {
    if (!hasInitialized.current) {
      return
    }

    if (!userId || !authSessionId) {
      if (previousUserId.current) {
        posthog.reset()
        previousUserId.current = null
      }
      return
    }

    posthog.identify(userId)
    posthog.register({
      distinct_id: userId,
      session_id: authSessionId,
    })
    previousUserId.current = userId
  }, [authSessionId, userId])

  return (
    <PostHogProvider client={posthog}>
      <PostHogReadyContext value={isReady}>
        <AuthSync />
        {children}
      </PostHogReadyContext>
    </PostHogProvider>
  )
}

export default function Providers({
  context,
  children,
}: {
  context: any // @todo
  children: React.ReactNode
}) {
  return (
    <ConvexBetterAuthComponent context={context}>
      <PostHogComponent>
        <TooltipProvider>
          <ThemeProviderComponent>
            <BetterAuthUIProviderComponent>
              {children}

              <Toaster />
            </BetterAuthUIProviderComponent>
          </ThemeProviderComponent>
        </TooltipProvider>
      </PostHogComponent>
    </ConvexBetterAuthComponent>
  )
}
