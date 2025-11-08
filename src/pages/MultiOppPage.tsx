import React, { useEffect, useMemo, useState } from 'react';
import { MultiOpp, Organization, User, Opportunity as OppType, Opportunity } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { formatMiniOppTime } from '../utils/timeUtils';
import { getOpportunity, getProfilePictureUrl } from '../api';

interface MultiOppDetailPageProps {
  multiopps: MultiOpp[];
  opportunities: Opportunity[];
  currentUser: User;
  allOrgs: Organization[];
  setMultiOpps: React.Dispatch<React.SetStateAction<MultiOpp[]>>;
  users: User[];
  staticId?: number;
  onSignUp?: (opportunityId: number) => Promise<void> | void;
  onUnsignUp?: (opportunityId: number) => Promise<void> | void;
}

const MultiOppDetailPage: React.FC<MultiOppDetailPageProps> = ({
  multiopps,
  currentUser,
  allOrgs,
  setMultiOpps,
  opportunities,
  users,
  staticId,
  onSignUp,
  onUnsignUp,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const multioppId = staticId ?? parseInt(id || '', 10);
  const multiopp = multiopps.find((m) => m.id === multioppId);

  const [participantsByOppId, setParticipantsByOppId] = useState<Record<number, User[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OppType | null>(null);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingOpps = useMemo(() => {
    if (!multiopp?.opportunities) return [];
    return [...multiopp.opportunities]
      .filter((opp) => new Date(opp.date) >= startOfToday)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [multiopp, startOfToday]);

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString);
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
  };

  const formatEventTimeRange = (gmtString: string, duration: number) => {
    const start = new Date(gmtString);
    const end = new Date(start.getTime() + duration * 60000);
    const format = { hour: 'numeric', minute: '2-digit', hour12: true } as const;
    return `${start.toLocaleTimeString('en-US', format)} – ${end.toLocaleTimeString('en-US', format)}`;
  };

  useEffect(() => {
    let cancelled = false;
    const loadParticipants = async () => {
      if (!upcomingOpps.length) return setParticipantsByOppId({});
      setLoadingParticipants(true);
      try {
        const map: Record<number, User[]> = {};
        for (const opp of upcomingOpps) {
          try {
            const full = opportunities.find((o) => o.id === opp.id);
            console.log("Loaded opportunity:", full);
            const participants =
              full?.involved_users
                ?.map((u: { id: number }) => users.find((usr) => usr.id === u.id))
                .filter(Boolean) ?? [];
            map[opp.id] = participants as User[];
          } catch {
            map[opp.id] = [];
          }
        }
        if (!cancelled) setParticipantsByOppId(map);
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    };
    loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [upcomingOpps, users]);

  if (!multiopp) return <p className="text-center text-gray-500 mt-10">Recurring opportunity not found.</p>;

  const handleOppClick = async (opp: OppType) => {
  console.log("Clicked opp:", opp);

  // guard: skip past events
  const d = new Date(opp.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return;

  try {
    // 🔹 Fetch the full opportunity (includes redirect_url)
    let full = opportunities.find((o) => o.id === opp.id);
    if (!full) {
      try {
        full = await getOpportunity(opp.id);
      } catch (err) {
        console.error("Failed to fetch remote opportunity:", err);
      }
      if (!full) {
        console.warn(`Opportunity ${opp.id} not found locally or remotely.`);
        return;
  }
   
    }

    console.log("Fetched full opp:", full);
    const isUserSignedUp = full.involved_users?.some(
    (u: { id: number; registered?: boolean }) =>
      u.id === currentUser.id && (u.registered ?? true)
  );

    if (full.redirect_url && !isUserSignedUp) {
      // show external registration modal
      setSelectedOpportunity(full);
      setShowExternalSignupModal(true);
    } else {
      navigate(`/opportunity/${opp.id}`);
    }
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    navigate(`/opportunity/${opp.id}`); // fallback navigation
  }
};


  // ✅ Fixed single version
  const handleExternalSignupConfirm = async () => {
    if (!selectedOpportunity) return;
    if (selectedOpportunity.redirect_url) {
      window.open(selectedOpportunity.redirect_url, '_blank', 'noopener,noreferrer');
    }
    try {
      if (onSignUp) await onSignUp(selectedOpportunity.id);
    } catch (err) {
      console.error('Local signup failed:', err);
    }
    setShowExternalSignupModal(false);
    navigate(`/opportunity/${selectedOpportunity.id}`);
    setSelectedOpportunity(null);
  };

  const handleExternalSignupCancel = () => {
    setShowExternalSignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleExternalUnsignupCancel = () => {
    setShowExternalUnsignupModal(false);
    setSelectedOpportunity(null);
  };


  return (
    <div className="pb-12">
      {/* Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <img
          src={multiopp.image || '/backup.jpeg'}
          alt={multiopp.name}
          className="w-full h-64 md:h-80 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{multiopp.name}</h1>
          {multiopp.nonprofit && <h2 className="text-2xl font-semibold text-white/90 drop-shadow-lg">{multiopp.nonprofit}</h2>}
          {multiopp.host_org_name && (
            <h3 className="text-xl font-semibold text-white/80 drop-shadow-lg">
              Hosted by {multiopp.host_org_name}
            </h3>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Event Details</h3>
          <p className="text-gray-600 mb-4">{multiopp.description || 'No description provided.'}</p>
          {multiopp.address && (
            <p className="text-gray-700 text-sm mb-6">
              📍{' '}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(multiopp.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cornell-red hover:text-red-800 underline"
              >
                {multiopp.address}
              </a>
            </p>
          )}

          {/* Upcoming Dates */}
          <div>
            <h3 className="text-xl font-bold mb-3">Upcoming Dates</h3>
            {upcomingOpps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingOpps.map((opp) => {
                  const thisWeek = isThisWeek(opp.date);
                  const participants = participantsByOppId[opp.id] || [];
                  return (
                    <div
                      key={opp.id}
                      className={`p-4 rounded-xl border transition-transform cursor-pointer hover:scale-[1.02] ${
                        thisWeek
                          ? 'border-cornell-red bg-red-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleOppClick(opp)}
                    >
                      <p className="font-semibold text-gray-800">
                        {new Date(opp.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{formatEventTimeRange(opp.date, opp.duration)}</p>
                      {thisWeek && <p className="text-xs font-semibold text-cornell-red mt-1">🌟 This week</p>}
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-500 mb-1">Participants:</p>
                        {loadingParticipants ? (
                          <p className="text-xs text-gray-400 italic">Loading…</p>
                        ) : participants.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {participants.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full"
                              >
                                <img
                                  src={getProfilePictureUrl(p.profile_image)}
                                  alt={p.name}
                                  className="w-6 h-6 rounded-full border border-gray-300 object-cover"
                                />
                                <span className="text-sm text-gray-700">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No users yet.</p>
                        )}
                      </div>
                      {opp.redirect_url && (
                        <p className="mt-3 text-xs font-medium text-blue-700">
                          External Registration Required →
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming opportunities.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-lg font-bold mb-2">Recurring Schedule</h4>
            {multiopp.days_of_week?.length ? (
              <ul className="text-gray-700">
                {multiopp.days_of_week.map((dayObj, idx) => {
                  const day = Object.keys(dayObj)[0];
                  const slots = dayObj[day];
                  return (
                    <li key={idx}>
                      <span className="font-medium">{day}</span> —{' '}
                      {slots.map(([time, duration], i) => (
                        <span key={i}>
                          {formatMiniOppTime(time, duration)}
                          {i < slots.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">Flexible or varies by week.</p>
            )}
          </div>
        </div>
      </div>

      {/* External Signup Modal */}
      {showExternalSignupModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">External Registration Required</h3>
            <p className="text-gray-600 mb-4">Please register externally by clicking the button below.</p>
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

      <p className="text-xs text-gray-500 mt-6 text-center">
        Click here to see our{' '}
        <a
          href="/Terms of Service.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Terms of Service and Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default MultiOppDetailPage;
