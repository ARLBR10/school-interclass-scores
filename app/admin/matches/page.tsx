"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminMatches() {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scoringTeam, setScoringTeam] = useState("");
  const teams = useQuery(api.teams.getTeams);
  const matches = useQuery(api.matches.getMatches);
  const createMatch = useMutation(api.matches.createMatch);
  const addEvent = useMutation(api.matches.addScoreEvent);

  const handleCreateMatch = () => {
    if (team1 && team2 && sport && date) {
      createMatch({ team1Id: team1, team2Id: team2, sport, date });
      setTeam1(""); setTeam2(""); setSport(""); setDate("");
    }
  };

  const handleAddPoint = (type: "point" | "penalty", value: number) => {
    if (selectedMatch && scoringTeam) {
      addEvent({ matchId: selectedMatch!, teamId: scoringTeam, type, value });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Matches & Live Scores</h1>
      <div className="mb-4">
        <select onChange={(e) => setTeam1(e.target.value)} className="border p-2 mr-2">
          <option value="">Team 1</option>
          {teams?.map((team: any) => <option key={team._id} value={team._id}>{team.name}</option>)}
        </select>
        <select onChange={(e) => setTeam2(e.target.value)} className="border p-2 mr-2">
          <option value="">Team 2</option>
          {teams?.map((team: any) => <option key={team._id} value={team._id}>{team.name}</option>)}
        </select>
        <input placeholder="Sport" value={sport} onChange={(e) => setSport(e.target.value)} className="border p-2 mr-2" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 mr-2" />
        <button onClick={handleCreateMatch} className="bg-blue-500 text-white p-2">Create Match</button>
      </div>
      <div className="mb-4">
        <select value={selectedMatch || ""} onChange={(e) => setSelectedMatch(e.target.value)} className="border p-2 mr-2">
          <option value="">Select Match</option>
          {matches?.map((m: any) => <option key={m._id} value={m._id}>{m.team1Id} vs {m.team2Id}</option>)}
        </select>
        <select value={scoringTeam || ""} onChange={(e) => setScoringTeam(e.target.value)} className="border p-2 mr-2">
          <option value="">Scoring Team</option>
          {teams?.map((team: any) => <option key={team._id} value={team._id}>{team.name}</option>)}
        </select>
        <button onClick={() => handleAddPoint("point", 1)} className="bg-green-500 text-white p-2 mr-2">+ Point</button>
        <button onClick={() => handleAddPoint("penalty", -1)} className="bg-red-500 text-white p-2">+ Penalty</button>
      </div>
      {/* List matches with basic info; events can be fetched per match in a separate component */}
        {matches?.map((match: any) => (
          <div key={match._id} className="border p-4 mb-4 rounded">
            <h3>{match.team1Id} vs {match.team2Id} - {match.sport}</h3>
            <p>Date: {match.date} | Status: {match.status}</p>
            <p>Scores update live via Convex subscriptions</p>
          </div>
        ))}
    </div>
  );
}



