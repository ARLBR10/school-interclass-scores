import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, SwordsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatSport } from '@/lib/sports'
import { Suspense } from 'react'

export const Route = createFileRoute('/matches/')({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.matches.getAllWithTeams, {}),
    )
  },
  component: MatchesPage,
})

const statusConfig = {
  Scheduled: {
    label: 'Agendada',
    variant: 'outline' as const,
    className: 'border-blue-500/30 text-blue-400',
  },
  Started: {
    label: 'Em andamento',
    variant: 'outline' as const,
    className: 'border-green-500/30 text-green-400',
  },
  Finished: {
    label: 'Finalizada',
    variant: 'secondary' as const,
    className: '',
  },
  Canceled: {
    label: 'Cancelada',
    variant: 'destructive' as const,
    className: '',
  },
} as const

function MatchesListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="mt-3 h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function computeScore(
  match: {
    events: Array<{
      type: string
      team?: string
      score?: number
    }>
    teams: string[]
  },
  teamId: string,
) {
  let score = 0
  for (const event of match.events) {
    if (event.type === 'AddScore' && event.team === teamId) {
      score += event.score ?? 0
    } else if (event.type === 'RemScore' && event.team === teamId) {
      score -= event.score ?? 0
    }
  }
  return Math.max(0, score)
}

function MatchesList() {
  const { data: matches } = useSuspenseQuery(
    convexQuery(api.matches.getAllWithTeams, {}),
  )

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-2">
          <SwordsIcon className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Nenhuma partida encontrada
          </h2>
          <p className="text-sm text-muted-foreground">
            As partidas aparecerão aqui quando forem registradas.
          </p>
        </div>
      </div>
    )
  }

  // Sort: Started first, then Scheduled, then Finished, then Canceled
  const statusOrder = {
    Started: 0,
    Scheduled: 1,
    Finished: 2,
    Canceled: 3,
  }

  const sorted = [...matches].toSorted((a, b) => {
    const orderDiff =
      (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    if (orderDiff !== 0) return orderDiff
    // Within same status, sort by scheduled date
    return (b.scheduledData ?? 0) - (a.scheduledData ?? 0)
  })

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((match) => {
        const team0 = match.teamsData[0]
        const team1 = match.teamsData[1]
        const score0 = computeScore(match as any, match.teams[0])
        const score1 = computeScore(match as any, match.teams[1])
        const status = statusConfig[match.status]

        return (
          <Link
            key={match._id}
            to="/matches/$id"
            params={{ id: match._id }}
            className="group"
          >
            <Card className="transition-colors group-hover:bg-muted/30">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {formatSport(team0?.sport)}
                    {team0?.type && (
                      <span className="ml-1.5 text-xs text-muted-foreground/60">
                        ({team0.type === 'Feminine' ? 'Feminino' : 'Masculino'})
                      </span>
                    )}
                  </CardTitle>
                  <Badge variant={status.variant} className={status.className}>
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Scoreboard */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex-1 text-right">
                    <p className="truncate text-sm font-medium text-foreground">
                      {team0?.name ?? 'Time A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span
                      className={cn(
                        'min-w-[1.5rem] rounded-md bg-muted px-1.5 py-0.5 text-center text-lg font-semibold',
                        match.status !== 'Scheduled' &&
                          score0 > score1 &&
                          'text-green-400',
                      )}
                    >
                      {match.status === 'Scheduled' ? '-' : score0}
                    </span>
                    <span className="text-xs text-muted-foreground">x</span>
                    <span
                      className={cn(
                        'min-w-[1.5rem] rounded-md bg-muted px-1.5 py-0.5 text-center text-lg font-semibold',
                        match.status !== 'Scheduled' &&
                          score1 > score0 &&
                          'text-green-400',
                      )}
                    >
                      {match.status === 'Scheduled' ? '-' : score1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {team1?.name ?? 'Time B'}
                    </p>
                  </div>
                </div>

                {/* Date */}
                {match.scheduledData && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    <span>
                      {new Date(match.scheduledData * 1000).toLocaleDateString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function MatchesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Partidas
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe todas as partidas do interclasse.
        </p>
      </div>
      <Suspense fallback={<MatchesListSkeleton />}>
        <MatchesList />
      </Suspense>
    </div>
  )
}
