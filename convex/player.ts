import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("players").collect();
  },
});

export const get = query({
  args: { ID: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ID)
  }
})