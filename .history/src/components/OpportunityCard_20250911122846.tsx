
import React, { useMemo } from 'react';
import { Opportunity, User, SignUp, Organization } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl } from '../api';
import { canUnregisterFromOpportunity, formatTimeUntilEvent, calculateEndTime } from '../utils/timeUtils';
import { useState } from 'react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  signedUpStudents: User[];
  allOrgs: Organization[];
  currentUser: User;
  onSignUp: (opportunityId: number) => void;
  onUnSignUp: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  isUserSignedUp: boolean;
  setPageState: (state: PageState) => void;
}

const PeopleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0019 16v1h-6.07zM6 11a5 5 0 00-4.54 2.91A6.978 6.978 0 001 16v1h11v-1a6.97 6.97 0 00-1.5-4.33A5 5 0 006 11z" />
    </svg>
);

const TrophyIcon: React.FC<{className?: string}> = ({className}) => (
    <img 
        src="/icons/points-icon.png" 
        alt="Points" 
        className={className || 'h-5 w-5'}
    />
);

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, signedUpStudents, allOrgs, currentUser, onSignUp, onUnSignUp, isUserSignedUp, setPageState }) => {
  // Debug logging
  console.log('Debug - Opportunity:', opportunity.name, 'ID:', opportunity.id);
  console.log('Debug - signedUpStudents:', signedUpStudents);
  console.log('Debug - signedUpStudents.length:', signedUpStudents.length);
  console.log('Debug - signedUpStudents data:', signedUpStudents.map(s => ({ id: s.id, name: s.name, profile_image: s.profile_image })));
  
  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;
  const isUserHost = opportunity.host_id === currentUser.id;
  const canManageOpportunity = isUserHost || currentUser.admin;
  
  // Check if user can unregister (7-hour rule)
  const unregistrationCheck = useMemo(() => {
    if (!isUserSignedUp) return null;
    return canUnregisterFromOpportunity(opportunity.date, opportunity.time);
  }, [isUserSignedUp, opportunity.date, opportunity.time]);
  
  const canUnregister = unregistrationCheck?.canUnregister ?? true;
  const timeUntilEvent = unregistrationCheck?.hoursUntilEvent ?? 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if the signup button or a group link was clicked
    if ((e.target as HTMLElement).closest('button, [data-clickable-org]')) {
      return;
    }
    setPageState({ page: 'opportunityDetail', id: opportunity.id });
  };
  
  const handleButtonClick = () => {
    if (isUserSignedUp) {
      onUnSignUp(opportunity.id, opportunity.date, opportunity.time);
    } else {
      // Check if this is an external signup opportunity
      if (opportunity.redirect_url) {
        setShowExternalSignupModal(true);
      } else {
        onSignUp(opportunity.id);
      }
    }
  };

  const handleExternalSignup = () => {
    // Open the external URL in a new tab
    window.open(opportunity.redirect_url!, '_blank');
    
    // Still register the user locally
    onSignUp(opportunity.id);
    
    // Close the modal
    setShowExternalSignupModal(false);
  };

  const topOrgs = useMemo(() => {
    const orgCounts: {[key: number]: number} = {};
    signedUpStudents.forEach(student => {
        student.organizationIds.forEach(orgId => {
            orgCounts[orgId] = (orgCounts[orgId] || 0) + 1;
        });
    });

    return Object.entries(orgCounts)
        .filter(([, count]) => count >= 2) // Only include organizations with at least 2 people
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([orgId]) => allOrgs.find(g => g.id === parseInt(orgId)))
        .filter((g): g is Organization => !!g);

  }, [signedUpStudents, allOrgs]);

// Create a Date object and add 1 day
const dateObj = new Date(opportunity.date);
dateObj.setDate(dateObj.getDate() + 1);

const displayDate = dateObj.toLocaleDateString('en-US', { 
  weekday: 'long', 
  month: 'short', 
  day: 'numeric', 
  year: 'numeric' 
});

const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
});

const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);

  return (
    <div onClick={handleCardClick} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 duration-300 cursor-pointer">
      <img 
          src={opportunity.imageUrl || '/backup.jpeg'} 
          alt={opportunity.name} 
          className="w-full h-48 object-cover"
          onError={(e) => {
              // Fallback to backup image if the main image fails to load
              const target = e.target as HTMLImageElement;
              if (target.src !== '/backup.jpeg') {
                  target.src = '/backup.jpeg';
              }
          }}
      />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-cornell-red uppercase tracking-wider">{opportunity.nonprofit}</span>
                {isUserHost && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Host
                    </span>
                )}
                {currentUser.admin && !isUserHost && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Admin
                    </span>
                )}
            </div>
            <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">{opportunity.points} PTS</span>
        </div>
        {opportunity.host_org_name && (
            <p className="text-sm text-gray-600 mb-2">🏢 Hosted by {opportunity.host_org_name}</p>
        )}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.name}</h3>
        <p className="text-gray-500 text-sm mb-4">{displayDate} &bull; {displayTime} - {displayEndTime}</p>
        {opportunity.address && (
          <p className="text-gray-600 text-sm mb-4">📍 {opportunity.address}</p>
        )}
        
        <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
            <div className="flex items-center gap-2">
                <PeopleIcon className="h-5 w-5 text-cornell-red" />
                <span>Signed Up ({signedUpStudents.length}/{opportunity.total_slots})</span>
            </div>
             <span className={`${availableSlots > 0 || isUserSignedUp ? 'text-green-600' : 'text-red-600'} font-bold`}>
                {availableSlots} slots left
             </span>
        </div>
        

        
        {signedUpStudents.length > 0 ? (
             <div className="flex items-center -space-x-2 mb-4">
                {signedUpStudents.slice(0, 10).map(student => (
                    <div key={student.id} className="group relative hover:z-10">
                        <img 
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white" 
                                                          src={getProfilePictureUrl(student.profile_image)} 
                            alt={student.name}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {student.name}
                            <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                            </svg>
                        </div>
                    </div>
                ))}
                {signedUpStudents.length > 10 && <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold ring-2 ring-white">+{signedUpStudents.length - 10}</div>}
             </div>
        ) : (
            <div className="text-center h-8 mb-4 rounded-lg text-sm text-gray-500">Be the first to sign up!</div>
        )}
        
        {topOrgs.length > 0 && (
             <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-500" />
                    <span>Top Organizations Attending</span>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-light-gray rounded-lg">
                    {topOrgs.map(org => (
                        <span 
                            key={org.id} 
                            data-clickable-org="true"
                            onClick={(e) => { e.stopPropagation(); setPageState({ page: 'groupDetail', id: org.id }); }}
                            className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-300 transition-colors">
                            {org.name}
                        </span>
                    ))}
                </div>
            </div>
        )}

        <button
          onClick={handleButtonClick}
          disabled={(!canSignUp && !isUserSignedUp) || (isUserSignedUp && !canUnregister)}
          className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors text-white ${
            isUserSignedUp
              ? canUnregister
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-500 cursor-not-allowed'
              : canSignUp
              ? 'bg-cornell-red hover:bg-red-800'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isUserSignedUp 
            ? canUnregister 
              ? 'Signed Up ✓' 
              : `Unregistration Closed (${formatTimeUntilEvent(timeUntilEvent)})`
            : canSignUp 
              ? (opportunity.redirect_url ? 'Sign Up Externally' : 'Sign Up')
              : 'No Slots Available'
          }
        </button>

        {/* External Signup Modal */}
        {showExternalSignupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">External Registration Required</h3>
              <p className="text-gray-600 mb-4">
                Please register externally on this link: 
                <a 
                  href={opportunity.redirect_url!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cornell-red hover:underline ml-1"
                >
                  {opportunity.redirect_url}
                </a>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                After registering externally, you'll still be registered locally in our system.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleExternalSignup}
                  className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Open Link & Register Locally
                </button>
                <button
                  onClick={() => setShowExternalSignupModal(false)}
                  className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show warning message if unregistration is blocked */}
        {isUserSignedUp && !canUnregister && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-800 text-center">
              ⚠️ Unregistration closed within 7 hours of event. 
              Contact organizer if you need to cancel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;