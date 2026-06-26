import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { ShirtIcon, UserIcon, UsersIcon } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSport } from '@/lib/sports'

export const Route = createFileRoute('/teams/')({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.teams.getAllWithMembers, {}),
    )
  },
  component: TeamsPage,
})

function formatTeamType(type: 'Feminine' | 'Masculine') {
  return type === 'Feminine' ? 'Feminino' : 'Masculino'
}

function getPlayerNames(team: {
  players?: string[]
  membersData: Array<{
    _id: string
    name: string
    schoolClass?: string
  } | null>
}) {
  const registeredPlayers = team.membersData
    .filter((member) => member !== null)
    .map((member) => ({
      id: member._id,
      name: member.name,
      schoolClass: member.schoolClass,
    }))
  const freeTextPlayers = (team.players ?? []).map((name) => ({
    id: name,
    name,
    schoolClass: undefined,
  }))

  return [...registeredPlayers, ...freeTextPlayers]
}

function TeamsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_team, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_player, itemIndex) => (
              <Skeleton key={itemIndex} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TeamsList() {
  const { data: teams } = useSuspenseQuery(
    convexQuery(api.teams.getAllWithMembers, {}),
  )

  if (teams.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-2">
          <UsersIcon className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Nenhum time encontrado
          </h2>
          <p className="text-sm text-muted-foreground">
            Os times aparecerão aqui quando forem cadastrados.
          </p>
        </div>
      </div>
    )
  }

  const sortedTeams = [...teams].toSorted((teamA, teamB) => {
    const sportComparison = formatSport(teamA.sport).localeCompare(
      formatSport(teamB.sport),
      'pt-BR',
      { sensitivity: 'base' },
    )
    if (sportComparison !== 0) return sportComparison

    return teamA.name.localeCompare(teamB.name, 'pt-BR', {
      sensitivity: 'base',
    })
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sortedTeams.map((team) => {
        const players = getPlayerNames(team)

        return (
          <Link
            key={team._id}
            to="/teams/$id"
            params={{ id: team._id }}
            className="group"
          >
            <Card className="overflow-hidden transition-colors group-hover:bg-muted/30">
              <CardHeader className="border-b border-border/70 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate font-serif text-xl">
                      {team.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        <ShirtIcon className="size-3" />
                        {formatSport(team.sport)}
                      </Badge>
                      <Badge variant="outline">
                        {formatTeamType(team.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-xl bg-background px-3 py-2 text-center">
                    <p className="text-lg font-semibold tabular-nums">
                      {players.length}
                    </p>
                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                      jogadores
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {players.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Nenhum jogador registrado neste time.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/70">
                    {players.map((player) => (
                      <li
                        key={`${team._id}-${player.id}`}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UserIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {player.name}
                          </p>
                          {player.schoolClass ? (
                            <p className="text-xs text-muted-foreground">
                              {player.schoolClass}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function TeamsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Times
        </h1>
        <p className="text-sm text-muted-foreground">
          Veja os times cadastrados, seus jogadores e o esporte de cada equipe.
        </p>
      </div>
      <Suspense fallback={<TeamsSkeleton />}>
        <TeamsList />
      </Suspense>
    </div>
  )
}
