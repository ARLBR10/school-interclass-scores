"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

export function PlayerItem({
  id,
  notIncludeClass,
}: {
  id: string;
  notIncludeClass?: boolean;
}) {
  const player = useQuery(api.player.get, { ID: id as any });

  if (!player) {
    return <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />;
  }

  return (
    <Link
      href={`/players/${player._id}`}
      className="text-gray-300 hover:underline"
    >
      {player.name} {notIncludeClass ? "" : `- ${player.class}`}
    </Link>
  );
}
