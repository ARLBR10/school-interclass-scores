import { v } from 'convex/values'

import { api } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { mutation, type MutationCtx } from './_generated/server'

type MemberPatch = Partial<Omit<Doc<'members'>, '_id' | '_creationTime'>>
type TeamPatch = Partial<Omit<Doc<'teams'>, '_id' | '_creationTime'>>
type MatchPatch = Partial<Omit<Doc<'matches'>, '_id' | '_creationTime'>>

const action = v.union(
  v.literal('list'),
  v.literal('get'),
  v.literal('create'),
  v.literal('update'),
  v.literal('delete'),
)

const mutableAdditionalRole = v.union(
  v.literal('press'),
  v.literal('judge'),
  v.null(),
)

const player = v.object({
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

const teamType = v.union(v.literal('Feminine'), v.literal('Masculine'))

const matchStatus = v.union(
  v.literal('Scheduled'),
  v.literal('Started'),
  v.literal('Canceled'),
  v.literal('Finished'),
)

const matchEvent = v.union(
  v.object({
    type: v.union(v.literal('AddScore'), v.literal('RemScore')),
    time: v.number(),
    team: v.id('teams'),
    score: v.number(),
    member: v.optional(v.id('members')),
    player: v.optional(v.string()),
  }),
  v.object({
    type: v.literal('KickedPlayer'),
    time: v.number(),
    team: v.id('teams'),
    member: v.optional(v.id('members')),
    player: v.optional(v.string()),
  }),
  v.object({
    type: v.union(v.literal('StartedMatch'), v.literal('FinishedMatch')),
    time: v.number(),
  }),
  v.object({
    type: v.literal('SwitchPlayers'),
    time: v.number(),
    team: v.id('teams'),
    members: v.optional(v.array(v.id('members'))),
    players: v.optional(v.array(v.string())),
  }),
)

export const members = mutation({
  args: {
    action,
    id: v.optional(v.id('members')),
    fields: v.optional(
      v.object({
        userId: v.optional(v.union(v.string(), v.null())),
        name: v.optional(v.string()),
        tuitionId: v.optional(v.union(v.string(), v.null())),
        additionalRole: v.optional(mutableAdditionalRole),
        schoolClass: v.optional(v.union(v.string(), v.null())),
        player: v.optional(v.union(player, v.null())),
      }),
    ),
  },
  async handler(ctx, args) {
    await requireAdmin(ctx)

    if (args.action === 'list') {
      return await ctx.db.query('members').take(999)
    }

    if (args.action === 'get') {
      if (!args.id) throw new Error('Informe o ID do membro.')
      return await ctx.db.get(args.id)
    }

    if (args.action === 'delete') {
      if (!args.id) throw new Error('Informe o ID do membro.')
      await ctx.db.delete(args.id)
      return { deleted: true }
    }

    const fields = args.fields
    if (!fields) throw new Error('Informe os campos do membro.')

    if (args.action === 'create') {
      if (!fields.name) throw new Error('Informe o nome do membro.')

      const member: Omit<Doc<'members'>, '_id' | '_creationTime'> = {
        name: fields.name,
        ...(fields.userId ? { userId: fields.userId } : {}),
        ...(fields.tuitionId ? { tuitionId: fields.tuitionId } : {}),
        ...(fields.additionalRole
          ? { additionalRole: fields.additionalRole }
          : {}),
        ...(fields.schoolClass ? { schoolClass: fields.schoolClass } : {}),
        ...(fields.player ? { player: fields.player } : {}),
      }

      const id = await ctx.db.insert('members', member)
      return await ctx.db.get(id)
    }

    if (!args.id) throw new Error('Informe o ID do membro.')

    const patch: MemberPatch = {}
    if ('userId' in fields) patch.userId = fields.userId ?? undefined
    if ('name' in fields && fields.name !== undefined) patch.name = fields.name
    if ('tuitionId' in fields) patch.tuitionId = fields.tuitionId ?? undefined
    if ('schoolClass' in fields)
      patch.schoolClass = fields.schoolClass ?? undefined
    if ('additionalRole' in fields) {
      patch.additionalRole = fields.additionalRole ?? undefined
    }
    if ('player' in fields) patch.player = fields.player ?? undefined

    await ctx.db.patch(args.id, patch)
    return await ctx.db.get(args.id)
  },
})

export const teams = mutation({
  args: {
    action,
    id: v.optional(v.id('teams')),
    fields: v.optional(
      v.object({
        name: v.optional(v.string()),
        sport: v.optional(v.string()),
        color: v.optional(v.union(v.string(), v.null())),
        type: v.optional(teamType),
        members: v.optional(v.union(v.array(v.id('members')), v.null())),
        players: v.optional(v.union(v.array(v.string()), v.null())),
      }),
    ),
  },
  async handler(ctx, args) {
    await requireAdmin(ctx)

    if (args.action === 'list') {
      return await ctx.db.query('teams').take(999)
    }

    if (args.action === 'get') {
      if (!args.id) throw new Error('Informe o ID do time.')
      return await ctx.db.get(args.id)
    }

    if (args.action === 'delete') {
      if (!args.id) throw new Error('Informe o ID do time.')
      await ctx.db.delete(args.id)
      return { deleted: true }
    }

    const fields = args.fields
    if (!fields) throw new Error('Informe os campos do time.')

    if (args.action === 'create') {
      if (!fields.name) throw new Error('Informe o nome do time.')
      if (!fields.sport) throw new Error('Informe o esporte do time.')
      if (!fields.type) throw new Error('Informe o tipo do time.')

      const team: Omit<Doc<'teams'>, '_id' | '_creationTime'> = {
        name: fields.name,
        sport: fields.sport,
        type: fields.type,
        ...(fields.color ? { color: fields.color } : {}),
        ...(fields.members ? { members: fields.members } : {}),
        ...(fields.players ? { players: fields.players } : {}),
      }

      const id = await ctx.db.insert('teams', team)
      return await ctx.db.get(id)
    }

    if (!args.id) throw new Error('Informe o ID do time.')

    const patch: TeamPatch = {}
    if ('name' in fields && fields.name !== undefined) patch.name = fields.name
    if ('sport' in fields && fields.sport !== undefined)
      patch.sport = fields.sport
    if ('type' in fields && fields.type !== undefined) patch.type = fields.type
    if ('color' in fields) patch.color = fields.color ?? undefined
    if ('members' in fields) patch.members = fields.members ?? undefined
    if ('players' in fields) patch.players = fields.players ?? undefined

    await ctx.db.patch(args.id, patch)
    return await ctx.db.get(args.id)
  },
})

export const matches = mutation({
  args: {
    action,
    id: v.optional(v.id('matches')),
    fields: v.optional(
      v.object({
        teams: v.optional(v.array(v.id('teams'))),
        scheduledData: v.optional(v.union(v.number(), v.null())),
        status: v.optional(matchStatus),
        events: v.optional(v.array(matchEvent)),
      }),
    ),
  },
  async handler(ctx, args) {
    await requireAdmin(ctx)

    if (args.action === 'list') {
      return await ctx.db.query('matches').take(999)
    }

    if (args.action === 'get') {
      if (!args.id) throw new Error('Informe o ID da partida.')
      return await ctx.db.get(args.id)
    }

    if (args.action === 'delete') {
      if (!args.id) throw new Error('Informe o ID da partida.')
      await ctx.db.delete(args.id)
      return { deleted: true }
    }

    const fields = args.fields
    if (!fields) throw new Error('Informe os campos da partida.')

    if (args.action === 'create') {
      if (!fields.teams) throw new Error('Informe os times da partida.')
      if (!fields.status) throw new Error('Informe o status da partida.')

      const match: Omit<Doc<'matches'>, '_id' | '_creationTime'> = {
        teams: fields.teams,
        status: fields.status,
        events: fields.events ?? [],
        ...(fields.scheduledData !== undefined && fields.scheduledData !== null
          ? { scheduledData: fields.scheduledData }
          : {}),
      }

      const id = await ctx.db.insert('matches', match)
      return await ctx.db.get(id)
    }

    if (!args.id) throw new Error('Informe o ID da partida.')

    const patch: MatchPatch = {}
    if ('teams' in fields && fields.teams !== undefined)
      patch.teams = fields.teams
    if ('status' in fields && fields.status !== undefined) {
      patch.status = fields.status
    }
    if ('events' in fields && fields.events !== undefined) {
      patch.events = fields.events
    }
    if ('scheduledData' in fields) {
      patch.scheduledData = fields.scheduledData ?? undefined
    }

    await ctx.db.patch(args.id, patch)
    return await ctx.db.get(args.id)
  },
})

async function requireAdmin(ctx: MutationCtx) {
  const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

  if (userInfo?.member?.additionalRole !== 'admin') {
    throw new Error('Apenas administradores podem usar este MCP.')
  }
}
