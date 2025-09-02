import React, { useState, useMemo } from 'react';
import { Opportunity, User, SignUp, allInterests, Organization } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import { PageState } from '../App';

interface OpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number) => void;
  setPageState: (state: PageState) => void;
  allOrgs: Organization[];
  currentUserSignupsSet: Set<number>;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  opportunities,
  students,
  signups,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  setPageState,
  allOrgs,
  currentUserSignupsSet
}) => {
  const [causeFilter, setCauseFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of local day

    return opportunities
      .map(opp => {
        // Parse opp.date once as a local date
        // Since the API adds 1 day to the date, we need to subtract 1 day to get the actual date
        const [year, month, day] = opp.date.split('-').map(Number);
        const actualDate = new Date(year, month - 1, day);
        actualDate.setDate(actualDate.getDate() - 1); // Subtract 1 day to get the real date
        
        return {
          ...opp,
          localDate: actualDate,
          actualDateString: actualDate.toISOString().split('T')[0] // YYYY-MM-DD format for comparison
        };
      })
      .filter(opp => {
        // Only approved opportunities
        if (!opp.approved) return false;

        // Cause filter
        if (causeFilter !== 'All' && (!opp.causes || !opp.causes.includes(causeFilter))) {
          return false;
        }

        // Date filter (from calendar input) - compare with actual date
        if (dateFilter && opp.actualDateString !== dateFilter) return false;

        // Don't show past events - compare with actual date
        return opp.localDate.getTime() >= today.getTime();
      })
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
  }, [opportunities, causeFilter, dateFilter]);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Upcoming Opportunities
          </h2>
          <p className="text-gray-600">Find the perfect way to make an impact in the Ithaca community.</p>
        </div>
        <button
          onClick={() => setPageState({ page: 'createOpportunity' })}
          className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
        >
          Create Opportunity
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label htmlFor="cause-filter" className="block text-sm font-medium text-gray-700">Filter by Cause</label>
          <select
            id="cause-filter"
            value={causeFilter}
            onChange={e => setCauseFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cornell-red focus:border-cornell-red sm:text-sm rounded-md bg-white"
          >
            <option>All</option>
            {allInterests.map(interest => <option key={interest}>{interest}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Filter by Date</label>
          <input
            type="date"
            id="date-filter"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cornell-red focus:border-cornell-red sm:text-sm rounded-md bg-white"
          />
        </div>
        <button
          onClick={() => { setCauseFilter('All'); setDateFilter(''); }}
          className="mt-2 sm:mt-6 w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cornell-red hover:bg-red-800"
        >
          Clear
        </button>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOpportunities.map(opp => {
          // Determine signed-up students - prioritize local signups state for immediate updates
          let signedUpStudents: User[] = [];
          
          // First, check local signups state (immediate updates)
          const opportunitySignups = signups.filter(s => s.opportunityId === opp.id);
          const localSignedUpStudents = students.filter(student =>
            opportunitySignups.some(s => s.userId === student.id)
          );
          
          // Then, check backend data (opportunities.involved_users) for any additional signups
          let backendSignedUpStudents: User[] = [];
          if (opp.involved_users && opp.involved_users.length > 0) {
            backendSignedUpStudents = opp.involved_users.filter(user => 
              user.registered === true || opp.host_id === user.id
            );
          }
          
          // Combine both sources, prioritizing local state
          const allSignedUpIds = new Set([
            ...localSignedUpStudents.map(s => s.id),
            ...backendSignedUpStudents.map(s => s.id)
          ]);
          
          signedUpStudents = students.filter(student => allSignedUpIds.has(student.id));
          
          console.log(`Opportunity: ${opp.name} (ID: ${opp.id})`);
          console.log(`Local signups:`, opportunitySignups);
          console.log(`Local signedUpStudents:`, localSignedUpStudents);
          console.log(`Backend involved_users:`, opp.involved_users);
          console.log(`Backend signedUpStudents:`, backendSignedUpStudents);
          console.log(`Final combined signedUpStudents:`, signedUpStudents);
          
          // Debug logging
          console.log('Opportunity:', opp.name, 'ID:', opp.id);
          console.log('involved_users:', opp.involved_users);
          console.log('signedUpStudents:', signedUpStudents);
          console.log('students:', students);
          console.log('signups:', signups);

          // Check if current user is signed up
          const isUserSignedUp = opp.involved_users
            ? opp.involved_users.some(user => user.id === currentUser.id && (user.registered || opp.host_id === currentUser.id))
            : currentUserSignupsSet.has(opp.id);

          return (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              signedUpStudents={signedUpStudents}
              currentUser={currentUser}
              onSignUp={handleSignUp}
              onUnSignUp={handleUnSignUp}
              isUserSignedUp={isUserSignedUp}
              setPageState={setPageState}
              allOrgs={allOrgs}
            />
          );
        })}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="col-span-full text-center py-12 px-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">No opportunities match your filters.</h3>
          <p className="text-gray-500 mt-2">Try clearing the filters to see all upcoming events.</p>
        </div>
      )}
    </>
  );
};

export default OpportunitiesPage;
