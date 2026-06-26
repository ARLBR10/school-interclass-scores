import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  DynamicTable,
  type AdminTableColumn,
  type AdminTableSelectOption,
} from '@/components/admin/DynamicTable'
import { createSelectColumn } from '@/components/admin/DynamicTableFields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { requireAdminMember, useRequireAdminMember } from '@/lib/admin-auth'
import { formatSport } from '@/lib/sports'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

type TeamType = Doc<'teams'>['type']

type TeamWithMembers = Doc<'teams'> & {
  membersData: Doc<'members'>[]
}

type TeamRow = {
  [key: string]: ReactNode
  _id: Id<'teams'>
  _creationTime: number
  name: string
  sport: string
  type: TeamType
  color?: string
  membersList: string
  membersSummary: string
  playersList: string
  playersCount: number
}

const teamTypeOptions: AdminTableSelectOption[] = [
  { value: 'Feminine', label: 'Feminino' },
  { value: 'Masculine', label: 'Masculino' },
]

export const Route = createFileRoute('/admin/teams')({
  beforeLoad: requireAdminMember,
  head: () => ({
    meta: [
      { title: 'Times - Interclasse AACSA' },
      { name: 'description', content: 'Gerencie times e jogadores.' },
    ],
  }),
  component: AdminTeamsPage,
})

function normalizeOptionalString(value: string | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  return trimmedValue
}

function normalizeTeamType(value: string | undefined): TeamType | undefined {
  if (value === 'Feminine' || value === 'Masculine') {
    return value
  }

  return undefined
}

function splitList(value: string | undefined) {
  return (value ?? '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitMemberRows(value: string | undefined) {
  if (!value) return ['']

  return value.split('\n')
}

function normalizeToken(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function getMemberLabel(member: Doc<'members'>) {
  return `${member.name}${member.schoolClass ? ` - ${member.schoolClass}` : ''}${member.tuitionId ? ` (${member.tuitionId})` : ''}`
}

function resolveMemberId(members: Doc<'members'>[], token: string) {
  const directMatch = members.find((member) => member._id === token)
  if (directMatch) return directMatch._id

  const normalizedToken = normalizeToken(token)
  const matches = members.filter((member) => {
    return (
      normalizeToken(member.name) === normalizedToken ||
      normalizeToken(getMemberLabel(member)) === normalizedToken ||
      (member.tuitionId
        ? normalizeToken(member.tuitionId) === normalizedToken
        : false)
    )
  })

  if (matches.length === 1) return matches[0]._id

  if (matches.length > 1) {
    throw new Error(`Membro "${token}" é ambíguo.`)
  }

  throw new Error(`Membro "${token}" não encontrado.`)
}

function parseMembers(value: string | undefined, members: Doc<'members'>[]) {
  const memberIds: Id<'members'>[] = []
  const seenMemberIds = new Set<Id<'members'>>()

  for (const token of splitList(value)) {
    const memberId = resolveMemberId(members, token)

    if (!seenMemberIds.has(memberId)) {
      memberIds.push(memberId)
      seenMemberIds.add(memberId)
    }
  }

  return memberIds.length > 0 ? memberIds : undefined
}

function parsePlayers(value: string | undefined) {
  const players = splitList(value)
  return players.length > 0 ? players : undefined
}

function toTeamRows(teams: TeamWithMembers[] | undefined): TeamRow[] {
  return (teams ?? [])
    .map((team) => {
      const memberNames = team.membersData.map((member) =>
        getMemberLabel(member),
      )
      const players = team.players ?? []

      return {
        _id: team._id,
        _creationTime: team._creationTime,
        name: team.name,
        sport: team.sport,
        type: team.type,
        color: team.color,
        membersList: (team.members ?? []).join('\n'),
        membersSummary: memberNames.join(', '),
        playersList: players.join('\n'),
        playersCount: memberNames.length + players.length,
      }
    })
    .toSorted((teamA, teamB) => {
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
}

function MemberSearchSelect({
  options,
  value,
  onChange,
}: {
  options: AdminTableSelectOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selectedOption = options.find((option) => option.value === value)
  const normalizedSearch = normalizeToken(search)
  const filteredOptions = normalizedSearch
    ? options.filter((option) =>
        normalizeToken(option.label).includes(normalizedSearch),
      )
    : options

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen)

        if (!nextOpen) {
          setSearch('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full justify-between rounded-md border-input bg-background px-3 font-normal shadow-sm"
        >
          <span className="min-w-0 truncate text-left">
            {selectedOption?.label ?? 'Selecione um membro'}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(30rem,90vw)] gap-2 rounded-2xl p-2"
      >
        <Input
          value={search}
          placeholder="Buscar membro..."
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="max-h-64 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              Nenhum membro encontrado.
            </p>
          ) : (
            filteredOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                disabled={option.disabled}
                className="h-auto min-h-9 w-full justify-start gap-2 rounded-xl px-2 py-2 text-left font-normal whitespace-normal"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setSearch('')
                }}
              >
                <CheckIcon
                  className={
                    option.value === value
                      ? 'size-4 shrink-0 opacity-100'
                      : 'size-4 shrink-0 opacity-0'
                  }
                />
                <span>{option.label}</span>
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MembersSelectListInput({
  options,
  value,
  onChange,
}: {
  options: AdminTableSelectOption[]
  value: string
  onChange: (value: string) => void
}) {
  const rows = splitMemberRows(value)

  function updateRows(nextRows: string[]) {
    onChange(nextRows.filter(Boolean).join('\n'))
  }

  function updateRow(index: number, nextValue: string) {
    const nextRows = [...rows]
    nextRows[index] = nextValue
    updateRows(nextRows)
  }

  function removeRow(index: number) {
    updateRows(rows.filter((_row, rowIndex) => rowIndex !== index))
  }

  function addRow() {
    onChange([...rows, ''].join('\n'))
  }

  return (
    <div className="space-y-2">
      {rows.map((rowValue, index) => {
        const selectedInOtherRows = new Set(
          rows.filter(
            (currentValue, rowIndex) => currentValue && rowIndex !== index,
          ),
        )
        const rowOptions = options.map((option) => ({
          ...option,
          disabled: selectedInOtherRows.has(option.value),
        }))

        return (
          <div key={index} className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <MemberSearchSelect
                options={rowOptions}
                value={rowValue}
                onChange={(nextValue) => updateRow(index, nextValue)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Remover membro"
              onClick={() => removeRow(index)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addRow}
      >
        <PlusIcon className="size-4" />
        Adicionar membro
      </Button>
    </div>
  )
}

function MultilineInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <Textarea
      value={value}
      className="min-h-32 resize-y"
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function getTeamColumns(
  memberOptions: AdminTableSelectOption[],
): AdminTableColumn<TeamRow>[] {
  return [
    { key: 'name', label: 'Nome' },
    {
      key: 'sport',
      label: 'Esporte',
      render: (row) => formatSport(row.sport),
    },
    createSelectColumn({
      key: 'type',
      label: 'Categoria',
      options: teamTypeOptions,
      placeholder: 'Selecione a categoria',
    }),
    { key: 'color', label: 'Cor', hiddenByDefault: true },
    {
      key: 'membersList',
      label: 'Membros cadastrados',
      showInTable: false,
      formRender: ({ value, onChange }) => (
        <MembersSelectListInput
          options={memberOptions}
          value={value}
          onChange={onChange}
        />
      ),
    },
    {
      key: 'membersSummary',
      label: 'Membros',
      showInForm: false,
      render: (row) => row.membersSummary || '-',
    },
    {
      key: 'playersList',
      label: 'Jogadores avulsos',
      hiddenByDefault: true,
      formRender: ({ value, onChange }) => (
        <MultilineInput
          value={value}
          placeholder="Um jogador por linha para nomes sem cadastro."
          onChange={onChange}
        />
      ),
      render: (row) => row.playersList || '-',
    },
    {
      key: 'playersCount',
      label: 'Jogadores',
      showInForm: false,
      render: (row) => <Badge variant="secondary">{row.playersCount}</Badge>,
    },
  ]
}

function AdminTeamsPage() {
  const isAdmin = useRequireAdminMember()
  const teamsData = useQuery(api.teams.getAllWithMembers, isAdmin ? {} : 'skip')
  const membersData = useQuery(api.members.getAll, isAdmin ? {} : 'skip')
  const createTeam = useMutation(api.teams.create)
  const updateTeam = useMutation(api.teams.update)
  const deleteTeam = useMutation(api.teams.purge)

  if (!isAdmin) {
    return null
  }

  const teams = toTeamRows(teamsData)
  const members = membersData ?? []
  const memberOptions = members.map((member) => ({
    value: member._id,
    label: getMemberLabel(member),
  }))

  return (
    <DynamicTable<TeamRow>
      columns={getTeamColumns(memberOptions)}
      data={teams}
      isLoading={teamsData === undefined || membersData === undefined}
      rowKey="_id"
      searchParamKey="_id"
      onCreate={async (values) => {
        const name = normalizeOptionalString(values.name)
        const sport = normalizeOptionalString(values.sport)
        const type = normalizeTeamType(values.type)

        if (!name || !sport || !type) {
          toast.error('Preencha nome, esporte e categoria do time.')
          return false
        }

        try {
          const created = await createTeam({
            name,
            sport,
            type,
            color: normalizeOptionalString(values.color),
            members: parseMembers(values.membersList, members),
            players: parsePlayers(values.playersList),
          })

          if (created === true) {
            toast.success('Time criado com sucesso.')
            return true
          }

          toast.error('Não foi possível criar o time.')
          return false
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Não foi possível criar o time.',
          )
          return false
        }
      }}
      onUpdate={async (team, values) => {
        const type = normalizeTeamType(values.type)

        if (values.type && !type) {
          toast.error('Selecione uma categoria válida.')
          return false
        }

        try {
          const updated = await updateTeam({
            id: team._id,
            name: normalizeOptionalString(values.name),
            sport: normalizeOptionalString(values.sport),
            type,
            color: normalizeOptionalString(values.color) ?? null,
            members: parseMembers(values.membersList, members) ?? null,
            players: parsePlayers(values.playersList) ?? null,
          })

          if (updated === true) {
            toast.success('Time atualizado com sucesso.')
            return true
          }

          toast.error('Não foi possível atualizar o time.')
          return false
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o time.',
          )
          return false
        }
      }}
      onDelete={async (team) => {
        try {
          const deleted = await deleteTeam({ id: team._id })

          if (deleted === true) {
            toast.success('Time excluído com sucesso.')
            return true
          }

          toast.error('Não foi possível excluir o time.')
          return false
        } catch {
          toast.error('Não foi possível excluir o time.')
          return false
        }
      }}
    />
  )
}
