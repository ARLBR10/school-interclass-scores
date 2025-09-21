// Dynamic match page placeholder.
// TODO: Fetch match details from Convex using the generated API.

type Props = {
  params: { id: string };
};

export default function MatchPage({ params }: Props) {
  const { id } = params;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:py-16">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          Partida #{id}
        </h1>

        <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg">
          Detalhes da partida (dados ainda não carregados — implementar Convex).
        </p>

        <section className="mt-8 bg-white/3 rounded-lg p-4">
          <p className="text-gray-300">Carregando detalhes da partida...</p>
        </section>
      </div>
    </div>
  );
}
