import { v } from 'convex/values'

import { api, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { captureMutationLog, capturePermissionDenied } from './logging'

type MemberPatch = Partial<Omit<Doc<'members'>, '_id' | '_creationTime'>>
type MemberCreateInput = Omit<Doc<'members'>, '_id' | '_creationTime'>

type PublicPlayer = Pick<Doc<'members'>, '_id' | '_creationTime' | 'name'> & {
  schoolClass?: string
  player: NonNullable<Doc<'members'>['player']>
}

type ClassAssignmentResult = {
  updated: number
  missing: string[]
  duplicateRows: string[]
  duplicateMembers: string[]
}

const mutableAdditionalRole = v.union(
  v.literal('press'),
  v.literal('judge'),
  v.null(),
)
const playerArgs = v.object({
  alias: v.optional(v.array(v.string())),
  height: v.optional(v.string()),
  weight: v.optional(v.string()),
  age: v.optional(v.number()),
  photo: v.optional(v.string()),
  socialMedias: v.optional(
    v.object({
      Instagram: v.optional(v.string()),
    }),
  ),
})

const memberCreateArgs = {
  // Keep this up-to-date with the members table.
  userId: v.optional(v.string()),
  name: v.string(),
  tuitionId: v.optional(v.string()),
  additionalRole: v.optional(v.union(v.literal('press'), v.literal('judge'))),
  schoolClass: v.optional(v.string()),
  player: v.optional(playerArgs),
}

export const getByUserId = internalQuery({
  args: {
    userId: v.optional(v.string()),
  },
  async handler(ctx, args): Promise<Doc<'members'> | null> {
    if (!args.userId) {
      return null
    }

    return await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique()
  },
})

export const get = internalQuery({
  args: {
    id: v.id('members'),
  },
  async handler(ctx, args): Promise<null | Doc<'members'>> {
    return ctx.db.get('members', args.id)
  },
})

export const assignStudentMembershipFromEmail = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  async handler(ctx, args) {
    const [emailName, emailTuitionId] = args.email
      .replace(/@.*/, '')
      .split('.') as string[]

    if (!(emailName && emailTuitionId)) {
      return null
    }

    const userByTuitionId = await ctx.db
      .query('members')
      .withIndex('by_tuitionId', (q) => q.eq('tuitionId', emailTuitionId))
      .unique()

    if (userByTuitionId && userByTuitionId.userId === undefined) {
      await ctx.db.patch('members', userByTuitionId!._id!, {
        userId: args.userId,
      })
    }
  },
})

export const getAll = query({
  args: {},
  async handler(ctx): Promise<Doc<'members'>[] | null> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      return null
    }

    return await ctx.db.query('members').take(999)
  },
})

export const getPublicPlayers = query({
  args: {},
  async handler(ctx): Promise<PublicPlayer[]> {
    const members = await ctx.db.query('members').take(999)

    return members
      .filter((member): member is Doc<'members'> & PublicPlayer =>
        Boolean(member.player),
      )
      .map((member) => ({
        _id: member._id,
        _creationTime: member._creationTime,
        name: member.name,
        ...(member.schoolClass !== undefined
          ? { schoolClass: member.schoolClass }
          : {}),
        player: member.player,
      }))
  },
})

export const getPublicPlayer = query({
  args: {
    id: v.id('members'),
  },
  async handler(ctx, args) {
    const member = await ctx.db.get(args.id)

    if (!member?.player) {
      return null
    }

    const teams = await ctx.db.query('teams').collect()
    const teamsData = teams
      .filter((team) => team.members?.includes(member._id))
      .map((team) => ({
        _id: team._id,
        name: team.name,
        sport: team.sport,
        type: team.type,
        color: team.color,
      }))

    return {
      _id: member._id,
      _creationTime: member._creationTime,
      name: member.name,
      ...(member.schoolClass !== undefined
        ? { schoolClass: member.schoolClass }
        : {}),
      player: member.player,
      teamsData,
    }
  },
})

// The admin type shouldn't be set by ANY mutation, that job should only occur at the Convex Admin

export const create = mutation({
  args: memberCreateArgs,
  async handler(ctx, args): Promise<null | boolean> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'members.create',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    const newMember: MemberCreateInput = {
      name: args.name,
      ...(args.userId !== undefined ? { userId: args.userId } : {}),
      ...(args.tuitionId !== undefined ? { tuitionId: args.tuitionId } : {}),
      ...(args.additionalRole !== undefined
        ? { additionalRole: args.additionalRole }
        : {}),
      ...(args.schoolClass !== undefined
        ? { schoolClass: args.schoolClass }
        : {}),
      ...(args.player !== undefined ? { player: args.player } : {}),
    }

    const memberId = await ctx.db.insert('members', newMember)

    await captureMutationLog(ctx, {
      mutation: 'members.create',
      actor: userInfo,
      outcome: 'success',
      details: { created_member_id: memberId, created_member: newMember },
    })
    return true
  },
})

export const bulkCreate = mutation({
  args: {
    members: v.array(v.object(memberCreateArgs)),
  },
  async handler(ctx, args): Promise<null | { created: number }> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'members.bulkCreate',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: { count: args.members.length } },
      })
      return null
    }

    if (args.members.length > 500) {
      throw new Error('Crie no máximo 500 membros por importação.')
    }

    for (const member of args.members) {
      const newMember: MemberCreateInput = {
        name: member.name,
        ...(member.userId !== undefined ? { userId: member.userId } : {}),
        ...(member.tuitionId !== undefined
          ? { tuitionId: member.tuitionId }
          : {}),
        ...(member.additionalRole !== undefined
          ? { additionalRole: member.additionalRole }
          : {}),
        ...(member.schoolClass !== undefined
          ? { schoolClass: member.schoolClass }
          : {}),
        ...(member.player !== undefined ? { player: member.player } : {}),
      }

      await ctx.db.insert('members', newMember)
    }

    await captureMutationLog(ctx, {
      mutation: 'members.bulkCreate',
      actor: userInfo,
      outcome: 'success',
      details: { created_count: args.members.length },
    })

    return { created: args.members.length }
  },
})

export const update = mutation({
  args: {
    id: v.id('members'),
    // Keep this up-to-date the table.
    userId: v.optional(v.union(v.string(), v.null())),
    name: v.optional(v.string()),
    tuitionId: v.optional(v.union(v.string(), v.null())),
    schoolClass: v.optional(v.union(v.string(), v.null())),
    additionalRole: v.optional(mutableAdditionalRole),
    player: v.optional(v.union(playerArgs, v.null())),
  },
  async handler(ctx, args): Promise<null | boolean> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'members.update',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    // Member Info
    const memberInfo = await ctx.runQuery(internal.members.get, {
      id: args.id,
    })

    if (!memberInfo) return null

    const memberPatch: MemberPatch = {}

    if ('userId' in args) {
      memberPatch.userId = args.userId ?? undefined
    }

    if ('tuitionId' in args) {
      memberPatch.tuitionId = args.tuitionId ?? undefined
    }

    if ('schoolClass' in args) {
      memberPatch.schoolClass = args.schoolClass ?? undefined
    }

    if ('additionalRole' in args) {
      memberPatch.additionalRole = args.additionalRole ?? undefined
    }

    if ('player' in args) {
      memberPatch.player = args.player ?? undefined
    }

    if ('name' in args && args.name !== undefined) {
      memberPatch.name = args.name
    }

    await ctx.db.patch('members', args.id, memberPatch)

    await captureMutationLog(ctx, {
      mutation: 'members.update',
      actor: userInfo,
      outcome: 'success',
      details: { member_id: args.id, data_received: args },
    })

    return true
  },
})

export const assignClasses = mutation({
  args: {
    schoolClass: v.string(),
    rows: v.array(
      v.object({
        number: v.optional(v.string()),
        tuitionId: v.string(),
        studentName: v.string(),
      }),
    ),
  },
  async handler(ctx, args): Promise<null | ClassAssignmentResult> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'members.assignClasses',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: { count: args.rows.length } },
      })
      return null
    }

    if (args.rows.length === 0) {
      throw new Error('Informe pelo menos um aluno para vincular à turma.')
    }

    if (args.rows.length > 500) {
      throw new Error('Atualize no máximo 500 membros por importação.')
    }

    const normalizedClass = args.schoolClass.trim()

    if (!normalizedClass) {
      throw new Error('Informe o nome da turma no título do Markdown.')
    }

    const tuitionCounts = new Map<string, number>()

    for (const row of args.rows) {
      const tuitionId = row.tuitionId.trim()
      tuitionCounts.set(tuitionId, (tuitionCounts.get(tuitionId) ?? 0) + 1)
    }

    const duplicateRows = [...tuitionCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([tuitionId]) => tuitionId)
    const duplicateRowSet = new Set(duplicateRows)
    const missing: string[] = []
    const duplicateMembers: string[] = []
    let updated = 0

    for (const row of args.rows) {
      const tuitionId = row.tuitionId.trim()

      if (!tuitionId || duplicateRowSet.has(tuitionId)) {
        continue
      }

      const matches = await ctx.db
        .query('members')
        .withIndex('by_tuitionId', (q) => q.eq('tuitionId', tuitionId))
        .take(2)

      if (matches.length === 0) {
        missing.push(`${row.studentName} (${tuitionId})`)
        continue
      }

      if (matches.length > 1) {
        duplicateMembers.push(`${row.studentName} (${tuitionId})`)
        continue
      }

      await ctx.db.patch('members', matches[0]._id, {
        schoolClass: normalizedClass,
      })
      updated += 1
    }

    await captureMutationLog(ctx, {
      mutation: 'members.assignClasses',
      actor: userInfo,
      outcome: 'success',
      details: {
        school_class: normalizedClass,
        updated_count: updated,
        missing_count: missing.length,
        duplicate_row_count: duplicateRows.length,
        duplicate_member_count: duplicateMembers.length,
        warnings: {
          missing,
          duplicate_rows: duplicateRows,
          duplicate_members: duplicateMembers,
        },
      },
    })

    return { updated, missing, duplicateRows, duplicateMembers }
  },
})

export const purge = mutation({
  args: {
    id: v.id('members'),
  },
  async handler(ctx, args): Promise<null | boolean> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'members.purge',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    await ctx.db.delete('members', args.id)
    await captureMutationLog(ctx, {
      mutation: 'members.purge',
      actor: userInfo,
      outcome: 'success',
      details: { member_id: args.id },
    })
    return true
  },
})
