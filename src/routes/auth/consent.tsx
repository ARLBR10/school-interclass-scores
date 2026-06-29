import { createFileRoute, redirect } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/auth/consent')({
  validateSearch(search): ConsentSearch {
    return {
      ...search,
      client_id:
        typeof search.client_id === 'string' ? search.client_id : undefined,
      scope: typeof search.scope === 'string' ? search.scope : undefined,
    }
  },
  beforeLoad({ context, search }) {
    if (!context.isAuthenticated) {
      throw redirect({
        to: '/auth/$path',
        params: { path: 'sign-in' },
        search,
      })
    }
  },
  component: ConsentPage,
})

type ConsentSearch = {
  [key: string]: unknown
  client_id?: string
  scope?: string
}

type OAuthPublicClient = {
  client_name?: string
  client_uri?: string
  logo_uri?: string
}

type OAuthConsentResponse = {
  redirect_uri?: string
  url?: string
}

function ConsentPage() {
  const search = Route.useSearch()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<OAuthPublicClient | null>(null)

  const requestedScopes = (search.scope ?? '')
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean)

  useEffect(() => {
    if (!search.client_id) return

    let ignore = false

    authClient
      .$fetch<OAuthPublicClient>('/oauth2/public-client', {
        query: { client_id: search.client_id },
      })
      .then((response) => {
        if (!ignore) setClient(response.data ?? null)
      })
      .catch(() => {
        if (!ignore) setClient(null)
      })

    return () => {
      ignore = true
    }
  }, [search.client_id])

  const clientName = client?.client_name ?? 'Aplicativo externo'

  async function submitConsent(accept: boolean) {
    setIsPending(true)
    setError(null)

    const { data, error: consentError } = await authClient.oauth2.consent({
      accept,
      ...(accept && requestedScopes.length > 0
        ? { scope: requestedScopes.join(' ') }
        : {}),
      oauth_query: getSignedOAuthQuery(),
    })

    if (consentError) {
      setError(
        consentError.message ?? 'Não foi possível processar o consentimento.',
      )
      setIsPending(false)
      return
    }

    const redirectUrl = (data as OAuthConsentResponse | null)?.url ?? data?.redirect_uri

    if (!redirectUrl) {
      setError('Não foi possível continuar o fluxo de autorização.')
      setIsPending(false)
      return
    }

    window.location.assign(redirectUrl)
  }

  return (
    <div className="flex justify-center my-auto p-4 md:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Autorizar acesso
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{clientName}</span>{' '}
              quer acessar sua conta do Interclasse AACSA.
            </p>
            {client?.client_uri ? (
              <p className="break-all">Origem: {client.client_uri}</p>
            ) : null}
          </div>

          {requestedScopes.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Permissões solicitadas</p>
              <div className="flex flex-wrap gap-2">
                {requestedScopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={() => submitConsent(true)} disabled={isPending}>
              {isPending ? <Spinner /> : null}
              Autorizar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => submitConsent(false)}
              disabled={isPending}
            >
              Recusar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getSignedOAuthQuery() {
  const params = new URLSearchParams(window.location.search)
  const signedParameterNames = params.getAll('ba_param')

  if (!params.has('sig') || signedParameterNames.length === 0) return undefined

  const signedParameters = new Set(signedParameterNames)
  const oauthQuery = new URLSearchParams()

  for (const [key, value] of params.entries()) {
    if (key === 'sig' || key === 'ba_param' || signedParameters.has(key)) {
      oauthQuery.append(key, value)
    }
  }

  return oauthQuery.toString()
}
