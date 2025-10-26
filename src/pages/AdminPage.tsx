import React, { useState, useMemo, useEffect } from 'react';
import { Opportunity, Organization, User } from '../types';
import * as api from '../api';
import { auth } from '../firebase-config';

interface AdminPageProps {
  currentUser: User;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  allUsers: User[];
}

const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  opportunities,
  setOpportunities,
  organizations,
  setOrganizations,
  allUsers,
}) => {
  // Helper function to get user name by ID
  const getUserNameById = (userId?: number): string => {
    if (!userId) return 'Unknown';
    const user = allUsers.find((u) => u.id === userId);
    return user ? user.name : 'Unknown';
  };
  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<number>>(new Set());
  const [selectedOrganizations, setSelectedOrganizations] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unapprovedOpportunities, setUnapprovedOpportunities] = useState<Opportunity[]>([]);
  const [unapprovedOrganizations, setUnapprovedOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [userEmails, setUserEmails] = useState<string[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showEmails, setShowEmails] = useState(false);
  const [approvedEmail, setApprovedEmail] = useState<string>('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  // CSV data management
  const [userCsv, setUserCsv] = useState<string | null>(null);
  const [oppCsv, setOppCsv] = useState<string | null>(null);
  const [activeCsv, setActiveCsv] = useState<'users' | 'opps' | null>(null);

  // Fetch unapproved opportunities and organizations
  useEffect(() => {
    const fetchUnapprovedData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [opportunities, organizations] = await Promise.all([
          api.getUnapprovedOpportunities(),
          api.getUnapprovedOrgs(),
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
    const confirmed = window.confirm(
      `Are you sure you want to delete the opportunity "${oppName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    // Store original state for potential rollback
    const originalUnapprovedOpportunities = [...unapprovedOpportunities];

    try {
      // Immediately remove from frontend (optimistic update)
      setUnapprovedOpportunities((prev) => prev.filter((opp) => opp.id !== oppId));

      // Make API call to backend
      await api.deleteOpportunity(oppId);
    } catch (error: any) {
      // Revert frontend state if backend delete failed
      setUnapprovedOpportunities(originalUnapprovedOpportunities);
      alert(`Error deleting opportunity: ${error.message}`);
    }
  };

  const handleDeleteOrganization = async (orgId: number, orgName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the organization "${orgName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    // Store original state for potential rollback
    const originalUnapprovedOrganizations = [...unapprovedOrganizations];

    try {
      // Immediately remove from frontend (optimistic update)
      setUnapprovedOrganizations((prev) => prev.filter((org) => org.id !== orgId));

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
      const selectedOpps = unapprovedOpportunities.filter((opp) =>
        selectedOpportunities.has(opp.id)
      );
      const selectedOrgs = unapprovedOrganizations.filter((org) =>
        selectedOrganizations.has(org.id)
      );

      // Add approved opportunities to the main opportunities list
      const approvedOpps = selectedOpps.map((opp) => ({ ...opp, approved: true }));
      setOpportunities((prev) => [...prev, ...approvedOpps]);

      // Add approved organizations to the main organizations list
      const approvedOrgs = selectedOrgs.map((org) => ({ ...org, approved: true }));
      setOrganizations((prev) => [...prev, ...approvedOrgs]);

      // Remove from unapproved lists
      setUnapprovedOpportunities((prev) =>
        prev.filter((opp) => !selectedOpportunities.has(opp.id))
      );
      setUnapprovedOrganizations((prev) =>
        prev.filter((org) => !selectedOrganizations.has(org.id))
      );

      // Clear selections
      setSelectedOpportunities(new Set());
      setSelectedOrganizations(new Set());

      // Make API calls to backend
      const opportunityPromises = Array.from(selectedOpportunities).map((oppId) =>
        api.updateOpportunity(oppId, { approved: true })
      );

      const organizationPromises = Array.from(selectedOrganizations).map((orgId) =>
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

      // Get the current Firebase user from auth
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setSecurityToken(token);
      } else {
        setError('No authenticated Firebase user found. Please sign in again.');
      }
    } catch (error: any) {
      console.error('Error getting security token:', error);
      setError(`Failed to get security token: ${error.message}`);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleGetUserEmails = async () => {
    try {
      setIsLoadingEmails(true);
      setError(null);

      const emails = await api.getUserEmails();
      setUserEmails(emails);
      setShowEmails(true);
    } catch (error: any) {
      console.error('Error fetching user emails:', error);
      setError(`Failed to fetch user emails: ${error.message}`);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleAddApprovedEmail = async () => {
    if (!approvedEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(approvedEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsAddingEmail(true);
      setError(null);

      await api.addApprovedEmail(approvedEmail.trim());
      setApprovedEmail(''); // Clear the input
      alert(`Email "${approvedEmail.trim()}" has been added to the approved list successfully!`);
    } catch (error: any) {
      console.error('Error adding approved email:', error);
      setError(`Failed to add approved email: ${error.message}`);
    } finally {
      setIsAddingEmail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadUsersCsv = async () => {
    try {
      const csvText = await api.getUserCsv();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.csv';
      link.click();
    } catch (err) {
      console.error('Error downloading user CSV:', err);
      alert('Failed to download user CSV.');
    }
  };

  const handleDownloadOppsCsv = async () => {
    try {
      const csvText = await api.getOpportunityCsv();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'opportunities.csv';
      link.click();
    } catch (err) {
      console.error('Error downloading opportunity CSV:', err);
      alert('Failed to download opportunity CSV.');
    }
  };
  const handleDownloadServiceDataCsv = async (startDate: string, endDate: string) => {
  try {
    const response = await api.getServiceDataCsv(startDate, endDate);
 
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service_data_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading CSV:", err);
    alert("Failed to download service data. Please try again.");
  }
};

const promptAndDownloadCsv = async () => {
  const today = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const defaultStart = twoMonthsAgo.toISOString().split("T")[0];
  const defaultEnd = today.toISOString().split("T")[0];

  const startDate = window.prompt("Enter start date (YYYY-MM-DD):", defaultStart);
  if (!startDate) return;

  const endDate = window.prompt("Enter end date (YYYY-MM-DD):", defaultEnd);
  if (!endDate) return;

  await handleDownloadServiceDataCsv(startDate, endDate);
};


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Review and approve pending opportunities and organizations.</p>
      </div>

      {/* Statistics Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{allUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved Opportunities</p>
              <p className="text-2xl font-semibold text-gray-900">
                {opportunities.filter((opp) => opp.approved !== false).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved Organizations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {organizations.filter((org) => org.approved !== false).length}
              </p>
            </div>
          </div>
        </div>
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
      {/* CSV Export Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">CSV Data Export</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download complete user or opportunity data in CSV format.
        </p>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownloadUsersCsv}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Download User CSV
          </button>

          <button
            onClick={handleDownloadOppsCsv}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Download Opportunity CSV
          </button>

          <button
            onClick={promptAndDownloadCsv}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Download Service Data CSV
          </button>
        </div>
      </div>

      {/* User Emails Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Emails</h2>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleGetUserEmails}
            disabled={isLoadingEmails}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 w-fit"
          >
            {isLoadingEmails ? 'Loading Emails...' : 'Get All User Emails'}
          </button>

          {showEmails && userEmails.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Emails ({userEmails.length} total):
              </label>
              <div className="bg-white border border-gray-300 rounded-lg p-3">
                <textarea
                  value={userEmails.join('\n')}
                  readOnly
                  className="w-full h-48 p-2 text-sm font-mono bg-gray-50 border border-gray-200 rounded resize-none"
                  placeholder="Emails will appear here..."
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(userEmails.join('\n'))}
                    className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                  >
                    Copy All Emails
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(userEmails.join(', '))}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy as Comma-Separated
                  </button>
                  <button
                    onClick={() => setShowEmails(false)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Hide Emails
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEmails && userEmails.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              <p>No user emails found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Approved Email Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Approved Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add email addresses to the approved list for non-Cornell users.
        </p>
        <div className="flex flex-col space-y-4">
          <div className="flex gap-4">
            <input
              type="email"
              value={approvedEmail}
              onChange={(e) => setApprovedEmail(e.target.value)}
              placeholder="Enter email address (e.g., user@example.com)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              disabled={isAddingEmail}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddApprovedEmail();
                }
              }}
            />
            <button
              onClick={handleAddApprovedEmail}
              disabled={isAddingEmail || !approvedEmail.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingEmail ? 'Adding...' : 'Add Email'}
            </button>
          </div>
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
                {isSubmitting
                  ? 'Approving...'
                  : `Approve Selected (${selectedOpportunities.size + selectedOrganizations.size})`}
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
                          Creator
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
                              <div className="break-words whitespace-pre-wrap">
                                {opp.description ? opp.description : 'No description specified'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {opp.nonprofit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getUserNameById(opp.host_id)}
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
                          Creator
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getUserNameById(org.host_user_id)}
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
