import Link from "next/link";

// Placeholder component for listing teams.
// TODO: Replace placeholder data with Convex API calls using
// `import { api } from '../../convex/_generated/api'` and
// `await api.teams.list.fetch()` (or similar) when ready.

export default function TeamsList() {
  const placeholder = [
    { id: "t1", name: "Escola A", points: 12 },
    { id: "t2", name: "Escola B", points: 9 },
    { id: "t3", name: "Escola C", points: 7 },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      {placeholder.map((t) => (
        <article
          key={t.id}
          className="bg-white/3 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-medium text-white">{t.name}</h3>
            <p className="mt-1 text-sm text-gray-300">{t.points} pontos</p>
          </div>
          <div className="text-right">
            <Link
              href={`/teams/${t.id}`}
              className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm inline-block"
            >
              Ver equipe
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
