import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpportunities } from '../api';
import { Opportunity } from '../types';

const AllOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [allTimeOpps, setAllTimeOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [hostOrgFilter, setHostOrgFilter] = useState<string>('');
  const [nonprofitFilter, setNonprofitFilter] = useState<string>('');

  useEffect(() => {
    getOpportunities()
      .then(setAllTimeOpps)
      .catch((err) => setError(err.message || 'Failed to load opportunities'))
      .finally(() => setLoading(false));
  }, []);

  const uniqueHostOrgs = useMemo(() => {
    const names = allTimeOpps
      .map((o) => o.host_org_name)
      .filter((n): n is string => !!n);
    return Array.from(new Set(names)).sort();
  }, [allTimeOpps]);

  const uniqueNonprofits = useMemo(() => {
    const names = allTimeOpps
      .map((o) => o.nonprofit)
      .filter((n): n is string => !!n);
    return Array.from(new Set(names)).sort();
  }, [allTimeOpps]);

  const filtered = useMemo(() => {
    const now = new Date();
    return allTimeOpps.filter((opp) => {
      if (timeFilter !== 'all') {
        const oppDateTime = new Date(`${opp.date}T${opp.time}`);
        if (timeFilter === 'upcoming' && oppDateTime <= now) return false;
        if (timeFilter === 'past' && oppDateTime > now) return false;
      }
      if (hostOrgFilter && opp.host_org_name !== hostOrgFilter) return false;
      if (nonprofitFilter && opp.nonprofit !== nonprofitFilter) return false;
      return true;
    });
  }, [allTimeOpps, timeFilter, hostOrgFilter, nonprofitFilter]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back to Admin
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Opportunities</h1>
        <span className="text-gray-500 text-sm">({filtered.length} / {allTimeOpps.length} total)</span>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cornell-red"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Host Org</label>
          <select
            value={hostOrgFilter}
            onChange={(e) => setHostOrgFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cornell-red"
          >
            <option value="">All</option>
            {uniqueHostOrgs.map((org) => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nonprofit</label>
          <select
            value={nonprofitFilter}
            onChange={(e) => setNonprofitFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cornell-red"
          >
            <option value="">All</option>
            {uniqueNonprofits.map((np) => (
              <option key={np} value={np}>{np}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setTimeFilter('all'); setHostOrgFilter(''); setNonprofitFilter(''); }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
          No opportunities match the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host Org</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nonprofit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slots</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/opportunity/${opp.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">{opp.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{opp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(`${opp.date}T${opp.time}`).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{opp.host_org_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{opp.nonprofit || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{opp.duration}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{opp.total_slots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOpportunitiesPage;
