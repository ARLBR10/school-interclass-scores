import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    name: v.string(),
    sport: v.string(), // e.g., "Volleyball"
    members: v.array(v.object({
      id: v.string(),
      name: v.string(),
      position: v.optional(v.string()), // Optional, e.g., "Captain"
    })),
  }).index("by_sport", ["sport"]),

  matches: defineTable({
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    sport: v.string(),
    date: v.string(), // ISO date
    status: v.union(v.literal("scheduled"), v.literal("ongoing"), v.literal("finished")),
  }),

  scoreEvents: defineTable({
    matchId: v.id("matches"),
    teamId: v.id("teams"), // Which team scored
    type: v.union(v.literal("point"), v.literal("penalty")),
    value: v.number(), // e.g., +1 for point, -1 for penalty
    timestamp: v.number(), // Unix timestamp
  }).index("by_match", ["matchId"]),
});
