import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    name: v.string(),
    sport: v.string(),
  }),
  members: defineTable({
    name: v.string(),
    teamId: v.id("teams"),
  }).index("by_team", ["teamId"]),
  matches: defineTable({
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    sport: v.string(),
    date: v.number(),
    status: v.string(),
  }).index("by_date", ["date"])
    .index("by_status", ["status"]),
  pointsPenalties: defineTable({
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    type: v.union(v.literal("point"), v.literal("penalty")),
    value: v.number(),
    timestamp: v.number(),
  }).index("by_match_timestamp", ["matchId", "timestamp"]),
});