"use client";

import { use } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function eventLabel(e: any) {
  switch (e.type) {
    case "match_started":
      return "Partida iniciada";
    case "match_ended":
      return "Partida encerrada";
    case "player_switched":
      return `Troca: ${e.playerOutName} → ${e.playerInName}`;
    case "player_kicked":
      return `Jogador expulso: ${e.playerName}`;
    case "score_added":
      return `Gol: ${e.team === "home" ? e.teamHomeName : e.teamAwayName} (+${
        e.points
      }) — ${e.playerName ?? "—"}`;
    case "score_removed":
      return `Placar anulado: ${e.reason ?? "—"}`;
    default:
      return e.type;
  }
}

function isCenterEvent(e: any) {
  return e.type === "match_started" || e.type === "match_ended";
}

function MatchTimeline({ events }: { events: any[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-white">Linha do tempo</h3>
      <div className="mt-6 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 transform -translate-x-1/2" />

        <div className="space-y-6">
          {sorted.map((e) => {
            const center = isCenterEvent(e);
            const side = center
              ? "center"
              : e.team === "away"
              ? "right"
              : "left";

            return (
              <div key={e.id} className="relative">
                <div
                  className={`w-full flex items-center ${
                    center
                      ? "justify-center"
                      : side === "right"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-xs">
                    <div
                      className={`inline-flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm ${
                        center ? "text-center mx-auto" : ""
                      }`}
                    >
                      <div className="text-2xl">{e.icon ?? "•"}</div>
                      <div>
                        <div className="text-sm text-gray-200">
                          {eventLabel(e)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(e.ts)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* connector dot removed to avoid visible artifacts */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MatchPage({ params }: Props) {
  const { id } = use(params);

  // Mock data in-page (substituir por Convex depois)
  const mockMatch = {
    id,
    date: new Date().toISOString(),
    teams: {
      home: { id: "t1", name: "Escola Alfa" },
      away: { id: "t2", name: "Colégio Beta" },
    },
    finalScore: { home: 3, away: 2 },
    events: [
      {
        id: "e1",
        ts: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: "match_started",
        icon: "🏁",
      },
      {
        id: "e2",
        ts: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        type: "score_added",
        team: "home",
        points: 1,
        playerName: "João",
        teamHomeName: "Escola Alfa",
        teamAwayName: "Colégio Beta",
        icon: "⚽",
      },
      {
        id: "e3",
        ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: "player_switched",
        playerOutName: "Miguel",
        playerInName: "Lucas",
        icon: "🔁",
      },
      {
        id: "e4",
        ts: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        type: "player_kicked",
        playerName: "Carlos",
        icon: "🟥",
      },
      {
        id: "e5",
        ts: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        type: "score_added",
        team: "away",
        points: 1,
        playerName: "Rafaela",
        teamHomeName: "Escola Alfa",
        teamAwayName: "Colégio Beta",
        icon: "⚽",
      },
      {
        id: "e6",
        ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: "score_removed",
        reason: "Anulação por falta",
        icon: "⚠️",
      },
      {
        id: "e7",
        ts: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        type: "score_added",
        team: "home",
        points: 2,
        playerName: "Pedro",
        teamHomeName: "Escola Alfa",
        teamAwayName: "Colégio Beta",
        icon: "🥅",
      },
      {
        id: "e8",
        ts: new Date().toISOString(),
        type: "match_ended",
        icon: "🏁",
      },
    ],
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          Informações da Partida
        </h1>

        <section className="mt-8 bg-white/3 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-300">Time</div>
                <div className="text-xl font-medium text-white">
                  {mockMatch.teams.home.name}
                </div>
              </div>

              <div className="text-4xl font-bold text-white">
                {mockMatch.finalScore.home}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-400">Data</div>
              <div className="text-sm text-gray-300">
                {formatTime(mockMatch.date)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold text-white">
                {mockMatch.finalScore.away}
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300">Time</div>
                <div className="text-xl font-medium text-white">
                  {mockMatch.teams.away.name}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-white/10" />

          <MatchTimeline events={mockMatch.events} />
        </section>
      </div>
    </div>
  );
}
