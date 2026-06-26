import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "./betterAuth/convex.config";
import posthog from "@posthog/convex/convex.config.js"

const app = defineApp({
  env: {
    // Better Auth
    SITE_URL: v.string(),
    GOOGLE_OAUTH_CLIENT_ID: v.optional(v.string()),
    GOOGLE_OAUTH_CLIENT_SECRET: v.optional(v.string()),
    // Posthog
    POSTHOG_PROJECT_TOKEN: v.string(),
    POSTHOG_HOST: v.optional(v.string()),
    POSTHOG_PERSONAL_API_KEY: v.optional(v.string()),
    POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS: v.optional(v.string()),
  },
});
// Better Auth
app.use(betterAuth);
// Posthog
app.use(posthog, {
  env: {
    POSTHOG_PROJECT_TOKEN: app.env.POSTHOG_PROJECT_TOKEN,
    POSTHOG_HOST: app.env.POSTHOG_HOST,
    POSTHOG_PERSONAL_API_KEY: app.env.POSTHOG_PERSONAL_API_KEY,
    POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS:
      app.env.POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS,
  },
});

export default app;
