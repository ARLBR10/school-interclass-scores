import { QueryClient } from '@tanstack/react-query'
import { createConvexQueryClient } from '../convex/provider'

export function getContext() {
  const convexQueryClient = createConvexQueryClient()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })

  convexQueryClient.connect(queryClient)

  return {
    queryClient,
    convexQueryClient,
  }
}
