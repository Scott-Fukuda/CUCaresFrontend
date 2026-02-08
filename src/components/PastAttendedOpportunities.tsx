import React, { useMemo } from "react";
import { Opportunity, User, Organization } from "../types";
import OpportunityCard from "./OpportunityCard";


interface PastAttendedOpportunitiesProps {
  opportunities: Opportunity[];
  currentUser: User;
  allOrgs: Organization[];
  loading?: boolean;
}

const PastAttendedOpportunities: React.FC<PastAttendedOpportunitiesProps> = ({
  opportunities,
  currentUser,
  allOrgs,
  loading = false,
}) => {

  const pastOpportunities = useMemo(() => {
    const now = new Date();
    if (opportunities.length === 0) {
      return [];
    }

    // For now, let's try a simpler approach - show all past opportunities
    // and let the user see what data we have
    return opportunities.filter((opp) => {
      const oppDateTime = new Date(`${opp.date}T${opp.time}`);
      const isPast = oppDateTime < now;

      // Check if user is involved in any way
      const userInvolved = opp.involved_users?.some((u) => u.id === currentUser.id);
      return isPast && userInvolved;
    });
  }, [opportunities, currentUser.id]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Past Attended Opportunities</h2>

      {loading && (
        <div className="text-center p-4">
          <p>Loading past opportunities...</p>
        </div>
      )}

      {!loading && pastOpportunities.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>You haven't attended any opportunities yet.</p>
        </div>
      )}

      {!loading && pastOpportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastOpportunities.map((opp) => {
            const signedUpStudents =
              opp.involved_users?.filter(
                (u) => u.attended || opp.host_id === u.id
              ) ?? [];

            return (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                signedUpStudents={signedUpStudents}
                allOrgs={allOrgs}
                currentUser={currentUser}
                onSignUp={() => { }}
                onUnSignUp={() => { }}
                isUserSignedUp={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PastAttendedOpportunities;
