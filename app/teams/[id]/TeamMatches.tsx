"use client";

import { MatchStatus } from "@/app/utils/Translations";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function TeamMatches({ team }: { team: string }) {
  const MatchesConvex = useQuery(api.matches.teamMatches, {
    Team: team as any,
  });
  const AllTeams = useQuery(api.teams.getAll);

  const isLoading = !MatchesConvex;

  const Matches = MatchesConvex?.map((Match) => ({
    id: Match._id,
    date:
      Match.status === "Finished"
        ? new Date(
            Match.events.find((m) => m.type === "FinishedMatch")!.time * 1000
          )
        : Match.scheduledData !== undefined
        ? new Date(Match.scheduledData * 1000)
        : false,
    status: Match.status,
    opponent: Match.teams.find((m) => m !== team)!,
    events: Match.events,
  }));

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
          : Matches?.map((m) => {
              const statusMeta = MatchStatus[m.status] || {
                classes: "bg-gray-600 text-white",
                text: m.status,
              };

              // Score
              let scores = {} as {
                [key: string]: number;
              };
              m.events.forEach((e) => {
                if (e.type === "AddScore" || e.type === "RemScore") {
                  // If null
                  if (!scores[e.team as string]) scores[e.team as string] = 0;
                  let multiplier = e.type === "RemScore" ? -1 : 1; // To remove or add points
                  scores[e.team as string] += e.score * multiplier;
                }
              });
              const score = `${scores[team] || 0} - ${scores[m.opponent] || 0}`;
              // Date
              const MatchDate =
                m.date === false
                  ? "Não agendado"
                  : (m.date as Date).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

              // Opponent name (lookup from fetched teams)
              const opponent_name = AllTeams?.find((t) => t._id === m.opponent)
                ? AllTeams.find((t) => t._id === m.opponent)!.name
                : `Time ${m.opponent}`;
              return (
                <li key={m.id} className="mb-1">
                  <Link
                    href={`/matches/${m.id}`}
                    className="flex items-center justify-between hover:underline"
                  >
                    <div>
                      <div className="text-sm text-gray-200">{MatchDate}</div>
                      {
                        <div className="text-xs text-gray-400">
                          Oponente: Time {opponent_name}
                        </div>
                      }
                    </div>

                    <div className="flex items-center gap-3">
                      {m.status === "Finished" && score ? (
                        <div className="text-sm text-gray-300">{score}</div>
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
