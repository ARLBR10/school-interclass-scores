import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Id } from './_generated/dataModel'

type LegacyPlayer = {
  _id: string
  name: string
  class?: string
  alias?: string[]
  height?: string
  weight?: string
  age?: number
  photo?: string
  socialMedias?: {
    Instagram?: string
  }
}

export const migratePlayersToMembers = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.batchSize ?? 50
    const db = ctx.db as any
    const playerIdToMemberId = new Map<string, Id<'members'>>()
    let migratedPlayers = 0
    let migratedTeams = 0
    let migratedMatches = 0

    for await (const player of db.query('players')) {
      if (migratedPlayers >= limit) break

      const legacyPlayer = player as LegacyPlayer
      const memberId = await ctx.db.insert('members', {
        name: legacyPlayer.name,
        schoolClass: legacyPlayer.class,
        player: {
          alias: legacyPlayer.alias ?? [],
          height: legacyPlayer.height,
          weight: legacyPlayer.weight,
          age: legacyPlayer.age,
          photo: legacyPlayer.photo,
          socialMedias: legacyPlayer.socialMedias,
        },
      })

      playerIdToMemberId.set(legacyPlayer._id, memberId)
      migratedPlayers += 1
    }

    for await (const team of ctx.db.query('teams')) {
      const legacyPlayers = (team as any).players as string[] | undefined
      if (!legacyPlayers?.length) continue

      const members = legacyPlayers
        .map((playerId) => playerIdToMemberId.get(playerId))
        .filter((memberId) => memberId !== undefined)

      if (members.length !== legacyPlayers.length) continue

      await ctx.db.patch(team._id, {
        members,
        players: undefined,
      } as any)
      migratedTeams += 1
    }

    for await (const match of ctx.db.query('matches')) {
      let changed = false
      const events = []

      for (const event of match.events as any[]) {
        if ('player' in event && event.player) {
          const member = playerIdToMemberId.get(event.player)
          if (member) {
            const rest = { ...event }
            delete rest.player
            events.push({ ...rest, member })
            changed = true
            continue
          }
        }

        if ('players' in event && event.players?.length) {
          const members = event.players
            .map((playerId: string) => playerIdToMemberId.get(playerId))
            .filter(
              (memberId: Id<'members'> | undefined) => memberId !== undefined,
            )

          if (members.length === event.players.length) {
            const rest = { ...event }
            delete rest.players
            events.push({ ...rest, members })
            changed = true
            continue
          }
        }

        events.push(event)
      }

      if (!changed) continue

      await ctx.db.patch(match._id, { events } as any)
      migratedMatches += 1
    }

    return { migratedPlayers, migratedTeams, migratedMatches }
  },
})
