import Link from "next/link";

export default function AdminIndexPage() {
  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          Administração
        </h1>

        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Área administrativa — gerencie recursos do sistema.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/matches"
            className="block p-4 rounded-lg bg-white/5 hover:bg-white/6 transition-colors"
          >
            <h2 className="text-lg font-medium text-white">Partidas</h2>
            <p className="mt-1 text-sm text-gray-300">
              Criar, editar e gerenciar partidas.
            </p>
          </Link>

          <Link
            href="/admin/teams"
            className="block p-4 rounded-lg bg-white/5 hover:bg-white/6 transition-colors"
          >
            <h2 className="text-lg font-medium text-white">Equipes</h2>
            <p className="mt-1 text-sm text-gray-300">
              Gerenciar equipes participantes.
            </p>
          </Link>

          <Link
            href="/admin/players"
            className="block p-4 rounded-lg bg-white/5 hover:bg-white/6 transition-colors"
          >
            <h2 className="text-lg font-medium text-white">Jogadores</h2>
            <p className="mt-1 text-sm text-gray-300">
              Gerenciar os jogadores inscritos.
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
}
