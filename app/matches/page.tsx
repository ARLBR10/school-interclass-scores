'use client'

import { useQuery } from '@convex/react'
import { api } from '../../convex/_generated/api'

interface Team {
  _id: string;
  name: string;
  sport: string;
  members: Array<{ id: string; name: string }>;
}

interface Match {
  _id: string;
  teams: [string, string]; // team1Id, team2Id as tuple for clarity
  date: number;
  status: string;
}

interface Event {
  type: 'point' | 'penalty';
  teamId: string;
  value: number;
  timestamp: number;
}

export default function MatchesPage() {
  const matches = useQuery(api.matches.listMatches) as Match[] | undefined
  const teams = useQuery(api.teams.listTeams) as Team[] | undefined

  if (matches === undefined) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading matches...</div>
      </div>
    )
  }

  if (matches === null) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">Error loading matches. Please try again.</div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">No matches available yet.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Interclass Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match: Match) => {
          const events = useQuery(api.matches.getMatchEvents, { matchId: match._id }) as Event[] | undefined

          let team1Points = 0
          let team2Points = 0
          let team1Penalties = 0
          let team2Penalties = 0

          if (events !== undefined) {
            const team1Id = match.teams[0]
            const team2Id = match.teams[1]

            const team1Events = events.filter((event: Event) => event.teamId === team1Id)
            const team2Events = events.filter((event: Event) => event.teamId === team2Id)

            team1Points = team1Events
              .filter((event: Event) => event.type === 'point')
              .reduce((sum: number, event: Event) => sum + event.value, 0)
            team1Penalties = team1Events
              .filter((event: Event) => event.type === 'penalty')
              .reduce((sum: number, event: Event) => sum + event.value, 0)
            team2Points = team2Events
              .filter((event: Event) => event.type === 'point')
              .reduce((sum: number, event: Event) => sum + event.value, 0)
            team2Penalties = team2Events
              .filter((event: Event) => event.type === 'penalty')
              .reduce((sum: number, event: Event) => sum + event.value, 0)
          }

          const team1 = teams?.find((t: Team) => t._id === match.teams[0])
          const team2 = teams?.find((t: Team) => t._id === match.teams[1])

          const isLive = match.status === 'live' // Assuming status field indicates live matches
          const matchIdDisplay = match._id.slice(-6).toUpperCase() // Shortened ID for display

          return (
            <div key={match._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-1">Match #{matchIdDisplay}</h2>
                <p className="text-sm text-gray-600">Date: {new Date(match.date).toLocaleDateString()}</p>
                <p className={`text-sm font-medium ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                  Status: {match.status} {isLive && '(Live Updates)'}
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <h3 className="font-bold text-lg">{team1?.name || 'Unknown Team'}</h3>
                  <p className="text-2xl font-bold text-blue-600">{team1Points} pts</p>
                  <p className="text-sm text-red-500">- {team1Penalties} pens</p>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{team2?.name || 'Unknown Team'}</h3>
                  <p className="text-2xl font-bold text-blue-600">{team2Points} pts</p>
                  <p className="text-sm text-red-500">- {team2Penalties} pens</p>
                </div>
              </div>
              {events === undefined && (
                <div className="text-center text-gray-500 text-sm">Loading events...</div>
              )}
              {events === null && (
                <div className="text-center text-red-500 text-sm">Error loading events</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}