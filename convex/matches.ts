import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const createOrEdit = mutation({
  args: {
    MatchID: v.optional(v.id("matches")),
    teams: v.array(v.id("teams")),
    scheduledData: v.optional(v.number()), // UNIX Timestamp
    status: v.union(
      v.literal("Scheduled"),
      //v.literal("Delayed"), // Have to do through scheduleData
      v.literal("Canceled"),
      v.literal("Finished")
    ),
    events: v.array(
      v.union(
        v.object({
          type: v.union(v.literal("AddScore"), v.literal("RemScore")),
          time: v.number(), // UNIX Timestamp
          team: v.id("teams"),
          score: v.number(),
          player: v.optional(v.id("players")),
        }),
        v.object({
          type: v.literal("KickedPlayer"),
          time: v.number(), // UNIX Timestamp
          team: v.id("teams"),
          player: v.id("players"),
        }),
        v.object({
          type: v.union(v.literal("StartedMatch"), v.literal("FinishedMatch")),
          time: v.number(), // UNIX Timestamp
        }),
        v.object({
          type: v.literal("SwitchPlayers"),
          time: v.number(), // UNIX Timestamp
          team: v.id("teams"),
          players: v.array(v.id("players")),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const UserAuthenticated = await ctx.auth.getUserIdentity();
    if (!UserAuthenticated) return "Not authorized";
    //console.log(args)

    if (args.MatchID) {
      const oldMatch = await ctx.db.get(args.MatchID);
      let newMatch = oldMatch

      newMatch!.events = args.events ?? oldMatch?.events;
      newMatch!.teams = args.teams ?? oldMatch?.teams;
      newMatch!.scheduledData = args.scheduledData ?? oldMatch?.scheduledData;

      console.log(oldMatch)
      console.log(newMatch)
      await ctx.db.patch(newMatch!._id, newMatch!);
      return "Updated!";
    } else {
      const newMatch = {} as any;

      newMatch.events = args.events
      newMatch.teams = args.teams 
      newMatch.scheduledData = args.scheduledData 
      return "Created!";
    }
  },
});