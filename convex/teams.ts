import { query, mutation } from "convex/server";
import { v } from "convex/values";

export const getTeams = query({
  args: { sport: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { db } = ctx;
    if (args.sport) {
      return await db.query("teams").withIndex("by_sport", (q) => q.eq("sport", args.sport)).collect();
    }
    return await db.query("teams").collect();
  },
});

export const addTeam = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
    members: v.array(v.object({ name: v.string(), position: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const id = await db.insert("teams", { ...args, members: args.members || [] });
    return id;
  },
});

export const addMember = mutation({
  args: { 
    teamId: v.id("teams"), 
    name: v.string(), 
    position: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const team = await db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    const memberId = `${Date.now()}`;
    const newMember = { id: memberId, name: args.name, position: args.position };
    const updatedMembers = [...(team.members || []), newMember];
    await db.patch(args.teamId, { members: updatedMembers });
  },
});
