import React, { useState, useEffect } from 'react';
import { User, Opportunity } from '../types';
import * as api from '../api';

interface AttendanceManagerProps {
  opportunity: Opportunity;
  participants: User[];
  onAttendanceSubmitted: () => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  opportunity,
  participants,
  onAttendanceSubmitted,
}) => {
  const [attendedUsers, setAttendedUsers] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDurationPopup, setShowDurationPopup] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // Initialize attendedUsers with actual attendance data from backend
  useEffect(() => {
    if (opportunity.attendance_marked && opportunity.involved_users) {
      const attendedUserIds = new Set<number>();

      opportunity.involved_users.forEach((user) => {
        if (user.attended === true) {
          attendedUserIds.add(user.id);
        }
      });

      setAttendedUsers(attendedUserIds);
    }
  }, [opportunity.attendance_marked, opportunity.involved_users]);

  const handleAttendanceToggle = (userId: number) => {
    setAttendedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmitClick = () => {
    if (isSubmitting || opportunity.attendance_marked) return;
    setShowDurationPopup(true);
  };

  const handleDurationSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Convert hours and minutes to total minutes
      const totalMinutes = durationHours * 60 + durationMinutes;

      await api.markAttendance({
        user_ids: Array.from(attendedUsers),
        opportunity_id: opportunity.id,
        duration: totalMinutes,
      });

      // Update the local opportunity object to reflect attendance submission
      opportunity.attendance_marked = true;

      setShowDurationPopup(false);
      onAttendanceSubmitted();
    } catch (error: any) {
      alert(`Error submitting attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDurationCancel = () => {
    setShowDurationPopup(false);
    setDurationHours(0);
    setDurationMinutes(0);
  };

  // Create opportunity date/time - dates are already converted to Eastern Time by the API
  const [year, month, day] = opportunity.date.split('-').map(Number);
  const [hours, minutes] = opportunity.time.split(':').map(Number);

  // Create the opportunity date/time string
  const opportunityDateString = (() => {
    return `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}T${hours
        .toString()
        .padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:00`;
  })();

  const opportunityDateTime = new Date(opportunityDateString);

  // Display time without additional timezone conversion (already Eastern Time from API)
  const displayTime = opportunityDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Display date without additional timezone conversion (already Eastern Time from API)
  const displayDate = opportunityDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isAttendanceMarked = opportunity.attendance_marked;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4">Attendance Management</h3>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Event Start Date:</strong> {displayDate}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Event Start Time (Eastern):</strong> {displayTime}
        </p>
        <p className="text-sm text-blue-800 mt-1">✅ Attendance submission is always available</p>
        {isAttendanceMarked && (
          <p className="text-sm text-green-800 mt-1 font-semibold">
            ✅ Attendance has been marked for this event
          </p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Participants ({participants.length})</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={api.getProfilePictureUrl(participant.profile_image)}
                  alt={participant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{participant.name}</p>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                </div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendedUsers.has(participant.id)}
                  onChange={() => handleAttendanceToggle(participant.id)}
                  disabled={isAttendanceMarked}
                  className="w-4 h-4 text-cornell-red border-gray-300 rounded focus:ring-cornell-red disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span
                  className={`text-sm font-medium ${isAttendanceMarked ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  {isAttendanceMarked
                    ? attendedUsers.has(participant.id)
                      ? 'Attended'
                      : 'Did not attend'
                    : 'Attended'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmitClick}
        disabled={isSubmitting || isAttendanceMarked}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${!isSubmitting && !isAttendanceMarked
            ? 'bg-cornell-red hover:bg-red-800'
            : 'bg-gray-400 cursor-not-allowed'
          }`}
      >
        {isAttendanceMarked
          ? 'Attendance Already Submitted'
          : isSubmitting
            ? 'Submitting...'
            : `Submit Attendance (${attendedUsers.size} marked)`}
      </button>

      {/* Duration Popup */}
      {showDurationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Event Duration</h3>
            <p className="text-gray-600 mb-4">How long did the event run for?</p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                  <input
                    type="text"
                    value={durationHours}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setDurationHours(0);
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
                          setDurationHours(numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setDurationHours(0);
                      } else if (value > 24) {
                        setDurationHours(24);
                      }
                    }}
                    placeholder="0-24"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0-24 hours</p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minutes</label>
                  <input
                    type="text"
                    value={durationMinutes}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setDurationMinutes(0);
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
                          setDurationMinutes(numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setDurationMinutes(0);
                      } else if (value > 59) {
                        setDurationMinutes(59);
                      }
                    }}
                    placeholder="0-59"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0-59 minutes</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDurationSubmit}
                  disabled={isSubmitting || (durationHours === 0 && durationMinutes === 0)}
                  className="flex-1 bg-cornell-red hover:bg-red-800 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                </button>
                <button
                  onClick={handleDurationCancel}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;