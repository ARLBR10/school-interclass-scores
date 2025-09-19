import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    name: v.string(),
    sport: v.string(),
    members: v.array(v.string()),
  })
    .index("by_sport", ["sport"]),

  matches: defineTable({
    teams: v.array(v.id("teams")),
    date: v.number(),
    status: v.string(),
    events: v.array(
      v.object({
        type: v.union(v.literal("point"), v.literal("penalty")),
        teamId: v.id("teams"),
        value: v.number(),
        timestamp: v.number(),
      })
    ),
  }),
});