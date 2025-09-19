"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminTeams() {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [memberName, setMemberName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const addTeam = useMutation(api.teams.addTeam);
  const addMember = useMutation(api.teams.addMember);

  const handleAddTeam = () => {
    addTeam({ name, sport, members: [] });
    setName(""); setSport("");
  };

  const handleAddMember = (teamId) => {
    addMember({ teamId, name: memberName });
    setMemberName("");
  };

  // Fetch teams via useQuery; add forms for team/member registration
  // Stub: Assume auth check here

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Register Teams</h1>
      <div className="mb-4">
        <input placeholder="Team Name" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 mr-2" />
        <input placeholder="Sport" value={sport} onChange={(e) => setSport(e.target.value)} className="border p-2 mr-2" />
        <button onClick={handleAddTeam} className="bg-blue-500 text-white p-2">Add Team</button>
      </div>
      {/* List teams, form to add members per team */}
      <div>
        <input placeholder="Member Name" value={memberName} onChange={(e) => setMemberName(e.target.value)} className="border p-2 mr-2" />
        <button onClick={() => handleAddMember(selectedTeam)} className="bg-green-500 text-white p-2">Add Member</button>
      </div>
    </div>
  );
}
