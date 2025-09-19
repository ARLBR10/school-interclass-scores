import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect();
  },
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
    members: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("teams", args);
    return id;
  },
});