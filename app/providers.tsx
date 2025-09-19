"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const convex = new ConvexReactClient(
    process.env.NEXT_PUBLIC_CONVEX_URL as string
  );

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}