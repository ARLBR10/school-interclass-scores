import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { api } from './_generated/api'
import type { MutationCtx } from './_generated/server'

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

async function getCurrentRole(ctx: MutationCtx) {
  const userInfo = await ctx.runQuery(api.auth.getCurrentUser)
  return userInfo?.member?.additionalRole
}

async function requireAdmin(ctx: MutationCtx) {
  const role = await getCurrentRole(ctx)
  return role === 'admin'
}

async function requireJudge(ctx: MutationCtx) {
  const role = await getCurrentRole(ctx)
  return role === 'admin' || role === 'judge'
}

export const get = query({
  args: {
    ID: v.id('matches'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ID)
  },
})

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('matches').collect()
  },
})

// Returns all matches with their team data resolved
export const getAllWithTeams = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query('matches').collect()

    const result = await Promise.all(
      matches.map(async (match) => {
        const teams = await Promise.all(
          match.teams.map((teamId) => ctx.db.get(teamId)),
        )
        return {
          ...match,
          teamsData: teams.filter(Boolean),
        }
      }),
    )

    return result
  },
})

// Returns a single match with full team and member data resolved
export const getWithDetails = query({
  args: {
    ID: v.id('matches'),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.ID)
    if (!match) return null

    const teams = await Promise.all(
      match.teams.map(async (teamId) => {
        const team = await ctx.db.get(teamId)
        if (!team) return null
        const members = await Promise.all(
          (team.members ?? []).map((memberId) => ctx.db.get(memberId)),
        )
        return {
          ...team,
          membersData: members.filter(Boolean),
        }
      }),
    )

    return {
      ...match,
      teamsData: teams.filter(Boolean),
    }
  },
})

export const nextMatch = query({
  args: {},
  async handler(ctx) {
    // Use index for Scheduled matches
    const scheduled = await ctx.db
      .query('matches')
      .withIndex('by_status', (q) => q.eq('status', 'Scheduled'))
      .collect()

    // Use index for Started matches
    const started = await ctx.db
      .query('matches')
      .withIndex('by_status', (q) => q.eq('status', 'Started'))
      .collect()

    const matches = [...scheduled, ...started]

    // Filter out matches without a scheduled timestamp
    const withSchedule = matches.filter((m) => m.scheduledData != null)

    const sorted = withSchedule.toSorted(
      (a, b) => a.scheduledData! - b.scheduledData!,
    )

    return sorted
  },
})

export const teamMatches = query({
  args: {
    Team: v.id('teams'),
  },
  async handler(ctx, args) {
    const Matches = await ctx.db.query('matches').collect()

    const Filtered = Matches.filter((m) => {
      return m.teams.includes(args.Team)
    })

    return Filtered
  },
})

export const createOrEdit = mutation({
  args: {
    MatchID: v.optional(v.id('matches')),
    teams: v.array(v.id('teams')),
    scheduledData: v.optional(v.number()), // UNIX Timestamp
    status: matchStatus,
    events: v.array(matchEvent),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdmin(ctx))) return 'Not authorized'

    if (args.MatchID) {
      await ctx.db.patch(args.MatchID, {
        teams: args.teams,
        scheduledData: args.scheduledData,
        status: args.status,
        events: args.events,
      })
      return 'Updated!'
    }

    await ctx.db.insert('matches', {
      teams: args.teams,
      scheduledData: args.scheduledData,
      status: args.status,
      events: args.events,
    })

    return 'Created!'
  },
})

export const updateStatus = mutation({
  args: {
    MatchID: v.id('matches'),
    status: matchStatus,
  },
  async handler(ctx, args): Promise<boolean | null> {
    if (!(await requireJudge(ctx))) return null

    const match = await ctx.db.get(args.MatchID)
    if (!match) return null

    const statusEvent =
      args.status === 'Started'
        ? { type: 'StartedMatch' as const, time: Date.now() / 1000 }
        : args.status === 'Finished'
          ? { type: 'FinishedMatch' as const, time: Date.now() / 1000 }
          : null

    await ctx.db.patch(args.MatchID, {
      status: args.status,
      events: statusEvent ? [...match.events, statusEvent] : match.events,
    })

    return true
  },
})

export const addEvent = mutation({
  args: {
    MatchID: v.id('matches'),
    event: matchEvent,
  },
  async handler(ctx, args): Promise<boolean | null> {
    if (!(await requireJudge(ctx))) return null

    const match = await ctx.db.get(args.MatchID)
    if (!match) return null

    await ctx.db.patch(args.MatchID, {
      events: [...match.events, args.event],
    })

    return true
  },
})

export const removeEvent = mutation({
  args: {
    MatchID: v.id('matches'),
    eventIndex: v.number(),
  },
  async handler(ctx, args): Promise<boolean | null> {
    if (!(await requireJudge(ctx))) return null

    const match = await ctx.db.get(args.MatchID)
    if (!match) return null

    if (args.eventIndex < 0 || args.eventIndex >= match.events.length)
      return null

    const events = match.events.filter((_, index) => index !== args.eventIndex)

    await ctx.db.patch(args.MatchID, { events })

    return true
  },
})

export const purge = mutation({
  args: {
    MatchID: v.id('matches'),
  },
  async handler(ctx, args): Promise<boolean | null> {
    if (!(await requireAdmin(ctx))) return null

    await ctx.db.delete(args.MatchID)
    return true
  },
})
