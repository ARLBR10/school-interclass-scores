import MatchesList from "./MatchesList";

export default function MatchesPage() {
  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          Partidas
        </h1>

        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Aqui você verá a lista de partidas agendadas e resultados recentes.
        </p>

        <section className="mt-8">
          <MatchesList />
        </section>
      </div>
    </div>
  );
}
