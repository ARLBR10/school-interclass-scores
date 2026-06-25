import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const additionalRole = v.union(
  v.literal('admin'),
  v.literal('press'),
  v.literal('judge'),
)

export default defineSchema({
  members: defineTable({
    // IDs from other components don't count on convex/values. This is optional because the member might not be registered.
    userId: v.optional(v.string()),
    name: v.string(),
    tuitionId: v.optional(v.string()),
    additionalRole: v.optional(additionalRole),
    schoolClass: v.optional(v.string()),
    player: v.optional(
      v.object({
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
      }),
    ),
  })
    .index('by_userId', ['userId'])
    .index('by_tuitionId', ['tuitionId']),
  matches: defineTable({
    teams: v.array(v.id('teams')),
    scheduledData: v.optional(v.number()), // UNIX Timestamp
    status: v.union(
      v.literal('Scheduled'),
      v.literal('Started'),
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
          member: v.optional(v.id('members')),
          player: v.optional(v.string()),
        }),
        v.object({
          type: v.literal('KickedPlayer'),
          time: v.number(), // UNIX Timestamp
          team: v.id('teams'),
          member: v.optional(v.id('members')),
          player: v.optional(v.string()),
        }),
        v.object({
          type: v.union(v.literal('StartedMatch'), v.literal('FinishedMatch')),
          time: v.number(), // UNIX Timestamp
        }),
        v.object({
          type: v.literal('SwitchPlayers'),
          time: v.number(), // UNIX Timestamp
          team: v.id('teams'),
          members: v.optional(v.array(v.id('members'))),
          players: v.optional(v.array(v.string())),
        }),
      ),
    ),
  }).index('by_status', ['status']),
  teams: defineTable({
    name: v.string(),
    sport: v.string(), // Create a LIST at the page
    color: v.optional(v.string()),
    type: v.union(v.literal('Feminine'), v.literal('Masculine')),
    members: v.optional(v.array(v.id('members'))),
    players: v.optional(v.array(v.string())),
  }),
})
