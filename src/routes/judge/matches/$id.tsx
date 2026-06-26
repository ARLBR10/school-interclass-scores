import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeftIcon, MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireJudgeMember } from '@/lib/admin-auth'
import { formatSport } from '@/lib/sports'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/judge/matches/$id')({
  head: () => ({
    meta: [
      { title: 'Editar partida - Interclasse AACSA' },
      {
        name: 'description',
        content: 'Painel de edição de partida para juízes.',
      },
    ],
  }),
  component: JudgeMatchEditPage,
})

type EventType = 'AddScore' | 'RemScore' | 'KickedPlayer' | 'SwitchPlayers'

const noMemberValue = '__no_member__'
const noSubstitutionMemberValue = '__no_substitution_member__'

const statusLabels = {
  Scheduled: 'Agendada',
  Started: 'Em andamento',
  Finished: 'Finalizada',
  Canceled: 'Cancelada',
} as const

function computeScore(match: Doc<'matches'>, teamId: Id<'teams'>) {
  let score = 0

  for (const event of match.events) {
    if (event.type === 'AddScore' && event.team === teamId) {
      score += event.score
    }

    if (event.type === 'RemScore' && event.team === teamId) {
      score -= event.score
    }
  }

  return Math.max(0, score)
}

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function describeEvent(
  event: Doc<'matches'>['events'][number],
  teamsById: Map<string, string>,
) {
  switch (event.type) {
    case 'StartedMatch':
      return 'Partida iniciada'
    case 'FinishedMatch':
      return 'Partida finalizada'
    case 'AddScore':
      return `+${event.score} para ${teamsById.get(event.team) ?? 'Time'}`
    case 'RemScore':
      return `-${event.score} para ${teamsById.get(event.team) ?? 'Time'}`
    case 'KickedPlayer':
      return `Expulsão em ${teamsById.get(event.team) ?? 'Time'}${event.player ? `: ${event.player}` : ''}`
    case 'SwitchPlayers':
      return `Troca em ${teamsById.get(event.team) ?? 'Time'}${event.players?.length ? `: ${event.players.join(', ')}` : ''}`
  }
}

function JudgeMatchEditPage() {
  const { id } = Route.useParams()
  const canJudge = useRequireJudgeMember()
  const match = useQuery(
    api.matches.getWithDetails,
    canJudge ? { ID: id as Id<'matches'> } : 'skip',
  )
  const updateStatus = useMutation(api.matches.updateStatus)
  const addEvent = useMutation(api.matches.addEvent)
  const removeEvent = useMutation(api.matches.removeEvent)
  const [eventType, setEventType] = useState<EventType>('AddScore')
  const [teamId, setTeamId] = useState<string>('')
  const [score, setScore] = useState('1')
  const [memberId, setMemberId] = useState(noMemberValue)
  const [playerOutId, setPlayerOutId] = useState(noSubstitutionMemberValue)
  const [playerInId, setPlayerInId] = useState(noSubstitutionMemberValue)

  if (!canJudge) return null

  if (match === undefined) {
    return <Skeleton className="h-96 rounded-xl" />
  }

  if (!match) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">Partida não encontrada.</p>
        <Button asChild variant="link">
          <Link to="/judge/matches">Voltar</Link>
        </Button>
      </div>
    )
  }

  const teamsData = match.teamsData.filter((team) => team !== null)
  const selectedTeam = teamId || teamsData[0]?._id
  const teamsById = new Map(teamsData.map((team) => [team._id, team.name]))
  const members =
    teamsData
      .find((team) => team._id === selectedTeam)
      ?.membersData.filter((member) => member !== null) ?? []
  const team0 = teamsData[0]
  const team1 = teamsData[1]
  const score0 = team0 ? computeScore(match, team0._id) : 0
  const score1 = team1 ? computeScore(match, team1._id) : 0

  async function handleStatus(status: Doc<'matches'>['status']) {
    try {
      const updated = await updateStatus({ MatchID: match!._id, status })
      if (!updated) throw new Error('not-updated')
      toast.success('Status da partida atualizado.')
    } catch {
      toast.error('Não foi possível atualizar o status.')
    }
  }

  async function handleAddEvent() {
    const parsedScore = Number(score)
    const now = Date.now() / 1000
    const normalizedMember =
      memberId === noMemberValue ? undefined : (memberId as Id<'members'>)

    if (!selectedTeam) {
      toast.error('Esta partida não tem time válido para registrar eventos.')
      return
    }

    try {
      if (eventType === 'AddScore' || eventType === 'RemScore') {
        if (!Number.isFinite(parsedScore) || parsedScore <= 0) {
          toast.error('Informe uma pontuação válida.')
          return
        }

        const created = await addEvent({
          MatchID: match!._id,
          event: {
            type: eventType,
            time: now,
            team: selectedTeam as Id<'teams'>,
            score: parsedScore,
            ...(normalizedMember ? { member: normalizedMember } : {}),
          },
        })
        if (!created) throw new Error('not-created')
      } else if (eventType === 'KickedPlayer') {
        const expelledMember = members.find(
          (member) => member._id === normalizedMember,
        )

        if (!expelledMember) {
          toast.error('Selecione o atleta expulso.')
          return
        }

        const created = await addEvent({
          MatchID: match!._id,
          event: {
            type: 'KickedPlayer',
            time: now,
            team: selectedTeam as Id<'teams'>,
            member: expelledMember._id,
            player: expelledMember.name,
          },
        })
        if (!created) throw new Error('not-created')
      } else {
        const playerOut = members.find((member) => member._id === playerOutId)
        const playerIn = members.find((member) => member._id === playerInId)

        if (!playerOut || !playerIn) {
          toast.error('Informe quem saiu e quem entrou.')
          return
        }

        if (playerOut._id === playerIn._id) {
          toast.error('Selecione atletas diferentes para a troca.')
          return
        }

        const created = await addEvent({
          MatchID: match!._id,
          event: {
            type: 'SwitchPlayers',
            time: now,
            team: selectedTeam as Id<'teams'>,
            players: [`Saiu: ${playerOut.name}`, `Entrou: ${playerIn.name}`],
            members: [playerOut._id, playerIn._id],
          },
        })
        if (!created) throw new Error('not-created')
      }

      setPlayerOutId(noSubstitutionMemberValue)
      setPlayerInId(noSubstitutionMemberValue)
      toast.success('Evento registrado.')
    } catch {
      toast.error('Não foi possível registrar o evento.')
    }
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/judge/matches">
          <ArrowLeftIcon className="size-4" />
          Voltar às partidas
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-serif text-2xl">
                {team0?.name ?? 'Time A'} x {team1?.name ?? 'Time B'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatSport(team0?.sport)} -{' '}
                {match.scheduledData
                  ? new Date(match.scheduledData * 1000).toLocaleString('pt-BR')
                  : 'Sem horário'}
              </p>
            </div>
            <Badge>{statusLabels[match.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <p className="truncate text-lg font-semibold">
              {team0?.name ?? 'Time A'}
            </p>
            <div className="rounded-2xl bg-muted px-5 py-3 text-3xl font-bold tabular-nums">
              {score0} x {score1}
            </div>
            <p className="truncate text-lg font-semibold">
              {team1?.name ?? 'Time B'}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              disabled={match.status === 'Started'}
              onClick={() => handleStatus('Started')}
            >
              Iniciar partida
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={match.status === 'Finished'}
              onClick={() => handleStatus('Finished')}
            >
              Finalizar partida
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatus('Canceled')}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar evento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={eventType}
              onValueChange={(value) => setEventType(value as EventType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AddScore">Adicionar ponto</SelectItem>
                <SelectItem value="RemScore">Remover ponto</SelectItem>
                <SelectItem value="KickedPlayer">Expulsão</SelectItem>
                <SelectItem value="SwitchPlayers">Troca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Select
              value={selectedTeam ?? ''}
              onValueChange={(nextTeamId) => {
                setTeamId(nextTeamId)
                setMemberId(noMemberValue)
                setPlayerOutId(noSubstitutionMemberValue)
                setPlayerInId(noSubstitutionMemberValue)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamsData.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(eventType === 'AddScore' || eventType === 'RemScore') && (
            <div className="space-y-2">
              <Label>Pontos</Label>
              <Input
                value={score}
                type="number"
                min="1"
                onChange={(event) => setScore(event.target.value)}
              />
            </div>
          )}

          {(eventType === 'AddScore' ||
            eventType === 'RemScore' ||
            eventType === 'KickedPlayer') && (
            <div className="space-y-2">
              <Label>
                {eventType === 'KickedPlayer'
                  ? 'Atleta expulso'
                  : 'Atleta (opcional)'}
              </Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      eventType === 'KickedPlayer'
                        ? 'Selecione o atleta'
                        : 'Opcional'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={noMemberValue}>
                    {eventType === 'KickedPlayer'
                      ? 'Selecione o atleta'
                      : 'Sem atleta'}
                  </SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {eventType === 'SwitchPlayers' ? (
            <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Quem saiu</Label>
                <Select value={playerOutId} onValueChange={setPlayerOutId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noSubstitutionMemberValue}>
                      Selecione o atleta
                    </SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quem entrou</Label>
                <Select value={playerInId} onValueChange={setPlayerInId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noSubstitutionMemberValue}>
                      Selecione o atleta
                    </SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            className="lg:col-span-4"
            disabled={!selectedTeam}
            onClick={handleAddEvent}
          >
            {eventType === 'RemScore' ? (
              <MinusIcon className="size-4" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Registrar evento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos da partida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {match.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado.
            </p>
          ) : (
            match.events.map((event, index) => (
              <div
                key={`${event.type}-${event.time}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
              >
                <div>
                  <p className="font-medium">
                    {describeEvent(event, teamsById)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(event.time)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      const removed = await removeEvent({
                        MatchID: match._id,
                        eventIndex: index,
                      })
                      if (!removed) throw new Error('not-removed')
                      toast.success('Evento removido.')
                    } catch {
                      toast.error('Não foi possível remover o evento.')
                    }
                  }}
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Remover evento</span>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
