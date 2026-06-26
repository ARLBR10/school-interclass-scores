import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import authConfig from "./auth.config";
import { components, internal } from "./_generated/api";
import { env, query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel, Doc } from "./_generated/dataModel";
import authSchema from "./betterAuth/schema";

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google:
        env?.GOOGLE_OAUTH_CLIENT_ID && env?.GOOGLE_OAUTH_CLIENT_SECRET
          ? {
              clientId: env?.GOOGLE_OAUTH_CLIENT_ID,
              clientSecret: env?.GOOGLE_OAUTH_CLIENT_SECRET,
            }
          : undefined,
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions;
};

const siteUrl = env.SITE_URL;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  },
);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export type AuthUser = Awaited<ReturnType<typeof authComponent.getAuthUser>>;

type UserInfoType = AuthUser & {
  member: Doc<"members"> | null;
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<UserInfoType | null> => {
    const userInfo = await authComponent.getAuthUser(ctx).catch(() => {
      return null;
    });

    if (!userInfo) {
      return null;
    }

    const membershipInfo = await ctx.runQuery(internal.members.getByUserId, {
      userId: userInfo._id,
    });

    return {
      ...userInfo,
      member: membershipInfo,
    };
  },
});
