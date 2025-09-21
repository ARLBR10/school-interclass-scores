"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BetterMatchText } from "./utils/Match";

export default function Home() {
  const nextMatch = useQuery(api.matches.nextMatch)
  const nextMatchText = BetterMatchText();


  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">Olá</h1>
        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Bem-vindo ao aplicativo de Pontuações Interclasse Escolar.
        </p>

        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/3 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white">Próxima Partida</h2>
            <p className="mt-2 text-gray-300 text-sm">
              {nextMatchText || "Time 1 vs Time 2"}
            </p>
            <div className="mt-4 flex gap-2">
              <button className="bg-white/6 hover:bg-white/8 text-white rounded-md px-3 py-2 touchable">
                Detalhes
              </button>
              <button className="bg-transparent border border-white/10 text-white rounded-md px-3 py-2 touchable">
                Acompanhar
              </button>
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
