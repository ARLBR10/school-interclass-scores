import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

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

// Returns a single match with full team and player data resolved
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
        const players = await Promise.all(
          team.players.map((playerId) => ctx.db.get(playerId)),
        )
        return {
          ...team,
          playersData: players.filter(Boolean),
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
    status: v.union(
      v.literal('Scheduled'),
      //v.literal("Delayed"), // Have to do through scheduleData
      v.literal('Canceled'),
      v.literal('Finished'),
    ),
    events: v.array(
      v.union(
        v.object({
          type: v.union(v.literal('AddScore'), v.literal('RemScore')),
          time: v.number(), // UNIX Timestamp
          team: v.id('teams'),
          score: v.number(),
          player: v.optional(v.id('players')),
        }),
        v.object({
          type: v.literal('KickedPlayer'),
          time: v.number(), // UNIX Timestamp
          team: v.id('teams'),
          player: v.id('players'),
        }),
        v.object({
          type: v.union(v.literal('StartedMatch'), v.literal('FinishedMatch')),
          time: v.number(), // UNIX Timestamp
        }),
        v.object({
          type: v.literal('SwitchPlayers'),
          time: v.number(), // UNIX Timestamp
          team: v.id('teams'),
          players: v.array(v.id('players')),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const UserAuthenticated = await ctx.auth.getUserIdentity()
    if (!UserAuthenticated) return 'Not authorized'
    //console.log(args)

    if (args.MatchID) {
      const oldMatch = await ctx.db.get(args.MatchID)
      let newMatch = oldMatch

      newMatch!.events = args.events ?? oldMatch?.events
      newMatch!.teams = args.teams ?? oldMatch?.teams
      newMatch!.scheduledData = args.scheduledData ?? oldMatch?.scheduledData

      console.log(oldMatch)
      console.log(newMatch)
      await ctx.db.patch(newMatch!._id, newMatch!)
      return 'Updated!'
    } else {
      const newMatch = {} as any

      newMatch.events = args.events
      newMatch.teams = args.teams
      newMatch.scheduledData = args.scheduledData
      return 'Created!'
    }
  },
})
