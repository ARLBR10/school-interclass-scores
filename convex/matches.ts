import { query, mutation } from "convex/server";
import { v } from "convex/values";

export const getMatches = query({
  handler: async (ctx) => {
    const { db } = ctx;
    return await db.query("matches").collect();
  },
});

export const createMatch = mutation({
  args: {
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    sport: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    return await db.insert("matches", { ...args, status: "scheduled" });
  },
});

export const addScoreEvent = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    type: v.union(v.literal("point"), v.literal("penalty")),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const timestamp = Date.now();
    await db.insert("scoreEvents", { ...args, timestamp });
    const match = await db.get(args.matchId);
    if (match && match.status === "scheduled") {
      await db.patch(args.matchId, { status: "ongoing" });
    }
  },
});

export const getScoreEvents = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const { db } = ctx;
    return await db.query("scoreEvents").withIndex("by_match", (q) => q.eq("matchId", args.matchId)).collect();
  },
});
