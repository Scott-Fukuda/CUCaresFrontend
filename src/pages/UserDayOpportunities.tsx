// NOTE: As of right now, this page is not being used anywhere

// import React, { useState, useEffect, useMemo } from "react";
// import { useParams } from "react-router-dom";
// import { Opportunity, User, Organization } from "../types";
// import OpportunityCard from "../components/OpportunityCard";
// import { getOpportunities } from "../api";

// type UserDayOpportunitiesProps = {
//   currentUser: User;
//   onSignUp: (oppId: number) => void;
//   onUnSignUp: (oppId: number) => void;
//   isUserSignedUp: (oppId: number, userId: number) => boolean;
//   allOrgs: Organization[];
//   onExternalSignup?: (oppId: number) => void;
//   onExternalUnsignup?: (oppId: number) => void;
// };

// const UserDayOpportunities: React.FC<UserDayOpportunitiesProps> = ({
//   currentUser,
//   onSignUp,
//   onUnSignUp,
//   isUserSignedUp,
//   allOrgs,
//   onExternalSignup,
//   onExternalUnsignup,
// }) => {

//   // 1️⃣ Get the date from the URL
//   const { date } = useParams<{ date: string }>();

//   // 2️⃣ Local state to store all opportunities
//   const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
//   const [loading, setLoading] = useState(true);

//   // 3️⃣ Fetch all opportunities from the API
//   useEffect(() => {
//     const fetchOpportunities = async () => {
//       try {
//         const opps = await getOpportunities();
//         setAllOpportunities(opps);
//       } catch (err) {
//         console.error("Error fetching opportunities:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOpportunities();
//   }, []);

//   // 4️⃣ Filter opportunities for the selected date and attended by user
//   const dayOpportunities: Opportunity[] = useMemo(() => {
//     if (!date || allOpportunities.length === 0) return [];

//     const selectedDate = new Date(date);

//     console.log("Selected date from URL:", selectedDate);
//     console.log("All opportunities fetched:", allOpportunities);


//     return allOpportunities.filter((opp) => {
//       const oppDate = opp.date;
//       const attendedByUser = opp.involved_users?.some(
//         (user) => user.id === currentUser.id && user.attended
//       );

//       console.log(
//       `Opp: ${opp.id}, oppDateTime: ${oppDate}, selectedDate: ${date}, attendedByUser: ${attendedByUser}`
//       );

//     return oppDate === date && attendedByUser;
//     });
//   }, [date, allOpportunities, currentUser.id]);

//   // 5️⃣ Show loading state
//   if (loading) {
//     return <div className="text-center p-10 font-semibold text-lg"> Loading...</div>;
//   }

//   const formattedDate = date
//     ? (() => {
//         const [year, month, day] = date.split("-").map(Number);
//         const localDate = new Date(year, month - 1, day); // month is 0-indexed
//         return localDate.toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         });
//       })()
//     : "";

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
//     {/* Header */}
//     <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
//       Opportunities You Attended on {formattedDate}
//     </h2>

//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {dayOpportunities.map((opp) => {
//       return (
//           <OpportunityCard
//             key={opp.id}
//             opportunity={opp}
//             signedUpStudents={opp.involved_users ?? []}
//             allOrgs={allOrgs}
//             currentUser={currentUser}
//             onSignUp={() => onSignUp(opp.id)}
//             onUnSignUp={() => onUnSignUp(opp.id)}
//             isUserSignedUp={isUserSignedUp(opp.id, currentUser.id)}
//             onExternalSignup={
//               onExternalSignup ? () => onExternalSignup(opp.id) : undefined
//             }
//             onExternalUnsignup={
//               onExternalUnsignup ? () => onExternalUnsignup(opp.id) : undefined
//             }
//           />
//       );
//     })}
//   </div>
// </div>
//   );
// };

// export default UserDayOpportunities;
