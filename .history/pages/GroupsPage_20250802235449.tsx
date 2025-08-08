
import React, { useState } from 'react';
import { Organization, User, OrganizationCategory, organizationCategories } from '../types';
import { PageState } from '../App';

interface GroupsPageProps {
  currentUser: User;
  allOrgs: Organization[];
  joinOrg: (orgId: number) => void;
  leaveOrg: (orgId: number) => void;
  createOrg: (orgName: string, category: OrganizationCategory) => void;
  setPageState: (state: PageState) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser, allOrgs, joinOrg, leaveOrg, createOrg, setPageState }) => {
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCategory, setNewOrgCategory] = useState<OrganizationCategory | ''>('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName.trim() && newOrgCategory) {
        createOrg(newOrgName.trim(), newOrgCategory);
        setNewOrgName('');
        setNewOrgCategory('');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Manage Organizations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* All Groups */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Join an Organization</h3>
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {allOrgs.sort((a,b) => a.name.localeCompare(b.name)).map(org => {
              const isMember = currentUser.organizationIds.includes(org.id);
              return (
                <li key={org.id} className="flex items-center justify-between bg-light-gray p-3 rounded-lg">
                  <div className="flex-grow cursor-pointer" onClick={() => setPageState({ page: 'groupDetail', id: org.id })}>
                    <span className="font-medium text-gray-800 hover:text-cornell-red">{org.name}</span>
                    <span className="block text-xs text-gray-500">{org.category}</span>
                  </div>
                  {isMember ? (
                    <button onClick={() => leaveOrg(org.id)} className="text-sm text-red-600 font-semibold hover:text-red-800 ml-4">Leave</button>
                  ) : (
                    <button onClick={() => joinOrg(org.id)} className="text-sm text-green-600 font-semibold hover:text-green-800 ml-4">Join</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Create Group */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Register a New Organization</h3>
            <p className="text-sm text-gray-600 mb-4">Once registered, your organization will appear here and on the leaderboard.</p>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                 <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Enter new organization name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
                    required
                />
                <select
                    value={newOrgCategory}
                    onChange={(e) => setNewOrgCategory(e.target.value as OrganizationCategory)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition bg-white"
                    required
                >
                    <option value="" disabled>Select a category...</option>
                    {organizationCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button
                    type="submit"
                    disabled={!newOrgName.trim() || !newOrgCategory}
                    className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                    Register Organization
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;