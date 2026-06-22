import { ConvexQueryClient } from '@convex-dev/react-query'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.error('missing envar VITE_CONVEX_URL')
}

// Create a fresh client per request so SSR does not reuse (and re-`connect`)
// a single shared instance. Wired into TanStack Query in
// `src/integrations/tanstack-query/root-provider.tsx`.
export function createConvexQueryClient() {
  return new ConvexQueryClient(CONVEX_URL)
}
