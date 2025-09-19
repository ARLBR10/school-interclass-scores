'use client'

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function TeamsPage() {
  const teams = useQuery(api.teams.listTeams);

  if (teams === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  if (!teams || !Array.isArray(teams)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">Error loading teams. Please try again later.</div>
      </div>
    );
  }

  const groupedTeams = teams.reduce((acc: Record<string, typeof teams>, team) => {
    const sport = team.sport || 'Unknown';
    if (!acc[sport]) {
      acc[sport] = [];
    }
    acc[sport].push(team);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Interclass Teams</h1>
      {Object.entries(groupedTeams).length === 0 ? (
        <p className="text-center text-gray-500">No teams available yet.</p>
      ) : (
        Object.entries(groupedTeams).map(([sport, sportTeams]) => (
          <section key={sport} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 capitalize border-b pb-2">
              {sport} Teams
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportTeams.map((team) => (
                <div
                  key={team._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">{team.name}</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {team.members?.length > 0 ? (
                        team.members.map((member, index) => (
                          <li key={index} className="text-sm">{member}</li>
                        ))
                      ) : (
                        <li className="text-sm italic text-gray-500">No members yet</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}