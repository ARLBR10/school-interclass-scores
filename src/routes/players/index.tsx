import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { DumbbellIcon, UserIcon, UsersIcon } from 'lucide-react'
import { Suspense } from 'react'

import { api } from '../../../convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/players/')({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.members.getPublicPlayers, {}),
    )
  },
  component: PlayersPage,
})

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatInstagram(instagram?: string) {
  if (!instagram) return null

  const username = instagram
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^(@\s*)+/, '')
    .replace(/\/.*$/, '')
    .trim()
  if (!username) return null

  return {
    label: `@${username}`,
    url: `https://instagram.com/${username}`,
  }
}

function PlayersSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_player, index) => (
        <Card key={index}>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PlayersList() {
  const { data: players } = useSuspenseQuery(
    convexQuery(api.members.getPublicPlayers, {}),
  )

  if (players.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-2">
          <UsersIcon className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Nenhum jogador encontrado
          </h2>
          <p className="text-sm text-muted-foreground">
            Os jogadores aparecerão aqui quando forem cadastrados.
          </p>
        </div>
      </div>
    )
  }

  const sortedPlayers = [...players].toSorted((playerA, playerB) =>
    playerA.name.localeCompare(playerB.name, 'pt-BR', { sensitivity: 'base' }),
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sortedPlayers.map((player) => {
        const instagram = formatInstagram(player.player.socialMedias?.Instagram)
        const hasAlias = Boolean(player.player.alias?.length)
        const hasMeta = Boolean(
          player.player.height || player.player.weight || instagram,
        )

        return (
          <Link
            key={player._id}
            to="/players/$id"
            params={{ id: player._id }}
            className="group self-start"
          >
            <Card className="gap-0 overflow-hidden py-0 transition-colors group-hover:bg-muted/30">
              <CardHeader
                className={cn(
                  'flex-row items-center gap-3 space-y-0 bg-muted/20 p-4',
                  (hasAlias || hasMeta) && 'border-b border-border/70',
                )}
              >
                <Avatar className="size-12">
                  {player.player.photo ? (
                    <AvatarImage src={player.player.photo} alt={player.name} />
                  ) : null}
                  <AvatarFallback>
                    {initials(player.name) || <UserIcon />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <CardTitle className="truncate font-serif text-xl leading-tight">
                    {player.name}
                  </CardTitle>
                  {player.schoolClass ? (
                    <p className="text-sm leading-none text-muted-foreground">
                      {player.schoolClass}
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              {hasAlias || hasMeta ? (
                <CardContent className="space-y-2.5 p-4">
                  {hasAlias ? (
                    <div className="flex flex-wrap gap-2">
                      {player.player.alias?.map((alias) => (
                        <Badge key={alias} variant="secondary">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {hasMeta ? (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {player.player.height ? (
                        <span>{player.player.height}</span>
                      ) : null}
                      {player.player.weight ? (
                        <span className="inline-flex items-center gap-1">
                          <DumbbellIcon className="size-3" />
                          {player.player.weight}
                        </span>
                      ) : null}
                      {instagram ? <span>{instagram.label}</span> : null}
                    </div>
                  ) : null}
                </CardContent>
              ) : null}
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function PlayersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Jogadores
        </h1>
        <p className="text-sm text-muted-foreground">
          Veja os jogadores cadastrados e acesse os detalhes públicos de cada
          atleta.
        </p>
      </div>
      <Suspense fallback={<PlayersSkeleton />}>
        <PlayersList />
      </Suspense>
    </div>
  )
}
