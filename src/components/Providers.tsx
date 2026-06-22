import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";

export default function Providers({
  context,
  children,
}: {
  context: any, // @todo
  children: React.ReactNode;
}) {
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ConvexBetterAuthProvider>
  );
}
