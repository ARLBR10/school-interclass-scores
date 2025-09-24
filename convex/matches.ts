import { v } from "convex/values";
import { query } from "./_generated/server";

export const get = query({
  args: {
    ID: v.id("matches"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ID);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("matches").collect();
  },
});

export const nextMatch = query({
  args: {},
  async handler(ctx) {
    const Matches = await ctx.db
      .query("matches")
      .filter((q) => q.or(q.eq(q.field("status"), "Scheduled"),q.eq(q.field("status"), "Started")))
      .collect();

    // Filter out matches without a scheduled timestamp on the server side.
    const MatchesWithSchedule = Matches.filter(
      (m) => m.scheduledData !== null && m.scheduledData !== undefined
    );

    const sorted = MatchesWithSchedule.sort((a, b) => {
      const ta =
        typeof a.scheduledData === "number"
          ? a.scheduledData
          : Number(a.scheduledData);
      const tb =
        typeof b.scheduledData === "number"
          ? b.scheduledData
          : Number(b.scheduledData);
      return ta - tb;
    });

    return sorted;
  },
});

export const teamMatches = query({
  args: {
    Team: v.id("teams"),
  },
  async handler(ctx, args) {
    const Matches = await ctx.db.query("matches").collect();

    const Filtered = Matches.filter((m) => {
      return m.teams.includes(args.Team);
    });

    return Filtered;
  },
});
