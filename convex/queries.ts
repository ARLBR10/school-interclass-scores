import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllTeams = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("members")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        return {
          ...team,
          members: members.map((m) => m.name),
        };
      })
    );
    return teamsWithMembers;
  },
});

export const getTeamById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;
    const members = await ctx.db
      .query("members")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    return { ...team, members: members.map((m) => m.name) };
  },
});

export const getAllMatches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_date", (q) => q)
      .order("asc")
      .collect();
  },
});

export const getMatchById = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    const pointsPenalties = await ctx.db
      .query("pointsPenalties")
      .withIndex("by_match_timestamp", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();
    return { ...match, pointsPenalties };
  },
});

export const getLivePointsForMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pointsPenalties")
      .withIndex("by_match_timestamp", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();
  },
});