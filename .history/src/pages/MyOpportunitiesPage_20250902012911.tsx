import React, { useState, useMemo } from 'react';
import { Opportunity, User, Organization } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import { PageState } from '../App';

interface MyOpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  allOrgs: Organization[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number) => void;
  setPageState: (state: PageState) => void;
  currentUserSignupsSet: Set<number>;
}

const MyOpportunitiesPage: React.FC<MyOpportunitiesPageProps> = ({ 
  opportunities, 
  students,
  allOrgs,
  currentUser, 
  handleSignUp,
  handleUnSignUp,
  setPageState,
  currentUserSignupsSet
}) => {
  const [showPastHosted, setShowPastHosted] = useState(false);
  const [showPastRegistered, setShowPastRegistered] = useState(false);

  // Get current date for filtering
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);

  // Filter opportunities based on user's role and date
  const { hostedOpportunities, registeredOpportunities } = useMemo(() => {
    const hosted: Opportunity[] = [];
    const registered: Opportunity[] = [];

    opportunities.forEach(opp => {
      const oppDate = new Date(`${opp.date}T${opp.time}`);
      const isPast = oppDate < threeDaysAgo;
      
      // Check if user is the host
      if (opp.host_id === currentUser.id) {
        if (!isPast) {
          hosted.push(opp);
        }
      }
      // Check if user is registered but not the host
      else if (opp.involved_users?.some(user => user.id === currentUser.id && user.registered)) {
        if (!isPast) {
          registered.push(opp);
        }
      }
    });

    return { hostedOpportunities: hosted, registeredOpportunities: registered };
  }, [opportunities, currentUser.id, threeDaysAgo]);

  // Get past opportunities
  const { pastHostedOpportunities, pastRegisteredOpportunities } = useMemo(() => {
    const pastHosted: Opportunity[] = [];
    const pastRegistered: Opportunity[] = [];

    opportunities.forEach(opp => {
      const oppDate = new Date(`${opp.date}T${opp.time}`);
      const isPast = oppDate < threeDaysAgo;
      
      if (isPast) {
        // Check if user is the host
        if (opp.host_id === currentUser.id) {
          pastHosted.push(opp);
        }
        // Check if user is registered but not the host
        else if (opp.involved_users?.some(user => user.id === currentUser.id && user.registered)) {
          pastRegistered.push(opp);
        }
      }
    });

    return { pastHostedOpportunities: pastHosted, pastRegisteredOpportunities: pastRegistered };
  }, [opportunities, currentUser.id, threeDaysAgo]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My Opportunities</h1>
        <p className="text-gray-600">Manage your hosted and registered opportunities.</p>
      </div>

      {/* Hosted Opportunities Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Opportunities I'm Hosting</h2>
          {pastHostedOpportunities.length > 0 && (
            <button
              onClick={() => setShowPastHosted(!showPastHosted)}
              className="text-cornell-red hover:text-red-800 font-medium"
            >
              {showPastHosted ? 'Hide Past Opportunities' : 'View Past Opportunities'}
            </button>
          )}
        </div>

        {hostedOpportunities.length === 0 && !showPastHosted && (
          <div className="text-center py-8 text-gray-500">
            <p>You're not hosting any upcoming opportunities.</p>
          </div>
        )}

        {hostedOpportunities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {hostedOpportunities.map(opp => {
              // Determine signed-up students from backend data
              let signedUpStudents: User[] = [];
              if (opp.involved_users && opp.involved_users.length > 0) {
                signedUpStudents = opp.involved_users.filter(user => 
                  user.registered === true || opp.host_id === user.id
                );
              }
              const isUserSignedUp = currentUserSignupsSet.has(opp.id);
              
              return (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  signedUpStudents={signedUpStudents}
                  allOrgs={allOrgs}
                  currentUser={currentUser}
                  onSignUp={handleSignUp}
                  onUnSignUp={handleUnSignUp}
                  isUserSignedUp={isUserSignedUp}
                  setPageState={setPageState}
                />
              );
            })}
          </div>
        )}

        {showPastHosted && pastHostedOpportunities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Past Hosted Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastHostedOpportunities.map(opp => {
                // Determine signed-up students from backend data
                let signedUpStudents: User[] = [];
                if (opp.involved_users && opp.involved_users.length > 0) {
                  signedUpStudents = opp.involved_users.filter(user => 
                    user.registered === true || opp.host_id === user.id
                  );
                }
                const isUserSignedUp = currentUserSignupsSet.has(opp.id);
                
                return (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    signedUpStudents={signedUpStudents}
                    allOrgs={allOrgs}
                    currentUser={currentUser}
                    onSignUp={handleSignUp}
                    onUnSignUp={handleUnSignUp}
                    isUserSignedUp={isUserSignedUp}
                    setPageState={setPageState}
                  />
                );
              })}
            </div>
          </div>
        )}

        {showPastHosted && pastHostedOpportunities.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>No past hosted opportunities.</p>
          </div>
        )}
      </div>

      {/* Registered Opportunities Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Other Opportunities I'm Registered For</h2>
          {pastRegisteredOpportunities.length > 0 && (
            <button
              onClick={() => setShowPastRegistered(!showPastRegistered)}
              className="text-cornell-red hover:text-red-800 font-medium"
            >
              {showPastRegistered ? 'Hide Past Opportunities' : 'View Past Opportunities'}
            </button>
          )}
        </div>

        {registeredOpportunities.length === 0 && !showPastRegistered && (
          <div className="text-center py-8 text-gray-500">
            <p>You're not registered for other any upcoming opportunities.</p>
          </div>
        )}

        {registeredOpportunities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                          {registeredOpportunities.map(opp => {
                // Determine signed-up students from backend data
                let signedUpStudents: User[] = [];
                if (opp.involved_users && opp.involved_users.length > 0) {
                  signedUpStudents = opp.involved_users.filter(user => 
                    user.registered === true || opp.host_id === user.id
                  );
                }
                const isUserSignedUp = currentUserSignupsSet.has(opp.id);
              
              return (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  signedUpStudents={signedUpStudents}
                  allOrgs={allOrgs}
                  currentUser={currentUser}
                  onSignUp={handleSignUp}
                  onUnSignUp={handleUnSignUp}
                  isUserSignedUp={isUserSignedUp}
                  setPageState={setPageState}
                />
              );
            })}
          </div>
        )}

        {showPastRegistered && pastRegisteredOpportunities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Past Registered Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastRegisteredOpportunities.map(opp => {
                const signedUpStudents = students.filter(student => 
                  opp.involved_users?.some(user => user.id === student.id && user.registered)
                );
                const isUserSignedUp = currentUserSignupsSet.has(opp.id);
                
                return (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    signedUpStudents={signedUpStudents}
                    allOrgs={allOrgs}
                    currentUser={currentUser}
                    onSignUp={handleSignUp}
                    onUnSignUp={handleUnSignUp}
                    isUserSignedUp={isUserSignedUp}
                    setPageState={setPageState}
                  />
                );
              })}
            </div>
          </div>
        )}

        {showPastRegistered && pastRegisteredOpportunities.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>No past registered opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOpportunitiesPage;
