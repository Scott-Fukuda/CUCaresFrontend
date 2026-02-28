import React, { useMemo } from 'react';
import { MultiOpp, Organization, Opportunity, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from '../api';
import { canUnregisterFromOpportunity, formatTimeUntilEvent } from '../utils/timeUtils';
import ErrorIcon from '@mui/icons-material/Error';

interface MultiOppCardProps {
  multiopp: MultiOpp;
  currentUser: User | null;
  allOrgs: Organization[];
  opportunitiesData?: Opportunity[];
  onSignUp?: (opportunityId: number) => void;
  onUnSignUp?: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  onExternalSignup?: (opportunity: Opportunity) => void;
  onExternalUnsignup?: (opportunity: Opportunity) => void;
}

const pad = (value: number) => value.toString().padStart(2, '0');
const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatLocalTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
const normalizeTimeInput = (time?: string | null) => {
  if (!time) return undefined;
  if (time.length === 5) return `${time}:00`;
  return time;
};
const parseDateTime = (dateString?: string, timeString?: string) => {
  if (!dateString) return null;

  if (dateString.includes('T')) {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (timeString) {
    const parts = timeString.split(':').map(Number);
    hours = parts[0] ?? 0;
    minutes = parts[1] ?? 0;
    seconds = parts[2] ?? 0;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const MultiOppCard: React.FC<MultiOppCardProps> = ({
  multiopp,
  currentUser,
  allOrgs,
  opportunitiesData,
  onSignUp,
  onUnSignUp,
  onExternalSignup,
  onExternalUnsignup,
}) => {
  const navigate = useNavigate();

  // Combined memo for both map and display opportunities
  const { displayOpportunities, opportunityMap } = useMemo(() => {
    const map = new Map<number, Opportunity>();
    if (!Array.isArray(opportunitiesData)) return { displayOpportunities: [], opportunityMap: map };

    opportunitiesData.forEach((opp) => map.set(opp.id, opp));

    if (!Array.isArray(multiopp?.opportunities)) return { displayOpportunities: [], opportunityMap: map };

    // Step 1: derive full opportunity data
    const ids = multiopp.opportunities.map((o) => o.id);
    const fullOpps = opportunitiesData.filter((o) => ids.includes(o.id));

    // Step 2: sort chronologically by date
    const sorted = [...fullOpps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Step 3: filter upcoming (after now)
    const now = new Date();
    const upcoming = sorted.filter((o) => new Date(o.date) > now);

    // Step 4: fallback to earliest if none upcoming
    const displayList = upcoming.length > 0 ? upcoming : sorted.length > 0 ? [sorted[0]] : [];

    // Step 5: limit to next 2
    const displayOpportunities = displayList.slice(0, 2);

    return { displayOpportunities, opportunityMap: map };
  }, [multiopp, opportunitiesData]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/multiopp/${multiopp.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02] duration-300 cursor-pointer"
    >
      <img
        src={multiopp.image || '/backup.jpeg'}
        alt={multiopp.name}
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
        }}
      />

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-semibold text-cornell-red uppercase tracking-wider truncate">
            {multiopp.nonprofit || 'Community Organization'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{multiopp.name}</h3>

        {!!multiopp.address && (
          <p className="text-gray-600 text-sm mb-3">📍 {multiopp.address}</p>
        )}

        {multiopp.name == 'Soup Kitchen' &&
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#F8D7DA', // light red
                color: '#721C24',            // dark red text
                border: '1px solid #F5C6CB',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.875rem',
                fontWeight: 500,
                // maxWidth: '220px',
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
              }}
            >
              <ErrorIcon style={{ color: '#D9534F', minWidth: '24px', minHeight: '24px' }} />
              <p>
                Due to unforeseen circumstances, the Salvation Army has canceled weekend hot meal service. We apologize for the inconvenience!
              </p>
            </div>
          </div>
        }

        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Upcoming Opportunities</h4>
          {displayOpportunities.length > 0 ? (
            displayOpportunities.map((baseOpp: Opportunity & { max_volunteers?: number }) => {
              const fullOpp = opportunityMap?.get(baseOpp.id);
              const opp = { ...baseOpp, ...(fullOpp || {}) } as Opportunity & {
                max_volunteers?: number;
              };

              const normalizedTime = normalizeTimeInput(opp.time);
              const rawDateString = typeof opp.date === 'string' ? opp.date : '';
              const oppDate = parseDateTime(rawDateString, normalizedTime);

              const displayTime = (
                gmtDate: string,
                gmtTime?: string,
                durationMinutes?: number
              ) => {
                if (!gmtDate) return { date: 'Date TBD', timeRange: '' };

                const [y, m, d] = gmtDate.split('-').map(Number);
                const [h = 0, min = 0, s = 0] = (gmtTime || '00:00:00').split(':').map(Number);

                // Create date directly - the time is already in Eastern from the API
                const start = new Date(y, m - 1, d, h, min, s);
                if (Number.isNaN(start.getTime())) return { date: 'Date TBD', timeRange: '' };

                const end = new Date(start.getTime() + (durationMinutes ?? 0) * 60 * 1000);

                const dateStr = start.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const timeFmt = { hour: 'numeric', minute: '2-digit', hour12: true } as const;
                const timeRange = `${start.toLocaleTimeString('en-US', timeFmt)} – ${end.toLocaleTimeString('en-US', timeFmt)}`;

                return { date: dateStr, timeRange };
              };
              const participants = Array.isArray(opp.involved_users) ? opp.involved_users : [];
              const isUserSignedUp = currentUser ? participants.some((u) => u.id === currentUser.id) : false;
              const totalSlots =
                typeof opp.total_slots === 'number'
                  ? opp.total_slots
                  : typeof opp.max_volunteers === 'number'
                    ? opp.max_volunteers
                    : undefined;
              const availableSlots =
                typeof totalSlots === 'number' ? Math.max(totalSlots - participants.length, 0) : Infinity;
              const slotsFull = typeof totalSlots === 'number' ? availableSlots <= 0 : false;
              const canSignUp = !isUserSignedUp && (typeof totalSlots !== 'number' || availableSlots > 0);
              const eventStarted = oppDate ? new Date() >= oppDate : false;

              const derivedDateString =
                oppDate || !rawDateString
                  ? oppDate
                    ? formatLocalDate(oppDate)
                    : undefined
                  : rawDateString.split('T')[0];
              const derivedTimeString =
                normalizedTime ?? (oppDate ? formatLocalTime(oppDate) : undefined);
              const redirectUrl = opp.redirect_url;

              const unregistrationInfo =
                isUserSignedUp && derivedDateString && derivedTimeString
                  ? canUnregisterFromOpportunity(derivedDateString, derivedTimeString)
                  : null;
              const canUnregister = unregistrationInfo?.canUnregister ?? true;
              const hoursUntilEvent = unregistrationInfo?.hoursUntilEvent ?? 0;

              const buttonDisabled =
                eventStarted || (!canSignUp && !isUserSignedUp) || (isUserSignedUp && !canUnregister) || (multiopp.name == 'Soup Kitchen');
              const buttonText = eventStarted
                ? 'Event Already Started'
                : isUserSignedUp
                  ? canUnregister
                    ? 'Signed Up ✓'
                    : `Unregistration Closed (${formatTimeUntilEvent(hoursUntilEvent)})`
                  : canSignUp
                    ? redirectUrl
                      ? 'Sign Up Externally'
                      : 'Sign Up'
                    : 'No Slots Available';

              const handleButtonClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (buttonDisabled) return;

                if (isUserSignedUp) {
                  if (redirectUrl && onExternalUnsignup) {
                    onExternalUnsignup(opp);
                  } else {
                    if (onUnSignUp) onUnSignUp(opp.id, derivedDateString, derivedTimeString);
                  }
                } else {
                  if (redirectUrl && onExternalSignup) {
                    onExternalSignup(opp);
                  } else {
                    if (onSignUp) onSignUp(opp.id);
                  }
                }
              };
              return (
                <div
                  key={opp.id}
                  className="flex justify-between items-start bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition"
                >
                  {/* LEFT: Date, Time, Volunteers */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {displayTime(opp.date, opp.time, opp.duration).date}
                    </span>
                    <span className="text-sm text-gray-900 whitespace-nowrap">
                      {displayTime(opp.date, opp.time, opp.duration).timeRange}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {slotsFull
                        ? 'Slots full'
                        : `${participants.length}/${totalSlots ?? '∞'} volunteers`}
                    </span>
                  </div>

                  {/* RIGHT: Avatars above the button */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex -space-x-2">
                      {participants.slice(0, 4).map((u) => (
                        <img
                          key={u.id}
                          src={getProfilePictureUrl(u.profile_image || null)}
                          alt={u.name}
                          title={u.name}
                          className="w-6 h-6 rounded-full border-2 border-white object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
                          }}
                        />
                      ))}
                      {participants.length > 4 && (
                        <span className="text-xs text-gray-500 self-center ml-1">
                          +{participants.length - 4}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleButtonClick}
                      disabled={buttonDisabled}
                      className={`
                      text-xs font-semibold px-3 py-1 rounded-lg transition 
                      text-white whitespace-nowrap
                      disabled:bg-gray-400 
                      disabled:cursor-not-allowed 
                      disabled:opacity-70
                      ${!buttonDisabled &&
                        (
                          isUserSignedUp
                            ? canUnregister
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-orange-500'
                            : canSignUp
                              ? 'bg-cornell-red hover:bg-red-800'
                              : ''
                        )}
                    `}
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>



              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No upcoming opportunities.</p>
          )}
        </div>

        {Array.isArray(multiopp.visibility) && multiopp.visibility.length > 0 && (
          <div className="mt-auto mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Visible to:</h4>
            <div className="flex flex-wrap gap-2">
              {multiopp.visibility.map((orgId) => {
                const org = allOrgs.find((o) => o.id === orgId);
                return org ? (
                  <span
                    key={org.id}
                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full border"
                  >
                    {org.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/multiopp/${multiopp.id}`);
            }}
            className="w-full text-gray-600 text-sm font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            View More Dates
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiOppCard;
