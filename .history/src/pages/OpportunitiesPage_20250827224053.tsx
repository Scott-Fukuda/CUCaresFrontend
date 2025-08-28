
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

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ opportunities, students, signups, currentUser, handleSignUp, handleUnSignUp, setPageState, allOrgs, currentUserSignupsSet }) => {
  const [causeFilter, setCauseFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    // Get today's date at the start of the day in the local timezone.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return opportunities
      .filter(opp => {
        // Only show approved opportunities
        if (opp.approved !== true) {
          return false;
        }
        
        // Cause filter
        if (causeFilter !== 'All' && (!opp.causes || !opp.causes.includes(causeFilter))) {
          return false;
        }
        
        // Parse the opportunity date string as a local date by adding T00:00:00
        const filteredOpportunities = useMemo(() => {
          // Get today's date at the start of the day in the local timezone
          const today = new Date();
          today.setHours(0, 0, 0, 0);
        
          return opportunities
            .filter(opp => {
              // Only show approved opportunities
              if (!opp.approved) return false;
        
              // Cause filter
              if (causeFilter !== 'All' && (!opp.causes || !opp.causes.includes(causeFilter))) {
                return false;
              }
        
              // Parse opp.date as local date
              const [year, month, day] = opp.date.split('-').map(Number);
              // month is 0-indexed in JS Date
              const oppDate = new Date(year, month - 1, day);
        
              // Date filter from calendar clicker
              if (dateFilter) {
                if (opp.date !== dateFilter) return false;
              }
        
              // Don't show past events
              return oppDate.getTime() >= today.getTime();
            })
            .sort((a, b) => {
              const [ay, am, ad] = a.date.split('-').map(Number);
              const [by, bm, bd] = b.date.split('-').map(Number);
              return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
            });
        }, [opportunities, causeFilter, dateFilter]);
        
  //       console.log(opp.date);
  //       const oppDate = new Date(`${opp.date}T00:00:00`);

  //       // Date filter
  //       if (dateFilter) {
  //           // Parse filter date string and compare only the date part (YYYY-MM-DD)
  //           const filterDateStr = dateFilter; // Already in YYYY-MM-DD format
  //           const oppDateStr = opp.date; // Should be in YYYY-MM-DD format
            
  //           if (oppDateStr !== filterDateStr) {
  //               return false;
  //           }
  //       }

  //       // Don't show past events
  //       return oppDate.getTime() >= today.getTime();
  //     })
  //     .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // }, [opportunities, causeFilter, dateFilter]);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Upcoming Opportunities</h2>
          <p className="text-gray-600">Find the perfect way to make an impact in the Ithaca community.</p>
        </div>
        <button 
          onClick={() => setPageState({ page: 'createOpportunity' })}
          className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
        >
          Create Opportunity
        </button>
      </div>
      
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
          // Use involved_users from backend if available, but filter to only registered users
          // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
          const signedUpStudents = opp.involved_users 
            ? opp.involved_users.filter(user => user.registered === true || opp.host_id === user.id)
            : students.filter(student =>
                signups.filter(s => s.opportunityId === opp.id).map(s => s.userId).includes(student.id)
              );
          
          // Check if current user is signed up by looking in involved_users from backend
          // This persists across login/logout cycles
          // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
          const isUserSignedUp = opp.involved_users 
            ? opp.involved_users.some(user => user.id === currentUser.id && (user.registered === true || opp.host_id === currentUser.id))
            : currentUserSignupsSet.has(opp.id);

          // Debug logging for host opportunities
          const isUserHost = opp.host_id === currentUser.id;
          if (isUserHost) {
            const currentUserInInvolvedUsers = opp.involved_users ? opp.involved_users.find(u => u.id === currentUser.id) : null;
            console.log(`Host opportunity ${opp.id} (${opp.name}):`, {
              involved_users: opp.involved_users,
              signedUpStudents: signedUpStudents.length,
              isUserSignedUp,
              currentUserInInvolvedUsers,
              currentUserInInvolvedUsersRegistered: currentUserInInvolvedUsers?.registered,
              currentUserInInvolvedUsersAttended: currentUserInInvolvedUsers?.attended
            });
          }

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