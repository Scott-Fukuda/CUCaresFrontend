// import React, { useState, useMemo } from 'react';
// import { Opportunity, User, SignUp, allInterests, Organization, MultiOpp } from '../types';
// import OpportunityCard  from '../components/OpportunityCard';
// import MultiOppCard  from '../components/MultiOppCard';
// import { useNavigate } from 'react-router-dom';

// interface OpportunitiesPageProps {
//   opportunities: Opportunity[];
//   students: User[];
//   signups: SignUp[];
//   multiopps: MultiOpp[];
//   allOpps: (Opportunity | MultiOpp)[];
//   currentUser: User;
//   handleSignUp: (opportunityId: number) => void;
//   handleUnSignUp: (
//     opportunityId: number,
//     opportunityDate?: string,
//     opportunityTime?: string
//   ) => void;
//   allOrgs: Organization[];
//   currentUserSignupsSet: Set<number>;
// }

// const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
//   opportunities,
//   multiopps,
//   students,
//   signups,
//   allOpps,
//   currentUser,
//   handleSignUp,
//   handleUnSignUp,
//   allOrgs,
//   currentUserSignupsSet,
// }) => {
//   const navigate = useNavigate();
//   // Filter functionality disabled
//   // const [causeFilter, setCauseFilter] = useState<string>('All');
//   // const [dateFilter, setDateFilter] = useState<string>('');

//   const filteredOpportunities = useMemo(() => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // start of local day
        
//       // add a spread operator here for mulitopps. this should be the onluplace wehere mulitopps are 
//       // are considered alongside
//     return opportunities
    
//       .map((opp) => {
//         const dateSegment = opp.date?.split('T')[0];
//         if (!dateSegment) {
//           return null;
//         }

//         const [yearStr, monthStr, dayStr] = dateSegment.split('-');
//         const year = Number(yearStr);
//         const month = Number(monthStr);
//         const day = Number(dayStr);
//         if (
//           !Number.isInteger(year) ||
//           !Number.isInteger(month) ||
//           !Number.isInteger(day)
//         ) {
//           return null;
//         }

//         const actualDate = new Date(year, month - 1, day);
//         if (Number.isNaN(actualDate.getTime())) {
//           return null;
//         }

//         const [hoursRaw, minutesRaw] = (opp.time ?? '00:00').split(':');
//         const hours = Number(hoursRaw);
//         const minutes = Number(minutesRaw);
//         const safeHours = Number.isInteger(hours) && hours >= 0 && hours < 24 ? hours : 0;
//         const safeMinutes =
//           Number.isInteger(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0;
//         const fullDateTime = new Date(year, month - 1, day, safeHours, safeMinutes);

//         return {
//           ...opp,
//           localDate: actualDate,
//           fullDateTime,
//           actualDateString: `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(
//             2,
//             '0'
//           )}`, // YYYY-MM-DD
//         };
//       })
//       .filter(
//         (
//           opp
//         ): opp is Opportunity & {
//           localDate: Date;
//           fullDateTime: Date;
//           actualDateString: string;
//         } => opp !== null
//       )
//       .filter((opp) => {
//         // Only approved opportunities
//         if (!opp.approved) return false;

//         // Don't show past events - compare with actual date
//         return opp.localDate.getTime() >= today.getTime();
//       })
//       .filter((opp) => {
//         if (opp.visibility) {
//           // If opportunity is private, check if user belongs to any allowed orgs
//           if (opp.visibility.length === 0 || currentUser.admin) return true; // public
//           const userOrgIds = currentUser.organizationIds || [];
//           console.log('User org IDs:', userOrgIds);
//           console.log('Opportunity visibility IDs:', opp.visibility);
//           console.log(
//   "🧭 visibility debug →",
//   opp.id,
//   typeof opp.visibility,
//   Array.isArray(opp.visibility),
//   opp.visibility
// );

//           return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
//         }
//       })
//       // filter out opportunities that exist under multiopps
//       .filter((opp) => {return (!opp.multiopp)
//       })
//       .sort((a, b) => a.fullDateTime.getTime() - b.fullDateTime.getTime());
//   }, [allOpps, currentUser]);

//   const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
//   const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
//   const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

//   const handleExternalSignup = (opportunity: Opportunity) => {
//     setSelectedOpportunity(opportunity);
//     setShowExternalSignupModal(true);
//   };

//   const handleExternalUnsignup = (opportunity: Opportunity) => {
//     setSelectedOpportunity(opportunity);
//     setShowExternalUnsignupModal(true);
//   };

//   const handleExternalSignupConfirm = () => {
//     if (selectedOpportunity) {
//       // Open the external URL in a new tab
//       window.open(selectedOpportunity.redirect_url!, '_blank');

//       // Still register the user locally
//       handleSignUp(selectedOpportunity.id);

//       // Close the modal
//       setShowExternalSignupModal(false);
//       setSelectedOpportunity(null);
//     }
//   };

//   const handleExternalUnsignupConfirm = () => {
//     if (selectedOpportunity) {
//       // Proceed with local unregistration
//       handleUnSignUp(selectedOpportunity.id, selectedOpportunity.date, selectedOpportunity.time);

//       // Close the modal
//       setShowExternalUnsignupModal(false);
//       setSelectedOpportunity(null);
//     }
//   };

//   const handleExternalSignupCancel = () => {
//     setShowExternalSignupModal(false);
//     setSelectedOpportunity(null);
//   };

//   const handleExternalUnsignupCancel = () => {
//     setShowExternalUnsignupModal(false);
//     setSelectedOpportunity(null);
//   };

//   function isMultiOpp(item: Opportunity | MultiOpp): item is MultiOpp {
//   return Array.isArray((item as MultiOpp).opportunities);
// }


//   return (
//     <>
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
//             Upcoming Opportunities
//           </h2>
//           <p className="text-gray-600">
//             Find the perfect way to make an impact in the Ithaca community.
//           </p>
//         </div>
//         <div className="flex gap-3">
//           <button
//             onClick={() => navigate('/create-opportunity')}
//             className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
//           >
//             Create Opportunity
//           </button>
//         </div>
//       </div>

//       {/* Filters - Disabled */}
//       {/* <div className="bg-white p-4 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row gap-4 items-center">
//         <div className="flex-1 w-full">
//           <label htmlFor="cause-filter" className="block text-sm font-medium text-gray-700">Filter by Cause</label>
//           <select
//             id="cause-filter"
//             value={causeFilter}
//             onChange={e => setCauseFilter(e.target.value)}
//             className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cornell-red focus:border-cornell-red sm:text-sm rounded-md bg-white"
//           >
//             <option>All</option>
//             {allInterests.map(interest => <option key={interest}>{interest}</option>)}
//           </select>
//         </div>
//         <div className="flex-1 w-full">
//           <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Filter by Date</label>
//           <input
//             type="date"
//             id="date-filter"
//             value={dateFilter}
//             onChange={e => setDateFilter(e.target.value)}
//             className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cornell-red focus:border-cornell-red sm:text-sm rounded-md bg-white"
//           />
//         </div>
//         <button
//           onClick={() => { setCauseFilter('All'); setDateFilter(''); }}
//           className="mt-2 sm:mt-6 w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cornell-red hover:bg-red-800"
//         >
//           Clear
//         </button>
//       </div> */}

//       {/* Opportunities Grid
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {filteredOpportunities.map((opp) => {
//           // Use backend data directly - it's more reliable than trying to combine sources
//           let signedUpStudents: User[] = [];

//           if (opp.involved_users && opp.involved_users.length > 0) {
//             // Use backend data directly - these are already transformed User objects
//             signedUpStudents = opp.involved_users.filter(
//               (user) => user.registered === true || opp.host_id === user.id
//             );
//           } else {
//             // Fallback to local signups if no backend data
//             const opportunitySignups = signups.filter((s) => s.opportunityId === opp.id);
//             signedUpStudents = students.filter((student) =>
//               opportunitySignups.some((s) => s.userId === student.id)
//             );
//           }

//           // Check if current user is signed up
//           const isUserSignedUp = opp.involved_users
//             ? opp.involved_users.some(
//                 (user) =>
//                   user.id === currentUser.id && (user.registered || opp.host_id === currentUser.id)
//               )
//             : currentUserSignupsSet.has(opp.id);

//           return (
//             <OpportunityCard
//               key={opp.id}
//               opportunity={opp}
//               signedUpStudents={signedUpStudents}
//               currentUser={currentUser}
//               onSignUp={handleSignUp}
//               onUnSignUp={handleUnSignUp}
//               isUserSignedUp={isUserSignedUp}
//               allOrgs={allOrgs}
//               onExternalSignup={handleExternalSignup} // Add the callback
//               onExternalUnsignup={handleExternalUnsignup} // Add the callback
//             />
//           );
//         })}
//       </div> */}
//       {/* Opportunities Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {filteredOpportunities.map((opp) => {
//           // Use backend data directly
//           let signedUpStudents: User[] = [];

//           if (opp.involved_users && opp.involved_users.length > 0) {
//             signedUpStudents = opp.involved_users.filter(
//               (user) => user.registered === true || opp.host_id === user.id
//             );
//           } else {
//             const opportunitySignups = signups.filter((s) => s.opportunityId === opp.id);
//             signedUpStudents = students.filter((student) =>
//               opportunitySignups.some((s) => s.userId === student.id)
//             );
//           }

//           const isUserSignedUp = opp.involved_users
//             ? opp.involved_users.some(
//                 (user) =>
//                   user.id === currentUser.id &&
//                   (user.registered || opp.host_id === currentUser.id)
//               )
//             : currentUserSignupsSet.has(opp.id);

//           // New logic: choose which card to render
//           if (isMultiOpp(opp)) {
//             return (
//               <MultiOppCard
//                 key={`multi-${opp.id}`}
//                 multiopp={opp}
//                 currentUser={currentUser}
//                 allOrgs={allOrgs}
//                 onSignUp={handleSignUp}
//                 onUnSignUp={handleUnSignUp}
//               />
//             );
//           }

//           return (
//             <OpportunityCard
//               key={`opp-${opp.id}`}
//               opportunity={opp}
//               signedUpStudents={signedUpStudents}
//               currentUser={currentUser}
//               onSignUp={handleSignUp}
//               onUnSignUp={handleUnSignUp}
//               isUserSignedUp={isUserSignedUp}
//               allOrgs={allOrgs}
//               onExternalSignup={handleExternalSignup}
//               onExternalUnsignup={handleExternalUnsignup}
//             />
//           );
//         })}
//       </div>


//       {filteredOpportunities.length === 0 && (
//         <div className="col-span-full text-center py-12 px-6 bg-white rounded-2xl shadow-lg">
//           <h3 className="text-xl font-semibold text-gray-800">
//             There are currently no opportunities.
//           </h3>
//           <p className="text-gray-500 mt-2">Please click 'Create Opportunity' if you would like to propose an opportunity.</p>
//         </div>
//       )}

//       {/* External Signup Modal */}
//       {showExternalSignupModal && selectedOpportunity && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-md mx-4">
//             <h3 className="text-lg font-bold text-gray-900 mb-4">External Registration Required</h3>
//             <p className="text-gray-600 mb-4">
//               Please register externally on this link by clicking the button below.
//             </p>
//             <p className="text-sm text-gray-500 mb-6">
//               After registering externally, you'll still be registered locally in our system.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={handleExternalSignupConfirm}
//                 className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
//               >
//                 Open Link & Register Locally
//               </button>
//               <button
//                 onClick={handleExternalSignupCancel}
//                 className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* External Unsignup Modal */}
//       {showExternalUnsignupModal && selectedOpportunity && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-md mx-4">
//             <h3 className="text-lg font-bold text-gray-900 mb-4">External Application Notice</h3>
//             <p className="text-gray-600 mb-4">
//               This opportunity required an external application. Please notify the host non-profit
//               that you no longer are able to participate in this opportunity.
//             </p>
//             <p className="text-sm text-gray-500 mb-6">
//               You will still be unregistered from our local system.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={handleExternalUnsignupConfirm}
//                 className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
//               >
//                 Unregister Locally
//               </button>
//               <button
//                 onClick={handleExternalUnsignupCancel}
//                 className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//         <p className="text-xs text-gray-500 mt-6 text-center">
//           Click here to see our {" "}
//           <a
//             href="/Terms of Service.pdf"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="underline hover:text-gray-700"
//           >
//             Terms of Service and Privacy Policy
//           </a>
//           .
//         </p>
//     </>
//   );
// };

// export default OpportunitiesPage;
import React, { useState, useMemo } from 'react';
import { Opportunity, User, SignUp, allInterests, Organization, MultiOpp } from '../types';
import OpportunityCard  from '../components/OpportunityCard';
import MultiOppCard  from '../components/MultiOppCard';
import { useNavigate } from 'react-router-dom';

interface OpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  multiopps: MultiOpp[];
  allOpps: (Opportunity | MultiOpp)[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ) => void;
  allOrgs: Organization[];
  currentUserSignupsSet: Set<number>;
  multiopps: MultiOpp[];
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  opportunities,
  multiopps,
  students,
  signups,
  allOpps,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  allOrgs,
  currentUserSignupsSet,
  multiopps,
}) => {
  const navigate = useNavigate();
  // Filter functionality disabled
  // const [causeFilter, setCauseFilter] = useState<string>('All');
  // const [dateFilter, setDateFilter] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of local day
        
      // add a spread operator here for mulitopps. this should be the onluplace wehere mulitopps are 
      // are considered alongside
    
    return allOpps
      .map((opp) => {
        const dateSegment = opp.date?.split('T')[0];
        if (!dateSegment) {
          return null;
        }

        const [yearStr, monthStr, dayStr] = dateSegment.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        if (
          !Number.isInteger(year) ||
          !Number.isInteger(month) ||
          !Number.isInteger(day)
        ) {
          return null;
        }

        const actualDate = new Date(year, month - 1, day);
        if (Number.isNaN(actualDate.getTime())) {
          return null;
        }

        const [hoursRaw, minutesRaw] = (opp.time ?? '00:00').split(':');
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);
        const safeHours = Number.isInteger(hours) && hours >= 0 && hours < 24 ? hours : 0;
        const safeMinutes =
          Number.isInteger(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0;
        const fullDateTime = new Date(year, month - 1, day, safeHours, safeMinutes);

        return {
          ...opp,
          localDate: actualDate,
          fullDateTime,
          actualDateString: `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(
            2,
            '0'
          )}`, // YYYY-MM-DD
        };
      })
      .filter(
        (
          opp
        ): opp is Opportunity & {
          localDate: Date;
          fullDateTime: Date;
          actualDateString: string;
        } => opp !== null
      )
      .filter((opp) => {
        // Only approved opportunities
        if (!opp.approved) return false;

        // Don't show past events - compare with actual date
        return opp.localDate.getTime() >= today.getTime();
      })
      .filter((opp) => {
        if (opp.visibility) {
          // If opportunity is private, check if user belongs to any allowed orgs
          if (opp.visibility.length === 0 || currentUser.admin) return true; // public
          const userOrgIds = currentUser.organizationIds || [];
          return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
        }
      })
      // filter out opportunities that exist under multiopps
      .filter((opp) => {return (!opp.multiopp)
      })
      .sort((a, b) => a.fullDateTime.getTime() - b.fullDateTime.getTime());
  }, [allOpps, currentUser]);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const handleExternalSignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalSignupModal(true);
  };

  console.log(currentUser);
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

  function isMultiOpp(item: Opportunity | MultiOpp): item is MultiOpp {
  return Array.isArray((item as MultiOpp).opportunities);
}


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
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create-opportunity')}
            className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
          >
            Create Opportunity
          </button>
        </div>
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

      {/* Opportunities Grid
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Render MultiOpps with visibility filtering */}
        {multiopps
          .filter((multiopp) => {
            // Public or admin always allowed
            if (!multiopp.visibility || multiopp.visibility.length === 0 || currentUser.admin)
              return true;

            const userOrgIds = currentUser.organizationIds || [];
            return multiopp.visibility.some((orgId) => userOrgIds.includes(orgId));
          })
          .map((multiopp) => (
            <MultiOppCard
              key={multiopp.id}
              multiopp={multiopp}
              currentUser={currentUser}
              allOrgs={allOrgs}
              opportunitiesData={opportunities}
              onSignUp={handleSignUp}
              onUnSignUp={handleUnSignUp}
              onExternalSignup={handleExternalSignup}
              onExternalUnsignup={handleExternalUnsignup}
            />
          ))}

        {filteredOpportunities.map((opp) => {
          // Use backend data directly - it's more reliable than trying to combine sources
          let signedUpStudents: User[] = [];

          if (opp.involved_users && opp.involved_users.length > 0) {
            // Use backend data directly - these are already transformed User objects
            signedUpStudents = opp.involved_users.filter(
              (user) => user.registered === true || opp.host_id === user.id
            );
          } else {
            // Fallback to local signups if no backend data
            const opportunitySignups = signups.filter((s) => s.opportunityId === opp.id);
            signedUpStudents = students.filter((student) =>
              opportunitySignups.some((s) => s.userId === student.id)
            );
          }

          // Check if current user is signed up
          const isUserSignedUp = opp.involved_users
            ? opp.involved_users.some(
                (user) =>
                  user.id === currentUser.id && (user.registered || opp.host_id === currentUser.id)
              )
            : currentUserSignupsSet.has(opp.id);

          return (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              signedUpStudents={signedUpStudents}
              currentUser={currentUser}
              onSignUp={handleSignUp}
              onUnSignUp={handleUnSignUp}
              isUserSignedUp={isUserSignedUp}
              allOrgs={allOrgs}
              onExternalSignup={handleExternalSignup} // Add the callback
              onExternalUnsignup={handleExternalUnsignup} // Add the callback
            />
          );
        })}
      </div> */}
      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOpportunities.map((opp) => {
          // Use backend data directly
          let signedUpStudents: User[] = [];

          if (opp.involved_users && opp.involved_users.length > 0) {
            signedUpStudents = opp.involved_users.filter(
              (user) => user.registered === true || opp.host_id === user.id
            );
          } else {
            const opportunitySignups = signups.filter((s) => s.opportunityId === opp.id);
            signedUpStudents = students.filter((student) =>
              opportunitySignups.some((s) => s.userId === student.id)
            );
          }

          const isUserSignedUp = opp.involved_users
            ? opp.involved_users.some(
                (user) =>
                  user.id === currentUser.id &&
                  (user.registered || opp.host_id === currentUser.id)
              )
            : currentUserSignupsSet.has(opp.id);

          // New logic: choose which card to render
          if (isMultiOpp(opp)) {
            return (
              <MultiOppCard
                key={`multi-${opp.id}`}
                multiopp={opp}
                currentUser={currentUser}
                allOrgs={allOrgs}
                onSignUp={handleSignUp}
                onUnSignUp={handleUnSignUp}
              />
            );
          }

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
            />
          );
        })}
      </div>


      {filteredOpportunities.length === 0 && (
        <div className="col-span-full text-center py-12 px-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            There are currently no opportunities.
          </h3>
          <p className="text-gray-500 mt-2">Please click 'Create Opportunity' if you would like to propose an opportunity.</p>
        </div>
      )}

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
            href="/terms_of_services.pdf"
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
