import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TeamsPage() {
  const teams = useQuery(api.teams.getTeams);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teams</h1>
      {teams?.map((team: any) => (
        <div key={team._id} className="border p-4 mb-4 rounded">
          <h2 className="text-xl font-bold">{team.name} ({team.sport})</h2>
          <h3 className="text-lg font-semibold mt-2">Members:</h3>
          <ul className="list-disc ml-6">
            {team.members?.map((member: any) => (
              <li key={member.id}>{member.name} {member.position && ` - ${member.position}`}</li>
            )) || <li>No members yet.</li>}
          </ul>
        </div>
      )) || <p>No teams yet.</p>}
    </div>
  );
}



