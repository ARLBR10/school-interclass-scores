import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTeam = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("teams", args);
    return id;
  },
});

export const addMemberToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("members", {
      ...args,
    });
    return id;
  },
});

export const createMatch = mutation({
  args: {
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    sport: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("matches", {
      ...args,
      status: "upcoming",
    });
    return id;
  },
});

export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, { status: args.status });
    return await ctx.db.get(args.matchId);
  },
});

export const addPointOrPenalty = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    type: v.union(v.literal("point"), v.literal("penalty")),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const id = await ctx.db.insert("pointsPenalties", {
      ...args,
      timestamp,
    });
    return { id, ...args, timestamp };
  },
});