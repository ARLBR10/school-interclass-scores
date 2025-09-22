import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // First time doing this so we need to check it.
  matches: defineTable({
    teams: v.array(v.id("teams")),
    scheduledData: v.optional(v.number()), // UNIX Timestamp
    status: v.union(
      v.literal("Scheduled"),
      //v.literal("Delayed"), // Have to do through scheduleData
      v.literal("Canceled"),
      v.literal("Started"),
      v.literal("Finished")
    ),
    events: v.array(
      v.object({
        type: v.union(
          v.literal('AddScore'),
          v.literal('RemScore'),
          v.literal('KickedPlayer'),
          v.literal('SwitchPlayers'),
          v.literal('StartedMatch'),
          v.literal('FinishedMatch'),
        ),
        team: v.id('teams'),
        player: v.optional(v.union(v.id("players"), v.literal("Unknown"), v.array(v.id("players")))),
      })
    ),
  }),
  teams: defineTable({
    name: v.string(),
    sport: v.string(), // Create a LIST at the page
    type: v.union(v.literal("Feminine"), v.literal("Masculine")),
    players: v.array(v.id("players")),
  }),
  players: defineTable({
    name: v.string(),
    class: v.string(),
    alias: v.array(v.string()),
    height: v.optional(v.string()),
    weight: v.optional(v.string()),
    age: v.optional(v.number()),
    photo: v.optional(v.string()), // URL *maybe?
    socialMedias: v.optional(
      v.object({
        instagram: v.optional(v.string()), // Maybe some other?
      })
    ),
  }),
});
