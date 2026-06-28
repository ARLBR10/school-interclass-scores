import { v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

type ViewerResult = {
  userId: string
  name?: string
  email?: string
}

type PingResult = {
  id: Id<'mcpPings'>
  message: string
}

export const viewer = query({
  args: {},
  async handler(ctx): Promise<ViewerResult> {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Não autenticado.')
    }

    return {
      userId: identity.subject,
      name: identity.name,
      email: identity.email,
    }
  },
})

export const ping = mutation({
  args: {
    message: v.string(),
  },
  async handler(ctx, args): Promise<PingResult> {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Não autenticado.')
    }

    const id = await ctx.db.insert('mcpPings', {
      userId: identity.subject,
      message: args.message,
      createdAt: Date.now(),
    })

    return { id, message: args.message }
  },
})
