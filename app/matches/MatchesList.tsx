"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { MatchStatus } from "../utils/Translations";

export default function matchesList() {
  const matches = useQuery(api.matches.getAll);
  const teams = useQuery(api.teams.getAll);
  let teamsLinks = {} as any;

  teams?.forEach((m) => {
    teamsLinks[m._id] = <Link href={`/teams/${m._id}`}>Time {m.name}</Link>;
  });
  const isLoading = !matches;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
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
        : matches?.map((m) => (
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
                  {(m.status === "Finished"
                    ? new Date(
                        m.events.find((m1) => m1.type === "FinishedMatch")!
                          .time * 1000
                      )
                    : m.scheduledData !== undefined
                    ? new Date(m.scheduledData * 1000)
                    : false
                  ).toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="text-right">
                {/* status badge colors */}
                {(() => {
                  const map = MatchStatus;
                  const Status = map[m.status] ?? {
                    classes: "bg-white/6 text-white",
                    text: m.status,
                  };
                  return (
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-md ${Status.classes}`}
                    >
                      {Status.text}
                    </span>
                  );
                })()}

                <div className="mt-2">
                  <Link
                    href={`/matches/${m._id}`}
                    className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
                  >
                    Detalhes
                  </Link>
                </div>
              </div>
            </article>
          ))}
    </div>
  );
}
