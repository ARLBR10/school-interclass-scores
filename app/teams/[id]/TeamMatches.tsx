"use client";

import Link from "next/link";
import { MatchStatus } from "@/app/utils/Translations";

type Match = {
  id: string;
  date: string;
  opponent: string;
  location: string;
  score: string | null;
  status: string; // should match keys in MatchStatus (e.g. 'Finished', 'Scheduled')
};

export default function TeamMatches({
  isLoading,
  matches,
}: {
  isLoading: boolean;
  matches?: Match[];
}) {
  const staticMatches: Match[] = matches || [
    {
      id: "m1",
      date: "01/10/2025",
      opponent: "Time B",
      location: "Quadra 1",
      score: "2 - 1",
      status: "Finished",
    },
    {
      id: "m2",
      date: "10/10/2025",
      opponent: "Time C",
      location: "Quadra 2",
      score: null,
      status: "Scheduled",
    },
  ];

  return (
    <section className="mt-6 bg-white/3 rounded-lg p-4">
      {/* Ensure Tailwind includes these dynamic badge classes during build */}
      <div className="hidden">
        <span className="bg-blue-600 text-white" />
        <span className="bg-yellow-600 text-white" />
        <span className="bg-red-600 text-white" />
        <span className="bg-green-600 text-white" />
        <span className="bg-gray-600 text-white" />
      </div>
      <h2 className="text-lg font-medium text-white">Partidas</h2>
      <ul className="mt-2 space-y-3 text-gray-300">
        {isLoading
          ? [1, 2].map((i) => (
              <li key={i} className="mb-2">
                <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
              </li>
            ))
          : staticMatches.map((m) => {
              const statusMeta = MatchStatus[m.status] || {
                classes: "bg-gray-600 text-white",
                text: m.status,
              };

              return (
                <li key={m.id} className="mb-1">
                  <Link
                    href={`/matches/${m.id}`}
                    className="flex items-center justify-between hover:underline"
                  >
                    <div>
                      <div className="text-sm text-gray-200">
                        {m.date} — {m.opponent}
                      </div>
                      <div className="text-xs text-gray-400">{m.location}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      {m.status === "Finished" && m.score ? (
                        <div className="text-sm text-gray-300">{m.score}</div>
                      ) : (
                        <span
                          className={`${statusMeta.classes} text-xs rounded-full px-2 py-1`}
                        >
                          {statusMeta.text}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
