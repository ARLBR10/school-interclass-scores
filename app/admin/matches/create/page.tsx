"use client";

import React from "react";
import Link from "next/link";
import { MatchForm } from "../components/MatchForm";

/**
 * Página administrativa para criar uma nova partida.
 * Reutiliza o `MatchForm` definido em `app/admin/matches/page.tsx`.
 *
 * Observações:
 * - Não realiza persistência direta aqui — apenas demonstra o fluxo.
 * - Você pode integrar com Convex no `onSubmit` (ex.: `api.matches.create.mutate(...)`).
 */

export default function AdminMatchCreatePage() {
  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">
              Criar nova partida
            </h1>
            <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
              Preencha os dados da partida e clique em{" "}
              <strong>Salvar partida</strong>.
            </p>
          </div>

          <div className="mt-2">
            <Link
              href="/admin/matches"
              className="inline-block bg-transparent border border-white/10 text-white px-3 py-1 rounded-md text-sm"
            >
              Voltar
            </Link>
          </div>
        </div>

        <section className="mt-8">
          <MatchForm
          />
        </section>

        <p className="mt-6 text-sm text-gray-400">
          Observação: a persistência não está implementada nesta página. Integre
          a lógica de criação no callback <code>handleSubmit</code> quando
          estiver pronto.
        </p>
      </div>
    </div>
  );
}
