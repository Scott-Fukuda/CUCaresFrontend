import React, { useState, useMemo } from 'react';
import { Opportunity, User, Organization } from '../types';
import OpportunityCard from '../components/OpportunityCard';

interface MyOpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  allOrgs: Organization[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  currentUserSignupsSet: Set<number>;
}

const MyOpportunitiesPage: React.FC<MyOpportunitiesPageProps> = ({ 
  opportunities, 
  students,
  allOrgs,
  currentUser, 
  handleSignUp,
  handleUnSignUp,
  currentUserSignupsSet
}) => {
  const [showPastHosted, setShowPastHosted] = useState(false);
  const [showPastRegistered, setShowPastRegistered] = useState(false);
  
  // Add modal states for external signup/unsignup
  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Add this state variable with the other state declarations at the top
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);

  // Get current date for filtering
  const now = new Date();

  // Filter opportunities based on user's role and date
  const { hostedOpportunities, registeredOpportunities } = useMemo(() => {
    const hosted: Opportunity[] = [];
    const registered: Opportunity[] = [];

    opportunities.forEach(opp => {
      const oppDate = new Date(`${opp.date}T${opp.time}`);
      const isPast = oppDate < now;
      
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
  }, [opportunities, currentUser.id, now]);

  // Get past opportunities
  const { pastHostedOpportunities, pastRegisteredOpportunities } = useMemo(() => {
    const pastHosted: Opportunity[] = [];
    const pastRegistered: Opportunity[] = [];

    opportunities.forEach(opp => {
      const oppDate = new Date(`${opp.date}T${opp.time}`);
      const isPast = oppDate < now;
      
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
  }, [opportunities, currentUser.id, now]);

  // Add handlers for external signup/unsignup
  const handleExternalSignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalSignupModal(true);
  };

  const handleExternalUnsignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalUnsignupModal(true);
  };

  const handleExternalSignupConfirm = () => {
    if (selectedOpportunity) {
      // Open the external URL in a new tab
      window.open(selectedOpportunity.redirect_url!, '_blank');
      
      // Still register the user locally
      handleSignUp(selectedOpportunity.id);
      
      // Close the modal
      setShowExternalSignupModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleExternalUnsignupConfirm = () => {
    if (selectedOpportunity) {
      // Proceed with local unregistration
      handleUnSignUp(selectedOpportunity.id, selectedOpportunity.date, selectedOpportunity.time);
      
      // Close the modal
      setShowExternalUnsignupModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleExternalSignupCancel = () => {
    setShowExternalSignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleExternalUnsignupCancel = () => {
    setShowExternalUnsignupModal(false);
    setSelectedOpportunity(null);
  };

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
                  onExternalSignup={handleExternalSignup}
                  onExternalUnsignup={handleExternalUnsignup}
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
                    onExternalSignup={handleExternalSignup}
                    onExternalUnsignup={handleExternalUnsignup}
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
                  onExternalSignup={handleExternalSignup}
                  onExternalUnsignup={handleExternalUnsignup}
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
                    onExternalSignup={handleExternalSignup}
                    onExternalUnsignup={handleExternalUnsignup}
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

      {/* All Opportunities Section (admin only) */}
      {currentUser.admin && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">All Opportunities</h2>
            <button
              onClick={() => setShowAllOpportunities(!showAllOpportunities)}
              className="text-cornell-red hover:text-red-800 font-medium"
            >
              {showAllOpportunities ? 'Hide All Opportunities' : 'View All Opportunities'}
            </button>
          </div>

          {showAllOpportunities && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map(opp => {
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
                    onExternalSignup={handleExternalSignup} 
                    onExternalUnsignup={handleExternalUnsignup} 
                  />
                );
              })}
            </div>
          )}

          {showAllOpportunities && opportunities.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No opportunities available.</p>
            </div>
          )}
        </div>
      )}

      {/* External Signup Modal */}
      {showExternalSignupModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">External Registration Required</h3>
            <p className="text-gray-600 mb-4">
              Please register externally click on the button below.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              After registering externally, you'll still be registered locally in our system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExternalSignupConfirm}
                className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
              >
                Open Link & Register Locally
              </button>
              <button
                onClick={handleExternalSignupCancel}
                className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Unsignup Modal */}
      {showExternalUnsignupModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">External Application Notice</h3>
            <p className="text-gray-600 mb-4">
              This opportunity required an external application. Please notify the host non-profit that you no longer are able to participate in this opportunity.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will still be unregistered from our local system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExternalUnsignupConfirm}
                className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
              >
                Unregister Locally
              </button>
              <button
                onClick={handleExternalUnsignupCancel}
                className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    <p className="text-xs text-gray-500 mt-6 text-center">
          Click here to see our {" "}
          <a
            href="/terms_of_service.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            Terms of Service and Privacy Policy
          </a>
          .
        </p>
    </div>
  );
};

export default MyOpportunitiesPage;
