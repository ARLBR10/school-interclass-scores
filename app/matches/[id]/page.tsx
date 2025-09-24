"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { MatchTimeline } from "./MatchTimeline";

type Props = {
  params: Promise<{ id: string }>;
};

export default function MatchPage({ params }: Props) {
  const { id } = use(params);
  // Get Match Info from ID
  // TODO: Creating a function of this to catch it error
  const MatchInfo = useQuery(api.matches.get, { ID: id as any });

  // Scores
  let scores = {} as {
    [key: string]: number;
  };
  MatchInfo?.events.forEach((e) => {
    if (e.type === "AddScore" || e.type === "RemScore") {
      // If null
      if (!scores[e.team as string]) scores[e.team as string] = 0;
      let multiplier = e.type === "RemScore" ? -1 : 1; // To remove or add points
      scores[e.team as string] += e.score * multiplier;
    }
  });

  const isLoading = !MatchInfo;

  // Teams with Name and ID
  const AllTeamsInfo = useQuery(api.teams.getAll);
  const Teams =
    MatchInfo && AllTeamsInfo
      ? MatchInfo.teams.map((t) => {
          const TeamInfo = AllTeamsInfo.find((t2) => t2._id === t);
          return {
            name: TeamInfo?.name,
            score: scores[t],
            id: t,
            sport: TeamInfo?.sport,
            link: <Link href={`/teams/${t}`}>{TeamInfo?.name}</Link>,
          };
        })
      : undefined;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          {isLoading ? (
            <div className="h-10 w-64 bg-white/10 rounded animate-pulse" />
          ) : (
            "Informações da Partida"
          )}
        </h1>

        <section className="mt-8 bg-white/3 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-300">Time</div>
                <div className="text-xl font-medium text-white">
                  {isLoading ? (
                    <div className="h-6 w-36 bg-white/10 rounded animate-pulse" />
                  ) : (
                    Teams?.[0]?.link ?? ""
                  )}
                </div>
              </div>

              <div className="text-4xl font-bold text-white">
                {isLoading ? (
                  <div className="h-10 w-20 bg-white/10 rounded animate-pulse inline-block" />
                ) : MatchInfo?.status !== "Scheduled" ? (
                  Teams?.[0]?.score || "0"
                ) : (
                  ""
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-400">Data</div>
              <div className="text-sm text-gray-300">
                {isLoading ? (
                  <span className="inline-block h-4 w-36 bg-white/10 rounded animate-pulse" />
                ) : MatchInfo?.scheduledData ? (
                  new Date(MatchInfo.scheduledData * 1000).toLocaleString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                ) : (
                  "01/01/2025, 00:01"
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold text-white">
                {isLoading ? (
                  <div className="h-10 w-20 bg-white/10 rounded animate-pulse inline-block" />
                ) : MatchInfo?.status !== "Scheduled" ? (
                  Teams?.[1]?.score || "0"
                ) : (
                  ""
                )}
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300">Time</div>
                <div className="text-xl font-medium text-white">
                  {isLoading ? (
                    <div className="h-6 w-36 bg-white/10 rounded animate-pulse" />
                  ) : (
                    Teams?.[1]?.link ?? ""
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-white/10" />

          <MatchTimeline
            events={MatchInfo?.events as any}
            teamInfo={Teams as any}
          />
        </section>
      </div>
    </div>
  );
}
