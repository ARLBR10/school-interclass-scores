'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AdminTeamsPage() {
  const [form, setForm] = useState({
    name: '',
    sport: '',
    members: [] as string[],
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const createTeam = useMutation(api.teams.createTeam);
  const teams = useQuery(api.teams.listTeams);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, name: e.target.value });
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, sport: e.target.value });
  };

  const handleMemberChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newMembers = [...form.members];
    newMembers[index] = e.target.value;
    setForm({ ...form, members: newMembers });
  };

  const addMember = () => {
    setForm({ ...form, members: [...form.members, ''] });
  };

  const removeMember = (index: number) => {
    const newMembers = form.members.filter((_, i) => i !== index);
    setForm({ ...form, members: newMembers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sport || form.members.length === 0) {
      setMessage('Please fill in all fields and add at least one member.');
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await createTeam({ name: form.name, sport: form.sport, members: form.members });
      setMessage('Team created successfully!');
      setIsSuccess(true);
      setForm({ name: '', sport: '', members: [] });
    } catch (error) {
      setMessage(`Error creating team: ${error}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin: Register New Team</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Team Name</label>
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter team name"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Sport</label>
          <select
            value={form.sport}
            onChange={handleSportChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a sport</option>
            <option value="Volleyball">Volleyball</option>
            <option value="Soccer Ball">Soccer Ball</option>
            <option value="Basketball">Basketball</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Members</label>
          {form.members.map((member, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={member}
                onChange={(e) => handleMemberChange(index, e)}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                placeholder={`Member ${index + 1} name`}
              />
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMember}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-2"
          >
            Add Member
          </button>
        </div>

        {message && (
          <p className={`mb-4 p-3 rounded-md ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !form.name || !form.sport || form.members.length === 0}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          {loading ? 'Creating Team...' : 'Create Team'}
        </button>
      </form>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Existing Teams</h2>
        {teams === undefined ? (
          <p className="text-center text-gray-500">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="text-center text-gray-500">No teams registered yet.</p>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold">{team.name} - {team.sport}</h3>
                <ul className="mt-2 list-disc list-inside">
                  {team.members.map((member, index) => (
                    <li key={index} className="text-sm">{member}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}