import React, { useState, useMemo } from 'react';
import { Organization, User, OrganizationType, organizationTypes } from '../types';

interface PostRegistrationOrgSetupProps {
  currentUser: User;
  allOrgs: Organization[];
  joinOrg: (orgId: number) => void;
  createOrg: (orgName: string, type: OrganizationType, description?: string) => void;
  onContinue: () => void;
}

const PostRegistrationOrgSetup: React.FC<PostRegistrationOrgSetupProps> = ({ 
  currentUser, 
  allOrgs, 
  joinOrg, 
  createOrg, 
  onContinue 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgType, setNewOrgType] = useState<OrganizationType | ''>('');
  const [newOrgDescription, setNewOrgDescription] = useState('');

  // Filter organizations based on search term
  const filteredOrgs = useMemo(() => {
    if (!searchTerm.trim()) return allOrgs;
    return allOrgs.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allOrgs, searchTerm]);

  // Check if search term matches any existing organization exactly
  const exactMatch = useMemo(() => {
    return allOrgs.find(org => 
      org.name.toLowerCase() === searchTerm.toLowerCase()
    );
  }, [allOrgs, searchTerm]);

  const handleCreateFromSearch = () => {
    if (searchTerm.trim() && newOrgType) {
      createOrg(searchTerm.trim(), newOrgType, newOrgDescription.trim() || undefined);
      setSearchTerm('');
      setNewOrgType('');
      setNewOrgDescription('');
      setShowCreateForm(false);
    }
  };

  const handleCreateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateFromSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to CampusCares, {currentUser.name.split(' ')[0]}! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Let's get you connected with your organizations to maximize your impact.
            </p>
          </div>
          {/* <button
            onClick={onContinue}
            className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
          >
            Continue
          </button> */}
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search for your organizations
          </h2>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type your org name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition text-lg"
            />
            <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Search Results */}
        {searchTerm.trim() && (
          <div className="mb-8">
            {filteredOrgs.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Found organizations:
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredOrgs.map(org => {
                    const isMember = currentUser.organizationIds?.includes(org.id);
                    return (
                      <div key={org.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div>
                          <span className="font-medium text-gray-800">{org.name}</span>
                          <span className="block text-sm text-gray-500">{org.type}</span>
                        </div>
                        {isMember ? (
                          <span className="text-sm text-green-600 font-semibold">Joined ✓</span>
                        ) : (
                          <button 
                            onClick={() => joinOrg(org.id)}
                            className="text-sm bg-cornell-red text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors font-semibold"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 mb-4">
                  No organizations found matching "{searchTerm}"
                </p>
                {!exactMatch && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
                  >
                    Create new organization: "{searchTerm}"
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Organization Form */}
        {showCreateForm && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create "{searchTerm}"
            </h3>
            <form onSubmit={handleCreateFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Type *
                </label>
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value as OrganizationType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition bg-white"
                  required
                >
                  <option value="" disabled>Select a type...</option>
                  {organizationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="Brief description of your organization..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition resize-none"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!newOrgType}
                  className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed font-semibold"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewOrgType('');
                    setNewOrgDescription('');
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* All Organizations */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Browse all organizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {allOrgs.sort((a,b) => a.name.localeCompare(b.name)).map(org => {
              const isMember = currentUser.organizationIds?.includes(org.id);
              return (
                <div key={org.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex-grow">
                    <span className="font-medium text-gray-800">{org.name}</span>
                    <span className="block text-xs text-gray-500">{org.type}</span>
                  </div>
                  {isMember ? (
                    <span className="text-sm text-green-600 font-semibold">Joined ✓</span>
                  ) : (
                    <button 
                      onClick={() => joinOrg(org.id)}
                      className="text-sm bg-cornell-red text-white px-3 py-1 rounded-md hover:bg-red-800 transition-colors font-semibold"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            You can always manage your organizations later in the Groups section.
          </p>
          <button
            onClick={onContinue}
            className="bg-cornell-red text-white px-8 py-3 rounded-lg hover:bg-red-800 transition-colors font-semibold text-lg"
          >
            Continue to CampusCares
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostRegistrationOrgSetup;
