import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function MatchesPage() {
  const matches = useQuery(api.matches.getMatches);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Matches</h1>
      {matches?.map((match: any) => (
        <div key={match._id} className="border p-4 mb-4 rounded">
          <h2 className="text-xl font-bold">{match.team1Id} vs {match.team2Id} ({match.sport})</h2>
          <p>Date: {match.date} | Status: {match.status}</p>
          <p>Scores update live via Convex subscriptions</p>
        </div>
      )) || <p>No matches yet.</p>}
    </div>
  );
}



