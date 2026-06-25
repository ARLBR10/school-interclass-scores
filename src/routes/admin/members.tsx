import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  DynamicTable,
  type AdminTableColumn,
  type AdminTableSelectOption,
} from '@/components/admin/DynamicTable'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { requireAdminMember, useRequireAdminMember } from '@/lib/admin-auth'
import { ChevronDownIcon } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { AuthUser } from '../../../convex/auth'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

const noRoleOptionValue = '__no_role__'
const noUserOptionValue = '__no_user__'

const additionalRoleOptions: AdminTableSelectOption[] = [
  { value: noRoleOptionValue, label: 'Sem permissão extra' },
  { value: 'press', label: 'Imprensa' },
  { value: 'admin', label: 'Administrador', disabled: true },
]

type MemberRow = {
  [key: string]: ReactNode
  _id: Id<'members'>
  _creationTime: number
  name: string
  tuitionId?: string
  schoolClass?: string
  userId?: string
  additionalRole?: 'admin' | 'press'
  playerSection?: string
  playerAlias?: string
  playerHeight?: string
  playerWeight?: string
  playerAge?: number
  playerPhoto?: string
  playerInstagram?: string
}

type MemberFormValues = Partial<Record<keyof MemberRow, string>>

export const Route = createFileRoute('/admin/members')({
  beforeLoad: requireAdminMember,
  head: () => ({
    meta: [
      { title: 'Membros - Interclasse AACSA' },
      {
        name: 'description',
        content: 'Gerencie membros, vínculos de usuário e dados de atleta.',
      },
    ],
  }),
  component: MembersPage,
})

function normalizeOptionalString(value: string | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  return trimmedValue
}

function normalizeNullableString(value: string | undefined) {
  return normalizeOptionalString(value) ?? null
}

function normalizeOptionalUserId(value: string | undefined) {
  if (value === noUserOptionValue) {
    return undefined
  }

  return normalizeOptionalString(value)
}

function normalizeNullableUserId(value: string | undefined) {
  if (value === noUserOptionValue) {
    return null
  }

  return normalizeNullableString(value)
}

function normalizeOptionalRole(value: string | undefined) {
  if (!value || value === noRoleOptionValue || value === 'admin') {
    return undefined
  }

  return value === 'press' ? value : undefined
}

function normalizeNullableRole(value: string | undefined) {
  return normalizeOptionalRole(value) ?? null
}

function normalizeOptionalNumber(value: string | undefined) {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    return undefined
  }

  const parsedValue = Number(normalizedValue)

  if (!Number.isFinite(parsedValue)) {
    return undefined
  }

  return parsedValue
}

function parseAlias(value: string | undefined) {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    return undefined
  }

  return normalizedValue
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean)
}

function getPlayerFormValue(
  values: MemberFormValues,
  fallback: MemberRow | undefined,
  key: keyof MemberRow,
) {
  if (key in values) {
    return values[key]
  }

  const fallbackValue = fallback?.[key]

  if (typeof fallbackValue === 'string' || typeof fallbackValue === 'number') {
    return String(fallbackValue)
  }

  return undefined
}

function buildPlayerPatch(values: MemberFormValues, fallback?: MemberRow) {
  const alias = parseAlias(getPlayerFormValue(values, fallback, 'playerAlias'))
  const height = normalizeOptionalString(
    getPlayerFormValue(values, fallback, 'playerHeight'),
  )
  const weight = normalizeOptionalString(
    getPlayerFormValue(values, fallback, 'playerWeight'),
  )
  const age = normalizeOptionalNumber(
    getPlayerFormValue(values, fallback, 'playerAge'),
  )
  const photo = normalizeOptionalString(
    getPlayerFormValue(values, fallback, 'playerPhoto'),
  )
  const instagram = normalizeOptionalString(
    getPlayerFormValue(values, fallback, 'playerInstagram'),
  )

  if (!(alias || height || weight || age !== undefined || photo || instagram)) {
    return null
  }

  return {
    ...(alias ? { alias } : {}),
    ...(height ? { height } : {}),
    ...(weight ? { weight } : {}),
    ...(age !== undefined ? { age } : {}),
    ...(photo ? { photo } : {}),
    ...(instagram ? { socialMedias: { Instagram: instagram } } : {}),
  }
}

function toMemberRows(members: Doc<'members'>[]): MemberRow[] {
  return members.map((member) => ({
    _id: member._id,
    _creationTime: member._creationTime,
    name: member.name,
    tuitionId: member.tuitionId,
    schoolClass: member.schoolClass,
    userId: member.userId,
    additionalRole: member.additionalRole,
    playerSection: '',
    playerAlias: member.player?.alias?.join(', '),
    playerHeight: member.player?.height,
    playerWeight: member.player?.weight,
    playerAge: member.player?.age,
    playerPhoto: member.player?.photo,
    playerInstagram: member.player?.socialMedias?.Instagram,
  }))
}

function getUserOptions(users: AuthUser[] | null | undefined) {
  const options: AdminTableSelectOption[] = [
    { value: noUserOptionValue, label: 'Sem usuário vinculado' },
  ]

  for (const user of users ?? []) {
    options.push({
      value: user._id,
      label: `${user.name || user.email} (${user.email})`,
    })
  }

  return options
}

function PlayerEditor({
  values,
  row,
  onFieldChange,
}: {
  values: Record<string, string>
  row: MemberRow | null
  onFieldChange: (key: string, value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const fields = [
    {
      key: 'playerAlias',
      label: 'Apelidos',
      placeholder: 'Ex.: camisa 10, capitão',
    },
    { key: 'playerHeight', label: 'Altura', placeholder: 'Ex.: 1,72m' },
    { key: 'playerWeight', label: 'Peso', placeholder: 'Ex.: 68kg' },
    { key: 'playerAge', label: 'Idade', placeholder: 'Ex.: 16' },
    { key: 'playerPhoto', label: 'Foto', placeholder: 'URL da foto' },
    {
      key: 'playerInstagram',
      label: 'Instagram',
      placeholder: '@usuario',
    },
  ]

  function getInputValue(key: string) {
    if (key in values) {
      return values[key] ?? ''
    }

    const fallbackValue = row?.[key]

    if (
      typeof fallbackValue === 'string' ||
      typeof fallbackValue === 'number'
    ) {
      return String(fallbackValue)
    }

    return ''
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border/70 bg-muted/20">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full justify-between gap-4 px-3 py-3 pr-4 text-left hover:bg-muted/40"
          >
            <span className="min-w-0 space-y-0.5">
              <span className="block text-sm font-semibold text-foreground">
                Dados de atleta
              </span>
              <span className="block text-[11px] font-normal leading-snug text-muted-foreground">
                Campos salvos dentro do objeto player do membro.
              </span>
            </span>
            <ChevronDownIcon
              className={
                isOpen
                  ? 'mt-0.5 size-4 shrink-0 rotate-180 transition-transform'
                  : 'mt-0.5 size-4 shrink-0 transition-transform'
              }
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-3 border-t border-border/70 px-3 py-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </span>
                <Input
                  value={getInputValue(field.key)}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    onFieldChange(field.key, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function getMemberColumns(
  userOptions: AdminTableSelectOption[],
): AdminTableColumn<MemberRow>[] {
  return [
    { key: 'name', label: 'Nome' },
    { key: 'tuitionId', label: 'Matrícula' },
    { key: 'schoolClass', label: 'Turma' },
    {
      key: 'userId',
      label: 'Usuário',
      formSelectOptions: userOptions,
      formSelectPlaceholder: 'Selecione um usuário',
      render: (row) => {
        const option = userOptions.find((user) => user.value === row.userId)
        return option?.label ?? row.userId ?? '-'
      },
    },
    {
      key: 'additionalRole',
      label: 'Permissão extra',
      formSelectOptions: additionalRoleOptions,
      formSelectPlaceholder: 'Selecione a permissão',
      render: (row) => {
        if (!row.additionalRole) {
          return '-'
        }

        return (
          additionalRoleOptions.find(
            (option) => option.value === row.additionalRole,
          )?.label ?? '-'
        )
      },
    },
    {
      key: 'playerSection',
      label: 'Dados de atleta',
      showInTable: false,
      formLabel: '',
      formRender: ({ values, row, onFieldChange }) => (
        <PlayerEditor values={values} row={row} onFieldChange={onFieldChange} />
      ),
    },
    {
      key: 'playerAlias',
      label: 'Apelidos',
      showInForm: false,
      hiddenByDefault: true,
    },
    {
      key: 'playerHeight',
      label: 'Altura',
      showInForm: false,
      hiddenByDefault: true,
    },
    {
      key: 'playerWeight',
      label: 'Peso',
      showInForm: false,
      hiddenByDefault: true,
    },
    {
      key: 'playerAge',
      label: 'Idade',
      showInForm: false,
      hiddenByDefault: true,
    },
    {
      key: 'playerPhoto',
      label: 'Foto',
      showInForm: false,
      hiddenByDefault: true,
    },
    {
      key: 'playerInstagram',
      label: 'Instagram',
      showInForm: false,
      hiddenByDefault: true,
    },
  ]
}

function MembersPage() {
  const isAdmin = useRequireAdminMember()
  const membersData = useQuery(api.members.getAll, isAdmin ? {} : 'skip')
  const usersData = useQuery(api.auth_admin.getAll, isAdmin ? {} : 'skip')
  const createMember = useMutation(api.members.create)
  const updateMember = useMutation(api.members.update)
  const deleteMember = useMutation(api.members.purge)

  if (!isAdmin) {
    return null
  }

  const userOptions = getUserOptions(usersData ?? undefined)
  const memberColumns = getMemberColumns(userOptions)
  const memberRows = toMemberRows(membersData ?? [])

  return (
    <DynamicTable<MemberRow>
      columns={memberColumns}
      data={memberRows}
      isLoading={membersData === undefined || usersData === undefined}
      rowKey="_id"
      searchParamKey="_id"
      onCreate={async (values) => {
        const name = normalizeOptionalString(values.name)

        if (!name) {
          toast.error('Informe o nome do membro.')
          return false
        }

        try {
          const created = await createMember({
            name,
            userId: normalizeOptionalUserId(values.userId),
            tuitionId: normalizeOptionalString(values.tuitionId),
            schoolClass: normalizeOptionalString(values.schoolClass),
            additionalRole: normalizeOptionalRole(values.additionalRole),
            player: buildPlayerPatch(values) ?? undefined,
          })

          if (created === true) {
            toast.success('Membro criado com sucesso.')
            return true
          }

          toast.error('Não foi possível criar o membro.')
          return false
        } catch {
          toast.error('Não foi possível criar o membro.')
          return false
        }
      }}
      onUpdate={async (member, values) => {
        try {
          const additionalRole =
            member.additionalRole === 'admin'
              ? undefined
              : normalizeNullableRole(values.additionalRole)
          const updated = await updateMember({
            id: member._id,
            name: normalizeOptionalString(values.name),
            userId: normalizeNullableUserId(values.userId),
            tuitionId: normalizeNullableString(values.tuitionId),
            schoolClass: normalizeNullableString(values.schoolClass),
            ...(additionalRole !== undefined ? { additionalRole } : {}),
            player: buildPlayerPatch(values, member),
          })

          if (updated === true) {
            toast.success('Membro atualizado com sucesso.')
            return true
          }

          toast.error('Não foi possível atualizar o membro.')
          return false
        } catch {
          toast.error('Não foi possível atualizar o membro.')
          return false
        }
      }}
      onDelete={async (member) => {
        try {
          const deleted = await deleteMember({ id: member._id })

          if (deleted === true) {
            toast.success('Membro excluído com sucesso.')
            return true
          }

          toast.error('Não foi possível excluir o membro.')
          return false
        } catch {
          toast.error('Não foi possível excluir o membro.')
          return false
        }
      }}
    />
  )
}
