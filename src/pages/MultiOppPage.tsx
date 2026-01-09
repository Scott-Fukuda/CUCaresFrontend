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
  if (!multiopp) return <p>Opportunity not found.</p>;

  const [participantsByOppId, setParticipantsByOppId] = useState<Record<number, User[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OppType | null>(null);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const isUserHost = multiopp.host_user_id === currentUser.id;
  const canManageOpportunity = isUserHost || currentUser.admin;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const initAllowCarpool = multiopp.opportunities.every(opp => opp.allow_carpool)
  const [editForm, setEditForm] = useState({
    name: multiopp.name,
    description: multiopp.description || '',
    address: multiopp.address,
    // date: multiopp.date,
    // time: multiopp.time,
    // days_of_week: multiopp.days_of_week,
    // week_frequency: multiopp.week_frequency || 1,
    // week_recurrences: multiopp.week_recurrences || 1,
    nonprofit: multiopp.nonprofit || '',
    redirect_url: multiopp.redirect_url || '', // Add redirect_url to form state
    // opportunities: multiopp.opportunities,
    allow_carpool: initAllowCarpool
  });

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

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsUploadingImage(true);
    try {
      const uploadResult = await uploadProfilePicture(selectedImage);
      const imageUrl = uploadResult;

      // Update the opportunity with the new image URL
      await updateMultiOpp(multiopp.id, { image: imageUrl });

      // Update local state
      multiopp.image = imageUrl;
      queryClient.invalidateQueries({ queryKey: ['multiopps'] });

      // Clear the selected image and preview
      setSelectedImage(null);
      setImagePreview(null);

      alert('Image updated successfully!');
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
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

  // const addDaySlot = (day: string) => {
  //   const updated = editForm.days_of_week.map(d => ({ ...d }));
  //   const existing = updated.find((d) => Object.keys(d)[0] === day);
  //   if (existing) {
  //     existing[day].push(['', 60]); // default time + duration
  //   } else {
  //     updated.push({ [day]: [['', 60]] });
  //   }
  //   setEditForm({ ...editForm, days_of_week: updated })
  // };

  // const updateDaySlot = (day: string, index: number, field: 'time' | 'duration', value: string) => {
  //   const updated = editForm.days_of_week.map(d => ({ ...d }));
  //   const target = updated.find((d) => Object.keys(d)[0] === day);
  //   if (target) {
  //     const slots = target[day];
  //     if (field === 'time') slots[index][0] = value;
  //     else slots[index][1] = parseInt(value);
  //     target[day] = slots;
  //   }
  //   setEditForm({ ...editForm, days_of_week: updated })
  // };

  // const removeDaySlot = (day: string, index: number) => {
  //   const updated = editForm.days_of_week.map(d => ({ ...d }));
  //   const target = updated.find((d) => Object.keys(d)[0] === day);
  //   if (target) {
  //     target[day].splice(index, 1);
  //     if (target[day].length === 0) {
  //       const filtered = updated.filter((d) => Object.keys(d)[0] !== day);
  //       setEditForm({ ...editForm, days_of_week: filtered })
  //       return;
  //     }
  //   }
  //   setEditForm({ ...editForm, days_of_week: updated })
  // };

  const handleDeleteOpportunity = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the opportunity "${multiopp.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteMultiOpp(multiopp.id);
      queryClient.invalidateQueries({ queryKey: ['multiopps'] });

      alert('Multiopp has been deleted successfully!');
      // Navigate back to opportunities page
      navigate('/opportunities');
    } catch (error: any) {
      alert(`Error deleting opportunity: ${error.message}`);
    }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Format the date and time correctly using the utility function
      // const formattedDateTime = formatDateTimeForBackend(editForm.date, editForm.time);

      const updateData = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        // date: formattedDateTime,
        nonprofit: editForm.nonprofit,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool,
        // days_of_week: editForm.days_of_week,
        // week_frequency: editForm.week_frequency,
        // week_recurrences: editForm.week_recurrences,
        // opportunities: editForm.opportunities
      };

      await updateMultiOpp(multiopp.id, updateData);
      queryClient.invalidateQueries({ queryKey: ['multiopps'] });

      // Update the local opportunity object to reflect changes
      Object.assign(multiopp, {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        // start_date: editForm.date,
        nonprofit: editForm.nonprofit,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool,
        // days_of_week: editForm.days_of_week,
        // week_frequency: editForm.week_frequency,
        // week_recurrences: editForm.week_recurrences,
        // opportunities: editForm.opportunities
      });

      alert('Opportunity details updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      alert(`Error updating opportunity: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
  }

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

          {canManageOpportunity && (
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                  >
                    Edit Recurring Events
                  </button>
                  {/* <button
                    onClick={handleDeleteOpportunity}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete All Recurring Events
                  </button> */}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Event Image</label>
                <div className="space-y-4">
                  {/* Current Image Preview */}
                  <div className="relative">
                    <img
                      src={imagePreview || multiopp.image || '/backup.jpeg'}
                      alt="Event preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/backup.jpeg') {
                          target.src = '/backup.jpeg';
                        }
                      }}
                    />
                    {imagePreview && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        New Image Selected
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                    />
                    {selectedImage && (
                      <button
                        onClick={handleImageUpload}
                        disabled={isUploadingImage}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                    )}
                  </div>

                  {selectedImage && (
                    <p className="text-sm text-gray-600">
                      Selected: {selectedImage.name} (
                      {(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nonprofit</label>
                <input
                  type="text"
                  value={editForm.nonprofit}
                  onChange={(e) => setEditForm({ ...editForm, nonprofit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                />
              </div>
              {/* <div className="bg-gray-50 p-4 rounded-lg border space-y-6">
                <div>
                  <p className="font-semibold mb-3">Which days of the week does this occur on?</p>
                  <div className="space-y-4">
                    {days.map((day) => {
                      const existing = editForm.days_of_week.find((d) => Object.keys(d)[0] === day);
                      return (
                        <div key={day}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{day}</span>
                            <button
                              type="button"
                              onClick={() => addDaySlot(day)}
                              className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              + Add time
                            </button>
                          </div>

                          {existing &&
                            existing[day].map(([time, duration], idx) => (
                              <div key={idx} className="flex gap-2 mt-2">
                                <input
                                  type="time"
                                  value={time}
                                  onChange={(e) => updateDaySlot(day, idx, 'time', e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 w-32"
                                />
                                <input
                                  type="number"
                                  value={duration}
                                  onChange={(e) => updateDaySlot(day, idx, 'duration', e.target.value)}
                                  min={15}
                                  step={15}
                                  className="border border-gray-300 rounded px-2 py-1 w-24"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeDaySlot(day, idx)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How often does this repeat? (every X weeks)
                  </label>
                  <input
                    type="number"
                    value={editForm.week_frequency}
                    onChange={(e) => setEditForm({ ...editForm, week_frequency: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-32 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    When should this recurring event start?
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                    className="border border-gray-300 rounded px-2 py-1 w-56"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    For how many weeks should this pattern repeat?
                  </label>
                  <input
                    type="number"
                    value={editForm.week_recurrences}
                    onChange={(e) => setEditForm({ ...editForm, week_recurrences: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-32 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>  */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Redirect Link (Optional)</label>
                <input
                  type="url"
                  value={editForm.redirect_url}
                  onChange={(e) => setEditForm({ ...editForm, redirect_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                  placeholder="https://example.com/register"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If you would like this opportunity to redirect to an external registration, enter the link here.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable carpooling for all recurring events?
                </label>
                <select
                  name="allowCarpool"
                  value={editForm.allow_carpool ? 'yes' : 'no'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, allow_carpool: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                  disabled={initAllowCarpool}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Volunteers can sign up to drive or request a ride through the system (this feature cannot be undone once enabled).
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 text-lg leading-relaxed break-words">
              {/* {formatDescription(opportunity.description)} */}
            </div>
          )}

          {/* Upcoming Dates */}
          <div style={{ marginTop: "20px" }}>
            <h3 className="text-xl font-bold mb-3">Upcoming Dates</h3>
            {upcomingOpps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingOpps.map((opp) => {
                  const thisWeek = isThisWeek(opp.date);
                  const participants = participantsByOppId[opp.id] || [];
                  return (
                    <div
                      key={opp.id}
                      className={`p-4 rounded-xl border transition-transform cursor-pointer hover:scale-[1.02] ${thisWeek
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
          href="/terms_of_service.pdf"
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
