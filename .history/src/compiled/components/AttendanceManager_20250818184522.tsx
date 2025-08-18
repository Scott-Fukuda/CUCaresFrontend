import React, { useState, useEffect } from 'react';
import { User, Opportunity } from '../../../types';
import * as api from '../../../api';

interface AttendanceManagerProps {
  opportunity: Opportunity;
  participants: User[];
  onAttendanceSubmitted: () => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ opportunity, participants, onAttendanceSubmitted }) => {
  const [attendedUsers, setAttendedUsers] = useState<Set<number>>(new Set());
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const opportunityDateTime = new Date(`${opportunity.date}T${opportunity.time}`);
      setIsSubmitEnabled(now >= opportunityDateTime);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [opportunity]);

  const handleAttendanceToggle = (userId: number) => {
    // Only allow toggling if not submitted or in edit mode
    if (!isSubmitted || isEditMode) {
      setAttendedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    }
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.markAttendance({
        user_ids: Array.from(attendedUsers),
        opportunity_id: opportunity.id
      });
      
      setIsSubmitted(true);
      setIsEditMode(false);
      onAttendanceSubmitted();
    } catch (error: any) {
      alert(`Error submitting attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmission = () => {
    setIsEditMode(true);
  };

  const handleResubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.markAttendance({
        user_ids: Array.from(attendedUsers),
        opportunity_id: opportunity.id
      });
      
      setIsEditMode(false);
      onAttendanceSubmitted();
    } catch (error: any) {
      alert(`Error resubmitting attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const opportunityDateTime = new Date(`${opportunity.date}T${opportunity.time}`);
  
  // Display time in Eastern Time (data is already stored as Eastern Time)
  const timeParts = opportunity.time.split(':');
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const displayTime = new Date(2024, 0, 1, hours, minutes).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4">Attendance Management</h3>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Event Start Time:</strong> {displayTime}
        </p>
        <p className="text-sm text-blue-800 mt-1">
          {isSubmitEnabled 
            ? "✅ Attendance submission is now enabled" 
            : "⏳ Attendance submission will be enabled at the event start time"
          }
        </p>
        {isSubmitted && !isEditMode && (
          <p className="text-sm text-green-800 mt-1">
            ✅ Attendance has been submitted successfully
          </p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Participants ({participants.length})</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {participants.map(participant => (
            <div 
              key={participant.id} 
              className={`flex items-center justify-between p-3 border rounded-lg ${
                isSubmitted && !isEditMode ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={participant.profilePictureUrl || `https://i.pravatar.cc/150?u=${participant.id}`} 
                  alt={`${participant.firstName} ${participant.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                </div>
              </div>
              <label className={`flex items-center space-x-2 ${
                isSubmitted && !isEditMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={attendedUsers.has(participant.id)}
                  onChange={() => handleAttendanceToggle(participant.id)}
                  disabled={isSubmitted && !isEditMode}
                  className="w-4 h-4 text-cornell-red border-gray-300 rounded focus:ring-cornell-red disabled:opacity-50"
                />
                <span className="text-sm font-medium text-gray-700">Attended</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!isSubmitEnabled || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
            isSubmitEnabled && !isSubmitting
              ? 'bg-cornell-red hover:bg-red-800'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting 
            ? 'Submitting...' 
            : isSubmitEnabled 
              ? `Submit Attendance (${attendedUsers.size} marked)` 
              : 'Submit Attendance (disabled until event start)'
          }
        </button>
      ) : isEditMode ? (
        <div className="space-y-3">
          <button
            onClick={handleResubmit}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
              !isSubmitting
                ? 'bg-cornell-red hover:bg-red-800'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting 
              ? 'Resubmitting...' 
              : `Resubmit Attendance (${attendedUsers.size} marked)`
            }
          </button>
          <button
            onClick={() => setIsEditMode(false)}
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel Edit
          </button>
        </div>
      ) : (
        <button
          onClick={handleEditSubmission}
          className="w-full py-3 px-4 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Edit Submission
        </button>
      )}
    </div>
  );
};

export default AttendanceManager;
