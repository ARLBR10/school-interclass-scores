import { ConvexProvider } from 'convex/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ConvexReactClient } from 'convex/react'

export default function Providers({
  client,
  children,
}: {
  client: ConvexReactClient
  children: React.ReactNode
}) {
  return (
    <ConvexProvider client={client}>
      <TooltipProvider>{children}</TooltipProvider>
    </ConvexProvider>
  )
}
