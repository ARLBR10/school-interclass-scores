import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
} from '@/components/reui/timeline'
import {
  ArrowRightIcon,
  FlagIcon,
  CirclePlusIcon,
  CircleMinusIcon,
  ArrowRightLeftIcon,
  ShieldBanIcon,
  CircleDotIcon,
} from 'lucide-react'

import type { Id } from '../../convex/_generated/dataModel'

type PlayerData = {
  _id: Id<'players'>
  name: string
  class: string
  alias: string[]
}

type TeamData = {
  _id: Id<'teams'>
  name: string
  sport: string
  color?: string
  type: 'Feminine' | 'Masculine'
  playersData: PlayerData[]
}

type MatchEvent =
  | {
      type: 'AddScore' | 'RemScore'
      time: number
      team: Id<'teams'>
      score: number
      player?: Id<'players'>
    }
  | {
      type: 'KickedPlayer'
      time: number
      team: Id<'teams'>
      player: Id<'players'>
    }
  | {
      type: 'StartedMatch' | 'FinishedMatch'
      time: number
    }
  | {
      type: 'SwitchPlayers'
      time: number
      team: Id<'teams'>
      players: Id<'players'>[]
    }

function PlayerLink({ id, teams }: { id: Id<'players'>; teams: TeamData[] }) {
  const player = teams.flatMap((t) => t.playersData).find((p) => p._id === id)

  return (
    <a
      href={`/players/${id}`}
      className="font-medium text-foreground underline-offset-4 hover:underline"
    >
      {player?.name ?? 'Jogador'}
    </a>
  )
}

function TeamName({
  teamId,
  teams,
}: {
  teamId: Id<'teams'>
  teams: TeamData[]
}) {
  const team = teams.find((t) => t._id === teamId)
  return (
    <span className="font-medium text-foreground">{team?.name ?? 'Time'}</span>
  )
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'StartedMatch':
    case 'FinishedMatch':
      return <FlagIcon className="size-4 text-primary" />
    case 'AddScore':
      return <CirclePlusIcon className="size-4 text-current" />
    case 'RemScore':
      return <CircleMinusIcon className="size-4 text-current" />
    case 'KickedPlayer':
      return <ShieldBanIcon className="size-4 text-current" />
    case 'SwitchPlayers':
      return <ArrowRightLeftIcon className="size-4 text-current" />
    default:
      return <CircleDotIcon className="size-4 text-muted-foreground" />
  }
}

function getEventTeamColor(event: MatchEvent, teams: TeamData[]) {
  if (isCenterEvent(event)) return undefined

  const teamIndex = teams.findIndex((team) => team._id === event.team)
  const fallback = teamIndex === 0 ? '#14b8a6' : '#a855f7'

  return teams[teamIndex]?.color ?? fallback
}

function eventTypeLabel(type: MatchEvent['type']) {
  switch (type) {
    case 'StartedMatch':
      return 'Início'
    case 'FinishedMatch':
      return 'Fim'
    case 'AddScore':
      return 'Ponto'
    case 'RemScore':
      return 'Ponto anulado'
    case 'KickedPlayer':
      return 'Expulsão'
    case 'SwitchPlayers':
      return 'Troca'
  }
}

function PlayerSeparator() {
  return (
    <span aria-hidden="true" className="mx-1.5 text-muted-foreground">
      /
    </span>
  )
}

function EventLabel({
  event,
  teams,
}: {
  event: MatchEvent
  teams: TeamData[]
}) {
  switch (event.type) {
    case 'StartedMatch':
      return <span>Partida iniciada</span>
    case 'FinishedMatch':
      return <span>Partida finalizada</span>
    case 'AddScore':
      return (
        <span>
          +{event.score} para <TeamName teamId={event.team} teams={teams} />
          {event.player && (
            <>
              <PlayerSeparator />
              <PlayerLink id={event.player} teams={teams} />
            </>
          )}
        </span>
      )
    case 'RemScore':
      return (
        <span>
          -{event.score} para <TeamName teamId={event.team} teams={teams} />
          {event.player && (
            <>
              <PlayerSeparator />
              <PlayerLink id={event.player} teams={teams} />
            </>
          )}
        </span>
      )
    case 'SwitchPlayers':
      return (
        <span>
          <PlayerLink id={event.players[0]} teams={teams} />
          <ArrowRightIcon className="mx-1.5 inline-block size-3.5 align-[-0.125em] text-muted-foreground" />
          <PlayerLink id={event.players[1]} teams={teams} />
        </span>
      )
    case 'KickedPlayer':
      return (
        <span>
          Jogador expulso: <PlayerLink id={event.player} teams={teams} />
        </span>
      )
    default:
      return <span>Evento desconhecido</span>
  }
}

function isCenterEvent(
  event: MatchEvent,
): event is Extract<MatchEvent, { type: 'StartedMatch' | 'FinishedMatch' }> {
  return event.type === 'StartedMatch' || event.type === 'FinishedMatch'
}

function getEventSide(
  event: MatchEvent,
  teams: TeamData[],
): 'center' | 'left' | 'right' {
  if (isCenterEvent(event)) return 'center'

  if (
    event.type === 'AddScore' ||
    event.type === 'RemScore' ||
    event.type === 'KickedPlayer' ||
    event.type === 'SwitchPlayers'
  ) {
    const isFirstTeam = teams[0] ? event.team === teams[0]._id : false
    return isFirstTeam ? 'left' : 'right'
  }

  return 'center'
}

function getTimelineContentClass(side: 'center' | 'left' | 'right') {
  if (side === 'left') {
    return 'ml-auto mr-[calc(50%+2rem)] w-[calc(50%-2rem)] text-right'
  }

  if (side === 'right') {
    return 'ml-[calc(50%+2rem)] w-[calc(50%-2rem)]'
  }

  return 'mx-auto w-fit max-w-sm text-center'
}

function formatEventDate(time: number) {
  return new Date(time * 1000).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CenterEventCard({
  event,
  teams,
}: {
  event: MatchEvent
  teams: TeamData[]
}) {
  return (
    <div className="relative z-10 flex justify-center">
      <div className="flex w-fit max-w-sm items-start gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
          <EventIcon type={event.type} />
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <TimelineDate
            dateTime={new Date(event.time * 1000).toISOString()}
            className="mb-0"
          >
            {formatEventDate(event.time)}
          </TimelineDate>
          <TimelineTitle>{eventTypeLabel(event.type)}</TimelineTitle>
          <div className="text-sm text-muted-foreground">
            <EventLabel event={event} teams={teams} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchTimeline({
  events,
  teams,
  isLoading = false,
}: {
  events?: MatchEvent[]
  teams: TeamData[]
  isLoading?: boolean
}) {
  const sorted = [...(events ?? [])].toSorted((a, b) => a.time - b.time)
  const startEvent = sorted.find((event) => event.type === 'StartedMatch')
  const finishEvent = sorted.find((event) => event.type === 'FinishedMatch')
  const timelineEvents = sorted.filter(
    (event) => event.type !== 'StartedMatch' && event.type !== 'FinishedMatch',
  )

  const isEmpty = !isLoading && events && events.length === 0

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Linha do tempo
      </h3>

      {isLoading ? (
        <div className="flex flex-col gap-4 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex justify-center">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex justify-center">
          <p className="rounded-lg border border-dashed bg-card/60 px-4 py-3 text-sm text-muted-foreground">
            Esta partida ainda não começou.
          </p>
        </div>
      ) : (
        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-border"
          />

          {startEvent ? (
            <CenterEventCard event={startEvent} teams={teams} />
          ) : null}

          {timelineEvents.length > 0 ? (
            <Timeline
              defaultValue={timelineEvents.length}
              className="relative z-10 mx-auto w-full"
            >
              {timelineEvents.map((event, index) => {
                const side = getEventSide(event, teams)
                const teamColor = getEventTeamColor(event, teams)

                return (
                  <TimelineItem
                    key={`${event.time}-${event.type}-${index}`}
                    step={index + 1}
                    className="w-full group-data-[orientation=vertical]/timeline:ms-0 group-data-[orientation=vertical]/timeline:not-last:pb-8"
                  >
                    <TimelineHeader>
                      <TimelineIndicator
                        className="flex size-8 items-center justify-center bg-background group-data-[orientation=vertical]/timeline:left-1/2 group-data-[orientation=vertical]/timeline:-translate-x-1/2"
                        style={
                          teamColor
                            ? {
                                borderColor: teamColor,
                                color: teamColor,
                              }
                            : undefined
                        }
                      >
                        <EventIcon type={event.type} />
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent
                      className={cn(
                        'rounded-lg border bg-card p-3 text-card-foreground shadow-sm',
                        getTimelineContentClass(side),
                      )}
                    >
                      <TimelineDate
                        dateTime={new Date(event.time * 1000).toISOString()}
                        className="mb-1"
                      >
                        {formatEventDate(event.time)}
                      </TimelineDate>
                      <TimelineTitle className="mb-1">
                        {eventTypeLabel(event.type)}
                      </TimelineTitle>
                      <div className="text-sm text-muted-foreground">
                        <EventLabel event={event} teams={teams} />
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </Timeline>
          ) : null}

          {finishEvent ? (
            <CenterEventCard event={finishEvent} teams={teams} />
          ) : null}
        </div>
      )}
    </div>
  )
}
