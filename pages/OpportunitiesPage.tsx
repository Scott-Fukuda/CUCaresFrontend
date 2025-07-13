
import React, { useState, useMemo } from 'react';
import { Opportunity, User, SignUp, allInterests, StudentGroup } from '../types';
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
  allGroups: StudentGroup[];
  currentUserSignupsSet: Set<number>;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ opportunities, students, signups, currentUser, handleSignUp, handleUnSignUp, setPageState, allGroups, currentUserSignupsSet }) => {
  const [causeFilter, setCauseFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    // Get today's date at the start of the day in the local timezone.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return opportunities
      .filter(opp => {
        // Cause filter
        if (causeFilter !== 'All' && opp.cause !== causeFilter) {
          return false;
        }
        
        // Parse the opportunity date string as a local date by adding T00:00:00
        const oppDate = new Date(`${opp.date}T00:00:00`);

        // Date filter
        if (dateFilter) {
            // Parse filter date string similarly to avoid timezone mismatches.
            const filterDate = new Date(`${dateFilter}T00:00:00`);
            if (oppDate.getTime() !== filterDate.getTime()) {
                return false;
            }
        }

        // Don't show past events
        return oppDate.getTime() >= today.getTime();
      })
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [opportunities, causeFilter, dateFilter]);

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Upcoming Opportunities</h2>
      <p className="text-gray-600 mb-6">Find the perfect way to make an impact in the Ithaca community.</p>
      
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
        <button onClick={() => { setCauseFilter('All'); setDateFilter(''); }} className="mt-2 sm:mt-6 w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cornell-red hover:bg-red-800">Clear</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOpportunities.map(opp => {
          const signedUpUsersIds = signups
            .filter(s => s.opportunityId === opp.id)
            .map(s => s.userId);

          const signedUpStudents = students.filter(student =>
            signedUpUsersIds.includes(student.id)
          );
          
          const isUserSignedUp = currentUserSignupsSet.has(opp.id);

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
              allGroups={allGroups}
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
