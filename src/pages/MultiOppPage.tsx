import React, { useEffect, useMemo, useState } from 'react';
import { MultiOpp, Organization, User, Opportunity as OppType, Opportunity } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { formatMiniOppTime } from '../utils/timeUtils';
import { getOpportunity, getProfilePictureUrl, uploadProfilePicture, updateMultiOpp, deleteMultiOpp } from '../api';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateTimeForBackend, calculateEndTime } from '../utils/timeUtils';

interface MultiOppDetailPageProps {
  multiopps: MultiOpp[];
  opportunities: Opportunity[];
  currentUser: User;
  allOrgs: Organization[];
  users: User[];
  staticId?: number;
  onSignUp?: (opportunityId: number) => Promise<void> | void;
  onUnsignUp?: (opportunityId: number) => Promise<void> | void;
}

const MultiOppDetailPage: React.FC<MultiOppDetailPageProps> = ({
  multiopps,
  currentUser,
  allOrgs,
  opportunities,
  users,
  staticId,
  onSignUp,
  onUnsignUp,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const multioppId = staticId ?? parseInt(id || '', 10);
  const multiopp = multiopps.find((m) => m.id === multioppId);
  
  // --- New State for Month Filtering ---
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = "All Events"
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [participantsByOppId, setParticipantsByOppId] = useState<Record<number, User[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OppType | null>(null);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const isUserHost = multiopp?.host_user_id === currentUser.id;
  const canManageOpportunity = isUserHost || currentUser.admin;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const initAllowCarpool = multiopp?.opportunities.every(opp => opp.allow_carpool) || false;
  const [editForm, setEditForm] = useState({
    name: multiopp?.name || '',
    description: multiopp?.description || '',
    address: multiopp?.address || '',
    nonprofit: multiopp?.nonprofit || '',
    redirect_url: multiopp?.redirect_url || '',
    allow_carpool: initAllowCarpool
  });

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Helper to count events with open spots
  const getOpenEventsCount = (month: number, year: number) => {
    if (!multiopp?.opportunities) return 0;
    return multiopp.opportunities.filter(opp => {
      const d = new Date(opp.date);
      const fullOpp = opportunities.find(o => o.id === opp.id) as any; // Cast to any to bypass missing 'capacity' error
      
      // If capacity is not defined, we treat it as "open"
      const cap = fullOpp?.capacity;
      const participants = fullOpp?.involved_users?.length || 0;
      const hasSpots = cap ? participants < cap : true;
      
      return d.getMonth() === month && d.getFullYear() === year && hasSpots && d >= startOfToday;
    }).length;
  };

  // Filtered list for the main display
  const displayOpps = useMemo(() => {
    if (!multiopp?.opportunities) return [];
    return [...multiopp.opportunities]
      .filter((opp) => {
        const d = new Date(opp.date);
        const matchesMonth = selectedMonth === null || d.getMonth() === selectedMonth;
        const matchesYear = d.getFullYear() === selectedYear;
        return d >= startOfToday && matchesMonth && matchesYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [multiopp, startOfToday, selectedMonth, selectedYear]);

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
      if (!displayOpps.length) return setParticipantsByOppId({});
      setLoadingParticipants(true);
      try {
        const map: Record<number, User[]> = {};
        for (const opp of displayOpps) {
          const full = opportunities.find((o) => o.id === opp.id);
          const participants = full?.involved_users
                ?.map((u: { id: number }) => users.find((usr) => usr.id === u.id))
                .filter(Boolean) ?? [];
          map[opp.id] = participants as User[];
        }
        if (!cancelled) setParticipantsByOppId(map);
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    };
    loadParticipants();
    return () => { cancelled = true; };
  }, [displayOpps, users, opportunities]);

  if (!multiopp) return <p className="text-center text-gray-500 mt-10">Opportunity not found.</p>;

  // Handlers
  const handleOppClick = (opp: OppType) => {
    const full = opportunities.find((o) => o.id === opp.id);
    const isUserSignedUp = full?.involved_users?.some((u: any) => u.id === currentUser.id);
    if (full?.redirect_url && !isUserSignedUp) {
      setSelectedOpportunity(full);
      setShowExternalSignupModal(true);
    } else {
      navigate(`/opportunity/${opp.id}`);
    }
  };

  const handleExternalSignupConfirm = async () => {
    if (!selectedOpportunity) return;
    if (selectedOpportunity.redirect_url) {
      window.open(selectedOpportunity.redirect_url, '_blank', 'noopener,noreferrer');
    }
    if (onSignUp) await onSignUp(selectedOpportunity.id);
    setShowExternalSignupModal(false);
    navigate(`/opportunity/${selectedOpportunity.id}`);
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <img src={multiopp.image || '/backup.jpeg'} alt="" className="w-full h-64 md:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h1 className="text-4xl lg:text-5xl font-bold drop-shadow-lg">{multiopp.name}</h1>
          {multiopp.nonprofit && <h2 className="text-2xl font-semibold opacity-90">{multiopp.nonprofit}</h2>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Event Details</h3>
          <p className="text-gray-600 mb-8">{multiopp.description}</p>

          {/* Upcoming Opportunities Header + Filter */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Upcoming Opportunities</h3>
            
            <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                {selectedMonth !== null ? `${monthNames[selectedMonth]} ${selectedYear}` : "All Events"}
                <span>▼</span>
              </button>

              {showMonthPicker && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-2xl z-50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-gray-100 rounded">◀</button>
                    <span className="font-bold">{selectedYear}</span>
                    <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-gray-100 rounded">▶</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((name, index) => {
                      const count = getOpenEventsCount(index, selectedYear);
                      return (
                        <button
                          key={name}
                          onClick={() => { setSelectedMonth(index); setShowMonthPicker(false); }}
                          className={`flex flex-col items-center p-2 rounded-lg ${selectedMonth === index ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                        >
                          <span className="text-xs font-bold">{name}</span>
                          <span className="text-[10px] opacity-70">{count} open</span>
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => { setSelectedMonth(null); setShowMonthPicker(false); }}
                    className="w-full mt-4 text-xs text-red-600 font-bold border-t pt-2"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Opportunity List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayOpps.length > 0 ? (
              displayOpps.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => handleOppClick(opp)}
                  className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${isThisWeek(opp.date) ? 'border-red-600 bg-red-50/30' : 'border-gray-200 bg-white'}`}
                >
                  <p className="font-bold text-gray-800">
                    {new Date(opp.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">{formatEventTimeRange(opp.date, opp.duration)}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {(participantsByOppId[opp.id] || []).map(p => (
                      <img key={p.id} src={getProfilePictureUrl(p.profile_image)} alt="" className="w-6 h-6 rounded-full border" title={p.name} />
                    ))}
                  </div>
                  <button className="w-full mt-4 bg-red-600 text-white text-xs font-bold py-2 rounded-lg">Sign Up</button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-12 col-span-2 bg-gray-50 rounded-xl border-dashed border">No events found for this filter.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border h-fit">
          <h4 className="font-bold mb-4">Recurring Schedule</h4>
          {multiopp.days_of_week?.map((dayObj, idx) => {
            const day = Object.keys(dayObj)[0];
            const slots = dayObj[day];
            return (
              <div key={idx} className="text-sm mb-2">
                <span className="font-bold">{day}:</span> {slots.map(([t, d], i) => <span key={i}>{formatMiniOppTime(t, d)}{i < slots.length - 1 ? ', ' : ''}</span>)}
              </div>
            );
          })}
          <div className="mt-6 pt-6 border-t text-sm text-gray-500">
            <div>📍 {multiopp.address}</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showExternalSignupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">External Registration Required</h3>
            <p className="text-gray-600 mb-6 text-sm">This event requires registration on the organizer's website. We will also sign you up here to track your points.</p>
            <div className="flex gap-3">
              <button onClick={handleExternalSignupConfirm} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg">Continue</button>
              <button onClick={() => setShowExternalSignupModal(false)} className="flex-1 bg-gray-100 font-bold py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiOppDetailPage;