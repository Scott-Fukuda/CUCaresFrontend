import React, { useMemo, useState, useEffect } from "react";
import { Opportunity, User, Organization } from "../types";
import OpportunityCard from "../components/OpportunityCard";
import { getOpportunities } from "../api";


interface PastAttendedOpportunitiesPageProps {
  currentUser: User;
  onSignUp: (oppId: number) => void;
  onUnSignUp: (oppId: number) => void;
  isUserSignedUp: (oppId: number, userId: number) => boolean;
  allOrgs: Organization[];
  onExternalSignup?: (oppId: number) => void;
  onExternalUnsignup?: (oppId: number) => void;
}

const PastAttendedOpportunitiesPage: React.FC<PastAttendedOpportunitiesPageProps> = ({
  currentUser,
  onSignUp,
  onUnSignUp,
  isUserSignedUp,
  allOrgs,
  onExternalSignup,
  onExternalUnsignup,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
      const fetchAll = async () => {
        const all = await getOpportunities();
        setOpportunities(all);
        setLoading(false); // <-- done loading
      };
      fetchAll();
    }, []);

  const pastOpportunities = useMemo(() => {
    const now = new Date();
    return opportunities.filter((opp) => {
      const oppDateTime = new Date(`${opp.date}T${opp.time}`);
      return (
        oppDateTime < now &&
        opp.involved_users?.some((u) => u.id === currentUser.id && u.attended)
      );
    });
  }, [opportunities, currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
      Attended Opportunities
    </h2>
{loading && (
  <div className="text-center p-10 font-semibold text-lg">
    <p>Loading...</p>
  </div>
)}

{!loading && pastOpportunities.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <p>You haven't attended any opportunities yet.</p>
  </div>
)}

{!loading && pastOpportunities.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          onSignUp={() => {}}
          onUnSignUp={() => {}}
          isUserSignedUp={true}
        />
      );
    })}
  </div>
)}
</div>
);
};

export default PastAttendedOpportunitiesPage;
