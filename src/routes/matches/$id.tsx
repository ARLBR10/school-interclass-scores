import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MatchTimeline } from '@/components/MatchTimeline'
import { ArrowLeftIcon, CalendarIcon, UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatSport } from '@/lib/sports'
import { Suspense } from 'react'

import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/matches/$id')({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.matches.getWithDetails, {
        ID: params.id as Id<'matches'>,
      }),
    )
  },
  component: MatchDetailPage,
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

function computeScore(
  events: Array<{
    type: string
    team?: string
    score?: number
  }>,
  teamId: string,
) {
  let score = 0
  for (const event of events) {
    if (event.type === 'AddScore' && event.team === teamId) {
      score += event.score ?? 0
    } else if (event.type === 'RemScore' && event.team === teamId) {
      score -= event.score ?? 0
    }
  }
  return Math.max(0, score)
}

function MatchDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Skeleton className="h-9 w-32" />

      {/* Scoreboard card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-12 w-28" />
          </div>
          <Separator />
          <Skeleton className="h-4 w-48 mx-auto" />
        </CardContent>
      </Card>

      {/* Teams card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Timeline skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MatchDetail() {
  const { id } = Route.useParams()
  const { data: match } = useSuspenseQuery(
    convexQuery(api.matches.getWithDetails, {
      ID: id as Id<'matches'>,
    }),
  )

  if (!match) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            404
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Partida não encontrada
            </h1>
            <p className="text-sm text-muted-foreground">
              Esta partida não existe ou foi removida.
            </p>
          </div>
          <Button asChild>
            <Link to="/matches">Voltar às partidas</Link>
          </Button>
        </div>
      </div>
    )
  }

  const team0 = match.teamsData[0]
  const team1 = match.teamsData[1]
  const score0 = computeScore(match.events as any, match.teams[0])
  const score1 = computeScore(match.events as any, match.teams[1])
  const status = statusConfig[match.status]
  const isPlayed = match.status === 'Started' || match.status === 'Finished'

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/matches">
          <ArrowLeftIcon className="size-4" />
          Voltar às partidas
        </Link>
      </Button>

      {/* Scoreboard card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
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

        <CardContent className="space-y-4">
          {/* Big scoreboard */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex-1 text-right">
              <p className="truncate text-lg font-semibold text-foreground sm:text-xl">
                {team0?.name ?? 'Time A'}
              </p>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span
                className={cn(
                  'min-w-[2.5rem] rounded-lg bg-muted px-2 py-1 text-center text-3xl font-bold sm:text-4xl',
                  isPlayed && score0 > score1 && 'text-green-400',
                )}
              >
                {match.status === 'Scheduled' ? '-' : score0}
              </span>
              <span className="text-lg text-muted-foreground">x</span>
              <span
                className={cn(
                  'min-w-[2.5rem] rounded-lg bg-muted px-2 py-1 text-center text-3xl font-bold sm:text-4xl',
                  isPlayed && score1 > score0 && 'text-green-400',
                )}
              >
                {match.status === 'Scheduled' ? '-' : score1}
              </span>
            </div>
            <div className="flex-1">
              <p className="truncate text-lg font-semibold text-foreground sm:text-xl">
                {team1?.name ?? 'Time B'}
              </p>
            </div>
          </div>

          {/* Date */}
          {match.scheduledData && (
            <>
              <Separator />
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <CalendarIcon className="size-3.5" />
                <span>
                  {new Date(match.scheduledData * 1000).toLocaleDateString(
                    'pt-BR',
                    {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Team rosters */}
      <div className="grid gap-4 sm:grid-cols-2">
        {match.teamsData.map((team) => {
          if (!team) return null
          return (
            <Card key={team._id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="size-4 text-muted-foreground" />
                  {team.name}
                </CardTitle>
                <CardDescription>
                  {team.membersData.length}{' '}
                  {team.membersData.length === 1 ? 'membro' : 'membros'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {team.membersData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum membro registrado.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {team.membersData.map((member) => {
                      if (!member) return null
                      return (
                        <li key={member._id}>
                          <a
                            href={`/members/${member._id}`}
                            className="text-sm text-foreground underline-offset-4 hover:underline"
                          >
                            {member.name}
                          </a>
                          {member.schoolClass && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {member.schoolClass}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-4">
          <MatchTimeline
            events={match.events as any}
            teams={match.teamsData as any}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function MatchDetailPage() {
  return (
    <Suspense fallback={<MatchDetailSkeleton />}>
      <MatchDetail />
    </Suspense>
  )
}
