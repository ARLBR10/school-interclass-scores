import Link from "next/link";

// Placeholder component for listing matches.
// TODO: Replace placeholder data with Convex API calls using
// `import { api } from '../../convex/_generated/api'` and
// `await api.matches.list.fetch()` (or similar) when ready.

export default function MatchesList() {
  const placeholder = [
    {
      id: "1",
      teams: ["Escola A", "Escola B"],
      time: "2025-09-30T14:00:00.000Z",
      status: "Scheduled",
    },
    {
      id: "2",
      teams: ["Escola C", "Escola D"],
      time: "2025-10-01T10:00:00.000Z",
      status: "Finished",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      {placeholder.map((m) => (
        <article
          key={m.id}
          className="bg-white/3 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-medium text-white">
              {m.teams[0]} <span className="text-gray-400">vs</span>{" "}
              {m.teams[1]}
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              {new Date(m.time).toLocaleString("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="text-right">
            {/* status badge colors */}
            {(() => {
              const map: Record<string, any> = {
                Scheduled: {
                  classes: "bg-blue-600 text-white",
                  text: "Agendado",
                },
                Delayed: {
                  classes: "bg-yellow-600 text-white",
                  text: "Atrasado",
                },
                Canceled: {
                  classes: "bg-red-600 text-white",
                  text: "Cancelado",
                },
                Started: {
                  classes: "bg-green-600 text-white",
                  text: "Em progresso",
                },
                Finished: {
                  classes: "bg-gray-600 text-white",
                  text: "Finalizado",
                },
              };
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
                href={`/matches/${m.id}`}
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
