import React, { useState, useMemo, useEffect } from 'react';
import { Opportunity, Organization, User } from '../types';
import * as api from '../api';

interface AdminPageProps {
  currentUser: User;
  setPageState: (state: any) => void;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  currentUser,
  opportunities,
  setOpportunities,
  organizations,
  setOrganizations
}) => {
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<number>>(new Set());
  const [selectedOrganizations, setSelectedOrganizations] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unapprovedOpportunities, setUnapprovedOpportunities] = useState<Opportunity[]>([]);
  const [unapprovedOrganizations, setUnapprovedOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  // Fetch unapproved opportunities and organizations
  useEffect(() => {
    const fetchUnapprovedData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [opportunities, organizations] = await Promise.all([
          api.getUnapprovedOpportunities(),
          api.getUnapprovedOrgs()
        ]);
        
        setUnapprovedOpportunities(opportunities);
        setUnapprovedOrganizations(organizations);
      } catch (err: any) {
        console.error('Error fetching unapproved data:', err);
        setError(err.message || 'Failed to fetch unapproved data');
      } finally {
        setLoading(false);
      }
    };

    fetchUnapprovedData();
  }, []);

  const handleOpportunityToggle = (oppId: number) => {
    const newSelected = new Set(selectedOpportunities);
    if (newSelected.has(oppId)) {
      newSelected.delete(oppId);
    } else {
      newSelected.add(oppId);
    }
    setSelectedOpportunities(newSelected);
  };

  const handleOrganizationToggle = (orgId: number) => {
    const newSelected = new Set(selectedOrganizations);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrganizations(newSelected);
  };

  const handleDeleteOpportunity = async (oppId: number, oppName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the opportunity "${oppName}"? This action cannot be undone.`);
    if (!confirmed) return;

    // Store original state for potential rollback
    const originalUnapprovedOpportunities = [...unapprovedOpportunities];

    try {
      // Immediately remove from frontend (optimistic update)
      setUnapprovedOpportunities(prev => prev.filter(opp => opp.id !== oppId));
      
      // Make API call to backend
      await api.deleteOpportunity(oppId);
    } catch (error: any) {
      // Revert frontend state if backend delete failed
      setUnapprovedOpportunities(originalUnapprovedOpportunities);
      alert(`Error deleting opportunity: ${error.message}`);
    }
  };

  const handleDeleteOrganization = async (orgId: number, orgName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the organization "${orgName}"? This action cannot be undone.`);
    if (!confirmed) return;

    // Store original state for potential rollback
    const originalUnapprovedOrganizations = [...unapprovedOrganizations];

    try {
      // Immediately remove from frontend (optimistic update)
      setUnapprovedOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      // Make API call to backend
      await api.deleteOrganization(orgId);
    } catch (error: any) {
      // Revert frontend state if backend delete failed
      setUnapprovedOrganizations(originalUnapprovedOrganizations);
      alert(`Error deleting organization: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (selectedOpportunities.size === 0 && selectedOrganizations.size === 0) {
      alert('Please select at least one item to approve.');
      return;
    }

    setIsSubmitting(true);
    
    // Store original state for potential rollback
    const originalOpportunities = [...opportunities];
    const originalOrganizations = [...organizations];
    const originalUnapprovedOpportunities = [...unapprovedOpportunities];
    const originalUnapprovedOrganizations = [...unapprovedOrganizations];
    
    try {
      // Immediately update frontend state (optimistic update)
      
      // Get the selected opportunities and organizations
      const selectedOpps = unapprovedOpportunities.filter(opp => selectedOpportunities.has(opp.id));
      const selectedOrgs = unapprovedOrganizations.filter(org => selectedOrganizations.has(org.id));
      
      // Add approved opportunities to the main opportunities list
      const approvedOpps = selectedOpps.map(opp => ({ ...opp, approved: true }));
      setOpportunities(prev => [...prev, ...approvedOpps]);
      
      // Add approved organizations to the main organizations list
      const approvedOrgs = selectedOrgs.map(org => ({ ...org, approved: true }));
      setOrganizations(prev => [...prev, ...approvedOrgs]);
      
      // Remove from unapproved lists
      setUnapprovedOpportunities(prev => prev.filter(opp => !selectedOpportunities.has(opp.id)));
      setUnapprovedOrganizations(prev => prev.filter(org => !selectedOrganizations.has(org.id)));
      
      // Clear selections
      setSelectedOpportunities(new Set());
      setSelectedOrganizations(new Set());
      
      // Make API calls to backend
      const opportunityPromises = Array.from(selectedOpportunities).map(oppId =>
        api.updateOpportunity(oppId, { approved: true })
      );

      const organizationPromises = Array.from(selectedOrganizations).map(orgId =>
        api.updateOrganization(orgId, { approved: true })
      );

      await Promise.all([...opportunityPromises, ...organizationPromises]);
      
      alert('Selected items have been approved successfully!');
      
    } catch (error: any) {
      // Revert frontend state if backend update failed
      setOpportunities(originalOpportunities);
      setOrganizations(originalOrganizations);
      setUnapprovedOpportunities(originalUnapprovedOpportunities);
      setUnapprovedOrganizations(originalUnapprovedOrganizations);
      
      alert(`Error approving items: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetSecurityToken = async () => {
    try {
      setIsLoadingToken(true);
      setSecurityToken(null);
      
      // Check if currentUser has getIdToken method (Firebase user)
      if (currentUser && typeof (currentUser as any).getIdToken === 'function') {
        const token = await (currentUser as any).getIdToken();
        setSecurityToken(token);
      } else {
        setError('User authentication token not available');
      }
    } catch (error: any) {
      console.error('Error getting security token:', error);
      setError(`Failed to get security token: ${error.message}`);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Review and approve pending opportunities and organizations.</p>
      </div>

      {/* Security Token Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Token</h2>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleGetSecurityToken}
            disabled={isLoadingToken}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 w-fit"
          >
            {isLoadingToken ? 'Getting Token...' : 'Get Security Token'}
          </button>
          
          {securityToken && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Token:
              </label>
              <div className="bg-white border border-gray-300 rounded-lg p-3">
                <textarea
                  value={securityToken}
                  readOnly
                  className="w-full h-32 p-2 text-sm font-mono bg-gray-50 border border-gray-200 rounded resize-none"
                  placeholder="Token will appear here..."
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(securityToken)}
                    className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setSecurityToken(null)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Clear Token
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cornell-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unapproved items...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Content - only show when not loading */}
      {!loading && (
        <>

      {/* Submit Button */}
      {(selectedOpportunities.size > 0 || selectedOrganizations.size > 0) && (
        <div className="mb-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Approving...' : `Approve Selected (${selectedOpportunities.size + selectedOrganizations.size})`}
          </button>
        </div>
      )}

      {/* Unapproved Opportunities */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Unapproved Opportunities ({unapprovedOpportunities.length})
        </h2>
        
        {unapprovedOpportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
            <p>No unapproved opportunities.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unapprovedOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOpportunities.has(opp.id)}
                          onChange={() => handleOpportunityToggle(opp.id)}
                          className="h-4 w-4 text-cornell-red focus:ring-cornell-red border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{opp.name}</div>
                          <div className="text-sm text-gray-500">
                            {opp.causes && opp.causes.length > 0 ? opp.causes.join(', ') : 'No causes specified'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opp.nonprofit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(opp.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id, opp.name)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          × Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Unapproved Organizations */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Unapproved Organizations ({unapprovedOrganizations.length})
        </h2>
        
        {unapprovedOrganizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
            <p>No unapproved organizations.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unapprovedOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrganizations.has(org.id)}
                          onChange={() => handleOrganizationToggle(org.id)}
                          className="h-4 w-4 text-cornell-red focus:ring-cornell-red border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {org.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          × Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
