import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listMatches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("matches").collect();
  },
});

export const getMatchEvents = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    return match?.events || [];
  },
});

export const createMatch = mutation({
  args: {
    teams: v.array(v.id("teams")),
    date: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("matches", {
      ...args,
      events: [],
    });
    return id;
  },
});

export const addMatchEvent = mutation({
  args: {
    matchId: v.id("matches"),
    type: v.union(v.literal("point"), v.literal("penalty")),
    teamId: v.id("teams"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    const newEvent = {
      type: args.type,
      teamId: args.teamId,
      value: args.value,
      timestamp: Date.now(),
    };
    await ctx.db.patch(args.matchId, {
      events: [...match.events, newEvent],
    });
    return newEvent;
  },
});