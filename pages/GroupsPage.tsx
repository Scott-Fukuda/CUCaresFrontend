
import React, { useState } from 'react';
import { StudentGroup, User, StudentGroupCategory, studentGroupCategories } from '../types';

interface GroupsPageProps {
  currentUser: User;
  allGroups: StudentGroup[];
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
  createGroup: (groupName: string, category: StudentGroupCategory) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser, allGroups, joinGroup, leaveGroup, createGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<StudentGroupCategory | ''>('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim() && newGroupCategory) {
        createGroup(newGroupName.trim(), newGroupCategory);
        setNewGroupName('');
        setNewGroupCategory('');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Manage Student Groups</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* All Groups */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Join a Group</h3>
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {allGroups.sort((a,b) => a.name.localeCompare(b.name)).map(group => {
              const isMember = currentUser.groupIds.includes(group.id);
              return (
                <li key={group.id} className="flex items-center justify-between bg-light-gray p-3 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-800">{group.name}</span>
                    <span className="block text-xs text-gray-500">{group.category}</span>
                  </div>
                  {isMember ? (
                    <button onClick={() => leaveGroup(group.id)} className="text-sm text-red-600 font-semibold hover:text-red-800">Leave</button>
                  ) : (
                    <button onClick={() => joinGroup(group.id)} className="text-sm text-green-600 font-semibold hover:text-green-800">Join</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Create Group */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Register a New Group</h3>
            <p className="text-sm text-gray-600 mb-4">Once registered, your group will appear here and on the leaderboard. (All submissions are auto-approved for now).</p>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                 <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter new group name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
                    required
                />
                <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as StudentGroupCategory)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition bg-white"
                    required
                >
                    <option value="" disabled>Select a category...</option>
                    {studentGroupCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button
                    type="submit"
                    disabled={!newGroupName.trim() || !newGroupCategory}
                    className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                    Register Group
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;