import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { ArrowLeftIcon, ShirtIcon, UserIcon, UsersIcon } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSport } from '@/lib/sports'

export const Route = createFileRoute('/teams/$id')({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.teams.getWithMembers, {
        ID: params.id as Id<'teams'>,
      }),
    )
  },
  component: TeamDetailPage,
})

function formatTeamType(type: 'Feminine' | 'Masculine') {
  return type === 'Feminine' ? 'Feminino' : 'Masculino'
}

function TeamDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-28" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 6 }).map((_player, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TeamDetail() {
  const { id } = Route.useParams()
  const { data: team } = useSuspenseQuery(
    convexQuery(api.teams.getWithMembers, {
      ID: id as Id<'teams'>,
    }),
  )

  if (!team) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            404
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Time não encontrado
            </h1>
            <p className="text-sm text-muted-foreground">
              Este time não existe ou foi removido.
            </p>
          </div>
          <Button asChild>
            <Link to="/teams">Voltar aos times</Link>
          </Button>
        </div>
      </div>
    )
  }

  const textPlayers = team.players ?? []
  const playersCount = team.membersData.length + textPlayers.length

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/teams">
          <ArrowLeftIcon className="size-4" />
          Voltar aos times
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="font-serif text-3xl">{team.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <ShirtIcon className="size-3" />
                  {formatSport(team.sport)}
                </Badge>
                <Badge variant="outline">{formatTeamType(team.type)}</Badge>
              </div>
            </div>
            <div className="rounded-xl bg-background px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">
                {playersCount}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                jogadores
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {playersCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <UsersIcon className="size-8" />
              <p className="text-sm">Nenhum jogador registrado neste time.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {team.membersData.map((member) => (
                <li key={member._id}>
                  <a
                    href={`/player/${member._id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      {member.schoolClass ? (
                        <p className="text-xs text-muted-foreground">
                          {member.schoolClass}
                        </p>
                      ) : null}
                    </div>
                  </a>
                </li>
              ))}
              {textPlayers.map((player) => (
                <li key={player} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserIcon className="size-4" />
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">
                    {player}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TeamDetailPage() {
  return (
    <Suspense fallback={<TeamDetailSkeleton />}>
      <TeamDetail />
    </Suspense>
  )
}
