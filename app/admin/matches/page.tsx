"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Página administrativa para listar partidas.
 * - Link de edição apontando para /admin/matches/[id]/edit
 * - Botão para criar apontando para /admin/matches/create
 *
 * Observação: não faço a integração completa com Convex — deixei as chamadas
 * a `useQuery` como no restante do projeto; você pode ajustar/regenerar quando
 * integrar as funções do backend.
 */

/* -------------------------- AdminMatchesPage ------------------------- */

export default function AdminMatchesPage() {
  // NOTE: deixei as queries como no restante do projeto para facilitar a integração.
  // Se preferir, você pode remover e passar dados via props ao integrar.
  const matches = useQuery(api.matches.getAll);
  const teams = useQuery(api.teams.getAll);
  let teamsLinks: Record<string, React.ReactNode> = {};

  teams?.forEach((t: any) => {
    teamsLinks[t._id] = (
      <Link href={`/teams/${t._id}`} className="text-white">
        Time {t.name}
      </Link>
    );
  });

  const isLoading = !matches;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">
              Partidas — Administração
            </h1>
            <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
              Aqui você pode criar e editar partidas do sistema.
            </p>
          </div>

          <div className="mt-2">
            <Link
              href="/admin/matches/create"
              className="inline-block bg-white/6 text-white px-4 py-2 rounded-md"
            >
              Criar partida
            </Link>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <article
                  key={`skeleton-${i}`}
                  className="bg-white/3 rounded-lg p-4 flex items-center justify-between animate-pulse"
                >
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      <div className="h-4 w-48 bg-white/10 rounded" />
                    </h3>
                    <div className="mt-1 text-sm text-gray-300">
                      <p className="h-3 w-36 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-md bg-white/6 text-white`}
                    >
                      &nbsp;
                    </span>

                    <div className="mt-2">
                      <span className="h-6 w-20 inline-block bg-white/10 rounded" />
                    </div>
                  </div>
                </article>
              ))
            : matches?.map((m: any) => (
                <article
                  key={m._id}
                  className="bg-white/3 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {teamsLinks[m.teams[0]]}{" "}
                      <span className="text-gray-400">vs</span>{" "}
                      {teamsLinks[m.teams[1]]}
                    </h3>
                    <p className="mt-1 text-sm text-gray-300">
                      {(
                        m.status === "Finished"
                          ? new Date(
                              m.events?.find((ev: any) => ev.type === "FinishedMatch")
                                ?.time * 1000
                            )
                          : m.scheduledData !== undefined
                          ? new Date(m.scheduledData * 1000)
                          : false
                      )?.toLocaleString?.("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }) ?? ""}
                    </p>
                  </div>

                  <div className="text-right">
                    {(() => {
                      // Cores básicas para status (pode ajustar)
                      const map: Record<string, { classes: string; text: string }> = {
                        Scheduled: { classes: "bg-white/6 text-white", text: "Agendada" },
                        Live: { classes: "bg-green-600 text-white", text: "Ao vivo" },
                        Finished: { classes: "bg-sky-600 text-white", text: "Finalizada" },
                        Cancelled: { classes: "bg-red-600 text-white", text: "Cancelada" },
                      };
                      const Status = map[m.status] ?? {
                        classes: "bg-white/6 text-white",
                        text: m.status,
                      };
                      return (
                        <span className={`inline-block text-xs px-2 py-1 rounded-md ${Status.classes}`}>
                          {Status.text}
                        </span>
                      );
                    })()}

                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/matches/${m._id}/edit`}
                        className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
                      >
                        Editar
                      </Link>

                      <Link
                        href={`/matches/${m._id}`}
                        className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
                      >
                        Ver público
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
        </section>

        <p className="mt-8 text-sm text-gray-400">
          Dica: use o botão “Criar partida” para adicionar novas partidas ou clique em
          “Editar” para alterar uma já existente.
        </p>
      </div>
    </div>
  );
}
