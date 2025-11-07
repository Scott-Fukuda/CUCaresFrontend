import React, { useMemo } from 'react';
import { Opportunity, User, SignUp, Organization } from '../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl, removeCarpoolUser } from '../api';
import {
  canUnregisterFromOpportunity,
  formatTimeUntilEvent,
  calculateEndTime,
} from '../utils/timeUtils';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OpportunityCardProps {
  opportunity: Opportunity;
  signedUpStudents: User[];
  allOrgs: Organization[];
  currentUser: User;
  onSignUp: (opportunityId: number) => void;
  onUnSignUp: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  isUserSignedUp: boolean;
  onExternalSignup?: (opportunity: Opportunity) => void; // Add callback for external signup
  onExternalUnsignup?: (opportunity: Opportunity) => void; // Add callback for external unsignup
  showPopup: (
        title: string,
        message: string,
        type: 'success' | 'info' | 'warning' | 'error'
    ) => void
}

const PeopleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/icons/points-icon.png" alt="Points" className={className || 'h-5 w-5'} />
);

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  signedUpStudents,
  allOrgs,
  currentUser,
  onSignUp,
  onUnSignUp,
  isUserSignedUp,
  onExternalSignup,
  onExternalUnsignup,
  showPopup
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [clickedStudentId, setClickedStudentId] = useState<number | null>(null);

  // Add click handler for profile pictures
  const handleProfileClick = (studentId: number) => {
    if (clickedStudentId === studentId) {
      setClickedStudentId(null); // Hide if already showing
    } else {
      setClickedStudentId(studentId); // Show name
    }
  };

  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;
  const eventStarted = new Date() >= new Date(`${opportunity.date}T${opportunity.time}`);
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
    navigate(`/opportunity/${opportunity.id}`);
  };

  const handleButtonClick = async () => {
    if (isUserSignedUp) {
      if (opportunity.allow_carpool) {
        try {
            const res = await removeCarpoolUser({
                user_id: currentUser.id,
                carpool_id: opportunity.carpool_id
            });

            if (!res.valid) {
              showPopup(
                'Failed to unregister',
                'You have signed up to drive for this event and therefore cannot unregister.',
                'error'
              );
              return;
            }
            queryClient.invalidateQueries({ queryKey: ['rides', opportunity.carpool_id] });
        } catch (err) {
            console.log('Failed to remove ride:', err);
        }
      }
      // Check if this is an external opportunity and user is trying to unregister
      if (opportunity.redirect_url && onExternalUnsignup) {
        onExternalUnsignup(opportunity);
      } else {
        onUnSignUp(opportunity.id, opportunity.date, opportunity.time);
      }
    } else {
      // Check if this is an external signup opportunity
      if (opportunity.redirect_url && onExternalSignup) {
        onExternalSignup(opportunity);
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
    // setShowExternalSignupModal(false); // This state is removed, so this line is removed
  };

  const handleExternalUnsignup = () => {
    // Open the external URL in a new tab
    window.open(opportunity.redirect_url!, '_blank');

    // Still register the user locally
    onSignUp(opportunity.id);

    // Close the modal
    // setShowExternalUnsignupModal(false); // This state is removed, so this line is removed
  };

  const handleExternalSignupConfirm = () => {
    if (opportunity) {
      // Open the external URL in a new tab
      window.open(opportunity.redirect_url!, '_blank');

      // Still register the user locally
      onSignUp(opportunity.id);

      // Close the modal
      // setShowExternalSignupModal(false); // This state is removed, so this line is removed
    }
  };

  const handleExternalUnsignupConfirm = () => {
    if (opportunity) {
      // Proceed with local unregistration
      onUnSignUp(opportunity.id, opportunity.date, opportunity.time);

      // Close the modal
      // setShowExternalUnsignupModal(false); // This state is removed, so this line is removed
    }
  };

  const handleExternalSignupCancel = () => {
    // setShowExternalSignupModal(false); // This state is removed, so this line is removed
    // setSelectedOpportunity(null); // This state is removed, so this line is removed
  };

  const handleExternalUnsignupCancel = () => {
    // setShowExternalUnsignupModal(false); // This state is removed, so this line is removed
    // setSelectedOpportunity(null); // This state is removed, so this line is removed
  };

  const topOrgs = useMemo(() => {
    const orgCounts: { [key: number]: number } = {};
    signedUpStudents.forEach((student) => {
      student.organizationIds.forEach((orgId) => {
        orgCounts[orgId] = (orgCounts[orgId] || 0) + 1;
      });
    });

    return Object.entries(orgCounts)
      .filter(([, count]) => count >= 2) // Only include organizations with at least 2 people
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([orgId]) => allOrgs.find((g) => g.id === parseInt(orgId)))
      .filter((g): g is Organization => !!g);
  }, [signedUpStudents, allOrgs]);

  const visibilityOrgs = useMemo(() => {
    if (!Array.isArray(opportunity.visibility) || opportunity.visibility.length === 0)
      return [] as Organization[];
    return allOrgs
      .filter((org) => opportunity.visibility.includes(org.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunity.visibility, allOrgs]);

  // Create a Date object and add 1 day
  console.log('card opp', opportunity)
  const dateObj = new Date(opportunity.date);
  dateObj.setDate(dateObj.getDate() + 1);

  const displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);

  // const [showExternalSignupModal, setShowExternalSignupModal] = useState(false); // This state is removed

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 duration-300 cursor-pointer"
    >
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-semibold text-cornell-red uppercase tracking-wider truncate">
              {opportunity.nonprofit}
            </span>
            {isUserHost && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                Host
              </span>
            )}
            {/* {currentUser.admin && !isUserHost && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Admin
                    </span>
                )} */}
          </div>
          <span
            className="text-white-50 text-xs font-bold py-1 rounded-full w-[80px] text-center inline-block flex-shrink-0 ml-2"
            style={{ backgroundColor: '#F5F5F5' }}
          >
            {opportunity.points} PTS
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.name}</h3>
        <p className="text-gray-500 text-sm mb-4">
          {displayDate} &bull; {displayTime} - {displayEndTime}
        </p>
        {opportunity.address && (
          <p className="text-gray-600 text-sm mb-4">📍 {opportunity.address}</p>
        )}

        <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <PeopleIcon className="h-5 w-5 text-cornell-red" />
            <span>
              Signed Up ({signedUpStudents.length}/{opportunity.total_slots})
            </span>
          </div>
          <span
            className={`${availableSlots > 0 || isUserSignedUp ? 'text-green-600' : 'text-red-600'} font-bold`}
          >
            {availableSlots} slots left
          </span>
        </div>

        {signedUpStudents.length > 0 ? (
          <div className="flex items-center -space-x-2 mb-4">
            {signedUpStudents.slice(0, 10).map((student) => (
              <div key={student.id} className="group relative hover:z-10">
                <img
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white cursor-pointer"
                  src={getProfilePictureUrl(student.profile_image)}
                  alt={student.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(student.id);
                  }}
                />
                <div
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md transition-opacity pointer-events-none ${clickedStudentId === student.id
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
                  {student.name}
                  <svg
                    className="absolute text-gray-800 h-2 w-full left-0 top-full"
                    x="0px"
                    y="0px"
                    viewBox="0 0 255 255"
                    xmlSpace="preserve"
                  >
                    <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                  </svg>
                </div>
              </div>
            ))}
            {signedUpStudents.length > 10 && (
              <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold ring-2 ring-white">
                +{signedUpStudents.length - 10}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center h-8 mb-4 rounded-lg text-sm text-gray-500">
            Be the first to sign up! +5 bonus points
          </div>
        )}

        {topOrgs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <TrophyIcon className="h-5 w-5 text-yellow-500" />
              <span>Top Organizations Attending</span>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-light-gray rounded-lg">
              {topOrgs.map((org) => (
                <span
                  key={org.id}
                  data-clickable-org="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/group-detail/${org.id}`);
                  }}
                  className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
                >
                  {org.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibilityOrgs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <span>Visible To</span>
            </div>
            <div className="flex flex-wrap gap-2 p-1">
              {visibilityOrgs.map((org) => (
                <span
                  key={org.id}
                  data-clickable-org="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/group-detail/${org.id}`);
                  }}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {org.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={!eventStarted ? handleButtonClick : undefined}
          disabled={
            eventStarted || (!canSignUp && !isUserSignedUp) || (isUserSignedUp && !canUnregister)
          }
          className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors text-white ${eventStarted
              ? 'bg-gray-500 cursor-not-allowed'
              : isUserSignedUp
                ? canUnregister
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-500 cursor-not-allowed'
                : canSignUp
                  ? 'bg-cornell-red hover:bg-red-800'
                  : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          {eventStarted
            ? 'Event Already Started'
            : isUserSignedUp
              ? canUnregister
                ? 'Signed Up ✓'
                : `Unregistration Closed (${formatTimeUntilEvent(timeUntilEvent)})`
              : canSignUp
                ? opportunity.redirect_url
                  ? 'Sign Up Externally'
                  : 'Sign Up'
                : 'No Slots Available'}
        </button>

        {/* Remove the modal from here - it will be handled at page level */}

        {/* Show warning message if unregistration is blocked */}
        {isUserSignedUp && !canUnregister && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-800 text-center">
              ⚠️ Unregistration closed within 7 hours of event. Contact organizer if you need to
              cancel.
            </p>
          </div>
        )}

        {/* Tags at bottom */}
        {opportunity.tags && Array.isArray(opportunity.tags) && opportunity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {opportunity.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;
