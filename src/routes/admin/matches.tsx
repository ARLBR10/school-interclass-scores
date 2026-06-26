import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import {
  DynamicTable,
  type AdminTableColumn,
  type AdminTableSelectOption,
} from '@/components/admin/DynamicTable'
import {
  createDateColumn,
  createSelectColumn,
} from '@/components/admin/DynamicTableFields'
import { requireAdminMember, useRequireAdminMember } from '@/lib/admin-auth'
import { formatSport } from '@/lib/sports'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

type MatchStatus = Doc<'matches'>['status']

type MatchRow = {
  [key: string]: ReactNode
  _id: Id<'matches'>
  _creationTime: number
  sport?: string
  teamA?: Id<'teams'>
  teamB?: Id<'teams'>
  scheduledData?: number
  status: MatchStatus
}

type MatchWithTeams = Doc<'matches'> & {
  teamsData: Array<Doc<'teams'> | null>
}

const statusOptions: AdminTableSelectOption[] = [
  { value: 'Scheduled', label: 'Agendada' },
  { value: 'Started', label: 'Em andamento' },
  { value: 'Finished', label: 'Finalizada' },
  { value: 'Canceled', label: 'Cancelada' },
]

export const Route = createFileRoute('/admin/matches')({
  beforeLoad: requireAdminMember,
  head: () => ({
    meta: [
      { title: 'Partidas - Interclasse AACSA' },
      { name: 'description', content: 'Gerencie partidas do interclasse.' },
    ],
  }),
  component: AdminMatchesPage,
})

function normalizeTimestamp(value: string | undefined) {
  if (!value) return undefined

  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) return undefined

  return Math.floor(timestamp / 1000)
}

function getTeamOptions(teams: Doc<'teams'>[] | undefined) {
  return (teams ?? []).map((team) => ({
    value: team._id,
    label: `${team.name} - ${formatSport(team.sport)} (${team.type === 'Feminine' ? 'Fem.' : 'Masc.'})`,
  }))
}

function getMatchRows(matches: MatchWithTeams[] | undefined): MatchRow[] {
  return (matches ?? []).map((match) => ({
    _id: match._id,
    _creationTime: match._creationTime,
    sport: formatSport(match.teamsData[0]?.sport),
    teamA: match.teams[0],
    teamB: match.teams[1],
    scheduledData: match.scheduledData ? match.scheduledData * 1000 : undefined,
    status: match.status,
  }))
}

function getMatchColumns(
  teamOptions: AdminTableSelectOption[],
): AdminTableColumn<MatchRow>[] {
  return [
    { key: 'sport', label: 'Esporte', showInForm: false },
    createSelectColumn({
      key: 'teamA',
      label: 'Time A',
      options: teamOptions,
      placeholder: 'Selecione o time A',
    }),
    createSelectColumn({
      key: 'teamB',
      label: 'Time B',
      options: teamOptions,
      placeholder: 'Selecione o time B',
    }),
    createDateColumn({ key: 'scheduledData', label: 'Data' }),
    createSelectColumn({
      key: 'status',
      label: 'Status',
      options: statusOptions,
      placeholder: 'Selecione o status',
    }),
  ]
}

function AdminMatchesPage() {
  const isAdmin = useRequireAdminMember()
  const matchesData = useQuery(
    api.matches.getAllWithTeams,
    isAdmin ? {} : 'skip',
  )
  const teamsData = useQuery(api.teams.getAll, isAdmin ? {} : 'skip')
  const createOrEditMatch = useMutation(api.matches.createOrEdit)
  const deleteMatch = useMutation(api.matches.purge)

  if (!isAdmin) {
    return null
  }

  const teamOptions = getTeamOptions(teamsData ?? undefined)

  return (
    <DynamicTable<MatchRow>
      columns={getMatchColumns(teamOptions)}
      data={getMatchRows(matchesData)}
      isLoading={matchesData === undefined || teamsData === undefined}
      rowKey="_id"
      searchParamKey="_id"
      onCreate={async (values) => {
        const teamA = values.teamA as Id<'teams'> | undefined
        const teamB = values.teamB as Id<'teams'> | undefined

        if (!teamA || !teamB || teamA === teamB) {
          toast.error('Selecione dois times diferentes.')
          return false
        }

        try {
          await createOrEditMatch({
            teams: [teamA, teamB],
            scheduledData: normalizeTimestamp(values.scheduledData),
            status: (values.status as MatchStatus | undefined) ?? 'Scheduled',
            events: [],
          })
          toast.success('Partida criada com sucesso.')
          return true
        } catch {
          toast.error('Não foi possível criar a partida.')
          return false
        }
      }}
      onUpdate={async (match, values) => {
        const teamA = (values.teamA as Id<'teams'> | undefined) ?? match.teamA
        const teamB = (values.teamB as Id<'teams'> | undefined) ?? match.teamB

        if (!teamA || !teamB || teamA === teamB) {
          toast.error('Selecione dois times diferentes.')
          return false
        }

        const currentMatch = matchesData?.find((item) => item._id === match._id)

        try {
          await createOrEditMatch({
            MatchID: match._id,
            teams: [teamA, teamB],
            scheduledData:
              normalizeTimestamp(values.scheduledData) ??
              currentMatch?.scheduledData,
            status: (values.status as MatchStatus | undefined) ?? match.status,
            events: currentMatch?.events ?? [],
          })
          toast.success('Partida atualizada com sucesso.')
          return true
        } catch {
          toast.error('Não foi possível atualizar a partida.')
          return false
        }
      }}
      onDelete={async (match) => {
        try {
          const deleted = await deleteMatch({ MatchID: match._id })

          if (deleted) {
            toast.success('Partida excluída com sucesso.')
            return true
          }

          toast.error('Não foi possível excluir a partida.')
          return false
        } catch {
          toast.error('Não foi possível excluir a partida.')
          return false
        }
      }}
    />
  )
}
