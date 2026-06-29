import { v } from 'convex/values'

import { api, components } from './_generated/api'
import { mutation, query } from './_generated/server'
import { authComponent, createAuth, type AuthUser } from './auth'
import { captureMutationLog, capturePermissionDenied } from './logging'

export const getAll = query({
  args: {},
  async handler(ctx): Promise<AuthUser[] | null> {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      return null
    }

    return (
      await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: 'user',
        paginationOpts: {
          cursor: null,
          numItems: 999,
        },
      })
    ).page
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    image: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)
    const safeArgs = { ...args, password: '[redacted]' }

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'auth_admin.create',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: safeArgs },
      })
      return null
    }

    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const authContext = await auth.$context

    const { id: createdUserId } = await authContext.internalAdapter.createUser({
      updatedAt: new Date(),
      name: args.name,
      email: args.email,
      emailVerified: false,
      image: args.image,
    })
    await authContext.internalAdapter.createAccount({
      accountId: createdUserId,
      userId: createdUserId,
      providerId: 'credential',
      createdAt: new Date(),
      updatedAt: new Date(),
      password: await authContext.password.hash(args.password),
    })

    await captureMutationLog(ctx, {
      mutation: 'auth_admin.create',
      actor: userInfo,
      outcome: 'success',
      details: {
        created_user_id: createdUserId,
        created_user: {
          name: args.name,
          email: args.email,
          image: args.image ?? null,
        },
      },
    })
    return true
  },
})

export const edit = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.union(v.string(), v.null())),
    password: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)
    const safeArgs = {
      ...args,
      password: args.password ? '[redacted]' : undefined,
      passwordUpdated: Boolean(args.password && args.password !== ''),
    }

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'auth_admin.edit',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: safeArgs },
      })
      return null
    }

    // Auth Interface
    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const authContext = await auth.$context

    await Promise.all([
      authContext.internalAdapter.updateUser(args.id, {
        updatedAt: new Date(),
        name: args.name,
        email: args.email,
        emailVerified: args.emailVerified,
        image: args.image,
      }),
      args.password && args.password !== ''
        ? await authContext.internalAdapter.updatePassword(
            args.id,
            await authContext.password.hash(args.password),
          )
        : null,
    ])

    await captureMutationLog(ctx, {
      mutation: 'auth_admin.edit',
      actor: userInfo,
      outcome: 'success',
      details: { user_id: args.id, data_updated: safeArgs },
    })
    return true
  },
})

export const purge = mutation({
  args: {
    id: v.string(),
  },
  async handler(ctx, args) {
    const userInfo = await ctx.runQuery(api.auth.getCurrentUser)

    // Permission check
    if (userInfo?.member?.additionalRole !== 'admin') {
      await capturePermissionDenied(ctx, {
        mutation: 'auth_admin.purge',
        actor: userInfo,
        requiredRole: 'admin',
        details: { data_received: args },
      })
      return null
    }

    // Auth Interface
    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const authContext = await auth.$context

    const accountId = (
      await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: 'account',
        where: [
          {
            field: 'userId',
            value: args.id,
          },
        ],
      })
    )._id

    await Promise.all([
      authContext.internalAdapter.deleteUser(args.id),
      authContext.internalAdapter.deleteAccount(accountId),
    ])
    await captureMutationLog(ctx, {
      mutation: 'auth_admin.purge',
      actor: userInfo,
      outcome: 'success',
      details: { user_id: args.id, account_id: accountId },
    })
    return true
  },
})
