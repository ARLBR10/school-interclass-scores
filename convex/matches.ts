import { query } from "./_generated/server";

export type BetterMatch = {
  _id: string;
  _creationTime: number;
  scheduledData?: Date | undefined;
  finishedData?: Date | undefined;
  teams: string[];
  status: "Scheduled" | "Delayed" | "Canceled" | "Started" | "Finished";
  scores: {
    reversed: boolean;
    player: string | "N/A";
  }[];
  penalties: {
    type: string;
    player: string;
  }[];
};

function makeBetterMatch(Match: any): BetterMatch {
  const NewMatch = Match as any;
  if (Match.scheduledData)
    NewMatch.scheduledData = new Date(Match.scheduledData);
  return NewMatch;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("matches").collect();
  },
});

export const nextMatch = query({
  args: {},
  async handler(ctx) {
    const Matches = await ctx.db.query("matches").collect();

    // Transform to BetterMatch
    const BetterMatches = Matches.map((Match) => makeBetterMatch(Match));

    // Sort to nearest date
    const CurrentDate = Date.now();
    // Filter out entries without a scheduled date, then sort ascending
    const WithDates = BetterMatches.filter((m) => m.scheduledData).sort(
      (a, b) => {
        const ta = new Date(a.scheduledData as any).getTime();
        const tb = new Date(b.scheduledData as any).getTime();
        return ta - tb;
      }
    );

    // Find the first upcoming match (scheduled after now), fallback to the earliest one
    const Next =
      WithDates.find(
        (m) => (m.scheduledData as Date).getTime() >= CurrentDate
      ) ||
      WithDates[0] ||
      null;

    return Next;
  },
});
