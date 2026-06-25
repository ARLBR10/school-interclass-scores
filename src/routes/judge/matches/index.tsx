import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowRightIcon, CalendarClockIcon, SwordsIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireJudgeMember } from '@/lib/admin-auth'
import { api } from '../../../../convex/_generated/api'

export const Route = createFileRoute('/judge/matches/')({
  component: JudgeMatchesPage,
})

const statusLabels = {
  Scheduled: 'Agendada',
  Started: 'Em andamento',
  Finished: 'Finalizada',
  Canceled: 'Cancelada',
} as const

function formatDate(timestamp: number | undefined) {
  if (!timestamp) return 'Sem horário definido'

  return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function JudgeMatchesPage() {
  const canJudge = useRequireJudgeMember()
  const matches = useQuery(api.matches.getAllWithTeams, canJudge ? {} : 'skip')

  if (!canJudge) return null

  if (matches === undefined) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  const sorted = [...matches].toSorted((a, b) => {
    const order = { Started: 0, Scheduled: 1, Finished: 2, Canceled: 3 }
    const statusDiff = order[a.status] - order[b.status]
    if (statusDiff !== 0) return statusDiff
    return (
      (a.scheduledData ?? Number.MAX_SAFE_INTEGER) -
      (b.scheduledData ?? Number.MAX_SAFE_INTEGER)
    )
  })
  const suggested =
    sorted.find((match) => match.status === 'Started') ??
    sorted.find((match) => match.status === 'Scheduled')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Partidas do juiz
        </h1>
        <p className="text-sm text-muted-foreground">
          Abra uma partida para iniciar, finalizar e registrar eventos.
        </p>
      </div>

      {suggested ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClockIcon className="size-4 text-primary" />
              Sugestão:{' '}
              {suggested.status === 'Started'
                ? 'partida atual'
                : 'próxima partida'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {suggested.teamsData[0]?.name ?? 'Time A'} x{' '}
                {suggested.teamsData[1]?.name ?? 'Time B'}
              </p>
              <p className="text-sm text-muted-foreground">
                {suggested.teamsData[0]?.sport ?? 'Esporte'} -{' '}
                {formatDate(suggested.scheduledData)}
              </p>
            </div>
            <Button asChild>
              <Link to="/judge/matches/$id" params={{ id: suggested._id }}>
                Editar agora
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma partida cadastrada.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((match) => (
            <Card
              key={match._id}
              className="transition-colors hover:bg-muted/30"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <SwordsIcon className="size-4 text-muted-foreground" />
                    {match.teamsData[0]?.sport ?? 'Esporte'}
                  </CardTitle>
                  <Badge
                    variant={match.status === 'Started' ? 'default' : 'outline'}
                  >
                    {statusLabels[match.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    {match.teamsData[0]?.name ?? 'Time A'} x{' '}
                    {match.teamsData[1]?.name ?? 'Time B'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(match.scheduledData)}
                  </p>
                </div>
                <Button asChild className="w-full" variant="secondary">
                  <Link to="/judge/matches/$id" params={{ id: match._id }}>
                    Editar partida
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
