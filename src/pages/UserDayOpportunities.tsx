import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Opportunity, User, Organization } from "../types";
import OpportunityCard from "../components/OpportunityCard";
import { getOpportunities } from "../api";

type UserDayOpportunitiesProps = {
  currentUser: User;
  onSignUp: (oppId: number) => void;
  onUnSignUp: (oppId: number) => void;
  isUserSignedUp: (oppId: number, userId: number) => boolean;
  allOrgs: Organization[];
  onExternalSignup?: (oppId: number) => void;
  onExternalUnsignup?: (oppId: number) => void;
};

const UserDayOpportunities: React.FC<UserDayOpportunitiesProps> = ({
  currentUser,
  onSignUp,
  onUnSignUp,
  isUserSignedUp,
  allOrgs,
  onExternalSignup,
  onExternalUnsignup,
}) => {
  // 1️⃣ Get the date from the URL
  const { date } = useParams<{ date: string }>();

  // 2️⃣ Local state to store all opportunities
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // 3️⃣ Fetch all opportunities from the API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const opps = await getOpportunities();
        setAllOpportunities(opps);
      } catch (err) {
        console.error("Error fetching opportunities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // 4️⃣ Filter opportunities for the selected date and attended by user
  const dayOpportunities: Opportunity[] = useMemo(() => {
    if (!date || allOpportunities.length === 0) return [];

    const selectedDate = new Date(date);

    console.log("Selected date from URL:", selectedDate);
    console.log("All opportunities fetched:", allOpportunities);


    return allOpportunities.filter((opp) => {
      const oppDate = opp.date;
      const attendedByUser = opp.involved_users?.some(
        (user) => user.id === currentUser.id && user.attended
      );

      console.log(
      `Opp: ${opp.id}, oppDateTime: ${oppDate}, selectedDate: ${date}, attendedByUser: ${attendedByUser}`
      );

    return oppDate === date && attendedByUser;
    });
  }, [date, allOpportunities, currentUser.id]);

  // 5️⃣ Show loading state
  if (loading) {
    return <p className="text-center mt-4 text-gray-500">Loading...</p>;
  }

  const formattedDate = date
    ? (() => {
        const [year, month, day] = date.split("-").map(Number);
        const localDate = new Date(year, month - 1, day); // month is 0-indexed
        return localDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      })()
    : "";

  return (
    <div className="user-day-opportunities max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Opportunities You Attended on {formattedDate}
      </h1>

      {dayOpportunities.length > 0 ? (
        dayOpportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            signedUpStudents={opp.involved_users ?? []}
            allOrgs={allOrgs}
            currentUser={currentUser}
            onSignUp={() => onSignUp(opp.id)}
            onUnSignUp={() => onUnSignUp(opp.id)}
            isUserSignedUp={isUserSignedUp(opp.id, currentUser.id)}
            onExternalSignup={
              onExternalSignup ? () => onExternalSignup(opp.id) : undefined
            }
            onExternalUnsignup={
              onExternalUnsignup ? () => onExternalUnsignup(opp.id) : undefined
            }
          />
        ))
      ) : (
        <p className="text-gray-500 text-center mt-4">
          No opportunities for this day.
        </p>
      )}
    </div>
  );
};

export default UserDayOpportunities;
