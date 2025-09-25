"use client";

import { useParams, useRouter } from "next/navigation";
import { use, useState } from "react";
import { MatchForm } from "../../components/MatchForm";
import Link from "next/link";

/**
 * Página de edição administrativa de uma partida.
 *
 * Observações:
 * - Reutiliza `MatchForm` exportado em `app/admin/matches/page.tsx`.
 * - Não realiza integração com Convex aqui — a tentativa de busca abaixo é apenas
 *   uma sugestão (fetch em `/api/admin/matches/:id`). Você pode ajustar para usar
 *   as funções Convex no cliente/servidor como preferir.
 *
 * Comportamento:
 * - Lê `id` via `useParams`.
 * - Tenta buscar dados em `/api/admin/matches/:id` (se existir).
 * - Mostra `MatchForm` com `initial` preenchido quando disponível.
 * - `onSubmit` atual apenas faz `console.log` e redireciona de volta à lista admin.
 */

export default function AdminMatchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const matchId = id
  const isLoading = !matchId

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">
              Editar partida
            </h1>
            <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
              Editar partida — ID:{" "}
              <span className="font-mono">{matchId || "—"}</span>
            </p>
          </div>
        </div>

        <section className="mt-8">
          {isLoading ? (
            <div className="bg-white/5 p-6 rounded-lg">
              <p className="text-gray-300">Carregando dados da partida...</p>
            </div>
          ) : (
            <>
              {/* {error && (
                <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded text-yellow-200">
                  {error}
                </div>
              )} */}

              <div className="mb-4 text-sm text-gray-300">
                Preencha os campos abaixo e clique em{" "}
                <strong>Salvar partida</strong>.
              </div>

              <MatchForm matchID={matchId} />

              <div className="mt-4 flex gap-2">
                <Link
                  href={"/admin/matches"}
                  className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm"
                >
                  Voltar
                </Link>

                <Link
                  href={`/matches/${matchId}`}
                  className="bg-white/6 text-white rounded-md px-3 py-1 text-sm"
                >
                  Ver como público
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
