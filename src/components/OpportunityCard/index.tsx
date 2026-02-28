import React, { useMemo } from 'react';
import { Opportunity, User, SignUp, Organization } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl, removeCarpoolUser } from '../../api';
import {
  canUnregisterFromOpportunity,
  formatTimeUntilEvent,
  calculateEndTime,
} from '../../utils/timeUtils';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import './index.scss';

interface OpportunityCardProps {
  opportunity: Opportunity;
  signedUpStudents: User[];
  allOrgs: Organization[];
  currentUser: User | null;
  onSignUp?: (opportunityId: number) => void;
  onUnSignUp?: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  isUserSignedUp: boolean;
  onExternalSignup?: (opportunity: Opportunity) => void; // Add callback for external signup
  onExternalUnsignup?: (opportunity: Opportunity) => void; // Add callback for external unsignup
  showPopup?: (
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
    if (!currentUser) setClickedStudentId(null);

    if (clickedStudentId === studentId) {
      setClickedStudentId(null); // Hide if already showing
    } else {
      setClickedStudentId(studentId); // Show name
    }
  };

  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;
  const eventStarted = new Date() >= new Date(`${opportunity.date}T${opportunity.time}`);
  const isUserHost = currentUser ? opportunity.host_id === currentUser.id : false;

  // Check if user can unregister (7-hour rule)
  const unregistrationCheck = useMemo(() => {
    if (!isUserSignedUp) return null;
    return canUnregisterFromOpportunity(opportunity.date, opportunity.time);
  }, [isUserSignedUp, opportunity.date, opportunity.time]);

  const canUnregister = unregistrationCheck?.canUnregister ?? true;
  const timeUntilEvent = unregistrationCheck?.hoursUntilEvent ?? 0;

  const handleCardClick = (e: React.MouseEvent) => {
    if (!currentUser) { navigate('/sign-up'); return; }

    // Prevent navigation if the signup button or a group link was clicked
    if ((e.target as HTMLElement).closest('button, [data-clickable-org]')) {
      return;
    }
    navigate(`/opportunity/${opportunity.id}`);
  };

  const handleButtonClick = async () => {
    if (!currentUser) navigate('/sign-up');

    if (currentUser && isUserSignedUp) {
      if (opportunity.allow_carpool) {
        try {
          const res = await removeCarpoolUser({
            user_id: currentUser.id,
            carpool_id: opportunity.carpool_id
          });

          if (!res.valid && showPopup) {
            showPopup(
              'Failed to unregister',
              'You have signed up to drive for this event and therefore cannot unregister.',
              'error'
            );
            return;
          }
          queryClient.invalidateQueries({ queryKey: ['rides', opportunity.carpool_id] });
        } catch (err) {
        }
      }
      // Check if this is an external opportunity and user is trying to unregister
      if (opportunity.redirect_url && onExternalUnsignup) {
        onExternalUnsignup(opportunity);
      } else {
        if (onUnSignUp) onUnSignUp(opportunity.id, opportunity.date, opportunity.time);
      }
    } else {
      // Check if this is an external signup opportunity
      if (opportunity.redirect_url && onExternalSignup) {
        onExternalSignup(opportunity);
      } else {
        if (onSignUp) onSignUp(opportunity.id);
      }
    }
  };

  const handleExternalSignup = () => {
    // Open the external URL in a new tab
    window.open(opportunity.redirect_url!, '_blank');

    // Still register the user locally
    if (onSignUp) onSignUp(opportunity.id);

    // Close the modal
    // setShowExternalSignupModal(false); // This state is removed, so this line is removed
  };

  const handleExternalUnsignup = () => {
    // Open the external URL in a new tab
    window.open(opportunity.redirect_url!, '_blank');

    // Still register the user locally
    if (onSignUp) onSignUp(opportunity.id);

    // Close the modal
    // setShowExternalUnsignupModal(false); // This state is removed, so this line is removed
  };

  const handleExternalSignupConfirm = () => {
    if (opportunity) {
      // Open the external URL in a new tab
      window.open(opportunity.redirect_url!, '_blank');

      // Still register the user locally
      if (onSignUp) onSignUp(opportunity.id);

      // Close the modal
      // setShowExternalSignupModal(false); // This state is removed, so this line is removed
    }
  };

  const handleExternalUnsignupConfirm = () => {
    if (opportunity) {
      // Proceed with local unregistration
      if (onUnSignUp) onUnSignUp(opportunity.id, opportunity.date, opportunity.time);

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
    <div onClick={handleCardClick} className="opportunity-card">
      <img
        src={opportunity.imageUrl || '/backup.jpeg'}
        alt={opportunity.name}
        className="opportunity-card__image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== '/backup.jpeg') {
            target.src = '/backup.jpeg';
          }
        }}
      />
      <div className="opportunity-card__content">
        <div className="opportunity-card__header">
          <div className="opportunity-card__nonprofit-container">
            <span className="opportunity-card__nonprofit">
              {opportunity.nonprofit}
            </span>
            {isUserHost && (
              <span className="opportunity-card__host-badge">
                Host
              </span>
            )}
          </div>
          <span className="opportunity-card__points" style={{ backgroundColor: '#F5F5F5' }}>
            {opportunity.points} PTS
          </span>
        </div>

        <h3 className="opportunity-card__title">{opportunity.name}</h3>

        <p className="opportunity-card__datetime">
          {displayDate} &bull; {displayTime} - {displayEndTime}
        </p>

        {opportunity.address && (
          <p className="opportunity-card__address">📍 {opportunity.address}</p>
        )}

        <div className="opportunity-card__slots-info">
          <div className="opportunity-card__slots-label">
            <PeopleIcon className="opportunity-card__slots-icon" />
            <span>
              Signed Up ({signedUpStudents.length}/{opportunity.total_slots})
            </span>
          </div>
          <span
            className={`opportunity-card__slots-available ${availableSlots > 0 || isUserSignedUp
              ? 'opportunity-card__slots-available--available'
              : 'opportunity-card__slots-available--unavailable'
              }`}
          >
            {availableSlots} slots left
          </span>
        </div>

        {signedUpStudents.length > 0 ? (
          <div className="opportunity-card__students">
            {signedUpStudents.slice(0, 10).map((student) => (
              <div key={student.id} className="opportunity-card__student-avatar-container">
                <img
                  className={`opportunity-card__student-avatar ${currentUser ? '' : 'restricted'}`}
                  src={getProfilePictureUrl(student.profile_image)}
                  alt={student.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(student.id);
                  }}
                /> {currentUser &&
                  <div
                    className={`opportunity-card__student-tooltip ${clickedStudentId === student.id
                      ? 'opportunity-card__student-tooltip--visible'
                      : ''
                      }`}
                  >
                    {student.name}
                    <svg
                      className="opportunity-card__student-tooltip-arrow"
                      x="0px"
                      y="0px"
                      viewBox="0 0 255 255"
                      xmlSpace="preserve"
                    >
                      <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                    </svg>
                  </div>}
              </div>
            ))}
            {signedUpStudents.length > 10 && (
              <div className="opportunity-card__more-students">
                +{signedUpStudents.length - 10}
              </div>
            )}
          </div>
        ) : (
          <div className="opportunity-card__first-signup">
            Be the first to sign up! +5 bonus points
          </div>
        )}

        {topOrgs.length > 0 && (
          <div className="opportunity-card__top-orgs">
            <div className="opportunity-card__top-orgs-header">
              <TrophyIcon className="opportunity-card__trophy-icon" />
              <span>Top Organizations Attending</span>
            </div>
            <div className="opportunity-card__org-list">
              {topOrgs.map((org) => (
                <span
                  key={org.id}
                  data-clickable-org="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/group-detail/${org.id}`);
                  }}
                  className="opportunity-card__org-tag"
                >
                  {org.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibilityOrgs.length > 0 && (
          <div className="opportunity-card__visibility">
            <div className="opportunity-card__visibility-header">
              <span>Visible To</span>
            </div>
            <div className="opportunity-card__visibility-list">
              {visibilityOrgs.map((org) => (
                <span
                  key={org.id}
                  data-clickable-org="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/group-detail/${org.id}`);
                  }}
                  className="opportunity-card__visibility-tag"
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
            eventStarted || (!canSignUp && !isUserSignedUp) || (isUserSignedUp && !canUnregister) || (opportunity.name == 'Soup Kitchen')
          }
          className={`opportunity-card__button ${eventStarted
            ? 'opportunity-card__button--started'
            : isUserSignedUp
              ? canUnregister
                ? 'opportunity-card__button--signed-up'
                : 'opportunity-card__button--unregister-closed'
              : canSignUp
                ? 'opportunity-card__button--available'
                : 'opportunity-card__button--unavailable'
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

        {isUserSignedUp && !canUnregister && (
          <div className="opportunity-card__warning">
            <p className="opportunity-card__warning-text">
              ⚠️ Unregistration closed within 7 hours of event. Contact organizer if you need to
              cancel.
            </p>
          </div>
        )}

        {opportunity.tags && Array.isArray(opportunity.tags) && opportunity.tags.length > 0 && (
          <div className="opportunity-card__tags">
            {opportunity.tags.map((tag, index) => (
              <span key={index} className="opportunity-card__tag">
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
