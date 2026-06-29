import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { posthog } from './posthog'

type ActorInfo = {
  _id?: string
  id?: string
  email?: string | null
  member?: {
    _id: Id<'members'>
    userId?: string
    name: string
    additionalRole?: 'admin' | 'press' | 'judge'
    schoolClass?: string
  } | null
}

type MutationLogArgs = {
  mutation: string
  actor: ActorInfo | null
  statusCode?: number
  outcome: 'success' | 'permission_denied' | 'not_found' | 'validation_error'
  requiredRole?: 'admin' | 'judge'
  details?: Record<string, unknown>
}

function getDistinctId(actor: ActorInfo | null) {
  return actor?._id ?? actor?.id ?? actor?.member?.userId ?? 'anonymous'
}

/**
 * Captures one structured PostHog event per completed Convex mutation path.
 */
export async function captureMutationLog(
  ctx: MutationCtx,
  {
    mutation,
    actor,
    statusCode = 200,
    outcome,
    requiredRole,
    details,
  }: MutationLogArgs,
) {
  const distinctId = getDistinctId(actor)

  await posthog.capture(ctx, {
    distinctId,
    event: 'convex_mutation',
    properties: {
      distinct_id: distinctId,
      mutation,
      outcome,
      status_code: statusCode,
      required_role: requiredRole ?? null,
      actor: {
        user_id: actor?._id ?? actor?.id ?? null,
        email: actor?.email ?? null,
        member_id: actor?.member?._id ?? null,
        member_user_id: actor?.member?.userId ?? null,
        member_name: actor?.member?.name ?? null,
        member_role: actor?.member?.additionalRole ?? null,
        member_school_class: actor?.member?.schoolClass ?? null,
        is_authenticated: actor !== null,
      },
      ...(details ? { details } : {}),
    },
  })
}

export async function capturePermissionDenied(
  ctx: MutationCtx,
  args: Omit<MutationLogArgs, 'outcome' | 'statusCode'>,
) {
  await captureMutationLog(ctx, {
    ...args,
    outcome: 'permission_denied',
    statusCode: 401,
  })
}
