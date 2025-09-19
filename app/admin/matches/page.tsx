'use client';

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export default function AdminMatchesPage() {
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [status, setStatus] = useState("scheduled");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const teams = useQuery(api.teams.listTeams);
  const matches = useQuery(api.matches.listMatches);

  const createMatch = useMutation(api.matches.createMatch);
  const addEvent = useMutation(api.matches.addMatchEvent);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Id || !team2Id || !date) {
      setMessage("Please fill all fields.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await createMatch({
        teams: [team1Id as Id<"teams">, team2Id as Id<"teams">],
        date: new Date(date).getTime(),
        status
      });
      setTeam1Id("");
      setTeam2Id("");
      setDate(new Date().toISOString().slice(0, 16));
      setStatus("scheduled");
      setMessage("Match created successfully.");
    } catch (error) {
      setMessage("Error creating match: " + (error as Error).message);
    }
    setLoading(false);
  };

  if (!teams || !matches) {
    return <div className="p-4">Loading...</div>;
  }

  const getScore = (events: any[], teamId: string) => {
    return events
      .filter((e) => e.teamId === teamId)
      .reduce((sum, e) => sum + (e.type === "point" ? e.value : -e.value), 0);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin Matches</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Match</h2>
        <form onSubmit={handleCreateMatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Team 1</label>
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Team 1</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Team 2</label>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Team 2</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Match"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Matches</h2>
        {matches.length === 0 ? (
          <p>No matches yet.</p>
        ) : (
          matches.map((match) => {
            const team1 = teams.find((t) => t._id === match.teams[0]);
            const team2 = teams.find((t) => t._id === match.teams[1]);
            const matchName = `${team1?.name || "TBD"} vs ${team2?.name || "TBD"}`;
            const matchDate = new Date(match.date).toLocaleString();

            const statusClass =
              match.status === "scheduled"
                ? "bg-yellow-100 text-yellow-800"
                : match.status === "live"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800";

            return (
              <div key={match._id} className="bg-white shadow-md rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{matchName}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${statusClass}`}>
                    {match.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{matchDate}</p>
                {match.status === "live" ? (
                  <div>
                    <div className="flex justify-between mb-4">
                      <span>{team1?.name || "TBD"}: </span>
                      <span>{getScore(match.events || [], match.teams[0])}</span>
                      <span>|</span>
                      <span>{team2?.name || "TBD"}: </span>
                      <span>{getScore(match.events || [], match.teams[1])}</span>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <select id={`team-select-${match._id}`} defaultValue={match.teams[0]} className="p-1 border rounded">
                        <option value={match.teams[0]}>{team1?.name}</option>
                        <option value={match.teams[1]}>{team2?.name}</option>
                      </select>
                      <input
                        id={`value-input-${match._id}`}
                        type="number"
                        defaultValue="1"
                        className="w-16 p-1 border rounded"
                        min="0"
                      />
                      <select id={`type-select-${match._id}`} defaultValue="point" className="p-1 border rounded">
                        <option value="point">Point</option>
                        <option value="penalty">Penalty</option>
                      </select>
                      <button
                        onClick={async () => {
                          const teamSelect = document.getElementById(`team-select-${match._id}`) as HTMLSelectElement;
                          const valueInput = document.getElementById(`value-input-${match._id}`) as HTMLInputElement;
                          const typeSelect = document.getElementById(`type-select-${match._id}`) as HTMLSelectElement;
                          if (!teamSelect || !valueInput || !typeSelect) return;
                          const teamId = teamSelect.value as Id<"teams">;
                          const value = parseInt(valueInput.value) || 1;
                          const type = typeSelect.value as "point" | "penalty";
                          try {
                            await addEvent({ matchId: match._id, type, teamId, value });
                            setMessage("Event added successfully.");
                          } catch (error) {
                            setMessage("Error adding event: " + (error as Error).message);
                          }
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Add Event
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Match not live.</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}