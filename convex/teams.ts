import { query } from './_generated/server'
import { v } from 'convex/values'

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
