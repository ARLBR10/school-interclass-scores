import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  DumbbellIcon,
  RulerIcon,
  ShirtIcon,
  UserIcon,
} from 'lucide-react'
import { Suspense } from 'react'
import type { ReactNode } from 'react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSport } from '@/lib/sports'

export const Route = createFileRoute('/players/$id')({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.members.getPublicPlayer, {
        id: params.id as Id<'members'>,
      }),
    )
  },
  component: PlayerDetailPage,
})

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatTeamType(type: 'Feminine' | 'Masculine') {
  return type === 'Feminine' ? 'Feminino' : 'Masculino'
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

function MissingValue() {
  return <span className="text-muted-foreground">-</span>
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string
  value?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-base font-medium text-foreground">
        {value || <MissingValue />}
      </div>
    </div>
  )
}

function PlayerDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-36" />
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_item, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function PlayerDetail() {
  const { id } = Route.useParams()
  const { data: player } = useSuspenseQuery(
    convexQuery(api.members.getPublicPlayer, {
      id: id as Id<'members'>,
    }),
  )

  if (!player) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            404
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Jogador não encontrado
            </h1>
            <p className="text-sm text-muted-foreground">
              Este perfil não existe, foi removido ou não é um jogador público.
            </p>
          </div>
          <Button asChild>
            <Link to="/players">Voltar aos jogadores</Link>
          </Button>
        </div>
      </div>
    )
  }

  const instagram = formatInstagram(player.player.socialMedias?.Instagram)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/players">
          <ArrowLeftIcon className="size-4" />
          Voltar aos jogadores
        </Link>
      </Button>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b border-border/70 bg-muted/20 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Avatar className="size-24">
              {player.player.photo ? (
                <AvatarImage src={player.player.photo} alt={player.name} />
              ) : null}
              <AvatarFallback className="text-xl">
                {initials(player.name) || <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="font-serif text-3xl leading-tight">
                {player.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {player.schoolClass ? (
                  <Badge variant="outline">{player.schoolClass}</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    -
                  </Badge>
                )}
                {player.player.alias?.map((alias) => (
                  <Badge key={alias} variant="secondary">
                    {alias}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Turma" value={player.schoolClass} />
            <DetailItem
              label="Apelidos"
              value={
                player.player.alias?.length
                  ? player.player.alias.join(', ')
                  : undefined
              }
            />
            <DetailItem
              label="Idade"
              value={
                player.player.age ? `${player.player.age} anos` : undefined
              }
              icon={<UserIcon className="size-3" />}
            />
            <DetailItem
              label="Altura"
              value={player.player.height}
              icon={<RulerIcon className="size-3" />}
            />
            <DetailItem
              label="Peso"
              value={player.player.weight}
              icon={<DumbbellIcon className="size-3" />}
            />
            <DetailItem
              label="Instagram"
              value={
                instagram ? (
                  <a
                    href={instagram.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {instagram.label}
                  </a>
                ) : undefined
              }
            />
            <DetailItem
              label="Foto"
              value={
                player.player.photo ? (
                  <a
                    href={player.player.photo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Ver foto
                  </a>
                ) : undefined
              }
            />
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Times
            </h2>
            {player.teamsData.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {player.teamsData.map((team) => (
                  <Link
                    key={team._id}
                    to="/teams/$id"
                    params={{ id: team._id }}
                    className="rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {team.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatSport(team.sport)} ·{' '}
                          {formatTeamType(team.type)}
                        </p>
                      </div>
                      <ShirtIcon className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-muted/15 p-4 font-medium text-muted-foreground">
                -
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PlayerDetailPage() {
  return (
    <Suspense fallback={<PlayerDetailSkeleton />}>
      <PlayerDetail />
    </Suspense>
  )
}
