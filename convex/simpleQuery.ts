import { query } from "./_generated/server";

export const hello = query({
  args: {},
  handler: async () => {
    return { message: "Convex is working!" };
  },
});