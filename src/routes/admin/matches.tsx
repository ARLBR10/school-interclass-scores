import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState, type ReactNode } from 'react'
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { requireAdminMember, useRequireAdminMember } from '@/lib/admin-auth'
import { formatSport } from '@/lib/sports'
import { UploadIcon } from 'lucide-react'
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

type ParsedMatchImport = {
  teamA: Id<'teams'>
  teamB: Id<'teams'>
  scheduledData?: number
}

type MatchImportJsonItem = {
  teamA?: unknown
  teamB?: unknown
  teams?: unknown
  scheduledAt?: unknown
  scheduledData?: unknown
  date?: unknown
}

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

function parseImportDate(value: unknown, itemLabel: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value)
  }

  if (typeof value !== 'string') {
    if (value === undefined || value === null) return undefined
    throw new Error(`${itemLabel}: data inválida.`)
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) return undefined

  const brazilianDateMatch = normalizedValue.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  )

  if (brazilianDateMatch) {
    const [, day, month, year, hour = '0', minute = '0'] = brazilianDateMatch
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    )

    if (!Number.isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000)
    }
  }

  const parsedDate = new Date(normalizedValue)

  if (!Number.isNaN(parsedDate.getTime())) {
    return Math.floor(parsedDate.getTime() / 1000)
  }

  throw new Error(`${itemLabel}: data inválida.`)
}

function getTeamOptions(teams: Doc<'teams'>[] | undefined) {
  return (teams ?? []).map((team) => ({
    value: team._id,
    label: `${team.name} - ${formatSport(team.sport)} (${team.type === 'Feminine' ? 'Fem.' : 'Masc.'})`,
  }))
}

function normalizeImportToken(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function resolveImportedTeam(
  teams: Doc<'teams'>[],
  teamOptions: AdminTableSelectOption[],
  value: unknown,
  itemLabel: string,
) {
  if (typeof value !== 'string') {
    throw new Error(`${itemLabel}: informe os dois times como texto.`)
  }

  const normalizedValue = normalizeImportToken(value)

  if (!normalizedValue) {
    throw new Error(`${itemLabel}: informe os dois times.`)
  }

  const directMatch = teams.find((team) => team._id === value.trim())
  if (directMatch) return directMatch._id

  const nameMatches = teams.filter(
    (team) => normalizeImportToken(team.name) === normalizedValue,
  )

  if (nameMatches.length === 1) return nameMatches[0]._id

  const labelMatches = teamOptions.filter(
    (option) => normalizeImportToken(option.label) === normalizedValue,
  )

  if (labelMatches.length === 1) return labelMatches[0].value as Id<'teams'>

  if (nameMatches.length > 1 || labelMatches.length > 1) {
    throw new Error(`${itemLabel}: time "${value}" é ambíguo.`)
  }

  throw new Error(`${itemLabel}: time "${value}" não encontrado.`)
}

function getJsonImportItems(value: string) {
  const parsedJson: unknown = JSON.parse(value)

  if (Array.isArray(parsedJson)) {
    return parsedJson
  }

  if (
    parsedJson &&
    typeof parsedJson === 'object' &&
    'matches' in parsedJson &&
    Array.isArray(parsedJson.matches)
  ) {
    return parsedJson.matches
  }

  throw new Error('O JSON deve ser um array ou um objeto com "matches".')
}

function parseMatchImport(
  value: string,
  teams: Doc<'teams'>[],
  teamOptions: AdminTableSelectOption[],
) {
  const parsedMatches: ParsedMatchImport[] = []
  const items = getJsonImportItems(value)

  for (const [index, item] of items.entries()) {
    const itemLabel = `Item ${index + 1}`

    if (!item || typeof item !== 'object') {
      throw new Error(`${itemLabel}: use um objeto JSON.`)
    }

    const match = item as MatchImportJsonItem
    const teamsValue = Array.isArray(match.teams) ? match.teams : undefined
    const teamAValue = match.teamA ?? teamsValue?.[0]
    const teamBValue = match.teamB ?? teamsValue?.[1]
    const dateValue = match.scheduledAt ?? match.scheduledData ?? match.date

    const teamA = resolveImportedTeam(
      teams,
      teamOptions,
      teamAValue,
      itemLabel,
    )
    const teamB = resolveImportedTeam(
      teams,
      teamOptions,
      teamBValue,
      itemLabel,
    )

    if (teamA === teamB) {
      throw new Error(`${itemLabel}: selecione dois times diferentes.`)
    }

    parsedMatches.push({
      teamA,
      teamB,
      scheduledData: parseImportDate(dateValue, itemLabel),
    })
  }

  return parsedMatches
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
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
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

  async function handleMassImport() {
    if (!teamsData) {
      toast.error('Aguarde o carregamento dos times.')
      return
    }

    let parsedMatches: ParsedMatchImport[]

    try {
      parsedMatches = parseMatchImport(importText, teamsData, teamOptions)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível ler a importação.',
      )
      return
    }

    if (parsedMatches.length === 0) {
      toast.error('Cole pelo menos uma partida em JSON para importar.')
      return
    }

    try {
      for (const match of parsedMatches) {
        await createOrEditMatch({
          teams: [match.teamA, match.teamB],
          scheduledData: match.scheduledData,
          status: 'Scheduled',
          events: [],
        })
      }

      toast.success(`${parsedMatches.length} partidas importadas com sucesso.`)
      setImportText('')
      setIsImportOpen(false)
    } catch {
      toast.error('Não foi possível importar as partidas.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AlertDialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline">
              <UploadIcon className="size-4" />
              Importar em massa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="flex max-h-[90vh] max-w-[min(92vw,56rem)] grid-rows-none flex-col gap-0 p-0">
            <AlertDialogHeader className="shrink-0 border-b p-6 text-left">
              <AlertDialogTitle>Importação em massa</AlertDialogTitle>
              <AlertDialogDescription>
                Cole um array JSON de partidas. Use nome exato do time, ID, ou o
                rótulo exibido no seletor.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
              <Textarea
                value={importText}
                className="max-h-[50vh] min-h-64 resize-y font-mono text-xs"
                placeholder={`[
  {
    "teamA": "1A Masculino",
    "teamB": "2B Masculino",
    "scheduledAt": "25/06/2026 14:30"
  },
  {
    "teams": ["1A Feminino", "2B Feminino"],
    "scheduledAt": "2026-06-25 15:30"
  }
]`}
                onChange={(event) => setImportText(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Campos aceitos: <code>teamA</code>, <code>teamB</code>,{' '}
                <code>teams</code>, <code>scheduledAt</code>,{' '}
                <code>scheduledData</code> ou <code>date</code>.
              </p>
            </div>

            <AlertDialogFooter className="shrink-0 border-t p-6">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button type="button" onClick={handleMassImport}>
                Importar partidas
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
    </div>
  )
}
