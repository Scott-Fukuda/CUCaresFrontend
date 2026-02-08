import React, { useMemo } from 'react';
import { Opportunity, User, Organization, SignUp } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OpportunityCard from '../components/OpportunityCard';

interface OpportunitySearchPageProps {
  opportunities: Opportunity[];
  students: User[];
  allOrgs: Organization[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  currentUserSignupsSet: Set<number>;
  signups: SignUp[];
  showPopup?: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

const OpportunitySearchPage: React.FC<OpportunitySearchPageProps> = ({
  opportunities,
  students,
  allOrgs,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  currentUserSignupsSet,
  signups,
  showPopup,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredOpportunities = useMemo(() => {
    if (!query) return [];

    const lowerCaseQuery = query.toLowerCase();

    return opportunities
      .filter((opp) => {
        if (opp.approved === false) return false;
        if (Array.isArray(opp.visibility) && opp.visibility.length > 0) {
          if (currentUser.admin) return true;
          const userOrgIds = currentUser.organizationIds || [];
          return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
        }
        return true;
      })
      .filter((opp) => {
        const oppName = opp.name.toLowerCase();
        const oppNonprofit = opp.nonprofit ? opp.nonprofit.toLowerCase() : '';
        const oppHostOrg = opp.host_org_name ? opp.host_org_name.toLowerCase() : '';
        return (
          oppName.includes(lowerCaseQuery) ||
          oppNonprofit.includes(lowerCaseQuery) ||
          oppHostOrg.includes(lowerCaseQuery)
        );
      })
      .sort((a, b) => {
        // Parse dates for comparison
        const [yearA, monthA, dayA] = a.date.split('-').map(Number);
        const [yearB, monthB, dayB] = b.date.split('-').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
  }, [query, opportunities, currentUser]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-cornell-red hover:text-red-800 font-semibold mb-4 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-600">
          Found {filteredOpportunities.length} opportunit{filteredOpportunities.length !== 1 ? 'ies' : ''}
        </p>
      </div>

      {filteredOpportunities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">No opportunities found matching "{query}"</p>
          <button
            onClick={() => navigate('/opportunities')}
            className="mt-4 text-cornell-red hover:text-red-800 font-semibold transition-colors"
          >
            Browse All Opportunities →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => {
            const signedUpStudents = opp.involved_users || [];
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
                showPopup={showPopup}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OpportunitySearchPage;
