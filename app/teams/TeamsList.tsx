"use client";
import { Sports, TeamType } from "@/app/utils/Translations";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function TeamsList() {
  const Teams = useQuery(api.teams.getAll);

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      {Teams
        ? Teams.map((t) => (
            <article
              key={t._id}
              className="bg-white/3 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-white">Time {t.name}</h3>
                <p className="mt-1 text-sm text-gray-300">
                  {t
                    ? `${Sports[t.sport] || t.sport}, ${
                        TeamType[t.type] || t.type
                      }`
                    : "Desconhecida, Assexuada"}
                </p>
              </div>
              <div className="text-right">
                <Link
                  href={`/teams/${t._id}`}
                  className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
                >
                  Ver equipe
                </Link>
              </div>
            </article>
          ))
        : // Loading skeletons while Teams is undefined
          Array.from({ length: 4 }).map((_, i) => (
            <article
              key={`skeleton-${i}`}
              className="bg-white/3 rounded-lg p-4 flex items-center justify-between animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-5 w-48 bg-white/10 rounded"></div>
                <div className="h-4 w-36 bg-white/6 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-8 w-24 bg-white/6 rounded inline-block" />
              </div>
            </article>
          ))}
    </div>
  );
}
