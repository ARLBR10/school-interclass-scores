"use client";

import Link from "next/link";
import { use } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

type Player = {
  id: string;
  name: string;
  class: string;
  alias: string[]; // required but can be empty
  height?: string | null;
  weight?: string | null;
  age?: number | null;
  photo?: string | null;
  socialMedias?: Record<string, string | null> | null;
};

function formatOptional(value: any) {
  if (value === undefined || value === null || value === "")
    return "Não definido";
  return value;
}

export default function PlayerPage({ params }: Props) {
  const id = use(params).id;

  const player = {
    id: "1",
    name: "João Silva",
    class: "3A",
    alias: ["J-Silva", "Capitão"],
    height: "1.78m",
    weight: "72kg",
    age: 17,
    photo:
      "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=800&q=80&auto=format&fit=crop",
    socialMedias: {
      instagram: "https://instagram.com/joaosilva",
      tiktok: null,
    },
  }

  // If you want a loading state when params are not yet available
  const isLoading = !id;

  const playerName = player ? player.name : "Não definido";
  const playerClass = player ? player.class : "Não definido";
  const playerAlias =
    player && player.alias !== undefined && player.alias !== null
      ? player.alias
      : null;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            {isLoading ? (
              <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
            ) : (
              playerName
            )}
          </h1>
          <Link
            href="/players"
            className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-3 text-gray-300">
          {isLoading ? (
            <span className="inline-block h-4 w-40 bg-white/10 rounded animate-pulse" />
          ) : (
            `Classe: ${playerClass}`
          )}
        </p>

        <section className="mt-6 bg-white/3 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white">
            Informações do Jogador
          </h2>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Photo */}
            <div className="w-full sm:w-40 flex-shrink-0">
              {player && player.photo ? (
                // Using regular img to avoid external image domain config
                // Tailwind classes keep appearance consistent
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-40 h-40 object-cover rounded-md border border-white/10"
                />
              ) : (
                <div className="w-40 h-40 bg-white/5 rounded-md border border-white/10 flex items-center justify-center text-gray-400">
                  Foto não definida
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 text-gray-300">
              <dl className="grid grid-cols-1 gap-y-2">
                <div>
                  <dt className="text-sm text-white">Nome</dt>
                  <dd className="text-sm">{formatOptional(playerName)}</dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Classe</dt>
                  <dd className="text-sm">{formatOptional(playerClass)}</dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Apelidos</dt>
                  <dd className="text-sm">
                    {playerAlias === null ? (
                      "Não definido"
                    ) : playerAlias.length === 0 ? (
                      // Alias exists but is empty array: show uma indicação neutra
                      "Nenhum"
                    ) : (
                      <ul className="list-disc list-inside">
                        {playerAlias.map((a, i) => (
                          <li key={i}>{a || "Não definido"}</li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Altura</dt>
                  <dd className="text-sm">
                    {formatOptional(player ? player.height : null)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Peso</dt>
                  <dd className="text-sm">
                    {formatOptional(player ? player.weight : null)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Idade</dt>
                  <dd className="text-sm">
                    {player && player.age !== undefined && player.age !== null
                      ? player.age
                      : "Não definido"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-white">Redes Sociais</dt>
                  <dd className="text-sm">
                    {player && player.socialMedias ? (
                      Object.entries(player.socialMedias).length === 0 ? (
                        "Nenhuma"
                      ) : (
                        <ul className="list-disc list-inside">
                          {Object.entries(player.socialMedias).map(
                            ([key, url]) => (
                              <li key={key}>
                                {key}:{" "}
                                {url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-300 underline"
                                  >
                                    {url}
                                  </a>
                                ) : (
                                  "Não definido"
                                )}
                              </li>
                            ),
                          )}
                        </ul>
                      )
                    ) : (
                      "Não definido"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
