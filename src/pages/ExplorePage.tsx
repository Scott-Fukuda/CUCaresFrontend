import React, { useMemo } from 'react';
import { Opportunity, User, SignUp, Organization, MultiOpp, FeedOrderResponse } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import MultiOppCard from '../components/MultiOppCard';
import { useQuery } from '@tanstack/react-query';
import * as api from '../api';
import { buildFeedItems } from '../utils/feed';

interface ExplorePageProps {
  opportunities: Opportunity[];
  multiopps: MultiOpp[];
  students: User[];
  signups: SignUp[];
  allOrgs: Organization[];
  oppsLoading: boolean;
}

/**
 * Public, signed-out view of the opportunity feed. Shares the feed filtering
 * and cards with OpportunitiesPage, but has no signup handlers: every action a
 * visitor takes on a card sends them to the sign-in prompt.
 */
const ExplorePage: React.FC<ExplorePageProps> = ({
  opportunities,
  multiopps,
  students,
  signups,
  allOrgs,
  oppsLoading,
}) => {
  // The feed order (and with it the list of admin-hidden multiopps) is only
  // served to authenticated users. Until it loads we treat the hidden list as
  // unknown, which hides every multiopp rather than leaking a hidden one.
  const { data: feedOrderResponse } = useQuery<FeedOrderResponse>({
    queryKey: ['feedOrder'],
    queryFn: api.getFeedOrder,
    retry: false,
  });

  const feedItems = useMemo(
    () =>
      buildFeedItems({
        opportunities,
        multiopps,
        currentUser: null,
        feedOrder: feedOrderResponse?.order ?? [],
        invisibleMultioppIds: feedOrderResponse?.invisible_multiopps ?? null,
      }),
    [opportunities, multiopps, feedOrderResponse]
  );

  const renderOpportunityCard = (opp: Opportunity) => {
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

    return (
      <OpportunityCard
        opportunity={opp}
        signedUpStudents={signedUpStudents}
        currentUser={null}
        isUserSignedUp={false}
        allOrgs={allOrgs}
      />
    );
  };

  return (
    <>
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
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {feedItems.map((item) => {
          if (item.kind === 'multiopp') {
            return (
              <MultiOppCard
                key={`multiopp-${item.data.id}`}
                multiopp={item.data}
                currentUser={null}
                allOrgs={allOrgs}
                opportunitiesData={opportunities}
              />
            );
          }

          const opp = item.data as Opportunity;
          return (
            <React.Fragment key={`opp-${opp.id}`}>
              {renderOpportunityCard(opp)}
            </React.Fragment>
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
        </div>
      ) : null}

      <p className="text-xs text-gray-500 mt-6 text-center">
        Click here to see our {" "}
        <a
          href="/terms_of_service.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Terms of Service
        </a>
        {" "}and{" "}
        <a
          href="/privacy_policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Privacy Policy
        </a>
        .
      </p>
    </>
  );
};

export default ExplorePage;
