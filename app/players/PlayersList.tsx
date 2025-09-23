"use client";
import { Sports, TeamType } from "@/app/utils/Translations";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function PlayersList() {
  const Teams = useQuery(api.players.getAll);

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      {Teams
        ? Teams.map((t) => (
            <article
              key={t._id}
              className="bg-white/3 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-white">
                  {t.name}
                </h3>
              </div>
              <div className="text-right">
                <Link
                  href={`/players/${t._id}`}
                  className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
                >
                  Ver jogador
                </Link>
              </div>
            </article>
          ))
        : // Loading skeletons while Players is undefined
          Array.from({ length: 4 }).map((_, i) => (
            <article
              key={`skeleton-${i}`}
              className="bg-white/3 rounded-lg p-4 flex items-center justify-between animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-5 w-48 bg-white/10 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-8 w-24 bg-white/6 rounded inline-block" />
              </div>
            </article>
          ))}
    </div>
  );
}
