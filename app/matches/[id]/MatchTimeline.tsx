"use client";

import { PlayerItem } from "@/app/utils/PlayerItem";

type PlayerInfo = {
  [key: string]: any; // I am lazy
  name: string;
  _id: string;
};

function eventLabel(e: MatchEvents, teamInfo: teamInfoType[]) {
  switch (e.type) {
    case "StartedMatch":
      return "Partida iniciada";
    case "FinishedMatch":
      return "Partida finalizada";
    case "AddScore":
      let PlayerLink;
      if (e.player) {
        PlayerLink = (
          <span>
            — <PlayerItem id={e.player} notIncludeClass={true} />
          </span>
        );
      }

      return (
        <span>
          Ponto: +{e.score} para {teamInfo.find((t) => t.id === e.team)?.link}{" "}
          {PlayerLink}
        </span>
      );
    case "RemScore":
      let RemPlayerLink;
      if (e.player) {
        RemPlayerLink = (
          <span>
            — <PlayerItem id={e.player} notIncludeClass={true} />
          </span>
        );
      }

      return (
        <span>
          Ponto anulado: -{e.score} para{" "}
          {teamInfo.find((t) => t.id === e.team)?.link} {RemPlayerLink}
        </span>
      );
    case "SwitchPlayers":
      const Player0Link = (
        <PlayerItem id={e.players[0]} notIncludeClass={true} />
      );
      const Player1Link = (
        <PlayerItem id={e.players[1]} notIncludeClass={true} />
      );

      return (
        <span>
          Troca {Player0Link} {"->"} {Player1Link}
        </span>
      );
    case "KickedPlayer":
      let KickPlayerLink;
      if (e.player) {
        KickPlayerLink = (
          <span>
            <PlayerItem id={e.player} notIncludeClass={true} />
          </span>
        );
      }

      return <span>Jogador expulso: {KickPlayerLink}</span>;
    default:
      return "Unknown";
  }
}

function isCenterEvent(e: MatchEvents) {
  return e.type === "StartedMatch" || e.type === "FinishedMatch";
}

type teamInfoType = {
  name: string | undefined;
  score: number;
  id: string | any;
  sport: string | undefined;
  link: string | any; // hihihi
};

type MatchEvents =
  | {
      player?: string | undefined;
      type: "AddScore" | "RemScore";
      time: number;
      team: string;
      score: number;
    }
  | {
      player?: string | undefined;
      type: "KickedPlayer";
      time: number;
      team: string;
    }
  | {
      type: "StartedMatch" | "FinishedMatch";
      time: number;
    }
  | {
      type: "SwitchPlayers";
      time: number;
      team: string;
      players: string[];
    };

export function MatchTimeline({
  events = [],
  teamInfo,
}: {
  events?: MatchEvents[];
  teamInfo: teamInfoType[];
}) {
  const sorted = [...(events ?? [])].sort((a, b) => {
    const ta = typeof a.time === "number" ? a.time : Number(a.time);
    const tb = typeof b.time === "number" ? b.time : Number(b.time);
    return ta - tb;
  });

  const isLoading = !teamInfo || teamInfo.length === 0 || events == null;
  const isEmpty = events && events.length === 0;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-white">Linha do tempo</h3>
      <div className="mt-6 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 transform -translate-x-1/2" />

        <div className="space-y-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="relative">
                <div className="w-full flex items-center justify-center">
                  <div className="max-w-xs">
                    <div
                      className={`inline-flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm text-center mx-auto`}
                    >
                      <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
                      <div className="w-40">
                        <div className="h-4 bg-white/10 rounded w-32 mb-2 animate-pulse" />
                        <div className="h-3 bg-white/10 rounded w-24 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : isEmpty ? (
            <div className="relative">
              <div className="w-full flex items-center justify-center">
                <div className="max-w-xs">
                  <div
                    className={`inline-flex items-center gap-3 p-3 rounded-lg text-center mx-auto`}
                  >
                    <div className="text-sm text-gray-400">
                      Esta partida ainda não começou.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            sorted.map((e) => {
              const center = isCenterEvent(e);
              let side: "center" | "right" | "left";
              if (
                e.type === "AddScore" ||
                e.type === "RemScore" ||
                e.type === "KickedPlayer" ||
                e.type === "SwitchPlayers"
              ) {
                const isFirstTeam =
                  teamInfo && teamInfo[0] ? e.team === teamInfo[0].id : false;
                side = isFirstTeam ? "left" : "right";
              } else {
                side = "center";
              }

              const icon_list = {
                StartedMatch: "🏁",
                AddScore: teamInfo[0].sport === "Basketball" ? "🏀" : "⚽️",
                RemScore: "⚠️",
                KickedPlayer: "🟥",
                SwitchPlayers: "🔁",
                FinishedMatch: "🏁",
              } as {
                [key: string]: string;
              };
              const icon = icon_list[e.type];

              return (
                <div key={`${e.time}-${e.type}`} className="relative">
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
                        <div className="text-2xl">{icon ?? "•"}</div>
                        <div>
                          <div className="text-sm text-gray-200">
                            {eventLabel(e, teamInfo)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(e.time * 1000).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* connector dot removed to avoid visible artifacts */}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
