import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

import { api } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { captureMutationLog, capturePermissionDenied } from './logging'

type TeamPatch = Partial<Omit<Doc<'teams'>, '_id' | '_creationTime'>>
type PublicTeamPlayer = Pick<Doc<'members'>, '_id' | 'name'> & {
  schoolClass?: string
  player: NonNullable<Doc<'members'>['player']>
}

const teamType = v.union(v.literal('Feminine'), v.literal('Masculine'))

function isPlayerMember(
  member: Doc<'members'> | null,
): member is Doc<'members'> {
  return Boolean(member?.player)
}

function toPublicTeamPlayer(member: Doc<'members'>): PublicTeamPlayer {
  return {
    _id: member._id,
    name: member.name,
    ...(member.schoolClass !== undefined
      ? { schoolClass: member.schoolClass }
      : {}),
    player: member.player!,
  }
}

async function requireAdmin(ctx: MutationCtx) {
  const userInfo = await ctx.runQuery(api.auth.getCurrentUser)
  return { userInfo, isAdmin: userInfo?.member?.additionalRole === 'admin' }
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('teams').collect()
  },
})

export const getAllWithMembers = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query('teams').collect()

    return await Promise.all(
      teams.map(async (team) => {
        const members = await Promise.all(
          (team.members ?? []).map((memberId) => ctx.db.get(memberId)),
        )

        const membersData = members.filter((member) => member !== null)

        return {
          _id: team._id,
          _creationTime: team._creationTime,
          name: team.name,
          sport: team.sport,
          type: team.type,
          color: team.color,
          players: team.players,
          membersData,
        }
      }),
    )
  },
})

export const getPublicAllWithPlayers = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query('teams').collect()

    return await Promise.all(
      teams.map(async (team) => {
        const members = await Promise.all(
          (team.members ?? []).map((memberId) => ctx.db.get(memberId)),
        )

        const membersData = members
          .filter(isPlayerMember)
          .map(toPublicTeamPlayer)

        return {
          ...team,
          membersData,
        }
      }),
    )
  },
})

export const get = query({
  args: { ID: v.id('teams') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ID)
  },
})

export const getWithMembers = query({
  args: { ID: v.id('teams') },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.ID)
    if (!team) return null

    const members = await Promise.all(
      (team.members ?? []).map((memberId) => ctx.db.get(memberId)),
    )
    const membersData = members.filter((member) => member !== null)

    return {
      _id: team._id,
      _creationTime: team._creationTime,
      name: team.name,
      sport: team.sport,
      type: team.type,
      color: team.color,
      players: team.players,
      membersData,
    }
  },
})

export const getPublicWithPlayers = query({
  args: { ID: v.id('teams') },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.ID)
    if (!team) return null

    const members = await Promise.all(
      (team.members ?? []).map((memberId) => ctx.db.get(memberId)),
    )
    const membersData = members.filter(isPlayerMember).map(toPublicTeamPlayer)

    return {
      ...team,
      membersData,
    }
  },
})

export const memberTeams = query({
  args: { ID: v.id('members') },
  handler: async (ctx, args) => {
    const teams = await ctx.db.query('teams').collect()

    return teams.filter((t) => t.members?.includes(args.ID))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
    color: v.optional(v.string()),
    type: teamType,
    members: v.optional(v.array(v.id('members'))),
    players: v.optional(v.array(v.string())),
  },
  async handler(ctx, args): Promise<null | boolean> {
    const { userInfo, isAdmin } = await requireAdmin(ctx)
    if (!isAdmin) {
      await capturePermissionDenied(ctx, {
        mutation: 'teams.create',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    const teamId = await ctx.db.insert('teams', {
      name: args.name,
      sport: args.sport,
      type: args.type,
      ...(args.color !== undefined ? { color: args.color } : {}),
      ...(args.members !== undefined ? { members: args.members } : {}),
      ...(args.players !== undefined ? { players: args.players } : {}),
    })

    await captureMutationLog(ctx, {
      mutation: 'teams.create',
      actor: userInfo,
      outcome: 'success',
      details: { team_id: teamId, data_received: args },
    })

    return true
  },
})

export const update = mutation({
  args: {
    id: v.id('teams'),
    name: v.optional(v.string()),
    sport: v.optional(v.string()),
    color: v.optional(v.union(v.string(), v.null())),
    type: v.optional(teamType),
    members: v.optional(v.union(v.array(v.id('members')), v.null())),
    players: v.optional(v.union(v.array(v.string()), v.null())),
  },
  async handler(ctx, args): Promise<null | boolean> {
    const { userInfo, isAdmin } = await requireAdmin(ctx)
    if (!isAdmin) {
      await capturePermissionDenied(ctx, {
        mutation: 'teams.update',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    const team = await ctx.db.get(args.id)
    if (!team) return null

    const patch: TeamPatch = {}

    if ('name' in args && args.name !== undefined) patch.name = args.name
    if ('sport' in args && args.sport !== undefined) patch.sport = args.sport
    if ('type' in args && args.type !== undefined) patch.type = args.type
    if ('color' in args) patch.color = args.color ?? undefined
    if ('members' in args) patch.members = args.members ?? undefined
    if ('players' in args) patch.players = args.players ?? undefined

    await ctx.db.patch(args.id, patch)

    await captureMutationLog(ctx, {
      mutation: 'teams.update',
      actor: userInfo,
      outcome: 'success',
      details: { team_id: args.id, data_received: args },
    })

    return true
  },
})

export const purge = mutation({
  args: {
    id: v.id('teams'),
  },
  async handler(ctx, args): Promise<null | boolean> {
    const { userInfo, isAdmin } = await requireAdmin(ctx)
    if (!isAdmin) {
      await capturePermissionDenied(ctx, {
        mutation: 'teams.purge',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    await ctx.db.delete(args.id)

    await captureMutationLog(ctx, {
      mutation: 'teams.purge',
      actor: userInfo,
      outcome: 'success',
      details: { team_id: args.id },
    })

    return true
  },
})
