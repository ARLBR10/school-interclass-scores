import TeamsList from "./TeamsList";

export default function TeamsPage() {
  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          Equipes
        </h1>
        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Lista das equipes participantes da competição.
        </p>

        <section className="mt-8">
          <TeamsList />
        </section>
      </div>
    </div>
  );
}
