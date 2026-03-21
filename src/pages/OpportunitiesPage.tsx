import React, { useState, useMemo } from 'react';
import { Opportunity, User, SignUp, allInterests, Organization, MultiOpp, FeedOrderItem, FeedItem } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import MultiOppCard from '../components/MultiOppCard';
import { useNavigate } from 'react-router-dom';
import MainFooter from '../components/MainFooter';

interface OpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  currentUser: User | null;
  handleSignUp?: (opportunityId: number) => void;
  handleUnSignUp?: (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ) => void;
  allOrgs: Organization[];
  currentUserSignupsSet?: Set<number>;
  multiopps: MultiOpp[];
  feedOrder: FeedOrderItem[];
  showCarpoolPopup?: number | null;
  setShowCarpoolPopup?: React.Dispatch<React.SetStateAction<number | null>>;
  showPopup?: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  oppsLoading: boolean
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  opportunities,
  students,
  signups,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  allOrgs,
  currentUserSignupsSet,
  multiopps,
  feedOrder,
  showCarpoolPopup,
  setShowCarpoolPopup,
  showPopup,
  oppsLoading
}) => {
  const navigate = useNavigate();

  // Filter functionality disabled
  // const [causeFilter, setCauseFilter] = useState<string>('All');
  // const [dateFilter, setDateFilter] = useState<string>('');

  const feedItems = useMemo((): FeedItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter standalone opps (approved, upcoming, visible, not part of a multiopp)
    const standaloneOpps = opportunities
      .map((opp) => {
        const [year, month, day] = opp.date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const [hours, minutes] = opp.time.split(':').map(Number);
        const fullDateTime = new Date(year, month - 1, day, hours, minutes);
        return { ...opp, localDate, fullDateTime };
      })
      .filter((opp) => {
        if (!opp.approved) return false;
        if (opp.localDate.getTime() < today.getTime()) return false;
        if (opp.multiopp) return false;
        if (!opp.visibility || opp.visibility.length === 0) return true;
        if (!currentUser) return false;
        if (currentUser.admin) return true;
        const userOrgIds = currentUser.organizationIds || [];
        return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
      });

    // Filter visible multiopps
    const visibleMultiOpps = multiopps.filter((m) => {
      if (!m.visibility || m.visibility.length === 0) return true;
      if (!currentUser) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds || [];
      return m.visibility.some((orgId) => userOrgIds.includes(orgId));
    });

    // Build position lookup from feedOrder — key: `${is_multiopp}-${id}`
    const positionMap = new Map<string, number>(
      feedOrder.map((item, index) => [`${item.is_multiopp}-${item.id}`, index])
    );

    const oppItems: FeedItem[] = standaloneOpps.map((opp) => ({ kind: 'opp', data: opp }));
    const multiItems: FeedItem[] = visibleMultiOpps.map((m) => ({ kind: 'multiopp', data: m }));

    return [...oppItems, ...multiItems].sort((a, b) => {
      const keyA = `${a.kind === 'multiopp'}-${a.data.id}`;
      const keyB = `${b.kind === 'multiopp'}-${b.data.id}`;
      const posA = positionMap.get(keyA) ?? Infinity;
      const posB = positionMap.get(keyB) ?? Infinity;
      if (posA !== posB) return posA - posB;
      // Fallback: chronological by first date
      const dateA = a.kind === 'opp'
        ? (a.data as typeof standaloneOpps[0]).fullDateTime.getTime()
        : new Date(a.data.date).getTime();
      const dateB = b.kind === 'opp'
        ? (b.data as typeof standaloneOpps[0]).fullDateTime.getTime()
        : new Date(b.data.date).getTime();
      return dateA - dateB;
    });
  }, [opportunities, multiopps, currentUser, feedOrder]);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

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
      if (!currentUser) {
        navigate('/login');
        return;
      }
      // Open the external URL in a new tab
      window.open(selectedOpportunity.redirect_url!, '_blank');

      if (handleSignUp) {
        // Still register the user locally
        handleSignUp(selectedOpportunity.id);
        // if (selectedOpportunity.allow_carpool) {
        //   setShowCarpoolPopup(true)
        // }
      }
      // Close the modal
      setShowExternalSignupModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleExternalUnsignupConfirm = () => {
    if (selectedOpportunity) {
      // Proceed with local unregistration
      if (handleUnSignUp) {
        handleUnSignUp(selectedOpportunity.id, selectedOpportunity.date, selectedOpportunity.time);
      }

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
    <>
      {/* Banner */}
      {/* <div className="campus-cares-banner">
        <div className="banner-content">
          <a href="https://forms.gle/DRD4P8BWCPm5kS4n6" target="_blank" rel="noopener noreferrer">
            <span className="banner-badge">Join the CampusCares team (Outreach, Tech, and Marketing)! Click to apply</span>
          </a>
        </div>
      </div> */}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Upcoming Opportunities
          </h2>
          <p className="text-gray-600">
            Find the perfect way to make an impact in the Ithaca community.
          </p>
        </div>
        {currentUser &&
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/create-opportunity')}
              className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
            >
              Create Opportunity
            </button>
          </div>}
      </div>

      {/* Filters - Disabled */}
      {/* <div className="bg-white p-4 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row gap-4 items-center">
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
      </div> */}

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {feedItems.map((item) => {
          if (item.kind === 'multiopp') {
            return (
              <MultiOppCard
                key={`multiopp-${item.data.id}`}
                multiopp={item.data}
                currentUser={currentUser}
                allOrgs={allOrgs}
                opportunitiesData={opportunities}
                onSignUp={handleSignUp}
                onUnSignUp={handleUnSignUp}
                onExternalSignup={handleExternalSignup}
                onExternalUnsignup={handleExternalUnsignup}
              />
            );
          }

          const opp = item.data;
          let signedUpStudents: User[] = [];
          if (opp.involved_users && opp.involved_users.length > 0) {
            signedUpStudents = opp.involved_users.filter(
              (user: User) => user.registered === true || opp.host_id === user.id
            );
          } else {
            const opportunitySignups = signups.filter((s) => s.opportunityId === opp.id);
            signedUpStudents = students.filter((student) =>
              opportunitySignups.some((s) => s.userId === student.id)
            );
          }
          const isUserSignedUp = currentUser && currentUserSignupsSet ? (
            opp.involved_users
              ? opp.involved_users.some(
                (user: User) =>
                  user.id === currentUser.id && (user.registered || opp.host_id === currentUser.id)
              )
              : currentUserSignupsSet.has(opp.id)
          ) : false;

          return (
            <OpportunityCard
              key={`opp-${opp.id}`}
              opportunity={opp}
              signedUpStudents={signedUpStudents}
              currentUser={currentUser}
              onSignUp={handleSignUp}
              onUnSignUp={handleUnSignUp}
              isUserSignedUp={isUserSignedUp}
              allOrgs={allOrgs}
              onExternalSignup={handleExternalSignup}
              onExternalUnsignup={handleExternalUnsignup}
              showPopup={showPopup}
            />
          );
        })}
      </div>

      {oppsLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: '600' }}>Loading...</div>
      ) : feedItems.length === 0 ? (
        <div className="col-span-full text-center py-12 px-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            There are currently no opportunities.
          </h3>
          {currentUser && <p className="text-gray-500 mt-2">Please click 'Create Opportunity' if you would like to propose an opportunity.</p>}
        </div>
      ) : null}

      {/* External Signup Modal */}
      {showExternalSignupModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">External Registration Required</h3>
            <p className="text-gray-600 mb-4">
              Please register externally on this link by clicking the button below.
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
              This opportunity required an external application. Please notify the host non-profit
              that you no longer are able to participate in this opportunity.
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
    </>
  );
};

export default OpportunitiesPage;
