"use client";

import { PlayerItem } from "@/app/utils/PlayerItem";
import { Sports, TeamType } from "@/app/utils/Translations";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { use } from "react";
import TeamMatches from "./TeamMatches";

type Props = {
  params: Promise<{ id: string }>;
};

export default function TeamPage({ params }: Props) {
  const id = use(params).id;

  const TeamInfo = useQuery(
    api.teams.get,
    id ? { ID: id } : (undefined as any)
  );

  const isLoading = !TeamInfo;

  // Derived data (use placeholders when loading)
  const teamName = TeamInfo ? `Time ${TeamInfo.name}` : "Time Desconhecido";
  const teamModality = TeamInfo
    ? `${Sports[TeamInfo.sport] || TeamInfo.sport}, ${
        TeamType[TeamInfo.type] || TeamInfo.type
      }`
    : "Desconhecida, Assexuada";
  const teamMembers = TeamInfo ? TeamInfo.players : [];

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            {isLoading ? (
              <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
            ) : (
              teamName
            )}
          </h1>
          <Link
            href="/teams"
            className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-3 text-gray-300">
          {isLoading ? (
            <span className="inline-block h-4 w-20 bg-white/10 rounded animate-pulse" />
          ) : (
            `${teamModality ?? "Desconhecida, Assexuada"}`
          )}
        </p>

        <section className="mt-6 bg-white/3 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white">Membros</h2>
          <ul className="mt-2 list-disc list-inside text-gray-300">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <li key={i} className="mb-2">
                    <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                  </li>
                ))
              : teamMembers.map((playerId) => (
                  <li key={playerId.toString()} className="mb-2">
                    <PlayerItem id={playerId} />
                  </li>
                ))}
          </ul>
        </section>

        <TeamMatches team={id} />
      </div>
    </div>
  );
}
