"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function Home() {
  const nextMatchList = useQuery(api.matches.nextMatch);
  const nextMatch = nextMatchList?.[0];
  const isLoading = nextMatchList === undefined;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">Olá</h1>
        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Bem-vindo ao aplicativo de Pontuações Interclasse Escolar.
        </p>

        <section className="mt-8 flex flex-col gap-4">
          <div className="bg-white/3 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white">Próxima Partida</h2>
            <p className="mt-2 text-gray-300 text-sm">
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-32 bg-white/10 rounded animate-pulse mr-2" />
                  <span className="inline-block h-4 w-6 align-middle">vs</span>
                  <span className="inline-block h-4 w-32 bg-white/10 rounded animate-pulse ml-2" />
                  <span className="inline-block h-4 w-36 bg-white/10 rounded animate-pulse ml-4" />
                </>
              ) : nextMatch ? (
                <>
                  <TeamLink TeamID={nextMatch?.teams[0] as string} /> vs{" "}
                  <TeamLink TeamID={nextMatch?.teams[1] as string} />
                  {" — "}
                  {nextMatch && nextMatch.scheduledData
                    ? new Date(nextMatch.scheduledData * 1000).toLocaleString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Invalid date"}
                </>
              ) : (
                <span>Não existe uma partida agendada neste momento</span>
              )}
            </p>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-9 w-full bg-white/10 rounded animate-pulse" />
              ) : nextMatch ? (
                <Link
                  href={`/matches/${nextMatch?._id}`}
                  className="w-full bg-white/6 hover:bg-white/8 text-white rounded-md px-3 py-2 touchable"
                >
                  Detalhes
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-white/6 text-white rounded-md px-3 py-2 touchable opacity-60"
                >
                  Sem Detalhes
                </button>
              )}
            </div>
          </div>

          <div className="bg-white/3 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white">Classificação</h2>
            <p className="mt-2 text-gray-300 text-sm">
              Veja a classificação atual das equipes.
            </p>
            <div className="mt-4">
              <button className="w-full bg-white/6 hover:bg-white/8 text-white rounded-md px-3 py-2 touchable">
                Ver Classificação
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TeamLink({ TeamID }: { TeamID: string }) {
  const Team = useQuery(
    api.teams.get,
    TeamID ? { ID: TeamID as any } : (undefined as any)
  );
  const isLoading = Team === undefined;

  return (
    <b>
      {isLoading ? (
        <span className="inline-block h-4 w-28 bg-white/10 rounded animate-pulse" />
      ) : (
        <Link href={`/teams/${TeamID}`}>Time {Team?.name}</Link>
      )}
    </b>
  );
}
