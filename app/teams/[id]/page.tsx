import Link from "next/link";

// Dynamic team page.
// TODO: Fetch real team data with Convex API, for example:
// `import { api } from '../../../convex/_generated/api'` and
// `const team = await api.teams.get.fetch(id)` when ready.

type Props = {
  params: { id: string };
};

export default function TeamPage({ params }: Props) {
  const { id } = params;

  // Placeholder data
  const team = {
    id,
    name: `Equipe ${id}`,
    points: 10,
    members: ["Aluno 1", "Aluno 2", "Aluno 3"],
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            {team.name}
          </h1>
          <Link
            href="/teams"
            className="bg-transparent border border-white/10 text-white rounded-md px-3 py-1 text-sm"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-3 text-gray-300">{team.points} pontos</p>

        <section className="mt-6 bg-white/3 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white">Membros</h2>
          <ul className="mt-2 list-disc list-inside text-gray-300">
            {team.members.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
