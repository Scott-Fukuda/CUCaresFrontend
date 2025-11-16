import React, { useState } from "react";
import { Opportunity, User, Organization } from "../types";
import OpportunityCard from "./OpportunityCard";

interface Props {
  title: string;
  opportunities: Opportunity[];
  currentUser: User;
  allOrgs: Organization[];
}

const UpcomingToggleSection: React.FC<Props> = ({
  title,
  opportunities,
  currentUser,
  allOrgs,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

        {opportunities.length > 0 && (
          <button
            className="text-cornell-red hover:text-red-800 text-sm font-medium"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide" : "View"}
          </button>
        )}
      </div>

      {open && opportunities.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-4">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              allOrgs={allOrgs}
              currentUser={currentUser}
              signedUpStudents={opp.involved_users ?? []}
              isUserSignedUp={false}    // no signup logic on profile page
              onSignUp={() => {}}
              onUnSignUp={() => {}}
            />
          ))}
        </div>
      )}

      {open && opportunities.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">None available.</p>
      )}
    </div>
  );
};

export default UpcomingToggleSection;
